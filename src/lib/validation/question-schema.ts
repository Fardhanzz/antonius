import { z } from 'zod';

/**
 * Schema representing the extracted question from Gemini Vision.
 * Validates the structured output before returning to client.
 */
export const ExtractedQuestionSchema = z.object({
  subject: z.string().nullable().default(null),
  topic: z.string().nullable().default(null),
  questionText: z.string().min(1, 'Teks soal tidak boleh kosong'),
  detectedLanguage: z.string().nullable().default('id'),
  confidence: z.enum(['high', 'medium', 'low']),
  needsClarification: z.boolean().default(false),
  clarificationReason: z.string().nullable().default(null),
  hasDiagramOrTable: z.boolean().default(false),
  diagramDescription: z.string().nullable().default(null),
});

export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;

/**
 * Standard API response wrapper for extraction endpoint.
 */
export interface ExtractApiResponse {
  success: boolean;
  data?: ExtractedQuestion;
  error?: string;
  code?: string;
}
