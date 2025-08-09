/**
 * Generate Shields.io badge markdown for repository metadata
 */

/**
 * Generate GitHub Stars badge
 */
function generateStarsBadge(repoFullName, stars, options = {}) {
  if (!repoFullName || stars === undefined) return '';
  
  const style = options.style || 'flat-square';
  const badgeUrl = `https://img.shields.io/github/stars/${repoFullName}?style=${style}&logo=github`;
  const repoUrl = `https://github.com/${repoFullName}/stargazers`;
  
  return `[![GitHub Stars](${badgeUrl})](${repoUrl})`;
}

/**
 * Generate License badge
 */
function generateLicenseBadge(license, options = {}) {
  if (!license) return '';
  
  const style = options.style || 'flat-square';
  // Encode license name for URL
  const encodedLicense = encodeURIComponent(license);
  const badgeUrl = `https://img.shields.io/badge/license-${encodedLicense}-blue?style=${style}`;
  
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
function generateVersionBadge(version, packageManager = 'npm', packageName = null, options = {}) {
  if (!version) return '';
  
  const style = options.style || 'flat-square';
  let badgeUrl;
  let linkUrl = '';
  
  if (packageManager === 'npm' && packageName) {
    badgeUrl = `https://img.shields.io/npm/v/${packageName}?style=${style}&logo=npm`;
    linkUrl = `https://www.npmjs.com/package/${packageName}`;
  } else if (packageManager === 'pypi' && packageName) {
    badgeUrl = `https://img.shields.io/pypi/v/${packageName}?style=${style}&logo=pypi`;
    linkUrl = `https://pypi.org/project/${packageName}/`;
  } else {
    // Generic version badge
    badgeUrl = `https://img.shields.io/badge/version-${encodeURIComponent(version)}-blue?style=${style}`;
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
 * AI-driven function to select the best Shields.io style for the repo
 */
function selectBestBadgeStyle({ repoType, isLibrary, isApp, isPopular }) {
  // Heuristic: use 'for-the-badge' for popular repos, 'flat-square' for libraries, 'flat' for apps, 'plastic' for legacy, 'social' for social focus
  if (isPopular) return 'for-the-badge';
  if (isLibrary) return 'flat-square';
  if (isApp) return 'flat';
  if (repoType === 'legacy') return 'plastic';
  return 'flat-square'; // default
}

/**
 * General Shields.io badge generator with customization
 */
function generateShieldsBadge({ label, message, color = 'blue', style = 'flat-square', logo, link }) {
  let url = `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}?style=${style}`;
  if (logo) url += `&logo=${encodeURIComponent(logo)}`;
  const markdown = `![${label}](${url})`;
  return link ? `[${markdown}](${link})` : markdown;
}

/**
 * Generate all relevant badges for a repository
 */
function generateAllBadges(githubData = null, localData = null, options = {}) {
  const badges = [];
  const importantBadges = [];
  // AI-driven style selection
  const style = options.style || selectBestBadgeStyle({
    repoType: githubData?.repoType,
    isLibrary: localData?.isLibrary,
    isApp: localData?.isApp,
    isPopular: githubData?.stars > 1000
  });
  const badgeOpts = { ...options, style };
  // Important badges
  if (githubData) {
    const starsBadge = generateStarsBadge(githubData.fullName, githubData.stars, badgeOpts);
    if (starsBadge) importantBadges.push(starsBadge);
    const licenseBadge = generateLicenseBadge(githubData.license, badgeOpts);
    if (licenseBadge) importantBadges.push(licenseBadge);
  }
  if (localData && localData.fileContents && localData.fileContents['package.json']) {
    const pkg = JSON.parse(localData.fileContents['package.json']);
    const versionBadge = generateVersionBadge(pkg.version, 'npm', pkg.name, badgeOpts);
    if (versionBadge) importantBadges.push(versionBadge);
  }
  // Other badges (add more as needed)
  // GitHub-specific badges
  if (githubData) {
    const forksBadge = generateForksBadge(githubData.fullName, githubData.forks);
    if (forksBadge) badges.push(forksBadge);
    
    const issuesBadge = generateIssuesBadge(githubData.fullName);
    if (issuesBadge) badges.push(issuesBadge);
    
    const lastCommitBadge = generateLastCommitBadge(githubData.fullName);
    if (lastCommitBadge) badges.push(lastCommitBadge);
    
    const languageBadge = generateLanguageBadge(githubData.language);
    if (languageBadge) badges.push(languageBadge);
  }
  
  // Local project badges
  if (localData && localData.fileContents) {
    // Docker badge
    const dockerBadge = generateDockerBadge(!!localData.fileContents['Dockerfile']);
    if (dockerBadge) badges.push(dockerBadge);
  }
  
  // If we only have local data and no GitHub data, try to extract language from local files
  if (!githubData && localData && localData.fileContents) {
    let detectedLanguage = null;
    
    if (localData.fileContents['package.json']) {
      detectedLanguage = 'JavaScript';
    } else if (localData.fileContents['requirements.txt'] || localData.fileContents['setup.py']) {
      detectedLanguage = 'Python';
    } else if (localData.fileContents['Cargo.toml']) {
      detectedLanguage = 'Rust';
    }
    
    if (detectedLanguage) {
      const languageBadge = generateLanguageBadge(detectedLanguage);
      if (languageBadge) badges.push(languageBadge);
    }
  }
  
  return { importantBadges, otherBadges: badges };
}

/**
 * Format badges into markdown
 */
function formatBadgesMarkdown({ importantBadges, otherBadges }) {
  let md = '';
  if (importantBadges && importantBadges.length > 0) {
    md += importantBadges.join(' ') + '\n\n';
  }
  if (otherBadges && otherBadges.length > 0) {
    md += otherBadges.join(' ') + '\n\n';
  }
  return md;
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
  formatBadgesMarkdown,
  selectBestBadgeStyle,
  generateShieldsBadge
};
