import { ISearchProvider } from './grounding-types';
import { GeminiGroundingProvider } from './gemini-grounding-provider';
import { GroundingInput, GroundedSearchResult } from '@/lib/validation/grounding-schema';

export class SearchService {
  private provider: ISearchProvider;

  constructor(provider?: ISearchProvider) {
    this.provider = provider || new GeminiGroundingProvider();
  }

  public setProvider(provider: ISearchProvider): void {
    this.provider = provider;
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Process a question with web grounding when factual verification or up-to-date info is needed.
   */
  async searchAndGround(input: GroundingInput): Promise<GroundedSearchResult> {
    const sanitizedInput: GroundingInput = {
      questionText: input.questionText.trim(),
      subject: input.subject?.trim() || null,
      topic: input.topic?.trim() || null,
      userMessage: input.userMessage?.trim() || null,
    };

    return await this.provider.searchAndGround(sanitizedInput);
  }
}

// Export singleton instance for app-wide use
export const searchService = new SearchService();
