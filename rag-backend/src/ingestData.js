import dotenv from 'dotenv';
dotenv.config();

import {
  generateEmbedding,
  initializePinecone,
  upsertVectors,
} from './ragClient.js';

import { extractGitHubData } from './extractGitHubData.js';
import { extractAllNotebooksFromWorkspace } from './extractNotebooks.js';
import { extractMarkdownAndCode } from './extractMarkdownAndCode.js';
import { extractPdfsFromWorkspace } from './extractPdfs.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Static portfolio data structure
 * (Can be combined with GitHub data)
 */
const staticPortfolioData = [
  {
    id: 'about-1',
    title: 'About Me',
    type: 'about',
    text: 'Developer and creator passionate about building interactive web experiences. Experienced in full-stack development with focus on user-centered design and performance optimization.',
  },
  {
    id: 'skill-1',
    title: 'Frontend Development',
    type: 'skill',
    text: 'Expert in Vue 3, React, JavaScript, TypeScript, HTML5, CSS3, and TailwindCSS. Experience with Vite, Webpack, and modern frontend tooling. Proficient in responsive design and component architecture.',
  },
  {
    id: 'skill-2',
    title: 'Backend Development',
    type: 'skill',
    text: 'Experienced with Node.js, Express.js, Python, and SQL databases. Knowledge of RESTful API design, database optimization, and server architecture.',
  },
  {
    id: 'skill-3',
    title: 'AI & Machine Learning',
    type: 'skill',
    text: 'Working with Google Gemini API, Pinecone vector database, and RAG (Retrieval-Augmented Generation) systems. Experience with embeddings and semantic search.',
  },
  {
    id: 'project-1',
    title: 'Portfolio Website',
    type: 'featured-project',
    text: 'A Vue 3 based portfolio website built with Vite, TailwindCSS, and Remix Icons. Features interactive project display, skill showcase, and journey timeline. Includes audio synthesis for intro sound and smooth animations.',
  },
  {
    id: 'project-2',
    title: 'RAG Application',
    type: 'featured-project',
    text: 'A Retrieval-Augmented Generation (RAG) application using Google Gemini and Pinecone. Enables semantic search and intelligent querying over portfolio content with context-aware responses.',
  },
];

/**
 * Main data ingestion function
 */
