import React from 'react';
import { Question, QuestionType } from '../types';

interface QuestionTableProps {
  questions: Question[];
  onQuestionChange: (index: number, field: keyof Question, value: any) => void;
}

const MAX_EMBEDDED_IMAGE_SIZE = 1600;
const EMBEDDED_IMAGE_QUALITY = 0.9;
const optionLabels = ['A', 'B', 'C', 'D', 'E'];

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Khong doc duoc file anh.'));
  reader.readAsDataURL(file);
});

const resizeImageFileToDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Hay chon dung file anh.');
  }

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Khong xu ly duoc anh nay.'));
      image.src = objectUrl;
    });

    const scale = Math.min(1, MAX_EMBEDDED_IMAGE_SIZE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return readFileAsDataUrl(file);

    ctx.drawImage(img, 0, 0, width, height);
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(outputType, EMBEDDED_IMAGE_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const getEmbeddedImageSizeLabel = (value: string): string => {
  if (!value.startsWith('data:image/')) return '';
  const base64 = value.split(',')[1] || '';
  const bytes = Math.round(base64.length * 0.75);
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const getTextareaRows = (
  value: string,
  minRows: number,
  maxRows: number,
  charsPerRow: number
): number => {
  const rows = (value || '')
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerRow)), 0);

  return Math.max(minRows, Math.min(maxRows, rows));
};

const getQuestionTypeLabel = (type: QuestionType): string => {
  if (type === QuestionType.MultipleChoice) return 'Trac nghiem';
  if (type === QuestionType.Checkbox) return 'Dung/Sai nhieu y';
  if (type === QuestionType.FillInTheBlank) return 'Dien dap an';
  return type;
};

