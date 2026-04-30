import React, { useCallback, useState } from 'react';
import { UploadIcon, DocumentIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  id?: string;
  accept?: string;
  multiple?: boolean;
  emptyHint?: string;
  selectedHint?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFiles,
  id = 'file-upload',
  accept = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  multiple = false,
  emptyHint = 'DOCX file',
  selectedHint = 'Click or drag to replace',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
        ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
        transition-colors duration-200 ease-in-out`}
      >
        {hasFiles ? (
          <div className="flex flex-col items-center justify-center text-center px-4">
            <DocumentIcon className="w-16 h-16 mb-4 text-indigo-500" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
            </p>
            {selectedFiles.length > 1 && (
              <p className="mt-1 max-w-full truncate text-xs text-gray-500 dark:text-gray-400">
                {selectedFiles.map(file => file.name).join(', ')}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedHint}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{emptyHint}</p>
          </div>
        )}
        <input
          id={id}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
        />
      </label>
    </div>
  );
};

export default FileUpload;
