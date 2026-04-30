import * as XLSX from 'xlsx';
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

export const exportToXlsx = (questions: Question[], fileName = `${makeExportBaseName(questions)}.xlsx`) => {
    const headerRow = [
        'Question text', 'Question type', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 
        'Correct answer', 'Time in seconds', 'Link of the image', 'Answer explanation'
    ];

    const data = questions.map(q => [
        q.questionText,
        q.questionType,
        ...Array.from({ length: 5 }, (_, i) => q.options[i] || ''),
        q.correctAnswer,
        q.timeInSeconds,
        q.imageLink,
        q.answerExplanation
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...data]);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quiz Data");

    // Write file
    XLSX.writeFile(wb, sanitizeFileName(fileName));
};
