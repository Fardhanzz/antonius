import { z } from 'zod';

/**
 * Input contract for the Solver, received from M3 Vision Extraction.
 */
export const SolverInputSchema = z.object({
  questionText: z.string().min(1, 'Teks soal tidak boleh kosong'),
  subject: z.string().nullable().default(null),
  topic: z.string().nullable().default(null),
  questionType: z.string().nullable().default(null),
  options: z.array(z.string()).nullable().default(null),
  hasDiagramOrTable: z.boolean().default(false),
  diagramDescription: z.string().nullable().default(null),
  detectedLanguage: z.string().nullable().default('id'),
  confidence: z.enum(['high', 'medium', 'low']).default('high'),
  needsClarification: z.boolean().default(false),
  clarificationReason: z.string().nullable().default(null),
});

export type SolverInput = z.infer<typeof SolverInputSchema>;

/**
 * Individual step in the solution explanation.
 */
export const SolverStepSchema = z.object({
  title: z.string().min(1, 'Judul langkah tidak boleh kosong'),
  explanation: z.string().min(1, 'Penjelasan langkah tidak boleh kosong'),
  formula: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
});

export type SolverStep = z.infer<typeof SolverStepSchema>;

/**
 * Verification contract to ensure calculations and consistency are checked.
 */
export const SolverVerificationSchema = z.object({
  performed: z.boolean(),
  result: z.enum(['passed', 'failed', 'not_available']),
  explanation: z.string().min(1, 'Penjelasan verifikasi tidak boleh kosong'),
});

export type SolverVerification = z.infer<typeof SolverVerificationSchema>;

/**
 * Complete structured solution contract returned by ISolverProvider.
 */
export const SolverOutputSchema = z.object({
  status: z.enum(['solved', 'needs_clarification', 'cannot_solve']),
  finalAnswer: z.string().nullable(),
  answerType: z.enum([
    'numeric',
    'text',
    'multiple_choice',
    'formula',
    'explanation',
    'other',
  ]),
  explanation: z.string().min(1, 'Penjelasan ringkas tidak boleh kosong'),
  steps: z.array(SolverStepSchema).default([]),
  verification: SolverVerificationSchema,
  confidence: z.number().min(0).max(1),
  clarificationQuestion: z.string().optional().nullable(),
  warnings: z.array(z.string()).optional(),
});

export type SolverOutput = z.infer<typeof SolverOutputSchema>;

/**
 * Standard API response wrapper for POST /api/solver/solve
 */
export interface SolveApiResponse {
  success: boolean;
  data?: SolverOutput;
  error?: string;
  code?: string;
}
