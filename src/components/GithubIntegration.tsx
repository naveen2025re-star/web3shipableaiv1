const handleGithubFilesSelected = (files: FileWithContent[], repoDetails: RepoDetails) => {
    onFilesSelected(files, repoDetails);
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