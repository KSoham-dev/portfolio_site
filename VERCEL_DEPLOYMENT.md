# Vercel Deployment Guide

## Overview
The portfolio site is deployed across two separate Vercel projects:
- **Frontend**: Vue.js application (hosted at your domain)
- **Backend**: Express.js RAG API (serverless functions)

## Prerequisites
1. Vercel account ([vercel.com](https://vercel.com))
2. GitHub repository connected to Vercel
3. Environment variables ready (API keys, etc.)

## Deployment Steps

### 1. Deploy Backend to Vercel

#### Step 1a: Create Vercel Project for Backend
```bash
cd rag-backend
vercel --prod
```

Or via Vercel Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Choose "rag-backend" folder
4. Click "Deploy"

#### Step 1b: Configure Environment Variables
After creating the project, go to **Settings > Environment Variables** and add:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=portfolio-rag
PINECONE_ENVIRONMENT=us-east-1

# Hugging Face Inference API (for nomic-embed-text embeddings)
# Get free API key from: https://huggingface.co/settings/tokens
HF_API_KEY=your_huggingface_api_key_here

# Ollama (optional - only if self-hosted)
# If set and available, Ollama will be used instead of Hugging Face
# OLLAMA_BASE_URL=http://your-ollama-server:11434
# EMBEDDING_MODEL=nomic-embed-text

# GitHub (optional)
GITHUB_USERNAME=KSoham-dev
GITHUB_TOKEN=your_github_token_here

# Server
NODE_ENV=production
```

**Important**: Your backend URL will be something like:
```
https://portfolio-rag-api.vercel.app
```

### 2. Deploy Frontend to Vercel

#### Step 2a: Create Vercel Project for Frontend
```bash
cd frontend
vercel --prod
```

Or via Vercel Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Choose "frontend" folder
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click "Deploy"

#### Step 2b: Configure Environment Variables
In Frontend project settings, add:

```env
VITE_RAG_API_URL=https://portfolio-rag-api.vercel.app/api
```

Replace `portfolio-rag-api` with your actual backend project name.

### 3. Verify Deployment

Test the backend health check:
```bash
curl https://portfolio-rag-api.vercel.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-05T..."}
```

Test a query:
```bash
curl -X POST https://portfolio-rag-api.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What are the main skills?"}'
```

## Data Management

### Data Already Indexed
- 27 items in Pinecone (static portfolio + GitHub projects)
- Data persists in Pinecone (serverless - no local database)

### NOT Re-indexing in Production
Since the data is already indexed:
1. Never run `npm run ingest` in production
2. The ingest script is excluded via `.vercelignore`
3. Only queries against existing data are allowed

### If You Need to Update Data
1. Update locally
2. Run `npm run ingest` locally with Ollama running
3. Data automatically syncs to Pinecone
4. Production automatically uses updated index

## Embedding Services

### Development (Local)
- Uses Ollama on your local machine or network
- Model: `nomic-embed-text` (384 dimensions)
- Configuration: `OLLAMA_BASE_URL=http://192.168.1.40:11434`

### Production (Vercel)
The backend attempts embeddings in this order:
1. **Ollama** (if `OLLAMA_BASE_URL` is set and reachable - self-hosted only)
2. **Hugging Face Inference API** (free, uses nomic-embed-text-v1)
3. **Fallback** (hash-based, degraded quality)

#### To Use Hugging Face (Recommended for Production)
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token with "read" access
3. Set `HF_API_KEY` in Vercel environment variables
4. The backend will use `nomic-ai/nomic-embed-text-v1` model (384 dimensions)

## Troubleshooting

### Issue: 500 Error on Query
**Solution**: Check Vercel function logs
```bash
vercel logs rag-backend
```

Common causes:
- Pinecone API key invalid
- Gemini API quota exceeded
- Embedding service unavailable

### Issue: CORS Error in Browser
**Solution**: 
- Verify `VITE_RAG_API_URL` matches your backend URL
- Check backend CORS settings in `server.js`
- Ensure frontend can reach backend

### Issue: Queries Returning Generic Responses
**Solution**:
- Check if embedding service is working (check logs)
- Verify Pinecone index has data: Use Pinecone dashboard
- Test with `curl` directly to backend

## Monitoring

### Useful Commands
```bash
# Check backend logs
vercel logs rag-backend --follow

# Check frontend build logs
vercel logs frontend --follow

# View project settings
vercel projects

# List environment variables
vercel env list
```

### Pinecone Monitoring
1. Go to [pinecone.io](https://pinecone.io)
2. Check index statistics
3. Monitor query metrics
4. Check for usage warnings

## Performance Notes

- Frontend: Cached globally via Vercel's CDN
- Backend: Serverless functions (cold starts ~2-3 seconds)
- Embedding: Fallback mechanisms ensure queries work even if service unavailable
- Pinecone: Always-on vector database (separate billing)

## Cost Considerations

- **Vercel**: Free tier for frontend/backend (up to ~3GB bandwidth)
- **Pinecone**: Free tier includes storage and some queries
- **Gemini**: Free API keys included
- **Together AI**: Free credits available (optional)

## Next Steps

1. Push changes to GitHub
2. Vercel auto-deploys on push
3. Monitor deployment progress in Vercel dashboard
4. Test with real queries in production

For issues or questions, check the backend logs in Vercel dashboard.
