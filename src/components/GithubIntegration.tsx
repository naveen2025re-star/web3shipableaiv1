import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FolderOpen, 
  Edit3, 
  Trash2, 
  Calendar, 
  Code, 
  Shield, 
  TrendingUp,
  Clock,
  FileText,
  Settings,
  LogOut,
  User,
  Search,
  Filter,
  Grid,
  List,
  Github,
  X
} from 'lucide-react';
import { useProjects, Project } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';
import ProjectModal from '../components/ProjectModal';
import GithubIntegration from '../components/GithubIntegration';
import RepoFileSelector from '../components/RepoFileSelector';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    projects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
  } = useProjects();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterBlockchain, setFilterBlockchain] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showGithubIntegration, setShowGithubIntegration] = useState(false);
  const [isCreatingFromGithub, setIsCreatingFromGithub] = useState(false);
  const [showRepoFileBrowser, setShowRepoFileBrowser] = useState(false);
  const [selectedRepoForBrowsing, setSelectedRepoForBrowsing] = useState<any>(null);

  const handleCreateProject = () => {
    setProjectModalMode('create');
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setProjectModalMode('edit');
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setShowDeleteConfirm(project);
  };

  const confirmDeleteProject = async () => {
    if (showDeleteConfirm) {
      await deleteProject(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
    }
  };

  const handleProjectModalSubmit = async (
    name: string,
    contractLanguage: string,
    targetBlockchain: string
  ) => {
    if (projectModalMode === 'create') {
      const newProject = await createProject(name, contractLanguage, targetBlockchain);
      if (newProject) {
        setCurrentProject(newProject);
        navigate('/app');
      }
    } else if (editingProject) {
      await updateProject(editingProject.id, {
        name,
        contract_language: contractLanguage,
        target_blockchain: targetBlockchain,
      });
    }
  };

  const handleProjectSelect = (project: Project) => {
    console.log('Selecting project:', project.name);
    console.log('Setting current project...');
    setCurrentProject(project);
    localStorage.setItem('currentProject', JSON.stringify(project));
    navigate('/app');
  };

  const handleGithubRepositorySelect = async (repo: any) => {
    // Show file browser for the selected repository
    setSelectedRepoForBrowsing(repo);
    setShowRepoFileBrowser(true);
    setShowGithubIntegration(false);
  };
  
  const handleGithubFilesSelected = async (content: string, repoDetails: { owner: string; repo: string }) => {
  const handleGithubFilesSelected = async (files: { path: string; content: string }[], repoDetails: { owner: string; repo: string }) => {
    setIsCreatingFromGithub(true);
    
    try {
      // Combine all file contents into a single string
      const content = files.map(file => 
        `// File: ${file.path}\n${file.content}`
      ).join('\n\n' + '='.repeat(80) + '\n\n');
      
      // Determine the contract language based on file extensions in content
      let contractLanguage = 'Solidity';
      
      // Check file extensions from the files array
      const fileExtensions = files.map(file => file.path.toLowerCase());
      if (fileExtensions.some(path => path.endsWith('.js'))) contractLanguage = 'JavaScript';
      else if (fileExtensions.some(path => path.endsWith('.ts'))) contractLanguage = 'TypeScript';
      else if (fileExtensions.some(path => path.endsWith('.rs'))) contractLanguage = 'Rust';
      else if (fileExtensions.some(path => path.endsWith('.py'))) contractLanguage = 'Python';
      else if (fileExtensions.some(path => path.endsWith('.vy'))) contractLanguage = 'Vyper';
      else if (fileExtensions.some(path => path.endsWith('.cairo'))) contractLanguage = 'Cairo';
      else if (fileExtensions.some(path => path.endsWith('.move'))) contractLanguage = 'Move';
      
      const projectName = `${repoDetails.repo} (${files.length} files)`;
      
      // Create project from selected files
      const newProject = await createProject(projectName, contractLanguage, 'Ethereum');
      
      if (newProject) {
        // Set as current project and navigate to chat
        setCurrentProject(newProject);
        
        // Store file content for immediate analysis
        localStorage.setItem('pendingFileAnalysis', JSON.stringify({
          content: content,
          repoDetails: repoDetails,
          projectId: newProject.id
        }));
        
        navigate('/app');
      }
    } catch (error) {
      console.error('Error creating project from GitHub files:', error);
      alert('Failed to create project from selected files');
    } finally {
      setIsCreatingFromGithub(false);
      setShowGithubIntegration(false);
      setShowRepoFileBrowser(false);
      setSelectedRepoForBrowsing(null);
    }
  };

  const handleCancelFileBrowser = () => {
    setShowRepoFileBrowser(false);
    setSelectedRepoForBrowsing(null);
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'Solidity': 'bg-blue-100 text-blue-800 border-blue-200',
      'Vyper': 'bg-green-100 text-green-800 border-green-200',
      'Rust': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cairo': 'bg-purple-100 text-purple-800 border-purple-200',
      'Move': 'bg-pink-100 text-pink-800 border-pink-200',
      'JavaScript': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'TypeScript': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[language] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getBlockchainColor = (blockchain: string) => {
    const colors: { [key: string]: string } = {
      'Ethereum': 'bg-blue-50 text-blue-700 border-blue-200',
      'Polygon': 'bg-purple-50 text-purple-700 border-purple-200',
      'BSC': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Arbitrum': 'bg-blue-50 text-blue-700 border-blue-200',
      'Optimism': 'bg-red-50 text-red-700 border-red-200',
      'Avalanche': 'bg-red-50 text-red-700 border-red-200',
      'Fantom': 'bg-blue-50 text-blue-700 border-blue-200',
      'Solana': 'bg-green-50 text-green-700 border-green-200',
      'Near': 'bg-gray-50 text-gray-700 border-gray-200',
      'Aptos': 'bg-gray-900 text-white border-gray-700',
      'Sui': 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return colors[blockchain] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = !filterLanguage || project.contract_language === filterLanguage;
    const matchesBlockchain = !filterBlockchain || project.target_blockchain === filterBlockchain;
    return matchesSearch && matchesLanguage && matchesBlockchain;
  });

  // Get unique languages and blockchains for filters
  const uniqueLanguages = [...new Set(projects.map(p => p.contract_language))];
  const uniqueBlockchains = [...new Set(projects.map(p => p.target_blockchain))];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    SmartAudit AI
                  </h1>
                  <p className="text-sm text-gray-600">Project Dashboard</p>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="bg-blue-600 p-2 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-gray-500 text-xs">{user?.email}</p>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
                
                <button
                  onClick={signOut}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="bg-blue-100 rounded-xl p-3">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Languages</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueLanguages.length}</p>
                </div>
                <div className="bg-green-100 rounded-xl p-3">
                  <Code className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blockchains</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueBlockchains.length}</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.length > 0 ? 'Active' : 'None'}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-xl p-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Languages</option>
                  {uniqueLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <select
                  value={filterBlockchain}
                  onChange={(e) => setFilterBlockchain(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Blockchains</option>
                  {uniqueBlockchains.map(blockchain => (
                    <option key={blockchain} value={blockchain}>{blockchain}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Create Project Button */}
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Project
              </button>
              
              <button
                onClick={() => setShowGithubIntegration(!showGithubIntegration)}
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </button>
            </div>
          </div>

          {/* GitHub Integration Section */}
          {showGithubIntegration && (
            <div className="mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-900 p-2 rounded-lg">
                      <Github className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">GitHub Integration</h3>
                      <p className="text-sm text-gray-600">Import and scan repositories directly</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGithubIntegration(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                {isCreatingFromGithub && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-700 text-sm">Creating project from repository...</span>
                  </div>
                )}
                
                <GithubIntegration 
                  onFullRepositorySelect={handleGithubRepositorySelect}
                  onFilesSelected={handleGithubFilesSelected}
                  showRepositoryList={true} 
                />
              </div>
            </div>
          )}

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FolderOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {projects.length === 0 
                  ? 'Create your first project to start auditing smart contracts with AI-powered security analysis.'
                  : 'Try adjusting your search terms or filters to find the projects you\'re looking for.'
                }
              </p>
              {projects.length === 0 && (
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`group bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                    viewMode === 'list' ? 'flex items-center p-6' : 'p-6'
                  }`}
                 onClick={() => handleProjectSelect(project)}
                >
                  <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className={`flex items-start justify-between ${viewMode === 'list' ? 'items-center' : 'mb-4'}`}>
                      <div className={`${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}>
                        <div className={`bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-3 ${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}>
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          {viewMode === 'list' && (
                            <p className="text-sm text-gray-500">
                              Created {formatDate(project.created_at)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit project"
                        >
                          <Edit3 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className={`${viewMode === 'list' ? 'flex items-center space-x-4 ml-16' : 'space-y-3'}`}>
                      {/* Tags */}
                      <div className={`flex ${viewMode === 'list' ? 'space-x-2' : 'flex-wrap gap-2'}`}>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getLanguageColor(project.contract_language)}`}>
                          {project.contract_language}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getBlockchainColor(project.target_blockchain)}`}>
                          {project.target_blockchain}
                        </span>
                      </div>

                      {viewMode === 'grid' && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {formatDate(project.created_at)}
                        </div>
                      )}
                    </div>

                    {/* Open Project Button */}
                    <div
                      className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center cursor-pointer ${
                        viewMode === 'list' ? 'px-6 py-2 ml-4' : 'px-4 py-3 mt-4'
                      }`}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Start Auditing
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectModalSubmit}
        project={editingProject}
        mode={projectModalMode}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteConfirm.name}"? This will also delete all 
              associated chat sessions and audit reports. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repository File Browser Modal */}
      {showRepoFileBrowser && selectedRepoForBrowsing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-900 p-2 rounded-lg">
                  <Github className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Browse Repository Files
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedRepoForBrowsing.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelFileBrowser}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* File Browser Content */}
            <div className="flex-1 p-6 overflow-hidden">
              {isCreatingFromGithub && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700 text-sm">Creating project from selected files...</span>
                </div>
              )}
              
              <RepoFileSelector
                owner={selectedRepoForBrowsing.owner.login}
                repo={selectedRepoForBrowsing.name}
                  handleGithubFilesSelected(content, repoDetails);
                }}
                onCancel={handleCancelFileBrowser}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}