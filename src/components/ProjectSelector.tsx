import React, { useState } from 'react';
import { Plus, FolderOpen, Settings, Trash2, Edit3, ChevronDown } from 'lucide-react';
import { Project } from '../hooks/useProjects';

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

const CONTRACT_LANGUAGES = [
  'Solidity',
  'Vyper', 
  'Rust',
  'Cairo',
  'Move',
  'JavaScript',
  'TypeScript'
];

const BLOCKCHAINS = [
  'Ethereum',
  'Polygon',
  'BSC',
  'Arbitrum',
  'Optimism',
  'Avalanche',
  'Fantom',
  'Solana',
  'Near',
  'Aptos',
  'Sui'
];

export default function ProjectSelector({
  projects,
  currentProject,
  onProjectSelect,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'Solidity': 'bg-blue-100 text-blue-800',
      'Vyper': 'bg-green-100 text-green-800',
      'Rust': 'bg-orange-100 text-orange-800',
      'Cairo': 'bg-purple-100 text-purple-800',
      'Move': 'bg-pink-100 text-pink-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'TypeScript': 'bg-indigo-100 text-indigo-800',
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  const getBlockchainColor = (blockchain: string) => {
    const colors: { [key: string]: string } = {
      'Ethereum': 'bg-blue-100 text-blue-800',
      'Polygon': 'bg-purple-100 text-purple-800',
      'BSC': 'bg-yellow-100 text-yellow-800',
      'Arbitrum': 'bg-blue-100 text-blue-800',
      'Optimism': 'bg-red-100 text-red-800',
      'Avalanche': 'bg-red-100 text-red-800',
      'Fantom': 'bg-blue-100 text-blue-800',
      'Solana': 'bg-green-100 text-green-800',
      'Near': 'bg-gray-100 text-gray-800',
      'Aptos': 'bg-black text-white',
      'Sui': 'bg-blue-100 text-blue-800',
    };
    return colors[blockchain] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative">
      {/* Current Project Display */}
      <div
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <FolderOpen className="h-5 w-5 text-gray-600" />
          <div className="min-w-0 flex-1">
            {currentProject ? (
              <>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentProject.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLanguageColor(currentProject.contract_language)}`}>
                    {currentProject.contract_language}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBlockchainColor(currentProject.target_blockchain)}`}>
                    {currentProject.target_blockchain}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Select a project</p>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Create New Project Button */}
          <button
            onClick={() => {
              onCreateProject();
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Create New Project</span>
          </button>

          {/* Project List */}
          {projects.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No projects yet. Create your first project to get started.
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                  currentProject?.id === project.id ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  onClick={() => {
                    onProjectSelect(project);
                    setIsDropdownOpen(false);
                  }}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLanguageColor(project.contract_language)}`}>
                      {project.contract_language}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBlockchainColor(project.target_blockchain)}`}>
                      {project.target_blockchain}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProject(project);
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit project"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project);
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}