const axios = require('axios');
const chalk = require('chalk');

/**
 * Parse a GitHub URL to extract owner and repository name
 */
function parseGitHubUrl(url) {
  const patterns = [
    // https://github.com/owner/repo
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    // git@github.com:owner/repo.git
    /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
    // owner/repo format
    /^([^\/]+)\/([^\/]+)$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  }

  throw new Error(`Invalid GitHub URL format: ${url}`);
}

/**
 * Fetch repository metadata from GitHub API
 */
async function fetchRepoMetadata(url) {
  try {
    const { owner, repo } = parseGitHubUrl(url);
    
    console.log(chalk.gray(`Fetching metadata for ${owner}/${repo}...`));
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'docsmith-cli'
      },
      timeout: 10000
    });

    const data = response.data;
    
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      language: data.language || 'Unknown',
      license: data.license ? data.license.name : null,
      topics: data.topics || [],
      homepageUrl: data.homepage || null,
      gitUrl: data.git_url,
      cloneUrl: data.clone_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isPrivate: data.private,
      hasIssues: data.has_issues,
      hasWiki: data.has_wiki,
      hasPages: data.has_pages,
      owner: {
        login: data.owner.login,
        type: data.owner.type,
        avatarUrl: data.owner.avatar_url
      }
    };
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error(`Repository not found or is private: ${url}`);
        case 403:
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        case 401:
          throw new Error('GitHub API authentication failed.');
        default:
          throw new Error(`GitHub API error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to GitHub API. Please check your internet connection.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('GitHub API request timed out. Please try again.');
    } else {
      throw new Error(`Failed to fetch repository metadata: ${error.message}`);
    }
  }
}

/**
 * Get the current repository's remote URL if in a git repository
 */
async function getCurrentRepoUrl() {
  const { execSync } = require('child_process');
  
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Get the remote URL
    const remoteUrl = execSync('git config --get remote.origin.url', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    if (!remoteUrl) {
      throw new Error('No remote origin URL found');
    }
    
    // Check if it's a GitHub URL
    if (!remoteUrl.includes('github.com')) {
      throw new Error('Remote origin is not a GitHub repository');
    }
    
    return remoteUrl;
  } catch (error) {
    if (error.status === 128) {
      throw new Error('Current directory is not a Git repository');
    }
    throw error;
  }
}

/**
 * Check if a GitHub repository exists and is public
 */
async function checkRepoExists(url) {
  try {
    await fetchRepoMetadata(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  parseGitHubUrl,
  fetchRepoMetadata,
  getCurrentRepoUrl,
  checkRepoExists
};
