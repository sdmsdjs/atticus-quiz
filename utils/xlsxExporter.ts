import * as XLSX from 'xlsx';
import { Question } from '../types';
import { makeExportBaseName, sanitizeFileName } from './fileName';

export { makeExportBaseName, sanitizeFileName };

const EXCEL_SAFE_TEXT_CHUNK_LENGTH = 32000;

type ExportCell = string | number;

type ExportColumn = {
    header: string;
    value: (question: Question) => ExportCell;
};

const exportColumns: ExportColumn[] = [
    { header: 'Question text', value: question => question.questionText },
    { header: 'Question type', value: question => question.questionType },
    { header: 'Option 1', value: question => question.options[0] || '' },
    { header: 'Option 2', value: question => question.options[1] || '' },
    { header: 'Option 3', value: question => question.options[2] || '' },
    { header: 'Option 4', value: question => question.options[3] || '' },
    { header: 'Option 5', value: question => question.options[4] || '' },
    { header: 'Correct answer', value: question => question.correctAnswer },
    { header: 'Time in seconds', value: question => question.timeInSeconds },
    { header: 'Link of the image', value: question => question.imageLink },
    { header: 'Answer explanation', value: question => question.answerExplanation },
];

const splitCellForExcel = (value: ExportCell): ExportCell[] => {
    if (typeof value === 'number') return [value];

    const text = String(value ?? '');
    if (text.length === 0) return [''];

    const chunks: string[] = [];
    for (let index = 0; index < text.length; index += EXCEL_SAFE_TEXT_CHUNK_LENGTH) {
        chunks.push(text.slice(index, index + EXCEL_SAFE_TEXT_CHUNK_LENGTH));
    }

    return chunks;
};

export const exportToXlsx = (questions: Question[], fileName = `${makeExportBaseName(questions)}.xlsx`) => {
    const chunkRows = questions.map(question =>
        exportColumns.map(column => splitCellForExcel(column.value(question)))
    );

    const continuationCounts = exportColumns.map((_, columnIndex) =>
        Math.max(0, ...chunkRows.map(row => row[columnIndex].length - 1))
    );

    const continuationHeaders = exportColumns.flatMap((column, columnIndex) =>
        Array.from({ length: continuationCounts[columnIndex] }, (_, index) =>
            `${column.header} continuation ${index + 2}`
        )
    );

    const headerRow = [
        ...exportColumns.map(column => column.header),
        ...continuationHeaders,
    ];

    const data = chunkRows.map(row => [
        ...row.map(chunks => chunks[0] ?? ''),
        ...row.flatMap((chunks, columnIndex) =>
            Array.from({ length: continuationCounts[columnIndex] }, (_, index) =>
                chunks[index + 1] ?? ''
            )
        ),
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...data]);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quiz Data");

    // Write file
    XLSX.writeFile(wb, sanitizeFileName(fileName));
};
