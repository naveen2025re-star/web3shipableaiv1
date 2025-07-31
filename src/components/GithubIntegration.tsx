import React, { useState, useEffect } from 'react';
import { Github, Key, Folder, Download, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  language: string | null;
  private: boolean;
  updated_at: string;
}

interface GithubIntegrationProps {
  onRepositorySelect?: (repo: Repository) => void;
  showRepositoryList?: boolean;
}

export default function GithubIntegration({ 
  onRepositorySelect, 
  showRepositoryList = true 
}: GithubIntegrationProps) {
  const { user, updateUserProfile, getUserProfile } = useAuth();
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasSavedPat, setHasSavedPat] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Load existing PAT on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data, error } = await getUserProfile();
      if (data && data.github_pat) {
        setHasSavedPat(true);
        setPat(data.github_pat);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user, getUserProfile]);

  const handleSavePat = async () => {
    if (!pat.trim()) {
      setError('Please enter a GitHub Personal Access Token');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updateUserProfile({ github_pat: pat.trim() });
      
      if (error) {
        setError('Failed to save GitHub PAT: ' + error.message);
      } else {
        setSuccess('GitHub PAT saved successfully!');
        setHasSavedPat(true);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to save GitHub PAT');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRepositories = async () => {
    if (!pat.trim()) {
      setError('Please enter and save your GitHub PAT first');
      return;
    }

    setFetchingRepos(true);
    setError('');
    setRepositories([]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/list-github-repos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch repositories`);
      }

      const data = await response.json();
      
      if (data.repositories) {
        setRepositories(data.repositories);
        console.log('Repositories fetched successfully:', data.repositories.length);
        if (data.repositories.length === 0) {
          setError('No repositories found in your GitHub account');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
    } finally {
      setFetchingRepos(false);
    }
  };

  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setShowCreateProject(true);
    if (onRepositorySelect) {
      onRepositorySelect(repo);
    }
  };

  const handleCreateProjectFromRepo = () => {
    if (selectedRepo && onRepositorySelect) {
      onRepositorySelect(selectedRepo);
      setShowCreateProject(false);
    }
  };

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'TypeScript': 'bg-blue-100 text-blue-800',
      'Python': 'bg-green-100 text-green-800',
      'Solidity': 'bg-purple-100 text-purple-800',
      'Rust': 'bg-orange-100 text-orange-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Java': 'bg-red-100 text-red-800',
    };
    return colors[language || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-gray-900 p-2 rounded-lg">
          <Github className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">GitHub Integration</h3>
          <p className="text-sm text-gray-600">Connect your GitHub account to scan repositories</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* GitHub PAT Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="github-pat" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Personal Access Token
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="github-pat"
              type={showPat ? 'text' : 'password'}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={() => setShowPat(!showPat)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Need a token? <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Create one here</a>
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSavePat}
            disabled={loading || !pat.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <span>Save PAT</span>
          </button>

          <button
            onClick={handleFetchRepositories}
            disabled={fetchingRepos || !hasSavedPat}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetchingRepos ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Fetch Repositories</span>
          </button>
        </div>
      </div>

      {/* Repository List */}
      {showRepositoryList && repositories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Select Repository ({repositories.length} found)
          </h4>
          <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                onClick={() => handleRepositorySelect(repo)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:border-blue-300 ${
                  selectedRepo?.id === repo.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Folder className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{repo.name}</p>
                      <p className="text-xs text-gray-500 mb-1">{repo.full_name}</p>
                      {repo.description && (
                        <p className="text-xs text-gray-600 truncate max-w-xs">{repo.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {repo.language && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(repo.language)}`}>
                        {repo.language}
                      </span>
                    )}
                    {repo.private && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Repository Info */}
      {selectedRepo && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Github className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Selected Repository</p>
                <p className="text-sm text-blue-700">{selectedRepo.full_name}</p>
                {selectedRepo.description && (
                  <p className="text-xs text-blue-600 mt-1">{selectedRepo.description}</p>
                )}
              </div>
            </div>
            {showCreateProject && (
              <button
                onClick={handleCreateProjectFromRepo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Create Project & Scan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}