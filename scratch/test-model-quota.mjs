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
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest'
];

async function run() {
  for (const name of list) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent('Say hello in 1 word.');
      const t = (await res.response).text().trim();
      console.log(`[OK] ${name}: ${t}`);
    } catch (e) {
      console.log(`[ERR] ${name}: ${e.message.slice(0, 100)}`);
    }
  }
}

run();
