const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse package.json for Node.js projects
 */
async function parsePackageJson(basePath) {
  const packagePath = path.join(basePath, 'package.json');
  
  if (!(await fileExists(packagePath))) {
    return null;
  }

  try {
    const content = await fs.readFile(packagePath, 'utf8');
    const pkg = JSON.parse(content);
    
    return {
      type: 'node',
      name: pkg.name,
      description: pkg.description,
      version: pkg.version,
      scripts: pkg.scripts || {},
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {}),
      engines: pkg.engines,
      license: pkg.license,
      author: pkg.author,
      repository: pkg.repository,
      keywords: pkg.keywords || []
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not parse package.json: ${error.message}`));
    return null;
  }
}

/**
 * Parse requirements.txt for Python projects
 */
async function parseRequirementsTxt(basePath) {
  const reqPath = path.join(basePath, 'requirements.txt');
  
  if (!(await fileExists(reqPath))) {
    return null;
  }

  try {
    const content = await fs.readFile(reqPath, 'utf8');
    const dependencies = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].split('~=')[0].trim());
    
    return {
      type: 'python',
      dependencies,
      hasRequirements: true
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not parse requirements.txt: ${error.message}`));
    return null;
  }
}

/**
 * Parse setup.py for Python projects
 */
async function parseSetupPy(basePath) {
  const setupPath = path.join(basePath, 'setup.py');
  
  if (!(await fileExists(setupPath))) {
    return null;
  }

  try {
    const content = await fs.readFile(setupPath, 'utf8');
    
    // Basic extraction - looking for common patterns
    const nameMatch = content.match(/name\s*=\s*['"](.*?)['"]/);
    const versionMatch = content.match(/version\s*=\s*['"](.*?)['"]/);
    const descriptionMatch = content.match(/description\s*=\s*['"](.*?)['"]/);
    const authorMatch = content.match(/author\s*=\s*['"](.*?)['"]/);
    
    return {
      type: 'python',
      name: nameMatch ? nameMatch[1] : null,
      version: versionMatch ? versionMatch[1] : null,
      description: descriptionMatch ? descriptionMatch[1] : null,
      author: authorMatch ? authorMatch[1] : null,
      hasSetupPy: true
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not parse setup.py: ${error.message}`));
    return null;
  }
}

/**
 * Parse Makefile
 */
async function parseMakefile(basePath) {
  const makefilePaths = ['Makefile', 'makefile', 'GNUmakefile'];
  let makefilePath = null;
  
  for (const name of makefilePaths) {
    const fullPath = path.join(basePath, name);
    if (await fileExists(fullPath)) {
      makefilePath = fullPath;
      break;
    }
  }
  
  if (!makefilePath) {
    return null;
  }

  try {
    const content = await fs.readFile(makefilePath, 'utf8');
    
    // Extract targets (lines that start with a word followed by a colon)
    const targets = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      const targetMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
      
      if (targetMatch && !trimmed.startsWith('#')) {
        const target = targetMatch[1];
        // Skip internal targets starting with .
        if (!target.startsWith('.')) {
          targets.push(target);
        }
      }
    }
    
    return {
      type: 'makefile',
      targets: [...new Set(targets)], // Remove duplicates
      commonTargets: {
        hasInstall: targets.includes('install'),
        hasBuild: targets.includes('build'),
        hasRun: targets.includes('run'),
        hasTest: targets.includes('test'),
        hasClean: targets.includes('clean'),
        hasDocs: targets.includes('docs') || targets.includes('doc')
      }
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not parse Makefile: ${error.message}`));
    return null;
  }
}

/**
 * Parse Dockerfile
 */
async function parseDockerfile(basePath) {
  const dockerfilePaths = ['Dockerfile', 'dockerfile', 'Dockerfile.prod'];
  let dockerfilePath = null;
  
  for (const name of dockerfilePaths) {
    const fullPath = path.join(basePath, name);
    if (await fileExists(fullPath)) {
      dockerfilePath = fullPath;
      break;
    }
  }
  
  if (!dockerfilePath) {
    return null;
  }

  try {
    const content = await fs.readFile(dockerfilePath, 'utf8');
    
    // Extract base image
    const fromMatch = content.match(/FROM\s+([^\s\n]+)/i);
    const baseImage = fromMatch ? fromMatch[1] : null;
    
    // Check for common patterns
    const hasExpose = content.includes('EXPOSE');
    const portMatch = content.match(/EXPOSE\s+(\d+)/);
    const exposedPort = portMatch ? parseInt(portMatch[1]) : null;
    
    const hasWorkdir = content.includes('WORKDIR');
    const hasEntrypoint = content.includes('ENTRYPOINT');
    const hasCmd = content.includes('CMD');
    
    return {
      type: 'docker',
      baseImage,
      hasExpose,
      exposedPort,
      hasWorkdir,
      hasEntrypoint,
      hasCmd,
      isDockerized: true
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not parse Dockerfile: ${error.message}`));
    return null;
  }
}

/**
 * Parse Cargo.toml for Rust projects
 */
async function parseCargoToml(basePath) {
  const cargoPath = path.join(basePath, 'Cargo.toml');
  
  if (!(await fileExists(cargoPath))) {
    return null;
  }

  try {
    const content = await fs.readFile(cargoPath, 'utf8');
    
    // Basic TOML parsing for common fields
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
    const descriptionMatch = content.match(/description\s*=\s*"([^"]+)"/);
    const editionMatch = content.match(/edition\s*=\s*"([^"]+)"/);
    
    // Check for dependencies section
    const hasDependencies = content.includes('[dependencies]');
    const hasDevDependencies = content.includes('[dev-dependencies]');
    
    return {
      type: 'rust',
      name: nameMatch ? nameMatch[1] : null,
      version: versionMatch ? versionMatch[1] : null,
      description: descriptionMatch ? descriptionMatch[1] : null,
      edition: editionMatch ? editionMatch[1] : null,
      hasDependencies,
      hasDevDependencies
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not parse Cargo.toml: ${error.message}`));
    return null;
  }
}

/**
 * Analyze local project files and extract metadata
 */
async function analyzeLocalProject(basePath = process.cwd()) {
  console.log(chalk.gray(`Analyzing project files in ${basePath}...`));
  
  const metadata = {
    basePath,
    projectType: 'unknown',
    files: {},
    summary: []
  };

  // Parse different project files
  const parsers = [
    { name: 'package.json', parser: parsePackageJson },
    { name: 'requirements.txt', parser: parseRequirementsTxt },
    { name: 'setup.py', parser: parseSetupPy },
    { name: 'Makefile', parser: parseMakefile },
    { name: 'Dockerfile', parser: parseDockerfile },
    { name: 'Cargo.toml', parser: parseCargoToml }
  ];

  for (const { name, parser } of parsers) {
    try {
      const result = await parser(basePath);
      if (result) {
        metadata.files[name] = result;
        
        // Determine project type
        if (result.type && metadata.projectType === 'unknown') {
          metadata.projectType = result.type;
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Error parsing ${name}: ${error.message}`));
    }
  }

  // Generate summary
  metadata.summary = generateProjectSummary(metadata);
  
  return metadata;
}

/**
 * Generate a human-readable summary of the project
 */
function generateProjectSummary(metadata) {
  const summary = [];
  
  // Project type and basic info
  if (metadata.projectType !== 'unknown') {
    summary.push(`Detected ${metadata.projectType} project`);
  }
  
  // Package.json info
  if (metadata.files['package.json']) {
    const pkg = metadata.files['package.json'];
    if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
      summary.push(`NPM scripts available: ${Object.keys(pkg.scripts).join(', ')}`);
    }
    if (pkg.dependencies && pkg.dependencies.length > 0) {
      summary.push(`${pkg.dependencies.length} production dependencies`);
    }
  }
  
  // Makefile info
  if (metadata.files['Makefile']) {
    const makefile = metadata.files['Makefile'];
    if (makefile.targets.length > 0) {
      summary.push(`Makefile with targets: ${makefile.targets.slice(0, 5).join(', ')}${makefile.targets.length > 5 ? '...' : ''}`);
    }
  }
  
  // Docker info
  if (metadata.files['Dockerfile']) {
    const docker = metadata.files['Dockerfile'];
    summary.push(`Dockerized application${docker.baseImage ? ` (based on ${docker.baseImage})` : ''}`);
    if (docker.exposedPort) {
      summary.push(`Exposes port ${docker.exposedPort}`);
    }
  }
  
  // Python info
  if (metadata.files['requirements.txt']) {
    const req = metadata.files['requirements.txt'];
    summary.push(`Python project with ${req.dependencies.length} dependencies`);
  }
  
  if (metadata.files['setup.py']) {
    summary.push('Python package with setup.py');
  }
  
  // Rust info
  if (metadata.files['Cargo.toml']) {
    const cargo = metadata.files['Cargo.toml'];
    summary.push(`Rust project${cargo.edition ? ` (${cargo.edition} edition)` : ''}`);
  }
  
  return summary;
}

module.exports = {
  analyzeLocalProject,
  parsePackageJson,
  parseRequirementsTxt,
  parseSetupPy,
  parseMakefile,
  parseDockerfile,
  parseCargoToml,
  generateProjectSummary
};
