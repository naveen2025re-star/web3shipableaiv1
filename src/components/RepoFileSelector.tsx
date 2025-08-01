import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Code, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const RepoFileSelector: React.FC<RepoFileSelectorProps> = ({
  owner,
  repo,
  onFilesSelected,
  onCancel
}) => {
  const { session } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles('');
  }, [owner, repo]);

  const fetchFiles = async (path: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase configuration is missing');
      }

      if (!session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/list-github-repos?action=list-files&owner=${owner}&repo=${repo}&path=${encodeURIComponent(path)}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to fetch repository files';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repository files');
      }
      
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath: string): Promise<string> => {
    if (!session?.access_token) {
      throw new Error('Authentication required. Please sign in again.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/list-github-repos?action=get-file-content&owner=${owner}&repo=${repo}&path=${encodeURIComponent(filePath)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      let errorMessage = `Failed to fetch content for ${filePath}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 404) {
          errorMessage = `File not found: ${filePath}. The file may have been moved, deleted, or you may lack access permissions.`;
        } else if (response.status === 403) {
          errorMessage = `Access forbidden to ${filePath}. Check your GitHub token permissions.`;
        } else if (response.status === 401) {
          errorMessage = `Authentication failed when accessing ${filePath}. Please check your GitHub token.`;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || `Failed to fetch content for ${filePath}`);
    }
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
      // Navigate into directory
      setPathHistory(prev => [...prev, dirPath]);
      await fetchFiles(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const navigateBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop();
      const previousPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      fetchFiles(previousPath);
    }
  };

  const navigateToPath = (targetPath: string) => {
    const pathIndex = pathHistory.indexOf(targetPath);
    if (pathIndex !== -1) {
      const newHistory = pathHistory.slice(0, pathIndex + 1);
      setPathHistory(newHistory);
      fetchFiles(targetPath);
    }
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
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading repository files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Files</h3>
          <div className="text-gray-600 mb-4 text-left">
            {error.split('\n').map((line, index) => (
              <div key={index} className={index === 0 ? 'font-medium mb-2' : 'text-sm'}>
                {line.startsWith('•') ? (
                  <div className="ml-2">{line}</div>
                ) : (
                  line
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => fetchFiles(currentPath)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateBack}
            disabled={pathHistory.length <= 1}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-1 text-sm">
            <span className="font-medium">{owner}/{repo}</span>
            {pathHistory.map((path, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigateToPath(path)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {path === '' ? 'root' : path.split('/').pop()}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4 max-h-96">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files found in this directory</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div key={file.path} className="flex items-center space-x-2 py-2 hover:bg-gray-50 rounded-lg px-2">
                {file.type === 'dir' ? (
                  <button
                    onClick={() => toggleDirectory(file.path)}
                    className="flex items-center space-x-3 flex-1 text-left hover:bg-blue-50 rounded p-1 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    {getFileIcon(file)}
                    <span className="text-sm font-medium text-blue-600">{file.name}</span>
                  </button>
                ) : (
                  <label className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors">
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center space-x-3 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedFiles.size > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="flex space-x-3">
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
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loadingFiles ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading Files...
            </>
          ) : (
            `Create Project & Analyze (${selectedFiles.size})`
          )}
        </button>
        </div>
      </div>
    </div>
  );
};

export default RepoFileSelector;