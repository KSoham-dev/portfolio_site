import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract Jupyter notebook cells as text
 */
function extractNotebookContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const notebook = JSON.parse(content);
    
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return '';
    }

    // Extract markdown and code cells
    return notebook.cells
      .filter(cell => ['markdown', 'code'].includes(cell.cell_type))
      .map(cell => {
        const source = Array.isArray(cell.source) 
          ? cell.source.join('') 
          : cell.source;
        return source.trim();
      })
      .filter(text => text.length > 0)
      .join('\n\n');
  } catch (error) {
    console.error(`Error reading notebook ${filePath}:`, error.message);
    return '';
  }
}

/**
 * Recursively find all Jupyter notebooks in a directory
 */
function findNotebooksInDirectory(dir, maxDepth = 3, currentDepth = 0) {
  const notebooks = [];
  
  if (currentDepth >= maxDepth) return notebooks;

  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      // Skip common directories that don't contain notebooks
      if (['.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build'].includes(item)) {
        continue;
      }

      const filePath = path.join(dir, item);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        notebooks.push(...findNotebooksInDirectory(filePath, maxDepth, currentDepth + 1));
      } else if (item.endsWith('.ipynb')) {
        notebooks.push(filePath);
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
  }

  return notebooks;
}

/**
 * Extract notebooks from a repository directory
 */
export function extractNotebooksFromRepo(repoPath) {
  const notebooks = findNotebooksInDirectory(repoPath);
  
  return notebooks.map((notebookPath, index) => {
    const relativePath = path.relative(repoPath, notebookPath);
    const content = extractNotebookContent(notebookPath);
    
    // Get file stats for size info
    const stats = fs.statSync(notebookPath);
    
    return {
      title: path.basename(notebookPath, '.ipynb'),
      type: 'jupyter_notebook',
      text: content,
      file: relativePath,
      size: stats.size,
      url: null, // Will be set if repo has URL
    };
  });
}

/**
 * Extract all notebooks from workspace
 */
export function extractAllNotebooksFromWorkspace(workspacePath) {
  const allNotebooks = [];
  
  try {
    const items = fs.readdirSync(workspacePath);
    
    for (const item of items) {
      if (['.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next', '.cache'].includes(item)) {
        continue;
      }

      const dirPath = path.join(workspacePath, item);
      const stat = fs.statSync(dirPath);

      if (stat.isDirectory()) {
        const notebooks = extractNotebooksFromRepo(dirPath);
        
        notebooks.forEach(nb => {
          nb.url = `file://${dirPath}/${nb.file}`;
          allNotebooks.push(nb);
        });
      }
    }
  } catch (error) {
    console.error('Error extracting notebooks from workspace:', error.message);
  }

  return allNotebooks;
}
