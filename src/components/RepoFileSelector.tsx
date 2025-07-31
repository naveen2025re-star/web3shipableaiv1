import React, { useState, useEffect } from 'react';
import { X, File, Folder, FolderOpen, Code, Check, Loader2 } from 'lucide-react';

interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
}

interface RepoFileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  repoDetails: { owner: string; repo: string };
  onFilesSelect: (files: { path: string; content: string }[]) => void;
  githubPat: string;
}

export default function RepoFileSelector({ 
  isOpen, 
  onClose, 
  repoDetails, 
  onFilesSelect,
  githubPat 
}: RepoFileSelectorProps) {
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (isOpen && repoDetails) {
      fetchFiles('');
    }
  }, [isOpen, repoDetails]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const url = `https://api.github.com/repos/${repoDetails.owner}/${repoDetails.repo}/contents/${path}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();
      const fileList = Array.isArray(data) ? data : [data];
      
      if (path === '') {
        setFiles(fileList);
      } else {
        // Update files list with expanded directory contents
        setFiles(prev => {
          const newFiles = [...prev];
          const dirIndex = newFiles.findIndex(f => f.path === path);
          if (dirIndex !== -1) {
            newFiles.splice(dirIndex + 1, 0, ...fileList.map(f => ({ ...f, parentPath: path })));
          }
          return newFiles;
        });
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      alert('Failed to fetch repository files. Please check your GitHub token.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = async (dirPath: string) => {
    if (expandedDirs.has(dirPath)) {
      setExpandedDirs(prev => {
        const newSet = new Set(prev);
        newSet.delete(dirPath);
        return newSet;
      });
      // Remove files from this directory
      setFiles(prev => prev.filter(f => !f.path.startsWith(dirPath + '/')));
    } else {
      setExpandedDirs(prev => new Set(prev).add(dirPath));
      await fetchFiles(dirPath);
    }
  };

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  const fetchFileContent = async (file: RepoFile): Promise<string> => {
    if (!file.download_url) {
      throw new Error('No download URL available for file');
    }

    const response = await fetch(file.download_url, {
      headers: {
        'Authorization': `token ${githubPat}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }

    return await response.text();
  };

  const handleAnalyzeSelected = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select at least one file to analyze.');
      return;
    }

    setAnalyzing(true);
    try {
      const selectedFileObjects = files.filter(f => 
        f.type === 'file' && selectedFiles.has(f.path)
      );

      const filesWithContent = await Promise.all(
        selectedFileObjects.map(async (file) => {
          try {
            const content = await fetchFileContent(file);
            return { path: file.path, content };
          } catch (error) {
            console.error(`Error fetching content for ${file.path}:`, error);
            return { path: file.path, content: `Error loading file: ${error.message}` };
          }
        })
      );

      onFilesSelect(filesWithContent);
      onClose();
    } catch (error) {
      console.error('Error analyzing files:', error);
      alert('Failed to analyze selected files. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getFileIcon = (file: RepoFile) => {
    if (file.type === 'dir') {
      return expandedDirs.has(file.path) ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'sol', 'rs', 'go', 'java', 'cpp', 'c', 'h'];
    
    if (codeExtensions.includes(ext || '')) {
      return <Code className="w-4 h-4 text-green-500" />;
    }
    
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const getIndentLevel = (filePath: string) => {
    return filePath.split('/').length - 1;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Files to Analyze
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {repoDetails.owner}/{repoDetails.repo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleAnalyzeSelected}
                disabled={selectedFiles.size === 0 || analyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    Analyze Selected Files
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading repository files...</span>
              </div>
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    style={{ paddingLeft: `${getIndentLevel(file.path) * 20 + 8}px` }}
                  >
                    {file.type === 'dir' ? (
                      <div
                        className="flex items-center gap-2 flex-1"
                        onClick={() => toggleDirectory(file.path)}
                      >
                        {getFileIcon(file)}
                        <span className="text-sm font-medium text-gray-700">
                          {file.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-2 flex-1"
                          onClick={() => toggleFileSelection(file.path)}
                        >
                          {getFileIcon(file)}
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          {file.size && (
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                            selectedFiles.has(file.path)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                          onClick={() => toggleFileSelection(file.path)}
                        >
                          {selectedFiles.has(file.path) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}