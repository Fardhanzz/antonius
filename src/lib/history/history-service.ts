import { HistoryItem } from '@/lib/validation/history-schema';
import { ExtractedQuestion } from '@/lib/validation/question-schema';
import { SolverOutput } from '@/lib/validation/solver-schema';
import { FollowUpMessage } from '@/lib/validation/followup-schema';
import { GroundedSearchResult } from '@/lib/validation/grounding-schema';
import * as storage from './history-storage';

export class HistoryService {
  /**
   * Save a newly solved question or update an existing session item.
   * Prevents unintentional duplicate creation during retries of the same question.
   */
  async saveSolvedQuestion(params: {
    extractedQuestion: ExtractedQuestion;
    solverResult: SolverOutput;
    existingId?: string | null;
  }): Promise<HistoryItem> {
    const { extractedQuestion, solverResult, existingId } = params;
    const now = new Date().toISOString();

    let existingItem: HistoryItem | null = null;
    if (existingId) {
      existingItem = await storage.getItemById(existingId);
    }

    const id = existingItem?.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createdAt = existingItem?.createdAt || now;

    const item: HistoryItem = {
      id,
      createdAt,
      updatedAt: now,
      questionText: extractedQuestion.questionText,
      subject: extractedQuestion.subject || null,
      topic: extractedQuestion.topic || null,
      questionType: existingItem?.questionType || null,
      detectedLanguage: extractedQuestion.detectedLanguage || 'id',
      finalAnswer: solverResult.finalAnswer || '',
      answerType: solverResult.answerType || 'numeric',
      explanation: solverResult.explanation || '',
      steps: solverResult.steps || [],
      verification: solverResult.verification || null,
      confidence: solverResult.confidence ?? 1,
      warnings: solverResult.warnings || [],
      followUpMessages: existingItem?.followUpMessages || [],
      citations: existingItem?.citations || [],
      source: existingItem?.source || 'solver',
    };

    return await storage.saveItem(item);
  }

  /**
   * Update follow-up conversation history on an existing solved question item.
   */
  async updateFollowUp(id: string, messages: FollowUpMessage[]): Promise<boolean> {
    try {
      const existing = await storage.getItemById(id);
      if (!existing) return false;

      const updated: HistoryItem = {
        ...existing,
        followUpMessages: messages,
        updatedAt: new Date().toISOString(),
      };

      await storage.saveItem(updated);
      return true;
    } catch (err) {
      console.error('Failed to update follow-up in history:', err);
      return false;
    }
  }

  /**
   * Attach web citations / grounding output to an existing history item.
   */
  async updateGroundedResult(id: string, groundedResult: GroundedSearchResult): Promise<boolean> {
    try {
      const existing = await storage.getItemById(id);
      if (!existing) return false;

      const updated: HistoryItem = {
        ...existing,
        citations: groundedResult.citations || [],
        source: groundedResult.status === 'grounded' && (groundedResult.citations?.length || 0) > 0 ? 'grounded' : existing.source,
        updatedAt: new Date().toISOString(),
      };

      await storage.saveItem(updated);
      return true;
    } catch (err) {
      console.error('Failed to update grounded result in history:', err);
      return false;
    }
  }

  /**
   * Get all history items sorted newest first.
   */
  async getAll(): Promise<HistoryItem[]> {
    return await storage.getAllItems();
  }

  /**
   * Get a single history item by ID.
   */
  async getById(id: string): Promise<HistoryItem | null> {
    return await storage.getItemById(id);
  }

  /**
   * Delete a single history item by ID.
   */
  async delete(id: string): Promise<boolean> {
    return await storage.deleteItem(id);
  }

  /**
   * Clear all history items.
   */
  async clear(): Promise<boolean> {
    return await storage.clearAll();
  }
}

// Singleton export
export const historyService = new HistoryService();
