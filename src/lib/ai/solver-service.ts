import { ISolverProvider } from './solver-types';
import { GeminiSolverProvider } from './gemini-solver-provider';
import { SolverInput, SolverOutput, SolverInputSchema } from '@/lib/validation/solver-schema';

/**
 * Service orchestrating AI question solving.
 * Decouples the business logic / API routes from the underlying provider implementation.
 */
export class SolverService {
  constructor(private provider: ISolverProvider) {}

  /**
   * Set a custom provider at runtime if needed.
   */
  public setProvider(provider: ISolverProvider) {
    this.provider = provider;
  }

  /**
   * Solve an extracted question using the configured provider.
   */
  public async solveQuestion(input: SolverInput): Promise<SolverOutput> {
    // Validate input data
    const validatedInput = SolverInputSchema.parse(input);

    // Fast-path: If the question explicitly needs clarification from vision, do not guess
    if (validatedInput.needsClarification) {
      return {
        status: 'needs_clarification',
        finalAnswer: null,
        answerType: 'text',
        explanation: 'Soal ini memerlukan foto atau informasi yang lebih jelas sebelum dapat diselesaikan.',
        steps: [],
        verification: {
          performed: false,
          result: 'not_available',
          explanation: 'Verifikasi tidak dapat dilakukan karena soal belum lengkap.',
        },
        confidence: 0,
        clarificationQuestion:
          validatedInput.clarificationReason ||
          'Sebagian teks atau angka pada soal belum terbaca jelas. Harap ambil foto ulang dengan pencahayaan yang cukup.',
        warnings: ['Informasi soal tidak lengkap dari tahap pembacaan gambar.'],
      };
    }

    return this.provider.solve(validatedInput);
  }
}

// Singleton export with default Gemini Solver Provider
export const solverService = new SolverService(new GeminiSolverProvider());
