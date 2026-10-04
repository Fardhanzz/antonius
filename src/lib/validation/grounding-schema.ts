import { z } from 'zod';

/**
 * Citation schema for web-grounded sources.
 * Strictly validated to ensure URLs are authentic and safe.
 */
export const CitationSchema = z.object({
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

export type Citation = z.infer<typeof CitationSchema>;

/**
 * Output schema returned by Grounding service and API.
 * Semantics: status "grounded" strictly requires at least 1 verified citation.
 */
export const GroundedSearchResultSchema = z
  .object({
    status: z.enum([
      'grounded',
      'not_grounded',
      'needs_clarification',
      'cannot_answer',
    ]),
    answer: z.string().min(1, 'Jawaban grounding tidak boleh kosong'),
    citations: z.array(CitationSchema).default([]),
    confidence: z
      .number()
      .min(0, 'Confidence minimal 0')
      .max(1, 'Confidence maksimal 1')
      .default(1),
    searchQueries: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      // If status is 'grounded', it MUST have at least 1 verified citation
      if (data.status === 'grounded') {
        return data.citations.length >= 1;
      }
      return true;
    },
    {
      message: 'Status "grounded" harus memiliki minimal 1 citation terverifikasi.',
      path: ['citations'],
    }
  );

export type GroundedSearchResult = z.infer<typeof GroundedSearchResultSchema>;

/**
 * Input schema for web grounding request.
 */
export const GroundingInputSchema = z.object({
  questionText: z
    .string()
    .trim()
    .min(1, 'Pertanyaan tidak boleh kosong')
    .max(2000, 'Pertanyaan maksimal 2000 karakter'),
  subject: z.string().trim().max(100).optional().nullable(),
  topic: z.string().trim().max(100).optional().nullable(),
  userMessage: z.string().trim().max(2000).optional().nullable(),
});

export type GroundingInput = z.infer<typeof GroundingInputSchema>;

/**
 * API response contract for POST /api/search/ground
 */
export interface GroundingApiResponse {
  success: boolean;
  data?: GroundedSearchResult;
  error?: string;
  code?: string;
}
