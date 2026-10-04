import { GoogleGenerativeAI } from '@google/generative-ai';
import { IVisionProvider, VisionImageInput } from './types';
import { ExtractedQuestion, ExtractedQuestionSchema } from '@/lib/validation/question-schema';

const EXTRACTION_SYSTEM_PROMPT = `
You are the dedicated QUESTION EXTRACTION AND VISION UNDERSTANDING SYSTEM for Antonius, an Indonesian educational assistant.

YOUR MISSION:
Extract and transcribe the homework/school question faithfully from the provided image.

STRICT INSTRUCTIONS:
1. Inspect the image carefully. Determine whether it contains a homework, textbook, exam, or worksheet question.
2. Extract the question text faithfully and completely.
3. Preserve mathematical, scientific, and structural notations accurately (use standard notation or LaTeX for equations, powers, fractions, and chemical formulas).
4. For multiple-choice questions, include the question prompt and all visible answer options (A, B, C, D, etc.).
5. If there is a diagram, chart, table, or graph:
   - Set "hasDiagramOrTable": true.
   - In "diagramDescription", describe all visible numbers, labels, geometric shapes, axes, or table contents concisely so another system can solve it later.
6. Identify the school subject in Indonesian (e.g., "Matematika", "Fisika", "Kimia", "Biologi", "Bahasa Indonesia", "Bahasa Inggris", "Ekonomi", "Sejarah", "Geografi", "Lainnya").
7. Identify the specific topic when possible (e.g., "Persamaan Kuadrat", "Dinamika Gerak", "Termokimia", etc.).
8. Detect the language of the question (e.g., "id", "en").
9. Assess clarity and set confidence:
   - "high": The question is completely clear, sharp, fully visible, and unambiguous.
   - "medium": Mostly readable, but slight blur or minor ambiguous handwriting exists.
   - "low": Serious blur, poor lighting, heavy cropping, cut off text, or unreadable handwriting.
10. If the question is cut off, partially covered, too blurry to read key numbers, or ambiguous:
   - Set "needsClarification": true
   - In "clarificationReason", explain clearly and concisely in Indonesian what is missing or unclear (e.g., "Angka pada baris kedua buram dan tidak terbaca", "Bagian bawah soal terpotong kamera").

CRITICAL BOUNDARIES — WHAT YOU MUST NEVER DO:
- DO NOT solve the question or provide answers!
- DO NOT invent missing numbers or guess illegible text!
- DO NOT provide explanations or solutions!
- DO NOT fabricate details that are not visible in the image!
- Return ONLY valid JSON adhering strictly to the schema.
`;

export class GeminiProvider implements IVisionProvider {
  public name = 'Google Gemini Vision';
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async extractQuestion(image: VisionImageInput): Promise<ExtractedQuestion> {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY belum dikonfigurasi di server environment.');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Configurable model ID with modern stable default (gemini-3.5-flash-lite)
    const modelName = process.env.GEMINI_VISION_MODEL?.trim() || 'gemini-3.5-flash-lite';

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // low temperature for precise factual extraction
      },
    });

    const imagePart = {
      inlineData: {
        data: image.buffer.toString('base64'),
        mimeType: image.mimeType,
      },
    };

    const prompt = `${EXTRACTION_SYSTEM_PROMPT}

JSON Schema required:
{
  "subject": string | null,
  "topic": string | null,
  "questionText": string,
  "detectedLanguage": string | null,
  "confidence": "high" | "medium" | "low",
  "needsClarification": boolean,
  "clarificationReason": string | null,
  "hasDiagramOrTable": boolean,
  "diagramDescription": string | null
}

Extract the question from this image now:`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim() === '') {
      throw new Error('Model Gemini mengembalikan respons kosong.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Failed to parse Gemini response as JSON:', text);
      throw new Error('Format output dari model AI tidak valid (gagal parsing JSON).');
    }

    // Validate using Zod schema to guarantee shape
    const validationResult = ExtractedQuestionSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.error('Gemini output validation error:', validationResult.error.format());
      throw new Error('Data ekstraksi soal tidak sesuai dengan skema yang diharapkan.');
    }

    return validationResult.data;
  }
}
