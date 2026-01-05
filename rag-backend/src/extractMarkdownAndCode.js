import fs from 'fs';
import path from 'path';

/**
 * Extract markdown files from a directory
 */
function extractMarkdownFromDir(dir, maxDepth = 2, currentDepth = 0, maxSize = 50000) {
  const files = [];
  
  if (currentDepth >= maxDepth) return files;

  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (['.git', 'node_modules', '__pycache__', '.venv', 'dist', 'build', '.next'].includes(item)) {
        continue;
      }

      const filePath = path.join(dir, item);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        files.push(...extractMarkdownFromDir(filePath, maxDepth, currentDepth + 1, maxSize));
      } else if (item.match(/\.(md|markdown)$/i) && stat.size < maxSize) {
        const content = fs.readFileSync(filePath, 'utf-8');
        files.push({
          title: item.replace(/\.(md|markdown)$/i, ''),
          path: filePath,
          content: content,
          size: stat.size,
        });
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
  }

  return files;
}

/**
 * Extract code snippets from source files
 */
function extractCodeSnippets(dir, extensions = ['js', 'ts', 'py', 'java', 'cpp', 'c', 'jsx', 'tsx'], maxDepth = 2, currentDepth = 0) {
  const snippets = [];
  
  if (currentDepth >= maxDepth) return snippets;

  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (['.git', 'node_modules', '__pycache__', '.venv', 'dist', 'build', '.next'].includes(item)) {
        continue;
      }

      const filePath = path.join(dir, item);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        snippets.push(...extractCodeSnippets(filePath, extensions, maxDepth, currentDepth + 1));
      } else {
        const ext = path.extname(filePath).substring(1).toLowerCase();
        if (extensions.includes(ext) && stat.size < 100000) { // Skip large files
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Skip files with too many lines
            if (content.split('\n').length < 500) {
              snippets.push({
                title: path.relative(dir, filePath),
                type: `code-${ext}`,
                content: content,
                language: ext,
                size: stat.size,
              });
            }
          } catch (error) {
            // Skip files we can't read
          }
        }
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
  }

  return snippets;
}

/**
 * Extract all markdown and code from workspace
 */
export function extractMarkdownAndCode(workspacePath) {
  const data = {
    markdown: [],
    code: [],
  };

  try {
    const items = fs.readdirSync(workspacePath);
    
    for (const item of items) {
      if (['.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next', '.cache', 'rag-backend'].includes(item)) {
        continue;
      }

      const dirPath = path.join(workspacePath, item);
      const stat = fs.statSync(dirPath);

      if (stat.isDirectory()) {
        // Extract markdown files
        const markdownFiles = extractMarkdownFromDir(dirPath, 3);
        markdownFiles.forEach(md => {
          data.markdown.push({
            id: `md-${item}-${md.title}`,
            title: `${item}/${md.title}`,
            type: 'markdown',
            text: md.content,
            file: md.path,
          });
        });

        // Extract code snippets
        const codeFiles = extractCodeSnippets(dirPath, ['js', 'ts', 'jsx', 'tsx', 'vue'], 2);
        codeFiles.forEach((code, idx) => {
          data.code.push({
            id: `code-${item}-${idx}`,
            title: `${item}/${code.title}`,
            type: code.type,
            text: code.content,
            file: code.title,
            language: code.language,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error extracting markdown and code:', error.message);
  }

  return data;
}
