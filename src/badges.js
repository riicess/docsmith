/**
 * Generate Shields.io badge markdown for repository metadata
 */

/**
 * Generate GitHub Stars badge
 */
function generateStarsBadge(repoFullName, stars) {
  if (!repoFullName || stars === undefined) return '';
  
  const badgeUrl = `https://img.shields.io/github/stars/${repoFullName}?style=flat-square&logo=github`;
  const repoUrl = `https://github.com/${repoFullName}/stargazers`;
  
  return `[![GitHub Stars](${badgeUrl})](${repoUrl})`;
}

/**
 * Generate License badge
 */
function generateLicenseBadge(license) {
  if (!license) return '';
  
  // Encode license name for URL
  const encodedLicense = encodeURIComponent(license);
  const badgeUrl = `https://img.shields.io/badge/license-${encodedLicense}-blue?style=flat-square`;
  
  return `![License](${badgeUrl})`;
}

/**
 * Generate Programming Language badge
 */
function generateLanguageBadge(language) {
  if (!language || language === 'Unknown') return '';
  
  const badgeUrl = `https://img.shields.io/badge/language-${encodeURIComponent(language)}-brightgreen?style=flat-square`;
  
  return `![Language](${badgeUrl})`;
}

/**
 * Generate GitHub Forks badge
 */
function generateForksBadge(repoFullName, forks) {
  if (!repoFullName || forks === undefined) return '';
  
  const badgeUrl = `https://img.shields.io/github/forks/${repoFullName}?style=flat-square&logo=github`;
  const repoUrl = `https://github.com/${repoFullName}/network/members`;
  
  return `[![GitHub Forks](${badgeUrl})](${repoUrl})`;
}

/**
 * Generate Issues badge
 */
function generateIssuesBadge(repoFullName) {
  if (!repoFullName) return '';
  
  const badgeUrl = `https://img.shields.io/github/issues/${repoFullName}?style=flat-square&logo=github`;
  const issuesUrl = `https://github.com/${repoFullName}/issues`;
  
  return `[![GitHub Issues](${badgeUrl})](${issuesUrl})`;
}

/**
 * Generate Last Commit badge
 */
function generateLastCommitBadge(repoFullName) {
  if (!repoFullName) return '';
  
  const badgeUrl = `https://img.shields.io/github/last-commit/${repoFullName}?style=flat-square&logo=github`;
  
  return `![Last Commit](${badgeUrl})`;
}

/**
 * Generate Version badge from package.json or other version sources
 */
function generateVersionBadge(version, packageManager = 'npm', packageName = null) {
  if (!version) return '';
  
  let badgeUrl;
  let linkUrl = '';
  
  if (packageManager === 'npm' && packageName) {
    badgeUrl = `https://img.shields.io/npm/v/${packageName}?style=flat-square&logo=npm`;
    linkUrl = `https://www.npmjs.com/package/${packageName}`;
  } else if (packageManager === 'pypi' && packageName) {
    badgeUrl = `https://img.shields.io/pypi/v/${packageName}?style=flat-square&logo=pypi`;
    linkUrl = `https://pypi.org/project/${packageName}/`;
  } else {
    // Generic version badge
    badgeUrl = `https://img.shields.io/badge/version-${encodeURIComponent(version)}-blue?style=flat-square`;
  }
  
  return linkUrl ? 
    `[![Version](${badgeUrl})](${linkUrl})` : 
    `![Version](${badgeUrl})`;
}

/**
 * Generate Docker badge if Dockerfile is present
 */
function generateDockerBadge(hasDockerfile = false) {
  if (!hasDockerfile) return '';
  
  const badgeUrl = 'https://img.shields.io/badge/docker-supported-blue?style=flat-square&logo=docker';
  
  return `![Docker](${badgeUrl})`;
}

/**
 * Generate Build Status badge (placeholder for CI/CD)
 */
