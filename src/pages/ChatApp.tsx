import React, { useEffect } from 'react';
import ProjectSelector from '../components/ProjectSelector';
import ProjectModal from '../components/ProjectModal';
import ChatHistory from '../components/ChatHistory';
import CodeInput from '../components/CodeInput';
import { useProjects, Project } from '../hooks/useProjects';
import { useChatSessions } from '../hooks/useChatSessions';
import { useAuditWithSessions } from '../hooks/useAuditWithSessions';
import { useState } from 'react';
import { MessageSquare, Plus, Settings, LogOut, User, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChatSession } from '../hooks/useChatSessions';

export default function ChatApp() {
  const { user, signOut } = useAuth();
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const {
    currentSessionId,
    messages,
    isLoading,
    allSessions,
    setMessages,
    setIsLoading,
    createNewSession,
    loadSession,
    saveMessage,
    updateSessionTitle,
  } = useChatSessions(currentProject);

  const { performAudit } = useAuditWithSessions();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Project | null>(null);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject]);

  const handleNewChat = () => {
    createNewSession();
  };

  const handleSessionSelect = (sessionId: string) => {
    loadSession(sessionId);
  };

  const handleStartNewAudit = () => {
    createNewSession();
  };

  const handleAudit = async (code: string, description: string, fileName?: string, fileCount?: number) => {
    if (!currentProject) {
      alert('Please select a project first');
      return;
    }

    let sessionId = currentSessionId;
    
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }
    
    await performAudit(
      code,
      description,
      currentProject,
      sessionId,
      messages,
      setMessages,
      setIsLoading,
      saveMessage,
      updateSessionTitle,
      fileName,
      fileCount
    );
  };

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
      }
    } else if (editingProject) {
      await updateProject(editingProject.id, {
        name,
        contract_language: contractLanguage,
        target_blockchain: targetBlockchain,
      });
      // Update current project if it was the one being edited
      if (currentProject?.id === editingProject.id) {
        setCurrentProject({
          ...editingProject,
          name,
          contract_language: contractLanguage,
          target_blockchain: targetBlockchain,
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      <div className="h-screen flex bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 text-white flex flex-col h-full">
          {/* Project Selector */}
          <div className="p-4 border-b border-gray-700">
            <ProjectSelector
              projects={projects}
              currentProject={currentProject}
              onProjectSelect={setCurrentProject}
              onCreateProject={handleCreateProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={handleNewChat}
              disabled={!currentProject}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat Sessions */}
          <div className="flex-1 overflow-y-auto p-4 dark-scrollbar">
            <div className="space-y-2">
              {!currentProject ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a project</p>
                  <p className="text-xs mt-1">to view chat sessions</p>
                </div>
              ) : allSessions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chats yet</p>
                  <p className="text-xs mt-1">Start a new audit to begin</p>
                </div>
              ) : (
                allSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative rounded-lg transition-colors cursor-pointer ${
                      currentSessionId === session.id
                        ? 'bg-blue-700 border-l-4 border-blue-400'
                        : 'hover:bg-gray-800'
                    }`}
                    onClick={() => handleSessionSelect(session.id)}
                  >
                    <div className="flex items-center p-3">
                      <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(session.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Profile & Settings */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors text-sm">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          {!currentProject ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Project</h3>
                <p className="text-gray-600 mb-6">
                  Choose a project from the sidebar to start auditing smart contracts. Each project 
                  maintains its own chat history and audit reports.
                </p>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </button>
              </div>
            </div>
          ) : (
            <>
              <ChatHistory 
                messages={messages} 
                onStartNewAudit={handleStartNewAudit}
              />
              <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
                <CodeInput onSubmit={handleAudit} isLoading={isLoading} />
              </div>
            </>
          )}
        </div>
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
    </>
  );
}

// Remove the old Sidebar import since we're now using inline sidebar
// import Sidebar from '../components/Sidebar';
        />
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
          <CodeInput onSubmit={handleAudit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}