import React, { useState } from 'react';
import RepoFileSelector from './RepoFileSelector';

export interface FileWithContent {
  path: string;
  content: string;
}

export interface RepoDetails {
  owner: string;
  repo: string;
}

interface GithubIntegrationProps {
  onFilesSelected: (files: FileWithContent[], repoDetails: RepoDetails) => void;
  selectedRepoForBrowsing: any;
  showFileBrowser: boolean;
  onCancelFileBrowser: () => void;
}

const GithubIntegration: React.FC<GithubIntegrationProps> = ({
  onFilesSelected,
  selectedRepoForBrowsing,
  showFileBrowser,
  onCancelFileBrowser
}) => {
  const [loading] = useState(false);

  const handleGithubFilesSelected = (files: FileWithContent[], repoDetails: RepoDetails) => {
    onFilesSelected(files, repoDetails);
  };

  const handleCancelFileBrowser = () => {
    onCancelFileBrowser();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {showFileBrowser && selectedRepoForBrowsing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-auto">
            <RepoFileSelector
              owner={selectedRepoForBrowsing.owner.login}
              repo={selectedRepoForBrowsing.name}
              onFilesSelected={(files) => {
                const repoDetails = {
                  owner: selectedRepoForBrowsing.owner.login,
                  repo: selectedRepoForBrowsing.name
                };
                handleGithubFilesSelected(files, repoDetails);
              }}
              onCancel={handleCancelFileBrowser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubIntegration;