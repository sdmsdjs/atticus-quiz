import * as XLSX from 'xlsx';
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

export const importQuestionsFromXlsx = async (file: File): Promise<Question[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });

    if (rows.length < 2) return [];

    const headers = rows[0].map(normalizeHeader);
    const indexOf = (name: string, fallback: number) => {
        const index = headers.indexOf(name);
        return index >= 0 ? index : fallback;
    };

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
            question.questionText = asString(row[questionIndex]);
            question.questionType = normalizeQuestionType(row[typeIndex]);
            question.options = optionIndexes.map(index => asString(row[index])).filter(Boolean);
            question.correctAnswer = asString(row[answerIndex]);
            question.timeInSeconds = Number(row[timeIndex]) || 60;
            question.imageLink = asString(row[imageIndex]);
            question.answerExplanation = asString(row[explanationIndex]);
            return question;
        })
        .filter(question => question.questionText || question.options.length > 0);
};

const extractSlidesJson = (html: string): string => {
    const marker = 'initSlides(';
    const start = html.lastIndexOf(marker);

    if (start < 0) {
        throw new Error('Khong tim thay du lieu initSlides trong file HTML.');
    }

    const jsonStart = start + marker.length;
    const end = html.indexOf(');', jsonStart);

    if (end < 0) {
        throw new Error('File HTML co du lieu initSlides khong hop le.');
    }

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
