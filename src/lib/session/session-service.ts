import { HomeworkSession, CreateSessionInput } from '@/lib/validation/session-schema';
import { SessionWithItems, SessionProgress } from './session-types';
import { historyService } from '@/lib/history/history-service';
import { HistoryItem } from '@/lib/validation/history-schema';
import * as storage from './session-storage';

export class SessionService {
  /**
   * Create a new homework session with initial active status.
   */
  async createSession(input: CreateSessionInput): Promise<HomeworkSession> {
    const now = new Date().toISOString();
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const session: HomeworkSession = {
      id,
      title: input.title.trim(),
      subject: input.subject?.trim() || null,
      topic: input.topic?.trim() || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      historyItemIds: [],
    };

    return await storage.saveSession(session);
  }

  /**
   * Get all homework sessions sorted newest updatedAt first.
   */
  async getAll(): Promise<HomeworkSession[]> {
    return await storage.getAllSessions();
  }

  /**
   * Get raw session by ID.
   */
  async getById(id: string): Promise<HomeworkSession | null> {
    return await storage.getSessionById(id);
  }

  /**
   * Get session with resolved History Items and calculated progress.
   * Gracefully ignores and filters out dangling IDs if a History item was deleted in M7.
   */
  async getSessionWithItems(id: string): Promise<SessionWithItems | null> {
    const session = await storage.getSessionById(id);
    if (!session) return null;

    const items: HistoryItem[] = [];
    for (const itemId of session.historyItemIds) {
      try {
        const item = await historyService.getById(itemId);
        if (item) {
          items.push(item);
        } else {
          // Item was deleted in M7: safely ignored without crash
          console.info(`Dangling history item ${itemId} in session ${id} skipped safely.`);
        }
      } catch (err) {
        console.warn(`Error resolving history item ${itemId}:`, err);
      }
    }

    const totalItems = items.length;
    // In Antonius M7 architecture, stored history items are verified solved questions
    const solvedCount = items.filter((i) => Boolean(i.finalAnswer && i.finalAnswer.trim())).length;
    const needsClarificationCount = 0;
    const cannotSolveCount = 0;
    const percentage = totalItems > 0 ? Math.round((solvedCount / totalItems) * 100) : 0;

    const progress: SessionProgress = {
      totalItems,
      solvedCount,
      needsClarificationCount,
      cannotSolveCount,
      percentage,
    };

    return {
      ...session,
      items,
      progress,
    };
  }

  /**
   * Add a solved History Item ID to an existing homework session.
   * Prevents duplicate references on retry.
   */
  async addHistoryItemToSession(sessionId: string, historyItemId: string): Promise<boolean> {
    try {
      const session = await storage.getSessionById(sessionId);
      if (!session) return false;

      // Prevent duplicate reference ID
      if (session.historyItemIds.includes(historyItemId)) {
        return true;
      }

      const updated: HomeworkSession = {
        ...session,
        historyItemIds: [...session.historyItemIds, historyItemId],
        updatedAt: new Date().toISOString(),
      };

      await storage.saveSession(updated);
      return true;
    } catch (err) {
      console.error('Failed to add history item to session:', err);
      return false;
    }
  }

  /**
   * Change session status (e.g. mark completed or reopen).
   */
  async setSessionStatus(sessionId: string, status: 'active' | 'completed'): Promise<boolean> {
    try {
      const session = await storage.getSessionById(sessionId);
      if (!session) return false;

      const updated: HomeworkSession = {
        ...session,
        status,
        updatedAt: new Date().toISOString(),
      };

      await storage.saveSession(updated);
      return true;
    } catch (err) {
      console.error('Failed to update session status:', err);
      return false;
    }
  }

  /**
   * Delete a homework session.
   * Note: referenced History items are NOT deleted.
   */
  async delete(sessionId: string): Promise<boolean> {
    return await storage.deleteSession(sessionId);
  }

  /**
   * Clear all sessions.
   */
  async clear(): Promise<boolean> {
    return await storage.clearAllSessions();
  }
}

// Singleton export
export const sessionService = new SessionService();
