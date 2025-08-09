const fs = require('fs').promises;
const path = require('path');
const ignore = [
  '.git',
  'node_modules',
  '.DS_Store',
  '.*\\.lock$',
  '.*\\.log$',
  'dist',
  'build',
  'coverage',
  '^\\.env.*'
];

/**
 * Recursively get all files in a directory, ignoring specified patterns.
 * @param {string} dir - The directory to scan.
 * @param {Array<string>} ignorePatterns - Patterns to ignore.
 * @returns {Promise<Array<string>>} - A list of file paths.
 */
async function getFiles(dir, ignorePatterns) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (ignorePatterns.some(pattern => new RegExp(pattern).test(dirent.name))) {
        return [];
      }
      return dirent.isDirectory() ? getFiles(res, ignorePatterns) : res;
    })
  );
  return Array.prototype.concat(...files);
}

/**
 * Generates an ASCII tree structure from a file tree object.
 * @param {object} node - The current node in the file tree.
 * @param {string} prefix - The prefix for the current line.
 * @returns {string} - The ASCII tree string.
 */
function generateAsciiTree(node, prefix = '') {
  let treeString = '';
  const entries = Object.keys(node);
  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    treeString += `${prefix}${isLast ? '└── ' : '├── '}${entry}\n`;
    if (node[entry]) { // It's a directory
      treeString += generateAsciiTree(node[entry], `${prefix}${isLast ? '    ' : '│   '}`);
    }
  });
  return treeString;
}

/**
 * Generate a file tree and read the contents of all files.
 * @param {string} basePath - The root directory of the project.
 *returns {Promise<Object>} - An object with fileTree (as string) and fileContents.
 */
async function getProjectTreeAndContents(basePath) {
  const allFiles = await getFiles(basePath, ignore);
  const fileTreeObj = {};
  const fileContents = {};

  for (const file of allFiles) {
    const relativePath = path.relative(basePath, file);
    const content = await fs.readFile(file, 'utf-8');

    fileContents[relativePath] = content;

    let currentLevel = fileTreeObj;
    const parts = relativePath.split(path.sep);
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        currentLevel[part] = null; // It's a file
      } else {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }
    });
  }

  const fileTree = `${path.basename(basePath)}/\n${generateAsciiTree(fileTreeObj)}`;

  return { fileTree, fileContents };
}

module.exports = {
  getProjectTreeAndContents,
};
