import { FollowUpInput, FollowUpOutput } from '@/lib/validation/followup-schema';

export * from '@/lib/validation/followup-schema';

/**
 * Interface contract for AI Follow-up / Tutor providers.
 * Encapsulates multi-turn reasoning about the active solved question.
 */
export interface IFollowUpProvider {
  name: string;
  answerFollowUp(input: FollowUpInput): Promise<FollowUpOutput>;
}