function generateBuildBadge(repoFullName, hasCi = false) {
  if (!repoFullName || !hasCi) return '';
  
  // This is a placeholder - in a real implementation, you'd detect the CI system
  const badgeUrl = `https://img.shields.io/github/workflow/status/${repoFullName}/CI?style=flat-square&logo=github-actions`;
  const workflowUrl = `https://github.com/${repoFullName}/actions`;
  
  return `[![Build Status](${badgeUrl})](${workflowUrl})`;
}

/**
 * Generate all relevant badges for a repository
 */
function generateAllBadges(githubData = null, localData = null) {
  const badges = [];
  
  // GitHub-specific badges
  if (githubData) {
    const starsBadge = generateStarsBadge(githubData.fullName, githubData.stars);
    if (starsBadge) badges.push(starsBadge);
    
    const forksBadge = generateForksBadge(githubData.fullName, githubData.forks);
    if (forksBadge) badges.push(forksBadge);
    
    const issuesBadge = generateIssuesBadge(githubData.fullName);
    if (issuesBadge) badges.push(issuesBadge);
    
    const lastCommitBadge = generateLastCommitBadge(githubData.fullName);
    if (lastCommitBadge) badges.push(lastCommitBadge);
    
    const licenseBadge = generateLicenseBadge(githubData.license);
    if (licenseBadge) badges.push(licenseBadge);
    
    const languageBadge = generateLanguageBadge(githubData.language);
    if (languageBadge) badges.push(languageBadge);
  }
  
  // Local project badges
  if (localData) {
    // Version badge
    if (localData.files && localData.files['package.json']) {
      const pkg = localData.files['package.json'];
      const versionBadge = generateVersionBadge(pkg.version, 'npm', pkg.name);
      if (versionBadge) badges.push(versionBadge);
    } else if (localData.files && localData.files['setup.py']) {
      const setup = localData.files['setup.py'];
      const versionBadge = generateVersionBadge(setup.version, 'pypi', setup.name);
      if (versionBadge) badges.push(versionBadge);
    } else if (localData.files && localData.files['Cargo.toml']) {
      const cargo = localData.files['Cargo.toml'];
      const versionBadge = generateVersionBadge(cargo.version);
      if (versionBadge) badges.push(versionBadge);
    }
    
    // Docker badge
    const dockerBadge = generateDockerBadge(!!localData.files['Dockerfile']);
    if (dockerBadge) badges.push(dockerBadge);
  }
  
  // If we only have local data and no GitHub data, try to extract language from local files
  if (!githubData && localData) {
    let detectedLanguage = null;
    
    if (localData.files['package.json']) {
      detectedLanguage = 'JavaScript';
    } else if (localData.files['requirements.txt'] || localData.files['setup.py']) {
      detectedLanguage = 'Python';
    } else if (localData.files['Cargo.toml']) {
      detectedLanguage = 'Rust';
    }
    
    if (detectedLanguage) {
      const languageBadge = generateLanguageBadge(detectedLanguage);
      if (languageBadge) badges.push(languageBadge);
    }
  }
  
  return badges;
}

/**
 * Format badges into markdown
 */
function formatBadgesMarkdown(badges) {
  if (!badges || badges.length === 0) {
    return '';
  }
  
  // Join badges with spaces and add line breaks for better formatting
  const badgeLines = [];
  
  // Group badges in rows of 3-4 for better visual layout
  const maxPerRow = 4;
  for (let i = 0; i < badges.length; i += maxPerRow) {
    const rowBadges = badges.slice(i, i + maxPerRow);
    badgeLines.push(rowBadges.join(' '));
  }
  
  return badgeLines.join('\n\n') + '\n\n';
}

module.exports = {
  generateStarsBadge,
  generateLicenseBadge,
  generateLanguageBadge,
  generateForksBadge,
  generateIssuesBadge,
  generateLastCommitBadge,
  generateVersionBadge,
  generateDockerBadge,
  generateBuildBadge,
  generateAllBadges,
  formatBadgesMarkdown
};