const QuestionTable: React.FC<QuestionTableProps> = ({ questions, onQuestionChange }) => {
  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newOptions = [...questions[qIndex].options];
    newOptions[optIndex] = value;
    onQuestionChange(qIndex, 'options', newOptions);
  };

  const handleOptionClick = (qIndex: number, optIndex: number) => {
    const question = questions[qIndex];
    const answerIndex = (optIndex + 1).toString();

    if (question.questionType === QuestionType.MultipleChoice || question.questionType === QuestionType.FillInTheBlank) {
      onQuestionChange(qIndex, 'correctAnswer', question.correctAnswer === answerIndex ? '' : answerIndex);
    } else if (question.questionType === QuestionType.Checkbox) {
      const currentAnswers = question.correctAnswer.split(',').filter(Boolean);
      const isSelected = currentAnswers.includes(answerIndex);
      const newAnswers = isSelected
        ? currentAnswers.filter(a => a !== answerIndex)
        : [...currentAnswers, answerIndex];

      newAnswers.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      onQuestionChange(qIndex, 'correctAnswer', newAnswers.join(','));
    }
  };

  const handleImageFile = async (qIndex: number, file: File | null | undefined) => {
    if (!file) return;

    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      onQuestionChange(qIndex, 'imageLink', dataUrl);
    } catch (error: any) {
      window.alert(error?.message || 'Khong chen duoc anh nay.');
    }
  };

  const handlePasteImage = async (qIndex: number, event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.clipboardData.items as unknown as DataTransferItem[]);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    const file = imageItem?.getAsFile();
    if (!file) return;

    event.preventDefault();
    await handleImageFile(qIndex, file);
  };

  const handleDropImage = async (qIndex: number, event: React.DragEvent<HTMLDivElement>) => {
    const files = Array.from(event.dataTransfer.files as unknown as File[]);
    const file = files.find(item => item.type.startsWith('image/'));
    if (!file) return;

    event.preventDefault();
    await handleImageFile(qIndex, file);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => {
        const selectedAnswers = q.correctAnswer.split(',').filter(Boolean);
        const isEmbeddedImage = q.imageLink.startsWith('data:image/');
        const imageSizeLabel = getEmbeddedImageSizeLabel(q.imageLink);
        const isFillInTheBlank = q.questionType === QuestionType.FillInTheBlank;

        return (
          <article
            key={qIndex}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded bg-indigo-600 text-sm font-black text-white">
                  {qIndex + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-gray-900 dark:text-gray-100">
                    Cau {qIndex + 1}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span>{getQuestionTypeLabel(q.questionType)}</span>
                    {q.sourceFile && <span>{q.sourceFile}</span>}
                    {q.exportGroup && <span>{q.exportGroup}</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Loai</span>
                  <select
                    value={q.questionType}
                    onChange={(event) => onQuestionChange(qIndex, 'questionType', event.target.value as QuestionType)}
                    className="w-full rounded border border-gray-300 bg-white p-2 text-sm font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:w-44"
                  >
                    {Object.values(QuestionType).map(type => (
                      <option key={type} value={type}>{getQuestionTypeLabel(type)}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Giay</span>
                  <input
                    type="number"
                    value={q.timeInSeconds}
                    onChange={(event) => onQuestionChange(qIndex, 'timeInSeconds', parseInt(event.target.value, 10) || 0)}
                    className="w-full rounded border border-gray-300 bg-white p-2 text-sm font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:w-24"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-gray-800 dark:text-gray-100">
                    Noi dung cau hoi
                  </span>
                  <textarea
                    value={q.questionText}
                    onChange={(event) => onQuestionChange(qIndex, 'questionText', event.target.value)}
                    className="w-full resize-y rounded border border-gray-300 bg-gray-50 p-3 text-base leading-7 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    rows={getTextareaRows(q.questionText, 4, 12, 58)}
                  />
                </label>

                <section>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-gray-800 dark:text-gray-100">
                      Dap an lua chon
                    </h3>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Dap an dung: {q.correctAnswer || 'chua chon'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {Array.from({ length: isFillInTheBlank ? 1 : 5 }).map((_, optIndex) => {
                      const answerIndex = (optIndex + 1).toString();
                      const isSelected = selectedAnswers.includes(answerIndex);
                      const optionValue = q.options[optIndex] || '';
                      const isClickable = Boolean(optionValue || isFillInTheBlank) &&
                        (
                          q.questionType === QuestionType.MultipleChoice ||
                          q.questionType === QuestionType.Checkbox ||
                          q.questionType === QuestionType.FillInTheBlank
                        );

                      return (
                        <div
                          key={optIndex}
                          className={`rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!isClickable}
                              onClick={() => handleOptionClick(qIndex, optIndex)}
                              className={`flex h-9 w-9 flex-none items-center justify-center rounded border text-sm font-black transition-colors ${
                                isSelected
                                  ? 'border-green-600 bg-green-600 text-white'
                                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                              } disabled:cursor-not-allowed disabled:opacity-45`}
                              title={`Dap an ${optionLabels[optIndex] || optIndex + 1}`}
                            >
                              {optionLabels[optIndex] || optIndex + 1}
                            </button>
                            <div className="min-w-0 text-sm font-bold text-gray-700 dark:text-gray-200">
                              {isFillInTheBlank ? 'Dap an dien khuyet' : `Lua chon ${optionLabels[optIndex] || optIndex + 1}`}
                            </div>
                          </div>

                          <textarea
                            value={optionValue}
                            placeholder={isFillInTheBlank ? 'Nhap dap an...' : `Noi dung dap an ${optionLabels[optIndex] || optIndex + 1}`}
                            onChange={(event) => handleOptionChange(qIndex, optIndex, event.target.value)}
                            className={`w-full resize-y rounded border bg-white p-2 text-sm leading-6 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:bg-gray-700 dark:text-gray-100 ${
                              isSelected
                                ? 'border-green-400 dark:border-green-700'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            rows={getTextareaRows(optionValue, 2, 7, 42)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-gray-800 dark:text-gray-100">
                      Dap an dung
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(event) => onQuestionChange(qIndex, 'correctAnswer', event.target.value)}
                        className={`w-full rounded border bg-white p-2 pr-9 text-sm font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100 ${
                          q.isSolved ? 'border-indigo-400 dark:border-indigo-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {q.isSolving && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-gray-800 dark:text-gray-100">
                    Giai thich
                  </span>
                  <textarea
                    value={q.answerExplanation}
                    onChange={(event) => onQuestionChange(qIndex, 'answerExplanation', event.target.value)}
                    className="w-full resize-y rounded border border-gray-300 bg-gray-50 p-3 text-sm leading-6 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    rows={getTextareaRows(q.answerExplanation, 4, 10, 50)}
                    placeholder="AI explanation..."
                  />
                </label>

                <div
                  className="space-y-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  tabIndex={0}
                  onPaste={(event) => handlePasteImage(qIndex, event)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropImage(qIndex, event)}
                  title="Chon anh, keo-tha anh, hoac click vao day roi Ctrl+V anh."
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-gray-800 dark:text-gray-100">Anh minh hoa</div>
                    {q.imageLink && (
                      <button
                        type="button"
                        onClick={() => onQuestionChange(qIndex, 'imageLink', '')}
                        className="rounded bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200"
                      >
                        Xoa anh
                      </button>
                    )}
                  </div>

                  {q.imageLink ? (
                    <div className="space-y-2">
                      <img
                        src={q.imageLink}
                        alt={`Anh cau ${qIndex + 1}`}
                        className="max-h-56 w-full rounded border border-gray-200 bg-white object-contain dark:border-gray-600 dark:bg-gray-800"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                        {isEmbeddedImage ? `Da nhung offline${imageSizeLabel ? ` (${imageSizeLabel})` : ''}` : 'Dang dung URL anh'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-28 items-center justify-center rounded bg-white px-3 py-4 text-center text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                      Chon, keo-tha, hoac Ctrl+V anh vao day
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor={`question-image-${qIndex}`}
                      className="cursor-pointer rounded bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Chon anh
                    </label>
                    <input
                      id={`question-image-${qIndex}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleImageFile(qIndex, event.target.files?.[0]);
                        event.target.value = '';
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    value={isEmbeddedImage ? '' : q.imageLink}
                    onChange={(event) => onQuestionChange(qIndex, 'imageLink', event.target.value)}
                    placeholder={isEmbeddedImage ? 'Anh dang duoc nhung offline trong file HTML' : 'Hoac dan URL anh...'}
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              </aside>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default QuestionTable;
