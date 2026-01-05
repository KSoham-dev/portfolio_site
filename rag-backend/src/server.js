import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import {
  generateEmbedding,
  initializePinecone,
  querySimilarDocuments,
  generateAnswerWithContext,
} from './ragClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production (Vercel will handle it)
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

let pineconeIndex = null;

/**
 * Initialize Pinecone on startup
 */
async function initializeServer() {
  try {
    pineconeIndex = await initializePinecone();
    console.log('Pinecone index initialized');
  } catch (error) {
    console.error('Failed to initialize Pinecone:', error);
    process.exit(1);
  }
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Query endpoint - RAG-based search and answer
 */
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Find similar documents in Pinecone
    const similarDocs = await querySimilarDocuments(pineconeIndex, queryEmbedding, 5);

    // Generate answer using retrieved context
    const answer = await generateAnswerWithContext(query, similarDocs);

    // Format response with sources
    const sources = similarDocs.map((doc) => ({
      title: doc.metadata?.title || 'Unknown',
      type: doc.metadata?.type || 'unknown',
      score: doc.score,
    }));

    res.json({
      query,
      answer,
      sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message,
    });
  }
});

/**
 * Search endpoint - returns similar documents without generation
 */
app.post('/api/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Find similar documents
    const results = await querySimilarDocuments(pineconeIndex, queryEmbedding, topK);

    // Format results
    const formatted = results.map((result) => ({
      id: result.id,
      title: result.metadata?.title || 'Unknown',
      type: result.metadata?.type || 'unknown',
      text: result.metadata?.text || '',
      score: result.score,
    }));

    res.json({
      query,
      results: formatted,
      count: formatted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      error: 'Failed to perform search',
      message: error.message,
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

/**
 * Start server
 */
async function startServer() {
  await initializeServer();

  app.listen(PORT, () => {
    console.log(`RAG Server running on http://localhost:${PORT}`);
    console.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
