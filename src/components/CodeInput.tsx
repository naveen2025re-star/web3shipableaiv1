import React, { useState } from 'react';
import { Shield, Code2, FileText, UploadCloud, X, File } from 'lucide-react';

interface CodeInputProps {
  onSubmit: (code: string, description: string, fileName?: string, fileCount?: number) => void;
  isLoading: boolean;
}

export default function CodeInput({ onSubmit, isLoading }: CodeInputProps) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string}>>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() || uploadedFiles.length > 0) {
      const finalCode = uploadedFiles.length > 0 
        ? uploadedFiles.map(file => `// File: ${file.name}\n${file.content}`).join('\n\n')
        : code;
      const finalFileName = uploadedFiles.length > 0 
        ? uploadedFiles.length === 1 
          ? uploadedFiles[0].name 
          : `${uploadedFiles.length} files`
        : undefined;
      
      onSubmit(finalCode, description, finalFileName, uploadedFiles.length || undefined);
      setCode('');
      setDescription('');
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

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const switchMode = (mode: 'paste' | 'upload') => {
    setInputMode(mode);
    setCode('');
    setUploadedFiles([]);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            📋 Contract Description (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your smart contract (e.g., DeFi token, NFT marketplace...)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div>
          <div className="flex items-center space-x-1 mb-3">
            <button
              type="button"
              onClick={() => switchMode('paste')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                inputMode === 'paste'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Code2 className="h-4 w-4 mr-1" />
              Paste Code
            </button>
            <button
              type="button"
              onClick={() => switchMode('upload')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                inputMode === 'upload'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UploadCloud className="h-4 w-4 mr-1" />
              Upload File
            </button>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔍 Smart Contract Code
          </label>

          {inputMode === 'paste' ? (
            <div className="relative">
              <Code2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YourContract {
    // Paste your smart contract code here...
    // Supports Solidity, Vyper, Rust (Solana), and more
}"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm min-h-[200px] resize-vertical"
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.length === 0 ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your smart contract files here, or
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    <File className="h-4 w-4 mr-2" />
                    Choose Files
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".sol,.vy,.rs,.js,.ts,.cairo,.move"
                      multiple
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports multiple .sol, .vy, .rs, .js, .ts, .cairo, .move files
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                    </span>
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <File className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            title="Remove file"
                          >
                            <X className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2 max-h-20 overflow-y-auto">
                          <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                            {file.content.length > 200 ? `${file.content.substring(0, 200)}...` : file.content}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <label className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg cursor-pointer transition-colors">
                    <File className="h-4 w-4 mr-2" />
                    Add More Files
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".sol,.vy,.rs,.js,.ts,.cairo,.move"
                      multiple
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={(!code.trim() && uploadedFiles.length === 0) || isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Auditing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                🚀 Start Security Audit
                {uploadedFiles.length > 0 && (
                  <span className="ml-1 text-xs bg-blue-500 px-1.5 py-0.5 rounded-full">
                    {uploadedFiles.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}