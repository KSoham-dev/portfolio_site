import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Try to get gemini-pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('test');
    console.log('✅ gemini-pro works');
  } catch (error) {
    console.log('❌ gemini-pro error:', error.message);
  }

  // Try other models
  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-1.5-flash', 
    'gemini-1.5-pro',
    'text-bison',
    'gemini-pro-vision'
  ];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('test');
      console.log(`✅ ${modelName} works`);
    } catch (error) {
      if (error.message?.includes('404')) {
        console.log(`❌ ${modelName}: Not found`);
      } else if (error.message?.includes('quota')) {
        console.log(`⚠️  ${modelName}: Quota exceeded`);
      } else {
        console.log(`❌ ${modelName}: ${error.message?.split('\n')[0]}`);
      }
    }
  }
}

listModels();
