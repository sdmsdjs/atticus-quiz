import { Question } from '../types';

export const makeExportBaseName = (questions: Question[], fallback = 'quiz_data'): string => {
    const sourceFiles = Array.from(new Set(questions.map(q => q.sourceFile).filter(Boolean)));

    if (sourceFiles.length === 1) {
        return sourceFiles[0]!.replace(/\.[^.]+$/, '');
    }

    if (questions.length > 0) {
        return `quiz_${questions.length}_cau`;
    }

    return fallback;
};

export const sanitizeFileName = (name: string): string =>
    name
        .replace(/[<>:"/\\|?*]+/g, '')
        .replace(/\s+/g, ' ')
        .trim() || 'quiz_data';
