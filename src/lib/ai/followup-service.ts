import { IFollowUpProvider } from './followup-types';
import { GeminiFollowUpProvider } from './gemini-followup-provider';
import { FollowUpInput, FollowUpOutput, FollowUpInputSchema } from '@/lib/validation/followup-schema';

// Maximum number of previous follow-up messages sent to the model (context windowing)
const MAX_CONTEXT_MESSAGES = 10;

/**
 * Service orchestrating follow-up conversations for active solved questions.
 * Handles bounded history windowing, input validation, and provider delegation.
 */
export class FollowUpService {
  constructor(private provider: IFollowUpProvider) {}

  public setProvider(provider: IFollowUpProvider) {
    this.provider = provider;
  }

  public async answerFollowUp(input: FollowUpInput): Promise<FollowUpOutput> {
    const validatedInput = FollowUpInputSchema.parse(input);

    // Apply bounded context windowing: Keep only the most recent N messages
    // while strictly preserving the original question and complete solverResult
    const windowedMessages =
      validatedInput.messages.length > MAX_CONTEXT_MESSAGES
        ? validatedInput.messages.slice(-MAX_CONTEXT_MESSAGES)
        : validatedInput.messages;

    return this.provider.answerFollowUp({
      ...validatedInput,
      messages: windowedMessages,
    });
  }
}

// Singleton export with default Gemini Follow-Up Provider
export const followUpService = new FollowUpService(new GeminiFollowUpProvider());
