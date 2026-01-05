# Vercel Deployment Checklist

## Pre-Deployment (Local Testing)
- [x] Backend running locally on port 3001
- [x] Frontend running locally on port 5174
- [x] API health check working: `/api/health`
- [x] Query endpoint working: `/api/query`
- [x] Third-person tone working correctly
- [x] Markdown rendering working in modal
- [x] Pinecone index has 27 items indexed
- [x] No TypeScript/build errors

## Step 1: Backend Deployment

### 1.1: Push Code to GitHub
```bash
git add .
git commit -m "feat: prepare for Vercel deployment with fallback embeddings"
git push origin main
```

### 1.2: Create Backend Project on Vercel
**Manual Setup:**
1. Go to https://vercel.com/new
2. Select your GitHub repository
3. Framework Preset: Other (Nodejs)
4. Root Directory: `rag-backend`
5. Build Command: (leave empty - it's a Node app)
6. Output Directory: (leave empty)
7. Click "Deploy"

**Or use CLI:**
```bash
cd rag-backend
vercel --prod --name portfolio-rag-api
```

### 1.3: Add Environment Variables
In Vercel Dashboard > rag-backend project > Settings > Environment Variables, add:

```
GEMINI_API_KEY = <your-key>
PINECONE_API_KEY = <your-key>
PINECONE_INDEX_NAME = portfolio-rag
PINECONE_ENVIRONMENT = us-east-1
TOGETHER_API_KEY = <your-key>
NODE_ENV = production
```

See `rag-backend/.env.production` for reference.

### 1.4: Verify Backend Deployment
```bash
# Wait for deployment to complete, then test
curl https://portfolio-rag-api.vercel.app/api/health
curl -X POST https://portfolio-rag-api.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What are the main skills?"}'
```

**Expected Response:**
- Health: `{"status":"ok","timestamp":"..."}`
- Query: Returns answer with sources

If query fails, check Vercel logs:
```bash
vercel logs portfolio-rag-api --follow
```

---

## Step 2: Frontend Deployment

### 2.1: Update Frontend API URL
In `frontend/.env.production`:
```env
VITE_RAG_API_URL=https://portfolio-rag-api.vercel.app/api
```

### 2.2: Create Frontend Project on Vercel
**Manual Setup:**
1. Go to https://vercel.com/new
2. Select your GitHub repository
3. Framework: Vue.js
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click "Deploy"

**Or use CLI:**
```bash
cd frontend
vercel --prod --name portfolio-site
```

### 2.3: Add Environment Variables
In Vercel Dashboard > portfolio-site project > Settings > Environment Variables, add:

```
VITE_RAG_API_URL = https://portfolio-rag-api.vercel.app/api
```

See `frontend/.env.production` for reference.

### 2.4: Verify Frontend Deployment
```bash
# Go to your deployed URL and test
# https://portfolio-site.vercel.app

# Test chat button:
# 1. Click chat button (💬) in bottom-right
# 2. Modal should open with darkened background
# 3. Type a question
# 4. Wait for response
# 5. Verify third-person tone and markdown rendering
```

---

## Post-Deployment Verification

### Backend Checks
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Query endpoint returns answers with sources
- [ ] No embedding service errors in logs
- [ ] Response time < 5 seconds

### Frontend Checks
- [ ] Site loads without errors
- [ ] Chat button appears (💬) in bottom-right
- [ ] Chat modal opens when clicked
- [ ] Darkened/blurred background appears
- [ ] Can type and send queries
- [ ] Answers appear in third-person tone
- [ ] Markdown formatting is correct
- [ ] Sources are displayed
- [ ] Modal closes when clicking X or background

### Integration Tests
```bash
# Test different queries to ensure variety
curl -X POST https://portfolio-rag-api.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What projects have you built?"}'

curl -X POST https://portfolio-rag-api.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Tell me about your experience"}'

curl -X POST https://portfolio-rag-api.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is your educational background?"}'
```

---

## Troubleshooting

### Issue: 502 Bad Gateway on Backend
- Check Vercel logs: `vercel logs portfolio-rag-api --follow`
- Verify all environment variables are set
- Check Pinecone API key validity

### Issue: CORS Error in Browser Console
- Ensure `VITE_RAG_API_URL` in frontend matches backend URL exactly
- Check backend CORS settings in `rag-backend/src/server.js`
- Try incognito mode to clear browser cache

### Issue: Query Returns Error "No embedding service available"
- Check if `TOGETHER_API_KEY` is set (for production embeddings)
- Or verify `OLLAMA_BASE_URL` is set and reachable (if self-hosted)
- Check backend logs for embedding service errors

### Issue: Slow Response Time
- Cold start is normal (2-3 seconds first request)
- Subsequent requests should be < 1 second
- Check Gemini API quota status

### Issue: Modal Not Opening
- Ensure browser JavaScript is enabled
- Check browser console for errors
- Verify frontend deployed correctly

---

## Rollback Plan

If deployment fails:

**Option 1: Revert to Previous Version**
```bash
# In Vercel Dashboard:
# 1. Go to Deployments
# 2. Click on previous deployment
# 3. Click "Promote to Production"
```

**Option 2: Redeploy Locally**
```bash
cd rag-backend
vercel --prod --name portfolio-rag-api

cd ../frontend
vercel --prod --name portfolio-site
```

---

## Maintenance

### Regular Checks
- [ ] Monitor Vercel dashboard weekly
- [ ] Check Pinecone query metrics
- [ ] Review Gemini API usage
- [ ] Update dependencies monthly

### Data Updates
**If you update the portfolio data locally:**
1. Update relevant files locally
2. Run `npm run ingest` (locally only, not in production)
3. Verify data in Pinecone dashboard
4. Frontend/backend automatically serve updated data

**Do NOT run `npm run ingest` on Vercel** (it will fail and is not needed)

---

## Deployment Complete ✅

Once all checks pass:
- Share the live URL: `https://portfolio-site.vercel.app`
- Test chat functionality with friends/colleagues
- Monitor for any issues in the first week

For ongoing support, refer to:
- Vercel docs: https://vercel.com/docs
- Pinecone docs: https://docs.pinecone.io
- Gemini docs: https://ai.google.dev
