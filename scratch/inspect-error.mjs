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

async function inspectError() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      tools: [{ googleSearch: {} }],
    });
    const res = await model.generateContent('Siapa presiden Indonesia saat ini?');
    console.log(await (await res.response).text());
  } catch (err) {
    console.log('Full error message:');
    console.log(err.message);
  }
}

inspectError();
