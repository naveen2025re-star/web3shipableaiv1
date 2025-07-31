import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Code, FileText } from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
  isCodeFile?: boolean;
}

interface RepoFileSelectorProps {
  owner: string;
  repo: string;
  onFilesSelected: (files: { path: string; content: string }[]) => void;
  onCancel: () => void;
}

export const RepoFileSelector: React.FC<RepoFileSelectorProps> = ({
  owner,
  repo,
  onFilesSelected,
  onCancel
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles('');
  }, [owner, repo]);

  const fetchFiles = async (path: string = '') => {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/list-github-repos?action=list-files&owner=${owner}&repo=${repo}&path=${encodeURIComponent(path)}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch repository files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath: string): Promise<string> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/list-github-repos?action=get-file-content&owner=${owner}&repo=${repo}&path=${encodeURIComponent(filePath)}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch content for ${filePath}`);
    }

    const data = await response.json();
    return data.content;
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const toggleDirectory = async (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
      // Fetch directory contents if not already loaded
      await fetchFiles(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const handleAnalyzeSelected = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select at least one file to analyze');
      return;
    }

    setLoadingFiles(true);
    try {
      const filesWithContent = await Promise.all(
        Array.from(selectedFiles).map(async (filePath) => {
          const content = await fetchFileContent(filePath);
          return { path: filePath, content };
        })
      );

      onFilesSelected(filesWithContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch file contents');
    } finally {
      setLoadingFiles(false);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'dir') {
      return <Folder className="w-4 h-4 text-blue-500" />;
    }
    if (file.isCodeFile) {
      return <Code className="w-4 h-4 text-green-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3">Loading repository files...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Select Files from {owner}/{repo}
          </h3>
          <div className="text-sm text-gray-500">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4">
          {files.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No files found in this repository
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div key={file.path} className="flex items-center space-x-2 py-1">
                  {file.type === 'dir' ? (
                    <button
                      onClick={() => toggleDirectory(file.path)}
                      className="flex items-center space-x-2 hover:bg-gray-50 rounded px-2 py-1 flex-1"
                    >
                      {expandedDirs.has(file.path) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      {getFileIcon(file)}
                      <span className="text-sm">{file.name}</span>
                    </button>
                  ) : (
                    <label className="flex items-center space-x-2 hover:bg-gray-50 rounded px-2 py-1 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {getFileIcon(file)}
                      <span className="text-sm flex-1">{file.name}</span>
                      {file.size && (
                        <span className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loadingFiles}
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyzeSelected}
            disabled={selectedFiles.size === 0 || loadingFiles}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loadingFiles ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading Files...
              </>
            ) : (
              `Analyze Selected Files (${selectedFiles.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepoFileSelector