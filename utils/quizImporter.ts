import { Question, QuestionType } from '../types';

type HtmlSlideOption = {
    label?: string;
    text?: string;
    is_correct?: boolean;
};

type HtmlSlide = {
    type?: string;
    content?: string;
    explanation?: string;
    options?: HtmlSlideOption[];
    correct_answer?: string;
    image?: string;
    time?: number;
};

const defaultQuestion = (sourceFile?: string): Question => ({
    questionText: '',
    questionType: QuestionType.MultipleChoice,
    options: [],
    correctAnswer: '',
    timeInSeconds: 60,
    imageLink: '',
    answerExplanation: '',
    sourceFile,
});

export const normalizeQuestionType = (value: unknown): QuestionType => {
    const raw = String(value || '').trim().toLowerCase();

    if (raw.includes('checkbox') || raw.includes('true') || raw.includes('false') || raw.includes('dung') || raw.includes('sai')) {
        return QuestionType.Checkbox;
    }

    if (raw.includes('fill') || raw.includes('blank') || raw.includes('short') || raw.includes('tu luan') || raw.includes('dien')) {
        return QuestionType.FillInTheBlank;
    }

    if (raw.includes('open')) return QuestionType.OpenEnded;
    if (raw.includes('poll')) return QuestionType.Poll;
    if (raw.includes('draw')) return QuestionType.Draw;

    return QuestionType.MultipleChoice;
};

const normalizeHeader = (value: unknown): string =>
    String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const asString = (value: unknown): string => String(value ?? '').trim();
const asRawString = (value: unknown): string => String(value ?? '');

const findHeaderIndex = (headers: string[], name: string, fallback?: number): number => {
    const index = headers.indexOf(normalizeHeader(name));
    return index >= 0 ? index : (fallback ?? -1);
};

const readJoinedCell = (row: unknown[], headers: string[], name: string, fallback: number): string => {
    const firstIndex = findHeaderIndex(headers, name, fallback);
    const continuationIndexes: number[] = [];

    for (let part = 2; ; part++) {
        const index = findHeaderIndex(headers, `${name} continuation ${part}`);
        if (index < 0) break;
        continuationIndexes.push(index);
    }

    if (continuationIndexes.length === 0) {
        return firstIndex >= 0 ? asString(row[firstIndex]) : '';
    }

    const parts = [
        firstIndex >= 0 ? asRawString(row[firstIndex]) : '',
        ...continuationIndexes.map(index => asRawString(row[index])),
    ];

    return parts.join('');
};

export const importQuestionsFromXlsx = async (file: File): Promise<Question[]> => {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });

    if (rows.length < 2) return [];

    const headers = rows[0].map(normalizeHeader);
    const indexOf = (name: string, fallback: number) => findHeaderIndex(headers, name, fallback);

    const questionIndex = indexOf('question text', 0);
    const typeIndex = indexOf('question type', 1);
    const answerIndex = indexOf('correct answer', 7);
    const timeIndex = indexOf('time in seconds', 8);
    const imageIndex = indexOf('link of the image', 9);
    const explanationIndex = indexOf('answer explanation', 10);
    const optionIndexes = [1, 2, 3, 4, 5].map(number => indexOf(`option ${number}`, number + 1));

    return rows.slice(1)
        .map(row => {
            const question = defaultQuestion(file.name);
            question.questionText = readJoinedCell(row, headers, 'Question text', questionIndex);
            question.questionType = normalizeQuestionType(row[typeIndex]);
            question.options = optionIndexes.map((index, optionIndex) =>
                readJoinedCell(row, headers, `Option ${optionIndex + 1}`, index)
            ).filter(Boolean);
            question.correctAnswer = readJoinedCell(row, headers, 'Correct answer', answerIndex);
            question.timeInSeconds = Number(row[timeIndex]) || 60;
            question.imageLink = readJoinedCell(row, headers, 'Link of the image', imageIndex);
            question.answerExplanation = readJoinedCell(row, headers, 'Answer explanation', explanationIndex);
            return question;
        })
        .filter(question => question.questionText || question.options.length > 0);
};

const extractJsonFromDataScript = (html: string): string | null => {
    const match = html.match(/<script\b(?=[^>]*\bid=(["'])quiz-data\1)[^>]*>([\s\S]*?)<\/script>/i);
    return match ? match[2].trim() : null;
};

const findJsonEnd = (html: string, start: number): number => {
    let index = start;

    while (/\s/.test(html[index] || '')) index++;

    const firstChar = html[index];
    if (firstChar !== '[' && firstChar !== '{') {
        throw new Error('Du lieu JSON trong file HTML khong hop le.');
    }

    let depth = 0;
    let inString = false;
    let escaping = false;

    for (; index < html.length; index++) {
        const char = html[index];

        if (inString) {
            if (escaping) {
                escaping = false;
            } else if (char === '\\') {
                escaping = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '[' || char === '{') {
            depth++;
            continue;
        }

        if (char === ']' || char === '}') {
            depth--;
            if (depth === 0) return index + 1;
        }
    }

    throw new Error('File HTML co du lieu JSON chua dong het.');
};

const extractSlidesJson = (html: string): string => {
    const dataScriptJson = extractJsonFromDataScript(html);
    if (dataScriptJson) return dataScriptJson;

    const markers = ['initSlides(', 'loadQuizData('];
    const found = markers
        .map(marker => ({ marker, start: html.lastIndexOf(marker) }))
        .sort((a, b) => b.start - a.start)[0];

    if (!found || found.start < 0) {
        throw new Error('Khong tim thay du lieu quiz trong file HTML.');
    }

    const jsonStart = found.start + found.marker.length;
    const end = findJsonEnd(html, jsonStart);

    return html.slice(jsonStart, end);
};

export const importQuestionsFromHtml = async (file: File): Promise<Question[]> => {
    const html = await file.text();
    const slides = JSON.parse(extractSlidesJson(html)) as HtmlSlide[];

    return slides.map(slide => {
        const question = defaultQuestion(file.name);
        question.questionText = asString(slide.content);
        question.answerExplanation = asString(slide.explanation);
        question.timeInSeconds = Number(slide.time) || 60;
        question.imageLink = asString(slide.image);
        question.options = (slide.options || []).map(option => asString(option.text)).filter(Boolean);

        if (slide.type === 'tf') {
            question.questionType = QuestionType.Checkbox;
            question.correctAnswer = (slide.options || [])
                .map((option, index) => option.is_correct ? String(index + 1) : '')
                .filter(Boolean)
                .join(',');
        } else if (slide.type === 'short') {
            question.questionType = QuestionType.FillInTheBlank;
            question.options = [asString(slide.correct_answer || slide.options?.[0]?.text)];
            question.correctAnswer = '1';
        } else {
            question.questionType = QuestionType.MultipleChoice;
            question.correctAnswer = (slide.options || [])
                .map((option, index) => option.is_correct ? String(index + 1) : '')
                .filter(Boolean)
                .join(',');
        }

        return question;
    }).filter(question => question.questionText || question.options.length > 0);
};

export const importOutputQuestions = async (file: File): Promise<Question[]> => {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
        return importQuestionsFromHtml(file);
    }

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        return importQuestionsFromXlsx(file);
    }

    throw new Error(`Khong ho tro file ${file.name}. Hay chon HTML hoac XLSX.`);
};
