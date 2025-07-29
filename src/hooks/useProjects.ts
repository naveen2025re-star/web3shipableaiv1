import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);

  // Load all projects for the current user
  const loadProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
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

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [user]);

  return {
    projects,
    currentProject,
    setCurrentProject,
    loading,
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
  };
}