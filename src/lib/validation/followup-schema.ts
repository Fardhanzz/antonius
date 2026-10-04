import { z } from 'zod';
import { SolverOutputSchema } from './solver-schema';

/**
 * Single chat message within a follow-up discussion for an active question.
 */
export const FollowUpMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(4000, 'Pesan terlalu panjang (maksimum 4000 karakter)'),
});

export type FollowUpMessage = z.infer<typeof FollowUpMessageSchema>;

/**
 * Input contract for POST /api/followup
 */
export const FollowUpInputSchema = z.object({
  questionText: z.string().min(1, 'Teks soal wajib disertakan'),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  solverResult: SolverOutputSchema,
  messages: z.array(FollowUpMessageSchema).max(20, 'Riwayat pesan melebihi batas maksimum 20 pesan').default([]),
  userMessage: z
    .string()
    .trim()
    .min(1, 'Pertanyaan follow-up tidak boleh kosong')
    .max(2000, 'Pertanyaan terlalu panjang (maksimum 2000 karakter)'),
});

export type FollowUpInput = z.infer<typeof FollowUpInputSchema>;

/**
 * Structured output contract for Follow-up responses.
 */
export const FollowUpOutputSchema = z.object({
  status: z.enum(['answered', 'needs_clarification', 'cannot_answer']),
  answer: z.string().min(1, 'Jawaban tutor tidak boleh kosong'),
  confidence: z.number().min(0).max(1),
  clarificationQuestion: z.string().nullable().optional(),
  warnings: z.array(z.string()).optional(),
});

export type FollowUpOutput = z.infer<typeof FollowUpOutputSchema>;

/**
 * Standard API response wrapper for POST /api/followup
 */
export interface FollowUpApiResponse {
  success: boolean;
  data?: FollowUpOutput;
  error?: string;
  code?: string;
}
