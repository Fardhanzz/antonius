import { z } from 'zod';

/**
 * Strict Zod schema for Homework Session.
 * Groups questions into a single homework session without duplicating full records.
 */
export const HomeworkSessionSchema = z.object({
  id: z.string().min(1, 'ID sesi tidak boleh kosong'),
  title: z
    .string()
    .trim()
    .min(1, 'Judul sesi tidak boleh kosong')
    .max(100, 'Judul sesi maksimal 100 karakter'),
  subject: z.string().trim().max(100).optional().nullable().default(null),
  topic: z.string().trim().max(100).optional().nullable().default(null),
  status: z.enum(['active', 'completed']).default('active'),
  createdAt: z.string().min(1, 'Tanggal dibuat wajib ada'),
  updatedAt: z.string().min(1, 'Tanggal diperbarui wajib ada'),
  historyItemIds: z.array(z.string()).default([]),
});

export type HomeworkSession = z.infer<typeof HomeworkSessionSchema>;

/**
 * Schema for creating a new session from user input.
 */
export const CreateSessionInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul sesi wajib diisi')
    .max(100, 'Judul sesi maksimal 100 karakter'),
  subject: z.string().trim().max(100).optional().nullable().default(null),
  topic: z.string().trim().max(100).optional().nullable().default(null),
});

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
