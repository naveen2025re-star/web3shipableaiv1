import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Edit3 } from 'lucide-react';
import { Project } from '../hooks/useProjects';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, contractLanguage: string, targetBlockchain: string) => Promise<void>;
  project?: Project | null;
  mode: 'create' | 'edit';
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

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  mode
}: ProjectModalProps) {
  const [name, setName] = useState('');
  const [contractLanguage, setContractLanguage] = useState('Solidity');
  const [targetBlockchain, setTargetBlockchain] = useState('Ethereum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        setName(project.name);
        setContractLanguage(project.contract_language);
        setTargetBlockchain(project.target_blockchain);
      } else {
        setName('');
        setContractLanguage('Solidity');
        setTargetBlockchain('Ethereum');
      }
      setError('');
    }
  }, [isOpen, mode, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(name.trim(), contractLanguage, targetBlockchain);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {mode === 'create' ? (
              <FolderPlus className="h-6 w-6 text-blue-600" />
            ) : (
              <Edit3 className="h-6 w-6 text-blue-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create New Project' : 'Edit Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Contract Language */}
          <div>
            <label htmlFor="contractLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Smart Contract Language
            </label>
            <select
              id="contractLanguage"
              value={contractLanguage}
              onChange={(e) => setContractLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {CONTRACT_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          {/* Target Blockchain */}
          <div>
            <label htmlFor="targetBlockchain" className="block text-sm font-medium text-gray-700 mb-2">
              Target Blockchain
            </label>
            <select
              id="targetBlockchain"
              value={targetBlockchain}
              onChange={(e) => setTargetBlockchain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {BLOCKCHAINS.map((blockchain) => (
                <option key={blockchain} value={blockchain}>
                  {blockchain}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}