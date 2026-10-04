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

const models = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
];

async function testGroundingRest(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [{ text: 'Siapa presiden Indonesia saat ini?' }]
      }
    ],
    tools: [
      {
        googleSearch: {}
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[SUCCESS] ${model}:`);
      console.log('Text:', data.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 100));
      console.log('GroundingMetadata:', JSON.stringify(data.candidates?.[0]?.groundingMetadata, null, 2));
      return true;
    } else {
      console.log(`[FAILED ${res.status}] ${model}:`, data.error?.message?.slice(0, 200));
      return false;
    }
  } catch (e) {
    console.log(`[ERR] ${model}:`, e.message);
    return false;
  }
}

async function run() {
  for (const m of models) {
    const ok = await testGroundingRest(m);
    if (ok) break;
  }
}

run();
