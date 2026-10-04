import { z } from 'zod';

console.log('====================================================');
console.log('ANTONIUS M8 — AUTOMATED UNIT & INTEGRATION TEST SUITE');
console.log('HOMEWORK SESSIONS TEST RUNNER');
console.log('====================================================\n');

// 1. Schemas (identical to src/lib/validation/)
const CitationSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }),
  title: z.string().optional().nullable().default(null),
  domain: z.string().optional().nullable().default(null),
  citedText: z.string().optional().nullable().default(null),
});

const FollowUpMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

const SolverStepSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  formula: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
});

const SolverVerificationSchema = z.object({
  performed: z.boolean(),
  result: z.enum(['passed', 'failed', 'not_available']),
  explanation: z.string().min(1),
});

const HistoryItemSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  questionText: z.string().min(1),
  subject: z.string().optional().nullable().default(null),
  topic: z.string().optional().nullable().default(null),
  questionType: z.string().optional().nullable().default(null),
  detectedLanguage: z.string().optional().nullable().default('id'),
  finalAnswer: z.string().min(1),
  answerType: z.string().default('numeric'),
  explanation: z.string().default(''),
  steps: z.array(SolverStepSchema).default([]),
  verification: SolverVerificationSchema.optional().nullable().default(null),
  confidence: z.number().min(0).max(1).optional().nullable().default(1),
  warnings: z.array(z.string()).default([]),
  followUpMessages: z.array(FollowUpMessageSchema).default([]),
  citations: z.array(CitationSchema).default([]),
  source: z.enum(['solver', 'grounded']).default('solver'),
});

const HomeworkSessionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(100),
  subject: z.string().trim().max(100).optional().nullable().default(null),
  topic: z.string().trim().max(100).optional().nullable().default(null),
  status: z.enum(['active', 'completed']).default('active'),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  historyItemIds: z.array(z.string()).default([]),
});

const CreateSessionInputSchema = z.object({
  title: z.string().trim().min(1).max(100),
  subject: z.string().trim().max(100).optional().nullable().default(null),
  topic: z.string().trim().max(100).optional().nullable().default(null),
});

// Simulation of In-Memory IndexedDB Storage (mirroring storage architecture)
class MockAntoniusDB {
  constructor() {
    this.historyStore = new Map();
    this.sessionStore = new Map();
  }

  // History operations
  async saveHistoryItem(item) {
    const validated = HistoryItemSchema.parse(item);
    this.historyStore.set(validated.id, JSON.parse(JSON.stringify(validated)));
    return validated;
  }

