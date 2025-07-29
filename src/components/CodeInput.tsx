import React, { useState } from 'react';
import { Shield, Plus, X, File, Send, XCircle, Upload, Sparkles, Zap } from 'lucide-react';

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
      code = uploadedFiles.map(file => file.content).join('\n\n');
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
      
      // Reset textarea height
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = '60px';
      }
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

  const clearInput = () => {
    setInput('');
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = '60px';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Enhanced Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium mb-4 border border-blue-200/50 shadow-sm">
          <Sparkles className="h-4 w-4 mr-2" />
          AI-Powered Security Analysis
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Smart Contract
        </h2>
        <p className="text-gray-600">
          Get comprehensive security analysis in seconds with our advanced AI auditor
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div 
          className={`relative bg-white border-2 rounded-3xl shadow-xl transition-all duration-300 ${
            isDragOver 
              ? 'border-blue-400 shadow-2xl bg-blue-50/30 scale-[1.02]' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-2xl'
          } ${isLoading ? 'opacity-75' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-t-3xl">
              <div className="flex items-center mb-2">
                <File className="h-4 w-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
                    <File className="h-3 w-3 mr-1" />
                    <span className="max-w-32 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 hover:bg-blue-200 rounded-full p-1 transition-colors"
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
                ? "💡 Describe your smart contract or add additional context for better analysis..." 
                : "📝 Paste your smart contract code here or describe what you want to audit..."
              }
              className="w-full px-6 py-5 pr-28 border-none outline-none resize-none rounded-3xl text-gray-900 placeholder-gray-500 min-h-[80px] max-h-[300px] text-lg leading-relaxed"
              style={{ 
                height: 'auto',
                minHeight: '80px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 300) + 'px';
              }}
              disabled={isLoading}
            />

            {/* Action Buttons */}
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              {/* Clear Input Button */}
              {input.trim() && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="p-2.5 hover:bg-gray-100 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110"
                  title="Clear input"
                >
                  <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* File Upload Button */}
              <label className="p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 group">
                <Upload className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
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
                className="group p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <Zap className="h-4 w-4" />
                  </div>
                ) : (
                  <Send className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </div>
          </div>

          {/* Drag & Drop Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 bg-opacity-95 border-2 border-dashed border-blue-400 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-center animate-pulse">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-blue-800 font-bold text-lg mb-2">Drop your smart contract files here</p>
                <p className="text-blue-600 text-sm">Supports .sol, .vy, .rs, .cairo, .move and more</p>
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-green-500" />
              <span>Enterprise-grade security</span>
            </div>
            {uploadedFiles.length === 0 && (
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-1 text-blue-500" />
                <span>Drag & drop or click to upload</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">⌘</kbd>
            <kbd className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">Enter</kbd>
            <span>to send</span>
          </div>
        </div>
      </form>
    </div>
  );
}