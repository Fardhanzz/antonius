import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing with API key present:', !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

async function testGrounding(modelName, toolConfig, label) {
  console.log(`\n--- Testing ${modelName} with ${label} ---`);
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: toolConfig,
    });

    const result = await model.generateContent('Siapa presiden Indonesia saat ini? Jawab singkat.');
    const response = await result.response;
    console.log('Text:', response.text().slice(0, 200));
    const candidate = response.candidates?.[0];
    console.log('GroundingMetadata:', JSON.stringify(candidate?.groundingMetadata, null, 2));
    return true;
  } catch (err) {
    console.error(`Error with ${modelName} (${label}):`, err.message);
    return false;
  }
}

async function run() {
  await testGrounding('gemini-3.5-flash-lite', [{ googleSearch: {} }], 'tools: [{ googleSearch: {} }]');
  await testGrounding('gemini-3.5-flash-lite', [{ googleSearchRetrieval: {} }], 'tools: [{ googleSearchRetrieval: {} }]');
}

run();
