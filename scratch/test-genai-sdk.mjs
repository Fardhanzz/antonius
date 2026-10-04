import { GoogleGenAI } from '@google/genai';
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

console.log('Testing GoogleGenAI import and instantiation...');
try {
  const ai = new GoogleGenAI({ apiKey });
  console.log('GoogleGenAI instance created successfully!');
  console.log('Available properties on ai:', Object.keys(ai));
} catch (e) {
  console.log('Error creating GoogleGenAI:', e.message);
}
