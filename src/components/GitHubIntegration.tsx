import React, { useState, useEffect } from 'react';
import { Github, GitBranch, Upload, Download, FolderOpen, File, Plus, Trash2, RefreshCw } from 'lucide-react';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  sha?: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

interface GitHubIntegrationProps {
  onFileSelect: (content: string, filename: string) => void;
  currentCode: string;
  currentFilename: string;
}

export default function GitHubIntegration({ onFileSelect, currentCode, currentFilename }: GitHubIntegrationProps) {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      setIsConnected(true);
      loadRepos(savedToken);
    }
  }, []);

  const connectGitHub = async () => {
    if (!token.trim()) {
      setError('Please enter a valid GitHub Personal Access Token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token or insufficient permissions');
      }

      localStorage.setItem('github_token', token);
      setIsConnected(true);
      setShowTokenInput(false);
      await loadRepos(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to GitHub');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem('github_token');
    setToken('');
    setIsConnected(false);
    setRepos([]);
    setSelectedRepo(null);
    setFiles([]);
    setCurrentPath('');
    setShowTokenInput(false);
  };

  const loadRepos = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${authToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) throw new Error('Failed to load repositories');

      const repoData = await response.json();
      setRepos(repoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const selectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    await loadFiles(repo, '');
  };

  const loadFiles = async (repo: GitHubRepo, path: string) => {
    setLoading(true);
    try {
      const url = `https://api.github.com/repos/${repo.full_name}/contents/${path}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) throw new Error('Failed to load files');

      const fileData = await response.json();
      const processedFiles = Array.isArray(fileData) ? fileData.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        sha: item.sha
      })) : [];

      setFiles(processedFiles);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (file: GitHubFile) => {
    if (file.type === 'dir') {
      await loadFiles(selectedRepo!, file.path);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${selectedRepo!.full_name}/contents/${file.path}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) throw new Error('Failed to load file content');

      const fileData = await response.json();
      const content = atob(fileData.content);
      onFileSelect(content, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedRepo || !currentFilename || !currentCode) {
      setError('No file selected or content to save');
      return;
    }

    setLoading(true);
    try {
      const filePath = currentPath ? `${currentPath}/${currentFilename}` : currentFilename;
      
      // Check if file exists to get SHA
      let sha = '';
      try {
        const existingResponse = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/contents/${filePath}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          sha = existingData.sha;
        }
      } catch {
        // File doesn't exist, that's okay
      }

      const response = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update ${currentFilename} via SmartAudit AI`,
          content: btoa(currentCode),
          sha: sha || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to save file');

      // Refresh file list
      await loadFiles(selectedRepo, currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const navigateUp = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      loadFiles(selectedRepo!, parentPath);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to GitHub</h3>
          <p className="text-gray-600 mb-6">
            Connect your GitHub account to sync code with repositories
          </p>
          
          {!showTokenInput ? (
            <button
              onClick={() => setShowTokenInput(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Github className="h-5 w-5" />
              <span>Connect GitHub</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Need a token? <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Create one here</a>
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={connectGitHub}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  onClick={() => setShowTokenInput(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Github className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">GitHub Integration</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadRepos(token)}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={disconnect}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex">
        {/* Repository List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">Repositories</h4>
          </div>
          <div className="space-y-1 p-2">
            {repos.map((repo) => (
              <button
                key={repo.full_name}
                onClick={() => selectRepo(repo)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRepo?.full_name === repo.full_name
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{repo.name}</p>
                    <p className="text-xs text-gray-500">{repo.private ? 'Private' : 'Public'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Browser */}
        <div className="flex-1 overflow-y-auto">
          {selectedRepo ? (
            <>
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-700">{selectedRepo.name}</h4>
                  {currentPath && (
                    <span className="text-xs text-gray-500">/{currentPath}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {currentCode && (
                    <button
                      onClick={saveFile}
                      disabled={loading}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Push</span>
                    </button>
                  )}
                  {currentPath && (
                    <button
                      onClick={navigateUp}
                      className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      title="Go up"
                    >
                      <FolderOpen className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-1 p-2">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => openFile(file)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    {file.type === 'dir' ? (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                      <File className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-900">{file.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a repository to browse files</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}