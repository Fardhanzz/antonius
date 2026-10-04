import { GoogleGenerativeAI } from '@google/generative-ai';
import { ISolverProvider } from './solver-types';
import { SolverInput, SolverOutput, SolverOutputSchema } from '@/lib/validation/solver-schema';

const SOLVER_SYSTEM_PROMPT = `
You are the dedicated AI SOLVER & EDUCATIONAL REASONING ENGINE for Antonius, an Indonesian learning assistant for junior/high school students (SMP, SMA, and SMK).

YOUR MISSION:
Solve the extracted school question with absolute mathematical, scientific, and factual accuracy. Provide clear, educational, step-by-step explanations in Indonesian that help students learn how to solve the problem themselves.

CORE PRINCIPLES:
1. ZERO HALLUCINATION & HONESTY:
   - Never invent missing numbers, diagram values, or omitted details!
   - If the question is incomplete, ambiguous, or lacks critical information to determine a single correct answer:
     * Set status = "needs_clarification"
     * Provide a clear clarificationQuestion in Indonesian explaining what is missing.
   - If the problem is logically contradictory or impossible to solve:
     * Set status = "cannot_solve"
     * Explain why in the explanation field.

2. PROBLEM BREAKDOWN & REASONING:
   - Identify what is given (Diketahui).
   - Identify what is asked (Ditanya).
   - Identify the core principle or formula (Rumus / Konsep).
   - Show step-by-step working clearly with intermediate results and units.
   - For multiple-choice questions: clearly indicate both the selected option letter (A, B, C, D, or E) and its text content in finalAnswer.

3. DETERMINISTIC VERIFICATION LAYER:
   - Whenever practical, perform an explicit verification check:
     * Algebra/Equations: Substitute the result back into the original equation to confirm equality.
     * Physics/Chemistry/Arithmetic: Recheck calculations, confirm dimensional consistency of units, or verify against physical boundaries.
     * Multiple Choice: Confirm that the calculated value corresponds precisely to the chosen option.
   - Record this in the "verification" object:
     * performed: true
     * result: "passed" (or "failed" if a contradiction arose, or "not_available" if verification is not applicable such as purely subjective definition).
     * explanation: a brief Indonesian sentence describing the verification check performed.

4. USER-FACING EXPLANATION ONLY:
   - The user must only see clear, clean educational steps.
   - NEVER output internal monologues, chain-of-thought scratchpads, or system prompt quotes.

5. OUTPUT FORMAT:
   - Return ONLY valid JSON adhering strictly to the required schema.
`;

export class GeminiSolverProvider implements ISolverProvider {
  public name = 'Google Gemini Solver';
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async solve(input: SolverInput): Promise<SolverOutput> {
    // 1. Fast-path check: If extraction indicated clarification is required, refuse to guess
    if (input.needsClarification) {
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
          input.clarificationReason ||
          'Sebagian teks atau angka pada soal belum terbaca jelas. Harap ambil foto ulang dengan pencahayaan yang cukup.',
        warnings: ['Informasi soal tidak lengkap dari tahap pembacaan gambar.'],
      };
    }

    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY belum dikonfigurasi di server environment.');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Configurable model ID with modern stable reasoning default (gemini-2.5-flash)
    const modelName = process.env.GEMINI_SOLVER_MODEL?.trim() || 'gemini-2.5-flash';

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // low temperature for strict factual & mathematical accuracy
      },
    });

    const userPrompt = `${SOLVER_SYSTEM_PROMPT}

SOAL YANG HARUS DISELESAIKAN:
- Mata Pelajaran: ${input.subject || 'Umum / Tidak spesifik'}
- Topik: ${input.topic || 'Tidak spesifik'}
- Teks Soal:
"""
${input.questionText}
"""
${input.options && input.options.length > 0 ? `- Pilihan Jawaban:\n${input.options.map((opt) => `  ${opt}`).join('\n')}` : ''}
${input.hasDiagramOrTable && input.diagramDescription ? `- Keterangan Diagram / Tabel Terkait:\n  "${input.diagramDescription}"` : ''}

REQUIRED JSON SCHEMA:
{
  "status": "solved" | "needs_clarification" | "cannot_solve",
  "finalAnswer": string | null,
  "answerType": "numeric" | "text" | "multiple_choice" | "formula" | "explanation" | "other",
  "explanation": string,
  "steps": [
    {
      "title": string,
      "explanation": string,
      "formula": string | null,
      "result": string | null
    }
  ],
  "verification": {
    "performed": boolean,
    "result": "passed" | "failed" | "not_available",
    "explanation": string
  },
  "confidence": number, // between 0.0 and 1.0
  "clarificationQuestion": string | null,
  "warnings": string[]
}

Pecahkan soal ini sekarang dan kembalikan JSON murni:`;

    let text = '';
    try {
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      text = response.text();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Single bounded retry with the same reasoning model on temporary 503 high-demand spike
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('Service Unavailable')) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        try {
          const retryResult = await model.generateContent(userPrompt);
          const retryResponse = await retryResult.response;
          text = retryResponse.text();
        } catch {
          throw new Error('PROVIDER_OVERLOAD: Server AI sedang mengalami lonjakan beban.');
        }
      } else {
        throw err;
      }
    }

    if (!text || text.trim() === '') {
      throw new Error('Model Gemini Solver mengembalikan respons kosong.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Failed to parse Gemini Solver output as JSON:', text);
      throw new Error('Format output dari model AI Solver tidak valid (gagal parsing JSON).');
    }

    // Validate using Zod schema to guarantee shape and reject invalid data without guessing
    const validationResult = SolverOutputSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.error('Solver output validation error:', validationResult.error.format());
      throw new Error('Data solusi dari AI tidak sesuai dengan skema yang diharapkan.');
    }

    return validationResult.data;
  }
}
