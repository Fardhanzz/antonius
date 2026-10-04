import { IVisionProvider, VisionImageInput } from './types';
import { GeminiProvider } from './gemini-provider';
import { ExtractedQuestion } from '@/lib/validation/question-schema';

/**
 * VisionService acts as the abstraction layer between the HTTP route handlers
 * and the specific AI multimodal provider (e.g. Gemini).
 * This makes the AI provider replaceable and testable.
 */
export class VisionService {
  private provider: IVisionProvider;

  constructor(provider?: IVisionProvider) {
    this.provider = provider || new GeminiProvider();
  }

  public setProvider(provider: IVisionProvider) {
    this.provider = provider;
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public async extractQuestion(image: VisionImageInput): Promise<ExtractedQuestion> {
    return this.provider.extractQuestion(image);
  }
}

// Default global instance for application routes
export const visionService = new VisionService();
