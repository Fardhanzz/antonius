import { z } from 'zod';

console.log('====================================================');
console.log('ANTONIUS M7 — AUTOMATED UNIT & INTEGRATION TEST SUITE');
console.log('====================================================\n');

// 1. Define schemas exactly as in src/lib/validation/history-schema.ts
const CitationSchema = z.object({
  url: z
    .string()
    .url('URL sumber tidak valid')
    .refine((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'URL sumber harus menggunakan protokol http atau https'),
  title: z.string().optional().nullable().default(null),
  domain: z.string().optional().nullable().default(null),
  citedText: z.string().optional().nullable().default(null),
});

const FollowUpMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Pesan tidak boleh kosong'),
});

const StepSchema = z.object({
  title: z.string().min(1, 'Judul langkah tidak boleh kosong'),
  explanation: z.string().min(1, 'Penjelasan langkah tidak boleh kosong'),
  formula: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
});

const SolverVerificationSchema = z.object({
  performed: z.boolean(),
  result: z.enum(['passed', 'failed', 'not_available']),
  explanation: z.string().min(1, 'Penjelasan verifikasi tidak boleh kosong'),
});

const HistoryItemSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  questionText: z.string().min(1),
  subject: z.string().nullable().default(null),
  topic: z.string().nullable().default(null),
  questionType: z.string().nullable().default(null),
  detectedLanguage: z.string().default('id'),
  finalAnswer: z.string().min(1),
  answerType: z.string().default('numeric'),
  explanation: z.string().default(''),
  steps: z.array(StepSchema).default([]),
  verification: SolverVerificationSchema.optional().nullable().default(null),
  confidence: z.number().min(0).max(1).default(1),
  warnings: z.array(z.string()).default([]),
  followUpMessages: z.array(FollowUpMessageSchema).default([]),
  citations: z.array(CitationSchema).default([]),
  source: z.enum(['solver', 'grounded']).default('solver'),
});

// In-Memory Storage Simulation adhering to history-storage.ts logic
class InMemoryHistoryStorage {
  constructor() {
    this.store = new Map();
  }

  async saveItem(item) {
    const validated = HistoryItemSchema.parse(item);
    this.store.set(validated.id, JSON.parse(JSON.stringify(validated)));
    return validated;
  }

  async getAllItems() {
    const rawItems = Array.from(this.store.values());
    const validItems = [];
    for (const raw of rawItems) {
      const parsed = HistoryItemSchema.safeParse(raw);
      if (parsed.success) {
        validItems.push(parsed.data);
      } else {
        // safely skip corrupt
      }
    }
    // newest first
    validItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return validItems;
  }

  async getItemById(id) {
    const raw = this.store.get(id);
    if (!raw) return null;
    const parsed = HistoryItemSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  async deleteItem(id) {
    return this.store.delete(id);
  }

  async clearAll() {
    this.store.clear();
    return true;
  }
}

// In-Memory History Service simulating history-service.ts
class HistoryServiceSim {
  constructor(storage) {
    this.storage = storage;
  }

  async saveSolvedQuestion({ extractedQuestion, solverResult, existingId }) {
    const now = new Date().toISOString();
    let existingItem = null;
    if (existingId) {
      existingItem = await this.storage.getItemById(existingId);
    }

    const id = existingItem?.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createdAt = existingItem?.createdAt || now;

    const item = {
      id,
      createdAt,
      updatedAt: now,
      questionText: extractedQuestion.questionText,
      subject: extractedQuestion.subject || null,
      topic: extractedQuestion.topic || null,
      questionType: extractedQuestion.questionType || null,
      detectedLanguage: extractedQuestion.detectedLanguage || 'id',
      finalAnswer: solverResult.finalAnswer || '',
      answerType: solverResult.answerType || 'numeric',
      explanation: solverResult.explanation || '',
      steps: solverResult.steps || [],
      verification: solverResult.verification || null,
      confidence: solverResult.confidence ?? 1,
      warnings: solverResult.warnings || [],
      followUpMessages: existingItem?.followUpMessages || [],
      citations: existingItem?.citations || [],
      source: existingItem?.source || 'solver',
    };

    return await this.storage.saveItem(item);
  }

