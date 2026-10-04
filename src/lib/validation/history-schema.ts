import { z } from 'zod';
import { SolverStepSchema, SolverVerificationSchema } from './solver-schema';
import { FollowUpMessageSchema } from './followup-schema';
import { CitationSchema } from './grounding-schema';

/**
 * Strict Zod schema for a stored History record.
 * Guarantees data integrity and guards against corrupt local storage records.
 */
export const HistoryItemSchema = z.object({
  id: z.string().min(1, 'ID riwayat tidak boleh kosong'),
  createdAt: z.string().min(1, 'Tanggal dibuat wajib ada'),
  updatedAt: z.string().min(1, 'Tanggal diubah wajib ada'),
  questionText: z.string().min(1, 'Teks soal tidak boleh kosong'),
  subject: z.string().optional().nullable().default(null),
  topic: z.string().optional().nullable().default(null),
  questionType: z.string().optional().nullable().default(null),
  detectedLanguage: z.string().optional().nullable().default('id'),
  finalAnswer: z.string().min(1, 'Jawaban akhir tidak boleh kosong'),
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

export type HistoryItem = z.infer<typeof HistoryItemSchema>;
