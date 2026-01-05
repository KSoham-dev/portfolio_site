import dotenv from 'dotenv';
dotenv.config();

import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

/**
 * Generate embeddings using Ollama (local), Hugging Face, or fallback services
 * For production on Vercel without Ollama, uses Hugging Face Inference API with nomic-embed-text
 */
export async function generateEmbedding(text) {
  // Try Ollama first (works in development and self-hosted production)
  if (process.env.OLLAMA_BASE_URL) {
    try {
      const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
        model: EMBEDDING_MODEL,
        prompt: text,
        timeout: 10000,
      });
      
      if (!response.data.embedding) {
        throw new Error('No embedding in response');
      }
      
      return response.data.embedding;
    } catch (error) {
      console.warn('Ollama embedding failed:', error.message);
      // Continue to fallback
    }
  }

  // Fallback: Use Hugging Face Inference API with nomic-embed-text
  // nomic-embed-text provides 384-dimensional embeddings (same as local version)
  try {
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) {
      throw new Error('HF_API_KEY not configured');
    }

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/nomic-ai/nomic-embed-text-v1',
      {
        inputs: text,
      },
      {
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // Hugging Face returns embeddings differently depending on the model
    // nomic-embed-text returns an array directly
    if (Array.isArray(response.data)) {
      return response.data[0];
    } else if (response.data && response.data[0]) {
      return response.data[0];
    } else {
      throw new Error('Unexpected response format from Hugging Face');
    }
  } catch (hfError) {
    console.warn('Hugging Face embedding failed:', hfError.message);
    
    // Final fallback: Return a dummy embedding (not ideal, but allows graceful degradation)
    console.warn('Using fallback embedding service - results may be limited');
    // Create a hash-based embedding vector from text (384 dimensions)
    const hashBasedEmbedding = generateHashBasedEmbedding(text, 384);
    return hashBasedEmbedding;
  }
}

/**
 * Generate a hash-based embedding as last resort
 * Not ideal for semantic search but allows system to function
 */
function generateHashBasedEmbedding(text, dimensions) {
  // Simple hash-based approach: create pseudo-random values based on text hash
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const embedding = [];
  for (let i = 0; i < dimensions; i++) {
    // Use hash to generate pseudo-random but deterministic values
    const value = Math.sin((hash + i) * 12.9898 + (hash * 78.233)) * 43758.5453;
    embedding.push(value - Math.floor(value)); // Normalize to 0-1
  }
  
  return embedding;
}

/**
 * Initialize Pinecone index
 */
export async function initializePinecone() {
  try {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    return index;
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    throw error;
  }
}

/**
 * Upsert vectors to Pinecone
 */
export async function upsertVectors(index, vectors) {
  try {
    const records = vectors.map((v) => ({
      id: v.id,
      values: v.values,
      metadata: v.metadata,
    }));
    await index.upsert(records);
    console.log(`Upserted ${vectors.length} vectors to Pinecone`);
  } catch (error) {
    console.error('Error upserting vectors:', error);
    throw error;
  }
}

/**
 * Query Pinecone for similar documents
 */
export async function querySimilarDocuments(index, queryEmbedding, topK = 5) {
  try {
    const queryRequest = {
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
    };
    const results = await index.query(queryRequest);
    return results.matches || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw error;
  }
}

/**
 * Convert second-person pronouns to third-person
 */
function convertToThirdPerson(text) {
  // Replace common second-person patterns with third-person equivalents
  let converted = text
    // You've -> He's/Soham has
    .replace(/\bYou've\b/g, "Soham has")
    .replace(/\byou've\b/g, "he has")
    
    // You're -> He's/Soham is
    .replace(/\bYou're\b/g, "Soham is")
    .replace(/\byou're\b/g, "he is")
    
    // You'll -> He'll
    .replace(/\bYou'll\b/g, "He'll")
    .replace(/\byou'll\b/g, "he'll")
    
    // Your -> His/Soham's
    .replace(/\bYour\b/g, "His")
    .replace(/\byour\b/g, "his")
    
    // You -> He/Soham
    .replace(/\bYou\b/g, "He")
    .replace(/\byou\b/g, "he")
    
    // Yourself -> himself
    .replace(/\byourself\b/g, "himself")
    .replace(/\bYourself\b/g, "Himself");
  
  return converted;
}

/**
 * Generate answer using Gemini with retrieved context
 */
export async function generateAnswerWithContext(query, context) {
  try {
    // Use gemini-2.5-flash - available and no quota issues
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const contextText = context
      .map((match) => match.metadata?.text || '')
      .filter((text) => text)
      .join('\n\n');

    const prompt = `You are a Q&A resource about Soham's professional profile. Answer questions informatively.

Context about Soham:
${contextText}

Question: ${query}

Answer the question clearly with markdown formatting:
- Use headers (#, ##) for sections
- Use bullet points (-) for lists
- Use bold (**text**) for emphasis
- Use code blocks for technical content

Answer:`;

    // Add timeout of 15 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    );
    
    const contentPromise = model.generateContent(prompt);
    const result = await Promise.race([contentPromise, timeoutPromise]);
    let answer = result.response.text();
    
    // Convert second-person to third-person
    answer = convertToThirdPerson(answer);
    
    return answer;
  } catch (error) {
    console.error('Error generating answer:', error.message);
    
    // Check if it's a quota error or timeout
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('timeout')) {
      console.warn('⚠️ Gemini API error:', error.message);
      
      // Fallback: Generate a response from context without using Gemini
      const contextTitles = context
        .map((match) => match.metadata?.title || '')
        .filter((text) => text)
        .slice(0, 5)
        .join(', ');
      
      return `Based on available information, here are relevant items: ${contextTitles || 'No relevant information found'}. The AI service is temporarily unavailable. Please check the sources below for more details.`;
    }
    
    throw error;
  }
}

export { pinecone, genAI };