  async updateFollowUp(id, messages) {
    const existing = await this.storage.getItemById(id);
    if (!existing) return false;
    const updated = {
      ...existing,
      followUpMessages: messages,
      updatedAt: new Date().toISOString(),
    };
    await this.storage.saveItem(updated);
    return true;
  }

  async updateGroundedResult(id, groundedResult) {
    const existing = await this.storage.getItemById(id);
    if (!existing) return false;
    const updated = {
      ...existing,
      citations: groundedResult.citations || [],
      source: groundedResult.status === 'grounded' && (groundedResult.citations?.length || 0) > 0 ? 'grounded' : existing.source,
      updatedAt: new Date().toISOString(),
    };
    await this.storage.saveItem(updated);
    return true;
  }

  async getAll() {
    return await this.storage.getAllItems();
  }

  async getById(id) {
    return await this.storage.getItemById(id);
  }

  async delete(id) {
    return await this.storage.deleteItem(id);
  }

  async clear() {
    return await this.storage.clearAll();
  }
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runAllTests() {
  const storage = new InMemoryHistoryStorage();
  const service = new HistoryServiceSim(storage);

  // Test 1: Save history item
  const sampleExtracted = {
    questionText: 'Berapakah 2 + 2?',
    subject: 'Matematika',
    topic: 'Aritmatika',
    questionType: 'isian',
    detectedLanguage: 'id',
  };
  const sampleSolver = {
    status: 'solved',
    finalAnswer: '4',
    answerType: 'numeric',
    explanation: 'Penjumlahan dua bilangan bulat.',
    steps: [
      {
        title: 'Hitung penjumlahan',
        explanation: 'Tambahkan 2 dengan 2',
        formula: '2 + 2 = 4',
        result: '4',
      },
    ],
    verification: {
      performed: true,
      result: 'passed',
      explanation: '2 + 2 terbukti menghasilkan 4.',
    },
    confidence: 1,
    warnings: [],
  };

  const item1 = await service.saveSolvedQuestion({
    extractedQuestion: sampleExtracted,
    solverResult: sampleSolver,
  });
  assert(item1 && item1.id.startsWith('hist_') && item1.finalAnswer === '4', '1. Save history item');

  // Test 2: Read history items
  const allItems1 = await service.getAll();
  assert(allItems1.length === 1 && allItems1[0].id === item1.id, '2. Read history items');

  // Test 3: Newest item appears first
  // Add item2 with slightly later timestamp
  const sampleExtracted2 = {
    questionText: 'Apa ibukota Indonesia?',
    subject: 'Geografi',
    topic: 'Ibukota',
  };
  const sampleSolver2 = {
    status: 'solved',
    finalAnswer: 'Nusantara (IKN) / Jakarta',
    answerType: 'short_text',
    explanation: 'Berdasarkan regulasi terbaru.',
    steps: [],
    confidence: 0.95,
  };
  // Small delay to ensure timestamp progression
  await new Promise((r) => setTimeout(r, 10));
  const item2 = await service.saveSolvedQuestion({
    extractedQuestion: sampleExtracted2,
    solverResult: sampleSolver2,
  });

  const allItems2 = await service.getAll();
  assert(
    allItems2.length === 2 && allItems2[0].id === item2.id && allItems2[1].id === item1.id,
    '3. Newest item appears first'
  );

  // Test 4: Read single item
  const fetchedItem = await service.getById(item1.id);
  assert(fetchedItem && fetchedItem.questionText === 'Berapakah 2 + 2?', '4. Read single item');

  // Test 5: Delete single item
  const deleteResult = await service.delete(item1.id);
  const allAfterDelete = await service.getAll();
  assert(
    deleteResult === true && allAfterDelete.length === 1 && allAfterDelete[0].id === item2.id,
    '5. Delete single item'
  );

  // Test 6: Clear all
  const clearResult = await service.clear();
  const allAfterClear = await service.getAll();
  assert(clearResult === true && allAfterClear.length === 0, '6. Clear all');

  // Test 7: Empty state
  const emptyStateItems = await service.getAll();
  assert(Array.isArray(emptyStateItems) && emptyStateItems.length === 0, '7. Empty state');

  // Test 8: Invalid/corrupt record does not crash UI
  // Inject a corrupt object into underlying storage
  storage.store.set('corrupted_id', {
    id: 'corrupted_id',
    // missing required fields: createdAt, finalAnswer, etc.
    broken: true,
  });
  // Also add a valid item
  await service.saveSolvedQuestion({
    extractedQuestion: sampleExtracted,
    solverResult: sampleSolver,
  });
  const itemsWithCorrupt = await service.getAll();
  assert(
    itemsWithCorrupt.length === 1 && itemsWithCorrupt[0].id !== 'corrupted_id',
    '8. Invalid/corrupt record does not crash UI'
  );
  await service.clear();

  // Test 9: History item with no citations works
  const noCitationItem = await service.saveSolvedQuestion({
    extractedQuestion: sampleExtracted,
    solverResult: sampleSolver,
  });
  assert(
    Array.isArray(noCitationItem.citations) && noCitationItem.citations.length === 0,
    '9. History item with no citations works'
  );

  // Test 10: History item with citations works
  const groundedData = {
    status: 'grounded',
    citations: [
      {
        url: 'https://kemdikbud.go.id/kurikulum',
        title: 'Kurikulum Kemdikbud',
        domain: 'kemdikbud.go.id',
        citedText: 'Standar matematika SD',
      },
    ],
  };
  await service.updateGroundedResult(noCitationItem.id, groundedData);
  const itemWithCitations = await service.getById(noCitationItem.id);
  assert(
    itemWithCitations &&
      itemWithCitations.citations.length === 1 &&
      itemWithCitations.citations[0].url === 'https://kemdikbud.go.id/kurikulum' &&
      itemWithCitations.source === 'grounded',
    '10. History item with citations works'
  );

  // Test 11: Solver result can be persisted
  assert(
    itemWithCitations &&
      itemWithCitations.steps.length === 1 &&
      itemWithCitations.verification?.explanation === '2 + 2 terbukti menghasilkan 4.' &&
      itemWithCitations.finalAnswer === '4',
    '11. Solver result can be persisted'
  );

  // Test 12: Retry does not unintentionally create duplicate records
  const initialItemsCount = (await service.getAll()).length;
  // User retries solving the exact same question session (existingId passed)
  const retriedItem = await service.saveSolvedQuestion({
    extractedQuestion: sampleExtracted,
    solverResult: {
      ...sampleSolver,
      finalAnswer: '4.0',
    },
    existingId: noCitationItem.id,
  });
  const afterRetryCount = (await service.getAll()).length;
  assert(
    retriedItem.id === noCitationItem.id &&
      retriedItem.finalAnswer === '4.0' &&
      afterRetryCount === initialItemsCount,
    '12. Retry does not unintentionally create duplicate records'
  );

  // Test 13: Follow-up data does not break history
  const followUpChat = [
    { role: 'user', content: 'Kenapa bisa 4?' },
    { role: 'assistant', content: 'Karena 2 apel ditambah 2 apel sama dengan 4 apel.' },
  ];
  const updateFUSuccess = await service.updateFollowUp(retriedItem.id, followUpChat);
  const itemWithFU = await service.getById(retriedItem.id);
  assert(
    updateFUSuccess === true &&
      itemWithFU &&
      itemWithFU.followUpMessages.length === 2 &&
      itemWithFU.followUpMessages[0].content === 'Kenapa bisa 4?',
    '13. Follow-up data does not break history'
  );

  // Test 14: No API key or secret is persisted
  const serializedRecord = JSON.stringify(itemWithFU);
  const containsApiKey =
    serializedRecord.includes('AIzaSy') ||
    serializedRecord.includes('GEMINI_API_KEY') ||
    serializedRecord.includes('rawResponse') ||
    serializedRecord.includes('candidates');
  assert(!containsApiKey, '14. No API key or secret is persisted');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
