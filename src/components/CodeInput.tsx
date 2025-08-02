import React, { useState } from 'react';
import { Shield, Plus, X, File, Send, XCircle, Upload, Sparkles, Zap, FolderOpen, Code, FileText, Layers, Wand2 } from 'lucide-react';
import FileManager from './FileManager';

interface CodeInputProps {
  onSubmit: (code: string, description: string) => void;
  isLoading: boolean;
}

export default function CodeInput({ onSubmit, isLoading }: CodeInputProps) {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string}>>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine uploaded files content with manual input
    let finalCode = '';
    let description = '';
    
    if (uploadedFiles.length > 0) {
      // If files are uploaded, combine their content
      finalCode = uploadedFiles.map(file => file.content).join('\n\n');
      
      // Use manual input as description if provided
      if (input.trim()) {
        description = input.trim();
      }
    } else if (input.trim()) {
      // No files uploaded, check if input contains code patterns
      const hasCodePattern = /pragma solidity|contract\s+\w+|function\s+\w+|mapping\s*\(/.test(input);
      
      if (hasCodePattern) {
        // Input contains code
        finalCode = input.trim();
      } else {
        // Input is description only
        description = input.trim();
      }
    }
    
    // Only submit if we have code to analyze
    if (finalCode.trim()) {
      onSubmit(finalCode, description);
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

  const handleFileSelected = (fileName: string, content: string) => {
    setUploadedFiles([{ name: fileName, content }]);
    setShowFileManager(false);
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm text-blue-800 rounded-full text-sm font-bold mb-6 border border-blue-200/50 shadow-xl animate-scale-in hover:scale-105 transition-all duration-300">
          <Wand2 className="h-5 w-5 mr-2" />
          AI-Powered Security Analysis Engine
        </div>
        <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 animate-slide-up leading-tight">
          Upload Code, Files, or Scan Repository
        </h2>
        <p className="text-lg text-gray-700 animate-slide-up max-w-3xl mx-auto leading-relaxed font-medium">
          Upload files, paste code, or scan GitHub repositories with our <span className="text-blue-600 font-bold">advanced AI auditor</span>
        </p>
      </div>

      {/* GitHub Repository Selection */}
      {showFileManager && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl border border-blue-200/50 glass-effect animate-slide-up">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl border border-blue-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">File Manager</p>
                  <p className="text-sm text-gray-600 opacity-75">Select from uploaded files</p>
                </div>
              </div>
              <button
                onClick={() => setShowFileManager(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div 
          className={`relative bg-white/90 backdrop-blur-sm border-2 rounded-3xl shadow-2xl transition-all duration-500 ${
            isDragOver 
              ? 'border-blue-400 shadow-3xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 scale-[1.02] animate-pulse' 
              : 'border-gray-200/50 hover:border-blue-300/50 hover:shadow-3xl hover:scale-[1.01]'
          } ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-t-3xl backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl mr-3 shadow-lg">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-base font-bold text-gray-800">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="inline-flex items-center bg-gradient-to-r from-blue-100/90 to-blue-50/90 backdrop-blur-sm text-blue-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50 animate-scale-in hover:scale-105">
                    <File className="h-4 w-4 mr-2" />
                    <span className="max-w-32 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-3 hover:bg-blue-200/80 rounded-full p-1 transition-all duration-300 hover:scale-110"
                    >
                      <X className="h-3.5 w-3.5" />
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
                ? "💡 Describe your smart contract or add additional context for more targeted analysis..." 
                : "📝 Paste your smart contract code here, describe what you want to audit, or drag & drop files..."
              }
              className="w-full px-8 py-6 pr-32 border-none outline-none resize-none rounded-3xl text-gray-900 placeholder-gray-500 min-h-[100px] max-h-[400px] text-lg leading-relaxed bg-transparent font-medium"
              style={{ 
                height: 'auto',
                minHeight: '100px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 400) + 'px';
              }}
              disabled={isLoading}
            />

            {/* Action Buttons */}
            <div className="absolute right-4 bottom-4 flex items-center space-x-3">
              {/* Clear Input Button */}
              {input.trim() && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="p-3 hover:bg-gray-100/80 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50"
                  title="Clear input"
                >
                  <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* File Upload Button */}
              <label className="p-3 hover:bg-blue-50/80 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 group bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
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

              {/* File Manager Button */}
              <button
                type="button"
                onClick={() => setShowFileManager(true)}
                className="p-3 hover:bg-gray-50/80 rounded-xl transition-all duration-300 hover:scale-110 group bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50"
                title="Open File Manager"
              >
                <FolderOpen className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="group relative p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-110 disabled:transform-none disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                {isLoading ? (
                  <div className="flex items-center relative z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-2"></div>
                    <Sparkles className="h-5 w-5" />
                  </div>
                ) : (
                  <Send className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
                )}
              </button>
            </div>
          </div>

          {/* Drag & Drop Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 to-purple-50/95 border-3 border-dashed border-blue-400 rounded-3xl flex items-center justify-center backdrop-blur-lg animate-pulse">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-2xl animate-bounce">
                  <Upload className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-blue-800 font-black text-2xl mb-3">Drop your smart contract files here</p>
                <p className="text-blue-600 font-semibold">Supports .sol, .vy, .rs, .cairo, .move and more</p>
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600 animate-slide-up space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-lg mr-3 shadow-sm">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-bold">Enterprise-grade security</span>
            </div>
            {uploadedFiles.length === 0 && (
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg mr-3 shadow-sm">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-bold">Drag & drop or click to upload</span>
              </div>
            )}
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg mr-3 shadow-sm">
                <FolderOpen className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-bold">File management</span>
            </div>
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg mr-3 shadow-sm">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-bold">AI-powered analysis</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg text-sm font-mono shadow-lg border border-gray-200/50">⌘</kbd>
            <kbd className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg text-sm font-mono shadow-lg border border-gray-200/50">Enter</kbd>
            <span className="font-bold">to send</span>
          </div>
        </div>
      </form>

      {/* File Manager Modal */}
      {showFileManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-200/50">
            <div className="flex items-center justify-between p-8 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <h3 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">File Manager</h3>
              <button
                onClick={() => setShowFileManager(false)}
                className="p-3 hover:bg-gray-100/80 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="p-8">
              <FileManager
                onFileSelected={handleFileSelected}
                onClose={() => setShowFileManager(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}