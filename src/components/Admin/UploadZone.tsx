import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export default function UploadZone({ onFilesSelected, maxFiles = 100 }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearAll = () => {
    setFiles([]);
    onFilesSelected([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-6xl">📤</div>
          {isDragActive ? (
            <p className="text-lg font-medium text-indigo-600">Drop images here...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900">
                Drag & drop images here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse (PNG, JPG, SVG, GIF, WebP)
              </p>
              <p className="text-xs text-gray-400">
                Max {maxFiles} files
              </p>
            </>
          )}
        </div>
      </div>

      {/* Selected files list */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">
              Selected: {files.length} {files.length === 1 ? 'image' : 'images'}
            </h3>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <li key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded flex items-center justify-center">
                      <span className="text-xs">🖼️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-4 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}



