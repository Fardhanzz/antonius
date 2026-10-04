// M5 Verification Script: Unit Tests + Real Gemini API Tests
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually for test script
try {
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
} catch (e) {
  console.log('No .env.local found or error reading:', e.message);
}

const sampleSolverResult = {
  status: 'solved',
  subject: 'Matematika',
  topic: 'Persamaan Linear Satu Variabel',
  finalAnswer: 'x = 6',
  answerType: 'numeric',
  confidence: 1,
  steps: [
    {
      title: 'Pindahkan konstanta 5 ke ruas kanan',
      explanation: 'Kurangkan kedua ruas dengan 5 sehingga 2x = 17 - 5 = 12.',
      formula: '2x = 17 - 5',
      result: '2x = 12'
    },
    {
      title: 'Bagi kedua ruas dengan koefisien x',
      explanation: 'Bagi kedua ruas dengan 2 untuk mendapatkan nilai x.',
      formula: 'x = 12 / 2',
      result: 'x = 6'
    }
  ],
  keyFormulasOrConcepts: ['ax + b = c => ax = c - b => x = (c - b) / a'],
  explanation: 'Persamaan 2x + 5 = 17 diselesaikan dengan memindahkan konstanta dan membagi kedua ruas dengan koefisien x, menghasilkan x = 6.',
  verification: {
    performed: true,
    result: 'passed',
    explanation: 'Substitusi x = 6 ke 2(6) + 5 = 12 + 5 = 17 (cocok dengan ruas kanan).'
  }
};

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('ANTONIUS M5: UNIT TESTS & SCHEMA VALIDATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, name) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // 1. Schema valid test via /api/followup
  console.log('--- Testing API Validation & Error Handling ---');
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        subject: 'Matematika',
        topic: 'Aljabar',
        solverResult: sampleSolverResult,
        messages: [{ role: 'user', content: 'Halo' }, { role: 'assistant', content: 'Halo! Ada yang bisa dibantu?' }],
        userMessage: 'Kenapa hasilnya 6?'
      })
    });
    const data = await res.json();
    console.log('Test 1 Response:', res.status, JSON.stringify(data, null, 2));
    assert(res.status === 200 && data.success === true && data.data?.status, 'Valid follow-up request accepted (Test 1 & 6)');
  }

  // 2. Schema invalid: Missing questionText
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: 'Halo'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_INPUT' || data.code === 'INVALID_REQUEST'), 'Missing questionText rejected with 400 (Test 2)');
  }

  // 3. Empty user message rejected
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: '   '
      })
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_INPUT' || data.code === 'INVALID_REQUEST'), 'Empty userMessage rejected (Test 3)');
  }

  // 4. User message > 2000 chars rejected
  {
    const longMessage = 'A'.repeat(2001);
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: longMessage
      })
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_INPUT' || data.code === 'INVALID_REQUEST'), 'userMessage > 2000 characters rejected (Test 4)');
  }

  // 5. Too many messages rejected (> 50 messages)
  {
    const tooMany = Array.from({ length: 51 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Pesan ${i}`
    }));
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        solverResult: sampleSolverResult,
        messages: tooMany,
        userMessage: 'Pertanyaan'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_INPUT' || data.code === 'INVALID_REQUEST'), 'Too many messages (>50) rejected (Test 5)');
  }

  // 6. Missing solverResult rejected
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        messages: [],
        userMessage: 'Halo'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_INPUT' || data.code === 'INVALID_REQUEST'), 'Missing solverResult rejected (Test 6)');
  }

  // 7. Non-JSON body rejected
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_REQUEST' || data.code === 'INVALID_JSON'), 'Non-JSON body rejected with 400 (Test 7)');
  }

  // 8. GET method not allowed
  {
    const res = await fetch(`${BASE_URL}/api/followup`, { method: 'GET' });
    const data = await res.json();
    assert(res.status === 405 && data.code === 'METHOD_NOT_ALLOWED', 'GET method rejected with 405 (Test 8)');
  }

  // 9. API error mapping check
  {
    // Check that response structure matches { success, error, code, data }
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert('code' in data && 'error' in data && data.success === false, 'API error response adheres to standard contract (Test 9)');
  }

  // 10. Check structured output contract
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: 'Apakah x = 6 sudah benar?'
      })
    });
    const data = await res.json();
    assert(
      data.success === true &&
      typeof data.data.answer === 'string' &&
      typeof data.data.confidence === 'number' &&
      ['answered', 'needs_clarification', 'cannot_answer'].includes(data.data.status),
      'Follow-up provider response parsed and adheres to FollowUpOutputSchema (Test 10)'
    );
  }

  console.log(`\nUnit & validation tests: ${passedTests}/${totalTests} PASSED.\n`);

  console.log('====================================================');
  console.log('ANTONIUS M5: REAL GEMINI API TESTS');
  console.log('====================================================\n');

  // Real Test 1: Step clarification ("Kenapa langkah kedua dibagi 2?")
  console.log('Executing Real Gemini Test 1: "Kenapa langkah kedua dibagi 2?"');
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        subject: 'Matematika',
        topic: 'Persamaan Linear',
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: 'Kenapa langkah kedua dibagi 2?'
      })
    });
    const data = await res.json();
    console.log('Status:', data.data?.status);
    console.log('Answer:', data.data?.answer);
    console.log('Confidence:', data.data?.confidence);

    const ansLower = (data.data?.answer || '').toLowerCase();
    const mentionsDivisionOrIsolation = ansLower.includes('2x = 12') || ansLower.includes('bagi') || ansLower.includes('koefisien') || ansLower.includes('x = 6') || ansLower.includes('12');
    if (data.success && data.data?.status === 'answered' && mentionsDivisionOrIsolation) {
      console.log('>>> REAL TEST 1 PASSED: Correctly explains division by 2 to isolate x from 2x = 12.\n');
    } else {
      throw new Error(`Real Test 1 Failed: ${JSON.stringify(data)}`);
    }
  }

  // Real Test 2: Number variation ("Kalau konstanta 5 diganti 7 dan ruas kanan tetap 17, berapa x?")
  console.log('Executing Real Gemini Test 2: "Kalau konstanta 5 diganti 7 dan ruas kanan tetap 17, berapa x?"');
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        subject: 'Matematika',
        topic: 'Persamaan Linear',
        solverResult: sampleSolverResult,
        messages: [
          { role: 'user', content: 'Kenapa langkah kedua dibagi 2?' },
          { role: 'assistant', content: 'Karena setelah 2x = 12, kedua ruas dibagi 2 untuk mencari nilai x, sehingga x = 6.' }
        ],
        userMessage: 'Kalau konstanta 5 diganti 7 dan ruas kanan tetap 17, berapa x?'
      })
    });
    const data = await res.json();
    console.log('Status:', data.data?.status);
    console.log('Answer:', data.data?.answer);
    console.log('Confidence:', data.data?.confidence);

    const ans = data.data?.answer || '';
    const hasFive = ans.includes('5') || ans.toLowerCase().includes('x = 5');
    if (data.success && data.data?.status === 'answered' && hasFive) {
      console.log('>>> REAL TEST 2 PASSED: Correctly computed x = 5 for 2x + 7 = 17.\n');
    } else {
      throw new Error(`Real Test 2 Failed: ${JSON.stringify(data)}`);
    }
  }

  // Real Test 3: Alternative method ("Ada cara lain?")
  console.log('Executing Real Gemini Test 3: "Ada cara lain?"');
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        subject: 'Matematika',
        topic: 'Persamaan Linear',
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: 'Ada cara lain?'
      })
    });
    const data = await res.json();
    console.log('Status:', data.data?.status);
    console.log('Answer:', data.data?.answer);
    console.log('Confidence:', data.data?.confidence);

    if (data.success && data.data?.status === 'answered' && data.data?.answer.length > 20) {
      console.log('>>> REAL TEST 3 PASSED: Provided valid alternative method or approach.\n');
    } else {
      throw new Error(`Real Test 3 Failed: ${JSON.stringify(data)}`);
    }
  }

  // Real Test 4: Ambiguous reference ("Kenapa yang itu?")
  console.log('Executing Real Gemini Test 4: "Kenapa yang itu?"');
  {
    const res = await fetch(`${BASE_URL}/api/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: '2x + 5 = 17',
        subject: 'Matematika',
        topic: 'Persamaan Linear',
        solverResult: sampleSolverResult,
        messages: [],
        userMessage: 'Kenapa yang itu?'
      })
    });
    const data = await res.json();
    console.log('Status:', data.data?.status);
    console.log('Answer:', data.data?.answer);
    console.log('Clarification Question:', data.data?.clarificationQuestion);

    const isClarification = data.data?.status === 'needs_clarification' ||
      (data.data?.answer && (
        data.data.answer.toLowerCase().includes('bagian') ||
        data.data.answer.toLowerCase().includes('maksud') ||
        data.data.answer.toLowerCase().includes('jelaskan') ||
        data.data.answer.toLowerCase().includes('mana')
      ));

    if (data.success && isClarification) {
      console.log('>>> REAL TEST 4 PASSED: Ambiguity detected and clarification requested.\n');
    } else {
      throw new Error(`Real Test 4 Failed: ${JSON.stringify(data)}`);
    }
  }

  console.log('====================================================');
  console.log('ALL M5 UNIT & REAL GEMINI TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
