import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Project {
  id: string;
  name: string;
  contract_language: string;
  target_blockchain: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects from database
  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching projects for user:', user.id);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } else {
        console.log('Fetched projects:', data?.length || 0);
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load projects from database
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load current project from localStorage on mount
  useEffect(() => {
    if (!user || projects.length === 0) return;

    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId) {
      const savedProject = projects.find(p => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProject(savedProject);
      } else {
        localStorage.removeItem('currentProjectId');
      }
    }
  }, [user, projects]);

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    if (project?.id) {
      localStorage.setItem('currentProjectId', project.id);
      console.log('Saved current project to localStorage:', project.name);
    }
  };

  const clearCurrentProject = () => {
    setCurrentProject(null);
    localStorage.removeItem('currentProjectId');
    console.log('Removed current project from localStorage');
  };

  // Create a new project
  const createProject = async (
    name: string,
    contractLanguage: string,
    targetBlockchain: string
  ): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          contract_language: contractLanguage,
          target_blockchain: targetBlockchain,
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadProjects();
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  };

  // Update a project
  const updateProject = async (
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'contract_language' | 'target_blockchain'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await loadProjects();
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  };

  // Delete a project
  const deleteProject = async (projectId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await loadProjects();
      
      // Clear current project if it was deleted
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  return {
    projects,
    currentProject,
    setCurrentProject: selectProject,
    loading,
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
  };
}