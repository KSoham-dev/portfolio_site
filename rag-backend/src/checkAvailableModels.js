import dotenv from 'dotenv';
dotenv.config();

async function listAvailableModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    const data = await response.json();
    
    console.log('Available Models:');
    console.log('=================\n');
    
    if (data.models) {
      data.models.forEach(model => {
        console.log(`📌 ${model.name}`);
        console.log(`   Display: ${model.displayName}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
        console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log(`\nTotal models: ${data.models?.length || 0}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listAvailableModels();
