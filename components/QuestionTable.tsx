import React from 'react';
import { Question, QuestionType } from '../types';

interface QuestionTableProps {
  questions: Question[];
  onQuestionChange: (index: number, field: keyof Question, value: any) => void;
}

const MAX_EMBEDDED_IMAGE_SIZE = 1600;
const EMBEDDED_IMAGE_QUALITY = 0.9;

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
  reader.readAsDataURL(file);
});

const resizeImageFileToDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Hãy chọn đúng file ảnh.');
  }

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Không xử lý được ảnh này.'));
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

      let newAnswers;
      if (isSelected) {
        newAnswers = currentAnswers.filter(a => a !== answerIndex);
      } else {
        newAnswers = [...currentAnswers, answerIndex];
      }
      
      newAnswers.sort((a, b) => parseInt(a) - parseInt(b));
      
      onQuestionChange(qIndex, 'correctAnswer', newAnswers.join(','));
    }
  };

  const handleImageFile = async (qIndex: number, file: File | null | undefined) => {
    if (!file) return;

    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      onQuestionChange(qIndex, 'imageLink', dataUrl);
    } catch (error: any) {
      window.alert(error?.message || 'Không chèn được ảnh này.');
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
    <div className="w-full overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3 min-w-[20rem]">Question Text</th>
            <th scope="col" className="px-6 py-3">Type</th>
            <th scope="col" className="px-6 py-3">Option 1</th>
            <th scope="col" className="px-6 py-3">Option 2</th>
            <th scope="col" className="px-6 py-3">Option 3</th>
            <th scope="col" className="px-6 py-3">Option 4</th>
            <th scope="col" className="px-6 py-3">Option 5</th>
            <th scope="col" className="px-6 py-3">Correct Answer</th>
            <th scope="col" className="px-6 py-3 min-w-[18rem]">Image</th>
            <th scope="col" className="px-6 py-3">Explanation</th>
            <th scope="col" className="px-6 py-3">Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, qIndex) => {
            const isEmbeddedImage = q.imageLink.startsWith('data:image/');
            const imageSizeLabel = getEmbeddedImageSizeLabel(q.imageLink);

            return (
            <tr key={qIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="px-6 py-4">
                <textarea
                  value={q.questionText}
                  onChange={(e) => onQuestionChange(qIndex, 'questionText', e.target.value)}
                  className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  rows={4}
                />
              </td>
              <td className="px-6 py-4">
                <select
                  value={q.questionType}
                  onChange={(e) => onQuestionChange(qIndex, 'questionType', e.target.value as QuestionType)}
                  className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                >
                  {Object.values(QuestionType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </td>
              {Array.from({ length: 5 }).map((_, optIndex) => {
                  const isSelected = q.correctAnswer.split(',').includes((optIndex + 1).toString());
                  const optionValue = q.options[optIndex] || '';
                  const isFillInTheBlank = q.questionType === QuestionType.FillInTheBlank;
                  const isDisabled = isFillInTheBlank && optIndex > 0;
                  const isClickable = !isDisabled && (q.questionType === QuestionType.MultipleChoice || q.questionType === QuestionType.Checkbox || q.questionType === QuestionType.FillInTheBlank) && (optionValue || isFillInTheBlank);

                  return (
                    <td 
                      key={optIndex} 
                      className={`px-6 py-4 transition-colors ${isClickable ? 'cursor-pointer' : ''} ${isSelected ? 'bg-green-100 dark:bg-green-800' : ''} ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 opacity-50' : ''}`}
                      onClick={() => isClickable && handleOptionClick(qIndex, optIndex)}
                    >
                      <input
                        type="text"
                        value={optionValue}
                        disabled={isDisabled}
                        placeholder={isFillInTheBlank && optIndex === 0 ? "Enter answer..." : ""}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className={`w-full p-1 border rounded bg-transparent ${isSelected ? 'border-green-400 dark:border-green-600' : 'border-gray-300 dark:border-gray-600'} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                      />
                    </td>
                  );
              })}
              <td className="px-6 py-4">
                <div className="relative">
                    <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) => onQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                    className={`w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 ${q.isSolved ? 'border-indigo-400 dark:border-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {q.isSolving && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div
                  className="min-w-64 space-y-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  tabIndex={0}
                  onPaste={(event) => handlePasteImage(qIndex, event)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropImage(qIndex, event)}
                  title="Chọn ảnh, kéo-thả ảnh, hoặc click vào đây rồi Ctrl+V ảnh."
                >
                  {q.imageLink ? (
                    <div className="space-y-2">
                      <img
                        src={q.imageLink}
                        alt={`Ảnh câu ${qIndex + 1}`}
                        className="max-h-32 w-full rounded border border-gray-200 object-contain bg-white dark:border-gray-600 dark:bg-gray-800"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                        {isEmbeddedImage ? `Đã nhúng offline${imageSizeLabel ? ` (${imageSizeLabel})` : ''}` : 'Đang dùng URL ảnh'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-24 items-center justify-center rounded bg-white px-3 py-4 text-center text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                      Chọn, kéo-thả, hoặc Ctrl+V ảnh vào đây
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor={`question-image-${qIndex}`}
                      className="cursor-pointer rounded bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Chọn ảnh
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
                    {q.imageLink && (
                      <button
                        type="button"
                        onClick={() => onQuestionChange(qIndex, 'imageLink', '')}
                        className="rounded bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={isEmbeddedImage ? '' : q.imageLink}
                    onChange={(event) => onQuestionChange(qIndex, 'imageLink', event.target.value)}
                    placeholder={isEmbeddedImage ? 'Ảnh đang được nhúng offline trong file HTML' : 'Hoặc dán URL ảnh...'}
                    className="w-full rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              </td>
              <td className="px-6 py-4">
                <textarea
                  value={q.answerExplanation}
                  onChange={(e) => onQuestionChange(qIndex, 'answerExplanation', e.target.value)}
                  className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  rows={2}
                  placeholder="AI explanation..."
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="number"
                  value={q.timeInSeconds}
                  onChange={(e) => onQuestionChange(qIndex, 'timeInSeconds', parseInt(e.target.value, 10) || 0)}
                  className="w-20 p-1 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionTable;
