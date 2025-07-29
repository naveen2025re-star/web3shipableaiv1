import React, { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
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
    deleteChatSession,
    updateChatSessionTitle,
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
    if (sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  };

  const handleStartNewAudit = () => {
    createNewSession();
  };

  const handleAudit = async (code: string, description: string) => {
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
      updateSessionTitle
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
        <Sidebar
          currentSessionId={currentSessionId}
          sessions={allSessions}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={deleteChatSession}
          onUpdateSessionTitle={updateChatSessionTitle}
        />
        
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

      {/* Project Selector - Integrated into sidebar header */}
      <div className="absolute top-4 left-72 z-40 bg-white rounded-lg shadow-lg border border-gray-200">
        <ProjectSelector
          projects={projects}
          currentProject={currentProject}
          onProjectSelect={setCurrentProject}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
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