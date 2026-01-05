# Portfolio RAG Application

A Retrieval-Augmented Generation (RAG) application that uses Google Gemini AI and Pinecone vector database to enable intelligent Q&A over portfolio content.

## Overview

This application consists of two parts:

1. **Backend (RAG Server)** - Express.js server that handles:
   - Data ingestion and embedding generation
   - Semantic search using Pinecone
   - Context-aware answer generation using Google Gemini

2. **Frontend Component** - Vue 3 component that provides:
   - Interactive chat interface
   - Real-time query processing
   - Source attribution

## Architecture

```
Portfolio Content
       ↓
[Embedding Generation - Google Gemini]
       ↓
[Pinecone Vector Database]
       ↓
User Query → [Semantic Search] → [Context Retrieval] → [Gemini Answer Generation] → Response
```

## Setup Instructions

### Prerequisites

- Node.js 20.19.0 or higher
- Google Gemini API Key
- Pinecone API Key and Index

### Backend Setup

1. **Navigate to rag-backend directory**
   ```bash
   cd rag-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=portfolio-rag
   PINECONE_ENVIRONMENT=us-east-1
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

5. **Ingest portfolio data**
   ```bash
   npm run ingest
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3001`

### Frontend Setup

1. **Update vite.config.js** to enable RAG API communication

2. **Create .env.local in frontend directory**
   ```
   VITE_RAG_API_URL=http://localhost:3001/api
   ```

3. **Import RAGChat component in your Vue app**
   ```vue
   <script setup>
   import RAGChat from '@/components/RAGChat.vue';
   </script>

   <template>
     <RAGChat />
   </template>
   ```

## API Endpoints

### POST `/api/query`
Performs RAG-based question answering with context retrieval.

**Request:**
```json
{
  "query": "What are your main skills?"
}
```

**Response:**
```json
{
  "query": "What are your main skills?",
  "answer": "Based on the portfolio...",
  "sources": [
    {
      "title": "Frontend Development",
      "type": "skill",
      "score": 0.95
    }
  ],
  "timestamp": "2026-01-05T12:00:00Z"
}
```

### POST `/api/search`
Performs semantic search without answer generation.

**Request:**
```json
{
  "query": "Vue projects",
  "topK": 5
}
```

**Response:**
```json
{
  "query": "Vue projects",
  "results": [
    {
      "id": "project-1",
      "title": "Portfolio Website",
      "type": "project",
      "text": "A Vue 3 based portfolio website...",
      "score": 0.92
    }
  ],
  "count": 1,
  "timestamp": "2026-01-05T12:00:00Z"
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T12:00:00Z"
}
```

## Key Features

### 1. **Semantic Search**
   - Uses Google Gemini embeddings for semantic understanding
   - Finds relevant portfolio content based on meaning, not just keywords

### 2. **Context-Aware Responses**
   - Retrieves most relevant documents from Pinecone
   - Generates answers using actual portfolio content as context
   - Avoids hallucinations through grounded context

### 3. **Source Attribution**
   - Each answer includes sources
   - Users can see which portfolio items were used for the response

### 4. **Easy to Customize**
   - Portfolio data can be easily updated in `ingestData.js`
   - Supports projects, skills, about info, and custom content types

## Files Structure

```
rag-backend/
├── src/
│   ├── ragClient.js         # RAG operations (embeddings, search, generation)
│   ├── ingestData.js        # Data ingestion script
│   ├── server.js            # Express server
│   └── package.json
├── data/                    # Directory for custom data files
├── .env.example            # Environment variables template
└── README.md

frontend/
└── src/
    └── components/
        └── RAGChat.vue     # Vue chat interface component
```

## Adding Custom Data

Edit `rag-backend/src/ingestData.js` to add more portfolio content:

```javascript
const portfolioData = [
  {
    id: 'custom-1',
    title: 'My Custom Project',
    type: 'project',
    text: 'Detailed description of your project...',
  },
  // Add more items
];
```

Then re-run the ingestion:
```bash
npm run ingest
```

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` environment variable is set correctly
- Check that both frontend and backend are running on the configured ports

### Pinecone Connection Errors
- Verify API key and index name in `.env`
- Ensure index exists in Pinecone dashboard

### Embedding Generation Errors
- Check that Gemini API key is valid
- Verify API has quota available
- Check network connectivity

### Empty Results
- Run ingestion script to populate Pinecone with data
- Verify data was successfully upserted

## Technologies Used

- **Backend**: Express.js, Node.js
- **AI/ML**: Google Gemini API, Pinecone Vector Database
- **Frontend**: Vue 3, TailwindCSS
- **APIs**: RESTful API with CORS support

## License

MIT

## Future Enhancements

- [ ] Streaming responses for real-time answer generation
- [ ] Multi-turn conversation memory
- [ ] Document upload and custom indexing
- [ ] Advanced filtering and faceted search
- [ ] Analytics and query logging
- [ ] User authentication and personalization
