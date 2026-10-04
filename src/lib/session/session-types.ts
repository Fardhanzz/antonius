import { HomeworkSession, CreateSessionInput } from '@/lib/validation/session-schema';
import { HistoryItem } from '@/lib/validation/history-schema';

export type { HomeworkSession, CreateSessionInput };

export interface SessionProgress {
  totalItems: number;
  solvedCount: number;
  needsClarificationCount: number;
  cannotSolveCount: number;
  percentage: number;
}

export interface SessionWithItems extends HomeworkSession {
  items: HistoryItem[];
  progress: SessionProgress;
}
