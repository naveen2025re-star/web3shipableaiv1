import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, Download, Eye, Calendar, FileText, Code, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  created_at: string;
  content_type: string;
}

interface FileManagerProps {
  onFilesSelected: (files: Array<{name: string, content: string}>) => void;
  onClose: () => void;
}

export default function FileManager({ onFilesSelected, onClose }: FileManagerProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSettingUpStorage, setIsSettingUpStorage] = useState(false);

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load files from database
      const { data: userFiles, error: dbError } = await supabase
        .from('user_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      // Format files for display
      const formattedFiles: UploadedFile[] = (userFiles || []).map(file => ({
        id: file.id,
        name: file.filename,
        size: file.file_size,
        created_at: file.created_at,
        content_type: file.content_type
        }));

      setFiles(formattedFiles);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const setupStoragePolicies = async () => {
    if (!user) return;

    try {
      setIsSettingUpStorage(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-storage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'setup_policies' })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to setup storage');
      }

      // Reload files after successful setup
      await loadFiles();
      
    } catch (err) {
      console.error('Error setting up storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup storage policies');
    } finally {
      setIsSettingUpStorage(false);
    }
  };

  const handleFileUpload = async (uploadFiles: FileList) => {
    if (!user || uploadFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(uploadFiles).map(async (file) => {
        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['sol', 'vy', 'rs', 'js', 'ts', 'jsx', 'tsx', 'py', 'cairo', 'move', 'json', 'txt'];

        if (!allowedExtensions.includes(fileExtension || '')) {
          throw new Error(`File type not supported: ${file.name}`);
        }

        // Read file content
        const content = await file.text();
        
        // Save to database
        const { error: uploadError } = await supabase
          .from('user_files')
          .insert({
            user_id: user.id,
            filename: file.name,
            content: content,
            content_type: file.type || 'text/plain',
            file_size: file.size
          });

        if (uploadError) {
          throw uploadError;
        }

        return file.name;
      });

      await Promise.all(uploadPromises);
      await loadFiles(); // Refresh file list
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  };

  const handleFilesSelect = async () => {
    if (!user) return;
    
    if (selectedFiles.size === 0) {
      setError('Please select at least one file');
      return;
    }

    try {
      setError(null);
      
      const selectedFileData = await Promise.all(
        Array.from(selectedFiles).map(async (fileId) => {
          const { data, error } = await supabase
            .from('user_files')
            .select('filename, content')
            .eq('id', fileId)
            .single();

          if (error) throw error;
          return { name: data.filename, content: data.content };
        })
      );

      onFilesSelected(selectedFileData);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to download files');
    }
  };

  const handleFileDelete = async (file: UploadedFile) => {
    if (!user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id);

      if (error) {
        throw error;
      }

      await loadFiles(); // Refresh file list
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const codeExtensions = ['sol', 'vy', 'rs', 'js', 'ts', 'jsx', 'tsx', 'py', 'cairo', 'move'];
    
    if (codeExtensions.includes(extension || '')) {
      return <Code className="h-5 w-5 text-green-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Smart Contract Files</h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <input
          type="file"
          multiple
          accept=".sol,.vy,.rs,.js,.ts,.jsx,.tsx,.py,.cairo,.move,.json,.txt"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-all duration-200 ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed opacity-50' 
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </>
          )}
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Supported: .sol, .vy, .rs, .js, .ts, .py, .cairo, .move, .json, .txt
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium mb-1">Upload Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Your Files</h3>
          <span className="text-sm text-gray-500">{files.length} files</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload some smart contract files to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                  selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                  />
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(file.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFileDelete(file)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Delete file"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {selectedFiles.size > 0 && (
          <div className="flex items-center text-sm text-gray-600 mr-auto">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
          </div>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={handleFilesSelect}
          disabled={selectedFiles.size === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Eye className="h-4 w-4" />
          <span>Use Selected Files ({selectedFiles.size})</span>
        </button>
      </div>
    </div>
  );
}