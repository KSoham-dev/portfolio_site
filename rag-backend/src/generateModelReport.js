import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const apiKey = process.env.GEMINI_API_KEY;

// All 50 models from ListModels API
const ALL_MODELS = [
  'embedding-gecko-001',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash-lite-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-2.0-flash-lite-preview',
  'gemini-exp-1206',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
  'gemma-3-1b-it',
  'gemma-3-4b-it',
  'gemma-3-12b-it',
  'gemma-3-27b-it',
  'gemma-3n-e4b-it',
  'gemma-3n-e2b-it',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-09-2025',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3-pro-image-preview',
  'nano-banana-pro-preview',
  'gemini-robotics-er-1.5-preview',
  'gemini-2.5-computer-use-preview-10-2025',
  'deep-research-pro-preview-12-2025',
  'embedding-001',
  'text-embedding-004',
  'gemini-embedding-exp-03-07',
  'gemini-embedding-exp',
  'gemini-embedding-001',
  'aqa',
  'imagen-4.0-generate-preview-06-06',
  'imagen-4.0-ultra-generate-preview-06-06',
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-fast-generate-001',
  'veo-2.0-generate-001',
  'veo-3.0-generate-001',
  'veo-3.0-fast-generate-001',
  'veo-3.1-generate-preview',
];

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Try a simple request
    const result = await Promise.race([
      model.generateContent('test'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);
    
    return {
      model: modelName,
      status: '✅ AVAILABLE',
      error: null,
      quota: '✓ No quota error',
    };
  } catch (error) {
    const message = error.message || '';
    
    if (message.includes('404') || message.includes('not found')) {
      return {
        model: modelName,
        status: '❌ NOT FOUND',
        error: '404 Not Found',
        quota: 'N/A',
      };
    } else if (message.includes('429') || message.includes('quota') || message.includes('exceeded')) {
      return {
        model: modelName,
        status: '⚠️  QUOTA EXCEEDED',
        error: 'Rate limit / Quota exceeded',
        quota: '❌ Exceeded',
      };
    } else if (message.includes('503')) {
      return {
        model: modelName,
        status: '⚠️  SERVICE OVERLOADED',
        error: '503 Service Unavailable',
        quota: '❓ Unknown',
      };
    } else if (message.includes('Timeout')) {
      return {
        model: modelName,
        status: '⏱️  TIMEOUT',
        error: 'Request timeout',
        quota: '❓ Unknown',
      };
    } else if (message.includes('permission') || message.includes('401')) {
      return {
        model: modelName,
        status: '🔒 NO PERMISSION',
        error: '401 Unauthorized',
        quota: 'N/A',
      };
    } else {
      return {
        model: modelName,
        status: '❓ ERROR',
        error: message.split('\n')[0].substring(0, 60),
        quota: '❓ Unknown',
      };
    }
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(100));
  console.log('GEMINI API - COMPLETE MODEL STATUS REPORT');
  console.log('='.repeat(100));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`API Key: ${apiKey.substring(0, 20)}...`);
  console.log(`Total Models to Test: ${ALL_MODELS.length}\n`);

  const results = [];
  const categoryMap = {
    'Text Generation': [],
    'Embeddings': [],
    'Image Generation': [],
    'Video Generation': [],
    'Other': [],
  };

  console.log('Testing models... (this may take a minute)\n');

  // Test models in batches to avoid overwhelming the API
  for (let i = 0; i < ALL_MODELS.length; i++) {
    const modelName = ALL_MODELS[i];
    const result = await testModel(modelName);
    results.push(result);
    
    // Categorize
    if (modelName.includes('embedding')) {
      categoryMap['Embeddings'].push(result);
    } else if (modelName.includes('imagen') || modelName.includes('veo')) {
      categoryMap['Image Generation'].push(result);
    } else if (modelName.includes('veo')) {
      categoryMap['Video Generation'].push(result);
    } else if (modelName.includes('gemini') || modelName.includes('gemma') || modelName.includes('aqa')) {
      categoryMap['Text Generation'].push(result);
    } else {
      categoryMap['Other'].push(result);
    }
    
    // Show progress
    const percent = ((i + 1) / ALL_MODELS.length * 100).toFixed(0);
    process.stdout.write(`\r[${percent}%] Tested ${i + 1}/${ALL_MODELS.length} models`);
    
    // Small delay between requests
    if (i < ALL_MODELS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n\n' + '='.repeat(100));
  console.log('DETAILED RESULTS BY CATEGORY');
  console.log('='.repeat(100) + '\n');

  // Summary stats
  const available = results.filter(r => r.status.includes('✅')).length;
  const quotaExceeded = results.filter(r => r.status.includes('⚠️')).length;
  const notFound = results.filter(r => r.status.includes('❌')).length;
  const other = results.filter(r => r.status.includes('❓') || r.status.includes('🔒')).length;

  console.log('📊 SUMMARY STATISTICS:');
  console.log(`   ✅ Available: ${available}`);
  console.log(`   ⚠️  Quota/Rate Limited: ${quotaExceeded}`);
  console.log(`   ❌ Not Found: ${notFound}`);
  console.log(`   ❓ Other Issues: ${other}`);
  console.log(`   Total: ${results.length}\n`);

  // Print by category
  for (const [category, models] of Object.entries(categoryMap)) {
    if (models.length === 0) continue;
    
    console.log(`\n${'='.repeat(100)}`);
    console.log(`${category.toUpperCase()} (${models.length} models)`);
    console.log('='.repeat(100));
    
    models.forEach(result => {
      console.log(`${result.status} ${result.model}`);
      if (result.error) {
        console.log(`   └─ Error: ${result.error}`);
      }
    });
  }

  // Recommendations
  console.log('\n' + '='.repeat(100));
  console.log('📋 RECOMMENDATIONS');
  console.log('='.repeat(100));
  
  const availableGenerative = results.filter(r => 
    r.status.includes('✅') && 
    !r.model.includes('embedding') &&
    !r.model.includes('imagen') &&
    !r.model.includes('veo') &&
    r.model.includes('gemini')
  );

  if (availableGenerative.length > 0) {
    console.log('\n✅ RECOMMENDED MODELS FOR TEXT GENERATION:');
    availableGenerative.slice(0, 5).forEach(r => {
      console.log(`   • ${r.model}`);
    });
  }

  const availableEmbeddings = results.filter(r => 
    r.status.includes('✅') && 
    r.model.includes('embedding')
  );

  if (availableEmbeddings.length > 0) {
    console.log('\n✅ RECOMMENDED MODELS FOR EMBEDDINGS:');
    availableEmbeddings.forEach(r => {
      console.log(`   • ${r.model}`);
    });
  }

  console.log('\n⚠️  QUOTA STATUS:');
  if (quotaExceeded > 0) {
    console.log(`   You have exceeded quota for ${quotaExceeded} models.`);
    console.log('   Quotas reset at 00:00 UTC each day.');
    console.log('   Free tier has very low limits (~100 requests/minute).');
    console.log('\n💡 OPTIONS:');
    console.log('   1. Wait for quota reset (midnight UTC)');
    console.log('   2. Upgrade to paid plan (Google Cloud Console)');
    console.log('   3. Use Ollama for all generations (no quota)');
    console.log('   4. Use embedding models without quota issues');
  } else {
    console.log('   ✓ No quota issues detected');
  }

  console.log('\n' + '='.repeat(100) + '\n');
}

generateReport().catch(console.error);
