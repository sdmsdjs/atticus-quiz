import { GoogleGenAI, Type } from "@google/genai";
import { ParsedQuestion, QuestionType } from '../types';

export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

type GeminiRequestOptions = {
    model?: string;
    useSearch?: boolean;
};

type SolveQuestionInput = {
    id: string;
    questionText: string;
    options: string[];
    questionType: QuestionType;
};

export type SolvedQuestionResult = {
    id: string;
    correctAnswer: string;
    explanation: string;
};

const getEffectiveModel = (model?: string): string =>
    (model || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;

const getEffectiveApiKey = (apiKey?: string): string => {
    const key = (
        apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.API_KEY ||
        ''
    ).trim();

    if (!key) {
        throw new Error("Chua co Gemini API key. Hay nhap key trong o Gemini API Key truoc khi xu ly bang AI.");
    }

    return key;
};

export const hasConfiguredApiKey = (apiKey?: string): boolean => {
    try {
        return Boolean(getEffectiveApiKey(apiKey));
    } catch {
        return false;
    }
};

export const parseQuizFromFile = async (
    fileContent: string,
    apiKey?: string,
    options?: GeminiRequestOptions
): Promise<ParsedQuestion[]> => {
    const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey(apiKey) });

    const systemInstruction = `You are an expert data extraction assistant for Vietnamese quiz documents. Your task is to extract all questions, options, and question types into a structured JSON object.
 
 Follow these rules:
- **Multiple Choice:** Extract question and options. Options typically have prefixes like A, B, C, D or 1, 2, 3, 4. Remove these prefixes.
- **Checkbox:** For questions with multiple correct statements (e.g., "Chọn các đáp án đúng").
- **Fill-in-the-Blank:** For questions with no options. Put the answer in the first element of 'options' array.
- **Complex Questions:** If a question has statements (I, II, III), include them in the questionText with newlines.
- **Cleanup:** Preserve Vietnamese. Remove prefixes from options.
- **Output:** Return valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
        model: getEffectiveModel(options?.model),
        contents: fileContent,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        description: 'A list of all questions found in the document.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionText: {
                                    type: Type.STRING,
                                    description: 'The full text of the question, with sub-statements preserved on new lines.',
                                },
                                questionType: {
                                    type: Type.STRING,
                                    description: `The type of the question. Must be one of: 'Multiple Choice', 'Checkbox', 'Fill-in-the-Blank'.`
                                },
                                options: {
                                    type: Type.ARRAY,
                                    description: 'For Multiple Choice/Checkbox, this is the list of options. For Fill-in-the-Blank, this should be an array with exactly one element containing the answer or a placeholder.',
                                    items: {
                                        type: Type.STRING,
                                    },
                                },
                            },
                            required: ["questionText", "questionType", "options"]
                        },
                    },
                },
                required: ["questions"]
            },
        },
    });
    
    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.questions || [];
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e);
        console.error("Raw response text:", response.text);
        throw new Error("The AI returned an invalid data format. Please try a clearer document.");
    }
};

export const solveQuestionsWithSearch = async (
    questions: SolveQuestionInput[],
    apiKey?: string,
    options?: GeminiRequestOptions
): Promise<SolvedQuestionResult[]> => {
    if (questions.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey(apiKey) });
    const shouldUseSearch = options?.useSearch ?? true;
    const questionBlocks = questions.map((question, index) => {
        const isFillIn = question.questionType === QuestionType.FillInTheBlank;

        return `Question ${index + 1}
id: ${question.id}
Text: ${question.questionText}
Type: ${question.questionType}
${!isFillIn && question.options.length > 0 ? `Options:
${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}` : 'Options: none'}`;
    }).join('\n\n---\n\n');

    const prompt = `Solve these quiz questions${shouldUseSearch ? ' using Google Search to ensure accuracy' : ' as quickly as possible'}.

${questionBlocks}

Rules for solving:
1. For Multiple Choice: provide the number of the correct option (e.g. "1", "2").
2. For Checkbox: provide a comma-separated list of correct option numbers (e.g. "1,3").
3. For Fill-in-the-Blank: provide the actual answer text, not an option number.
4. Provide a clear, concise explanation in Vietnamese.
5. Return exactly one answer for each input question. Keep each id unchanged.

Return JSON with this shape:
{
  "answers": [
    {
      "id": "string",
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}`;

    const response = await ai.models.generateContent({
        model: getEffectiveModel(options?.model),
        contents: prompt,
        ...(shouldUseSearch ? { tools: [{ googleSearch: {} }] } : {}),
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answers: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                correctAnswer: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                            required: ["id", "correctAnswer", "explanation"]
                        }
                    }
                },
                required: ["answers"]
            }
        }
    });

    try {
        const result = JSON.parse(response.text);
        const answers = Array.isArray(result.answers) ? result.answers : [];

        return answers.map((answer: any) => ({
            id: String(answer.id || ""),
            correctAnswer: String(answer.correctAnswer || ""),
            explanation: String(answer.explanation || "")
        })).filter((answer: SolvedQuestionResult) => answer.id);
    } catch (e) {
        console.error("Failed to solve questions with AI:", e);
        throw new Error("AI failed to solve these questions.");
    }
};

export const solveQuestionWithSearch = async (
    question: { 
        questionText: string; 
        options: string[]; 
        questionType: QuestionType 
    },
    apiKey?: string,
    options?: GeminiRequestOptions
): Promise<{ correctAnswer: string; explanation: string }> => {
    const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey(apiKey) });

    const isFillIn = question.questionType === QuestionType.FillInTheBlank;
    const shouldUseSearch = options?.useSearch ?? true;
    
    const prompt = `Solve this quiz question${shouldUseSearch ? ' using Google Search to ensure accuracy' : ' as quickly as possible'}.
Question: ${question.questionText}
Type: ${question.questionType}
${!isFillIn && question.options.length > 0 ? `Options:
${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}` : ''}

Rules for solving:
1. For Multiple Choice: provide the number of the correct option (e.g. "1", "2").
2. For Checkbox: provide a comma-separated list of correct option numbers (e.g. "1,3").
3. For Fill-in-the-Blank: Provide the ACTUAL TEXT of the answer (e.g. "Thủ đô của Việt Nam là Hà Nội", "24.5"). DO NOT provide an option number.
4. Provide a clear, concise explanation in Vietnamese.

Return the result in JSON format with the following schema:
{
  "correctAnswer": "string",
  "explanation": "string"
}`;

    const response = await ai.models.generateContent({
        model: getEffectiveModel(options?.model),
        contents: prompt,
        ...(shouldUseSearch ? { tools: [{ googleSearch: {} }] } : {}),
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["correctAnswer", "explanation"]
            }
        }
    });

    try {
        const result = JSON.parse(response.text);
        return {
            correctAnswer: result.correctAnswer || "",
            explanation: result.explanation || ""
        };
    } catch (e) {
        console.error("Failed to solve question with AI:", e);
        throw new Error("AI failed to solve this question.");
    }
};
