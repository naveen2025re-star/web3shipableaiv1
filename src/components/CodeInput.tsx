import React, { useState } from 'react';
import { Shield, Plus, X, File, Send } from 'lucide-react';

interface CodeInputProps {
  onSubmit: (code: string, description: string, fileName?: string, fileCount?: number) => void;
  isLoading: boolean;
}

export default function CodeInput({ onSubmit, isLoading }: CodeInputProps) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string}>>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract description and code from input
    const lines = input.trim().split('\n');
    let description = '';
    let code = '';
    
    if (uploadedFiles.length > 0) {
      // If files are uploaded, treat input as description
      description = input.trim();
      code = uploadedFiles.map(file => `// File: ${file.name}\n${file.content}`).join('\n\n');
    } else if (input.trim()) {
      // If no files, check if input contains code
      const hasCodePattern = /pragma solidity|contract\s+\w+|function\s+\w+|mapping\s*\(/.test(input);
      
      if (hasCodePattern) {
        // Input contains code
        code = input.trim();
      } else {
        // Input is just description, no code
        description = input.trim();
        code = '';
      }
    }
    
    if (code.trim() || uploadedFiles.length > 0) {
      const finalFileName = uploadedFiles.length > 0 
        ? uploadedFiles.length === 1 
          ? uploadedFiles[0].name 
          : `${uploadedFiles.length} files`
        : undefined;
      
      onSubmit(code, description, finalFileName, uploadedFiles.length || undefined);
      setInput('');
      setUploadedFiles([]);
    }
  };

  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFiles(prev => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div 
          className={`relative bg-white border rounded-2xl shadow-lg transition-all duration-200 ${
            isDragOver ? 'border-blue-400 shadow-xl' : 'border-gray-300 hover:border-gray-400'
          } ${isLoading ? 'opacity-75' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <File className="h-3 w-3 mr-1" />
                    <span className="max-w-32 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Input Area */}
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedFiles.length > 0 
                ? "Describe your smart contract or add additional context..." 
                : "Paste your smart contract code here or describe what you want to audit..."
              }
              className="w-full px-4 py-4 pr-24 border-none outline-none resize-none rounded-2xl text-gray-900 placeholder-gray-500 min-h-[60px] max-h-[300px]"
              style={{ 
                height: 'auto',
                minHeight: '60px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 300) + 'px';
              }}
              disabled={isLoading}
            />

            {/* Action Buttons */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-2">
              {/* File Upload Button */}
              <label className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                <Plus className="h-5 w-5 text-gray-600" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".sol,.vy,.rs,.js,.ts,.cairo,.move"
                  multiple
                  className="hidden"
                  disabled={isLoading}
                />
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Drag & Drop Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <File className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-800 font-medium">Drop your smart contract files here</p>
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Supports Solidity, Vyper, Rust, and more</span>
            {uploadedFiles.length === 0 && (
              <span>• Drag & drop files or use the + button</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd>
            <span>to send</span>
          </div>
        </div>
      </form>
    </div>
  );
}