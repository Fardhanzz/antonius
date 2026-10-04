import { HistoryItem } from '@/lib/validation/history-schema';

export type { HistoryItem };

export interface SaveSolvedQuestionParams {
  questionText: string;
  subject?: string | null;
  topic?: string | null;
  questionType?: string | null;
  detectedLanguage?: string | null;
  finalAnswer: string;
  answerType: string;
  explanation: string;
  steps?: HistoryItem['steps'];
  verification?: HistoryItem['verification'];
  confidence?: number | null;
  warnings?: string[];
  existingId?: string | null;
}