async function ingestData() {
  try {
    console.log('🚀 Starting data ingestion...\n');

    // Initialize Pinecone
    const index = await initializePinecone();
    console.log('✅ Connected to Pinecone index\n');

    let allData = [...staticPortfolioData];

    // Check if GitHub extraction is enabled
    const useGitHub = process.env.GITHUB_USERNAME && process.env.GITHUB_USERNAME !== 'your-username';

    if (useGitHub) {
      console.log('📚 Including GitHub projects...\n');
      try {
        const githubData = await extractGitHubData();
        allData = [...allData, ...githubData];
        console.log(`✅ Added ${githubData.length} GitHub projects\n`);
      } catch (error) {
        console.warn('⚠️  GitHub extraction failed:', error.message);
        console.log('   Continuing with static data only...\n');
      }
    } else {
      console.log('ℹ️  GitHub integration disabled');
      console.log('   To enable, set GITHUB_USERNAME in .env\n');
    }

    // Extract Jupyter notebooks from workspace
    console.log('📓 Extracting Jupyter notebooks...\n');
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const workspacePath = path.resolve(__dirname, '../../');
      const notebooks = extractAllNotebooksFromWorkspace(workspacePath);
      
      if (notebooks.length > 0) {
        // Add unique ID to each notebook
        const notebooksWithIds = notebooks.map((nb, idx) => ({
          id: `notebook-${idx}-${Date.now()}`,
          ...nb,
        }));
        
        allData = [...allData, ...notebooksWithIds];
        console.log(`✅ Found and added ${notebooks.length} Jupyter notebooks\n`);
      } else {
        console.log('ℹ️  No Jupyter notebooks found in workspace\n');
      }
    } catch (error) {
      console.warn('⚠️  Notebook extraction failed:', error.message);
      console.log('   Continuing with other data...\n');
    }

    // Extract markdown files and code snippets
    console.log('📄 Extracting markdown files and code...\n');
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const workspacePath = path.resolve(__dirname, '../../');
      const { markdown, code } = extractMarkdownAndCode(workspacePath);
      
      // Add markdown files (only non-empty and not too large)
      const markdownItems = markdown
        .filter(md => md.text && md.text.length > 100 && md.text.length < 50000)
        .map((md, idx) => ({
          id: `md-${idx}-${Date.now()}`,
          ...md,
        }));
      
      if (markdownItems.length > 0) {
        allData = [...allData, ...markdownItems];
        console.log(`✅ Added ${markdownItems.length} markdown files\n`);
      }

      // Add code snippets (only from frontend/src)
      const codeItems = code
        .filter(c => c.file.includes('src/') && c.text && c.text.length > 50)
        .slice(0, 15) // Limit to 15 code files to avoid overwhelming the index
        .map((c, idx) => ({
          id: `code-${idx}-${Date.now()}`,
          ...c,
        }));
      
      if (codeItems.length > 0) {
        allData = [...allData, ...codeItems];
        console.log(`✅ Added ${codeItems.length} code files\n`);
      }
    } catch (error) {
      console.warn('⚠️  Markdown/code extraction failed:', error.message);
      console.log('   Continuing with other data...\n');
    }

    // Extract PDFs from workspace
    console.log('📕 Extracting PDF documents...\n');
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const workspacePath = path.resolve(__dirname, '../../');
      const pdfs = extractPdfsFromWorkspace(workspacePath);
      
      if (pdfs.length > 0) {
        const pdfItems = pdfs.map((pdf, idx) => ({
          id: `pdf-${idx}-${Date.now()}`,
          ...pdf,
        }));
        
        allData = [...allData, ...pdfItems];
        console.log(`✅ Found and added ${pdfs.length} PDF documents\n`);
      } else {
        console.log('ℹ️  No PDF documents found in workspace\n');
      }
    } catch (error) {
      console.warn('⚠️  PDF extraction failed:', error.message);
      console.log('   Continuing with other data...\n');
    }

    // Prepare vectors
    const vectors = [];

    console.log(`📝 Processing ${allData.length} items...`);
    console.log('   (including projects, skills, notebooks, markdown, code, and PDFs)\n');

    for (const item of allData) {
      try {
        console.log(`⏳ Processing: ${item.title}`);

        // Generate embedding for the text
        const embedding = await generateEmbedding(item.text);

        // Clean metadata - Pinecone doesn't accept null values
        const metadata = {
          title: item.title,
          type: item.type,
          text: item.text,
        };
        
        if (item.url) metadata.url = item.url;
        if (item.language) metadata.language = item.language;
        if (item.stars) metadata.stars = item.stars;
        if (item.topics) metadata.topics = item.topics;

        vectors.push({
          id: item.id,
          values: embedding,
          metadata,
        });

        console.log(`   ✅ Embedded\n`);

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Upsert all vectors to Pinecone
    console.log(`\n📤 Upserting ${vectors.length} vectors to Pinecone...`);
    await upsertVectors(index, vectors);

    console.log('\n✅ Data ingestion completed successfully!');
    console.log(`📊 Total items indexed: ${vectors.length}`);

    // Summary
    const staticCount = staticPortfolioData.length;
    const githubCount = allData.length - staticCount;
    console.log(`   - Static data: ${staticCount}`);
    if (githubCount > 0) {
      console.log(`   - GitHub projects: ${githubCount}`);
    }
  } catch (error) {
    console.error('❌ Error during data ingestion:', error);
    process.exit(1);
  }
}

// Run the ingestion
ingestData();