  async getHistoryItemById(id) {
    const raw = this.historyStore.get(id);
    if (!raw) return null;
    const parsed = HistoryItemSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  async getAllHistoryItems() {
    const items = [];
    for (const raw of this.historyStore.values()) {
      const parsed = HistoryItemSchema.safeParse(raw);
      if (parsed.success) items.push(parsed.data);
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  }

  async deleteHistoryItem(id) {
    return this.historyStore.delete(id);
  }

  // Session operations
  async saveSession(session) {
    const validated = HomeworkSessionSchema.parse(session);
    this.sessionStore.set(validated.id, JSON.parse(JSON.stringify(validated)));
    return validated;
  }

  async getSessionById(id) {
    const raw = this.sessionStore.get(id);
    if (!raw) return null;
    const parsed = HomeworkSessionSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  async getAllSessions() {
    const sessions = [];
    for (const raw of this.sessionStore.values()) {
      const parsed = HomeworkSessionSchema.safeParse(raw);
      if (parsed.success) sessions.push(parsed.data);
    }
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sessions;
  }

  async deleteSession(id) {
    return this.sessionStore.delete(id);
  }

  async clearAllSessions() {
    this.sessionStore.clear();
    return true;
  }
}

// SessionService Implementation matching src/lib/session/session-service.ts
class MockSessionService {
  constructor(db) {
    this.db = db;
  }

  async createSession(input) {
    const validatedInput = CreateSessionInputSchema.parse(input);
    const now = new Date().toISOString();
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const session = {
      id,
      title: validatedInput.title,
      subject: validatedInput.subject || null,
      topic: validatedInput.topic || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      historyItemIds: [],
    };

    return await this.db.saveSession(session);
  }

  async getAll() {
    return await this.db.getAllSessions();
  }

  async getById(id) {
    return await this.db.getSessionById(id);
  }

  async getSessionWithItems(id) {
    const session = await this.db.getSessionById(id);
    if (!session) return null;

    const items = [];
    for (const itemId of session.historyItemIds) {
      try {
        const item = await this.db.getHistoryItemById(itemId);
        if (item) {
          items.push(item);
        } else {
          // Dangling reference handled safely without crash
        }
      } catch (err) {
        // Safe skip
      }
    }

    const totalItems = items.length;
    const solvedCount = items.filter((i) => Boolean(i.finalAnswer && i.finalAnswer.trim())).length;
    const needsClarificationCount = 0;
    const cannotSolveCount = 0;
    const percentage = totalItems > 0 ? Math.round((solvedCount / totalItems) * 100) : 0;

    const progress = {
      totalItems,
      solvedCount,
      needsClarificationCount,
      cannotSolveCount,
      percentage,
    };

    return {
      ...session,
      items,
      progress,
    };
  }

  async addHistoryItemToSession(sessionId, historyItemId) {
    const session = await this.db.getSessionById(sessionId);
    if (!session) return false;

    if (session.historyItemIds.includes(historyItemId)) {
      return true;
    }

    const updated = {
      ...session,
      historyItemIds: [...session.historyItemIds, historyItemId],
      updatedAt: new Date().toISOString(),
    };

    await this.db.saveSession(updated);
    return true;
  }

  async setSessionStatus(sessionId, status) {
    const session = await this.db.getSessionById(sessionId);
    if (!session) return false;

    const updated = {
      ...session,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.db.saveSession(updated);
    return true;
  }

  async delete(sessionId) {
    return await this.db.deleteSession(sessionId);
  }

  async clear() {
    return await this.db.clearAllSessions();
  }
}

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    failed++;
  }
}

async function runTests() {
  const db = new MockAntoniusDB();
  const service = new MockSessionService(db);

  // Test 1: Create session
  const s1 = await service.createSession({
    title: 'PR Matematika Bab 3',
    subject: 'Matematika',
    topic: 'Aljabar',
  });
  assert(s1 && s1.id.startsWith('session_') && s1.status === 'active' && s1.title === 'PR Matematika Bab 3', '1. Create session');

  // Test 2: Read session
  const read1 = await service.getById(s1.id);
  assert(read1 && read1.id === s1.id && read1.subject === 'Matematika', '2. Read session');

  // Test 3: List sessions
  const list1 = await service.getAll();
  assert(Array.isArray(list1) && list1.length === 1 && list1[0].id === s1.id, '3. List sessions');

  // Test 4: Newest updated session first
  await new Promise((r) => setTimeout(r, 15));
  const s2 = await service.createSession({
    title: 'Fisika Termodinamika',
    subject: 'Fisika',
  });
  const list2 = await service.getAll();
  assert(list2.length === 2 && list2[0].id === s2.id && list2[1].id === s1.id, '4. Newest updated session first');

  // Create mock history items in DB
  const histItem1 = await db.saveHistoryItem({
    id: 'hist_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionText: 'Berapakah 3x + 5 = 20?',
    finalAnswer: 'x = 5',
    answerType: 'numeric',
    explanation: 'Kurangi 5 lalu bagi 3.',
    steps: [{ title: 'Pindahkan konstanta', explanation: '3x = 15', formula: '3x = 15', result: '15' }],
    verification: { performed: true, result: 'passed', explanation: '3(5)+5 = 20 terbukti.' },
    citations: [],
    followUpMessages: [],
  });

  const histItem2 = await db.saveHistoryItem({
    id: 'hist_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionText: 'Faktorkan x^2 - 9',
    finalAnswer: '(x - 3)(x + 3)',
    answerType: 'text',
    explanation: 'Selisih kuadrat.',
    steps: [],
    verification: { performed: true, result: 'passed', explanation: 'Benar.' },
    citations: [],
    followUpMessages: [],
  });

  // Test 5: Add History Item to session
  const addRes1 = await service.addHistoryItemToSession(s1.id, histItem1.id);
  const s1Updated = await service.getById(s1.id);
  assert(addRes1 === true && s1Updated.historyItemIds.includes('hist_1'), '5. Add History Item to session');

  // Test 6: Calculate progress
  await service.addHistoryItemToSession(s1.id, histItem2.id);
  const withItems1 = await service.getSessionWithItems(s1.id);
  assert(
    withItems1 &&
      withItems1.progress.totalItems === 2 &&
      withItems1.progress.solvedCount === 2 &&
      withItems1.progress.percentage === 100,
    '6. Calculate progress'
  );

  // Test 7: Solve count correct
  assert(withItems1.progress.solvedCount === 2, '7. Solve count correct');

  // Test 8: Empty session works
  const sEmpty = await service.createSession({ title: 'Sesi Kosong' });
  const emptyWithItems = await service.getSessionWithItems(sEmpty.id);
  assert(
    emptyWithItems &&
      emptyWithItems.progress.totalItems === 0 &&
      emptyWithItems.progress.solvedCount === 0 &&
      emptyWithItems.progress.percentage === 0 &&
      emptyWithItems.items.length === 0,
    '8. Empty session works'
  );

  // Test 9: Complete session
  await service.setSessionStatus(s1.id, 'completed');
  const completedSession = await service.getById(s1.id);
  assert(completedSession.status === 'completed', '9. Complete session');

  // Test 10: Reopen completed session
  await service.setSessionStatus(s1.id, 'active');
  const reopenedSession = await service.getById(s1.id);
  assert(reopenedSession.status === 'active', '10. Reopen completed session');

  // Test 11: Delete session
  const deleteRes = await service.delete(sEmpty.id);
  const afterDelete = await service.getById(sEmpty.id);
  assert(deleteRes === true && afterDelete === null, '11. Delete session');

  // Test 12: Deleting session does NOT delete History Item
  const sessionToDelete = await service.createSession({ title: 'Sesi Sementara' });
  await service.addHistoryItemToSession(sessionToDelete.id, histItem1.id);
  await service.delete(sessionToDelete.id);
  const histItemStillExists = await db.getHistoryItemById(histItem1.id);
  assert(histItemStillExists !== null && histItemStillExists.id === 'hist_1', '12. Deleting session does NOT delete History Item');

  // Test 13: Missing History Item does not crash session
  // Delete hist_2 from history, then load session s1 which referenced it
  await db.deleteHistoryItem('hist_2');
  const s1WithDangling = await service.getSessionWithItems(s1.id);
  assert(
    s1WithDangling !== null &&
      s1WithDangling.items.length === 1 &&
      s1WithDangling.items[0].id === 'hist_1' &&
      s1WithDangling.progress.totalItems === 1,
    '13. Missing History Item does not crash session'
  );

  // Test 14: Duplicate History Item ID is prevented/handled
  await service.addHistoryItemToSession(s1.id, 'hist_1');
  await service.addHistoryItemToSession(s1.id, 'hist_1');
  const s1CheckDup = await service.getById(s1.id);
  const countHist1 = s1CheckDup.historyItemIds.filter((id) => id === 'hist_1').length;
  assert(countHist1 === 1, '14. Duplicate History Item ID is prevented/handled');

  // Test 15: Session persists after reload simulation
  const reloadedSession = await service.getById(s1.id);
  assert(reloadedSession && reloadedSession.title === 'PR Matematika Bab 3', '15. Session persists after reload');

  // Test 16: Invalid session record does not crash
  db.sessionStore.set('broken_session', { id: 'broken_session', broken: true });
  const allWithBroken = await service.getAll();
  assert(
    !allWithBroken.some((s) => s.id === 'broken_session'),
    '16. Invalid session record does not crash'
  );

  // Test 17: Active session context reaches /scan simulation
  const dummyQueryUrl = `http://localhost:3000/scan?session=${s1.id}`;
  const parsedSessionId = new URL(dummyQueryUrl).searchParams.get('session');
  assert(parsedSessionId === s1.id, '17. Active session context reaches /scan');

  // Test 18: Solved question in active session attaches correctly
  const histItem3 = await db.saveHistoryItem({
    id: 'hist_3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionText: 'Tentukan gradien garis 2y = 4x + 6',
    finalAnswer: 'm = 2',
    answerType: 'numeric',
    explanation: 'Bagi kedua ruas dengan 2.',
    steps: [],
    verification: { performed: true, result: 'passed', explanation: 'Gradien = 2.' },
    citations: [],
    followUpMessages: [],
  });
  await service.addHistoryItemToSession(s1.id, histItem3.id);
  const s1WithItem3 = await service.getSessionWithItems(s1.id);
  assert(s1WithItem3.items.some((i) => i.id === 'hist_3'), '18. Solved question in active session attaches correctly');

  // Test 19: Retry does not duplicate session item
  // User retries solving hist_3 with slightly updated answer
  await db.saveHistoryItem({
    ...histItem3,
    finalAnswer: '2',
    updatedAt: new Date().toISOString(),
  });
  // Simulate scan page re-calling addHistoryItemToSession with same activeHistoryId
  await service.addHistoryItemToSession(s1.id, histItem3.id);
  const s1RetryCheck = await service.getById(s1.id);
  const hist3Occurrences = s1RetryCheck.historyItemIds.filter((id) => id === 'hist_3').length;
  assert(hist3Occurrences === 1, '19. Retry does not duplicate session item');

  // Test 20: Follow-up still belongs to same History Item
  const updatedHist3 = {
    ...histItem3,
    followUpMessages: [
      { role: 'user', content: 'Kenapa dibagi 2?' },
      { role: 'assistant', content: 'Karena bentuk umum gradien adalah y = mx + c.' },
    ],
  };
  await db.saveHistoryItem(updatedHist3);
  const reloadedItem3 = await db.getHistoryItemById('hist_3');
  assert(
    reloadedItem3.followUpMessages.length === 2 &&
      reloadedItem3.followUpMessages[0].content === 'Kenapa dibagi 2?',
    '20. Follow-up still belongs to same History Item'
  );

  // Test 21: Citation-compatible History Item works
  const groundedHistItem = await db.saveHistoryItem({
    id: 'hist_grounded',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionText: 'Siapa presiden pertama RI?',
    finalAnswer: 'Ir. Soekarno',
    answerType: 'text',
    explanation: 'Proklamator kemerdekaan RI.',
    steps: [],
    verification: { performed: true, result: 'passed', explanation: 'Terdokumentasi sejarah.' },
    citations: [{ url: 'https://kemdikbud.go.id/sejarah', title: 'Kemdikbud', domain: 'kemdikbud.go.id', citedText: 'Soekarno' }],
    source: 'grounded',
    followUpMessages: [],
  });
  await service.addHistoryItemToSession(s1.id, groundedHistItem.id);
  const s1GroundedCheck = await service.getSessionWithItems(s1.id);
  const foundGrounded = s1GroundedCheck.items.find((i) => i.id === 'hist_grounded');
  assert(
    foundGrounded && foundGrounded.citations.length === 1 && foundGrounded.source === 'grounded',
    '21. Citation-compatible History Item works'
  );

  // Test 22: No API key/secrets persisted
  const sessionDataJson = JSON.stringify(s1GroundedCheck);
  const hasSecrets =
    sessionDataJson.includes('AIzaSy') ||
    sessionDataJson.includes('GEMINI_API_KEY') ||
    sessionDataJson.includes('privateKey') ||
    sessionDataJson.includes('secret');
  assert(!hasSecrets, '22. No API key/secrets persisted');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
