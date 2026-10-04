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

const ai = new GoogleGenAI({ apiKey });

async function testNewSDK() {
  console.log('Calling ai.models.generateContent with @google/genai...');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Apa ibu kota Indonesia?',
    });
    console.log('Response text:', response.text?.slice(0, 100));
    console.log('Candidates count:', response.candidates?.length);
  } catch (err) {
    console.log('Error calling generateContent:', err.message);
  }
}

testNewSDK();
