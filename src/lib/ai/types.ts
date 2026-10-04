import { ExtractedQuestion } from '@/lib/validation/question-schema';

export interface VisionImageInput {
  buffer: Buffer;
  mimeType: string;
}

export interface IVisionProvider {
  name: string;
  extractQuestion(image: VisionImageInput): Promise<ExtractedQuestion>;
}
