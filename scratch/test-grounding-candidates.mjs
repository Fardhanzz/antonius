import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
let apiKey = '';
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('GEMINI_API_KEY=')) {
    apiKey = trimmed.slice('GEMINI_API_KEY='.length).trim();
  }
}

const genAI = new GoogleGenerativeAI(apiKey);

const list = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest'
];

async function testModelGrounding(name) {
  console.log(`\nTesting ${name}...`);
  try {
    const model = genAI.getGenerativeModel({
      model: name,
      tools: [{ googleSearch: {} }],
    });
    const res = await model.generateContent('Siapa presiden Indonesia saat ini? Jawab dalam satu kalimat.');
    const response = await res.response;
    console.log(`[SUCCESS] ${name}:`, response.text().trim());
    const candidate = response.candidates?.[0];
    console.log('GroundingMetadata:', JSON.stringify(candidate?.groundingMetadata, null, 2));
    return true;
  } catch (e) {
    console.log(`[FAILED with googleSearch] ${name}:`, e.message.slice(0, 150));
    try {
      const model2 = genAI.getGenerativeModel({
        model: name,
        tools: [{ googleSearchRetrieval: {} }],
      });
      const res2 = await model2.generateContent('Siapa presiden Indonesia saat ini? Jawab dalam satu kalimat.');
      const response2 = await res2.response;
      console.log(`[SUCCESS with googleSearchRetrieval] ${name}:`, response2.text().trim());
      const candidate2 = response2.candidates?.[0];
      console.log('GroundingMetadata:', JSON.stringify(candidate2?.groundingMetadata, null, 2));
      return true;
    } catch (e2) {
      console.log(`[FAILED with googleSearchRetrieval] ${name}:`, e2.message.slice(0, 150));
      return false;
    }
  }
}

async function run() {
  for (const name of list) {
    const ok = await testModelGrounding(name);
    if (ok) {
      console.log(`\n===> CHOSEN WORKING GROUNDING MODEL: ${name} <===`);
      break;
    }
  }
}

run();
