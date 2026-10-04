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

const candidates = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
];

async function checkModel(name) {
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
    return name;
  } catch (e) {
    console.log(`[FAILED] ${name}:`, e.message.slice(0, 150));
    return null;
  }
}

async function main() {
  for (const c of candidates) {
    const ok = await checkModel(c);
    if (ok) break;
  }
}

main();
