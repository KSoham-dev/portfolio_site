import fs from 'fs';
import path from 'path';

/**
 * Extract text from PDF files using a simple approach
 * (Note: For production, consider using pdf-parse or similar library)
 */
function extractPdfMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath, '.pdf');
    
    return {
      title: fileName,
      type: 'pdf-document',
      file: filePath,
      size: stats.size,
      // PDF text extraction would require a library like pdf-parse
      // For now, we'll include filename and metadata
      text: `PDF Document: ${fileName}\nFile size: ${(stats.size / 1024).toFixed(2)} KB\nPath: ${filePath}`,
    };
  } catch (error) {
    console.error(`Error reading PDF ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Find all PDF files in a directory
 */
function findPdfsInDirectory(dir, maxDepth = 3, currentDepth = 0) {
  const pdfs = [];
  
  if (currentDepth >= maxDepth) return pdfs;

  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (['.git', 'node_modules', '__pycache__', '.venv', 'dist', 'build', '.next'].includes(item)) {
        continue;
      }

      const filePath = path.join(dir, item);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        pdfs.push(...findPdfsInDirectory(filePath, maxDepth, currentDepth + 1));
      } else if (item.endsWith('.pdf')) {
        const pdfData = extractPdfMetadata(filePath);
        if (pdfData) {
          pdfs.push(pdfData);
        }
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
  }

  return pdfs;
}

/**
 * Extract all PDFs from workspace
 */
export function extractPdfsFromWorkspace(workspacePath) {
  const pdfs = [];
  
  try {
    const items = fs.readdirSync(workspacePath);
    
    for (const item of items) {
      if (['.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next', '.cache', 'rag-backend'].includes(item)) {
        continue;
      }

      const dirPath = path.join(workspacePath, item);
      const stat = fs.statSync(dirPath);

      if (stat.isDirectory()) {
        const dirPdfs = findPdfsInDirectory(dirPath, 3);
        dirPdfs.forEach(pdf => {
          pdfs.push({
            id: `pdf-${item}-${pdf.title}`,
            title: `${item}/${pdf.title}`,
            ...pdf,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error extracting PDFs from workspace:', error.message);
  }

  return pdfs;
}
