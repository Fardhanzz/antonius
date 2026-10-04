import { HomeworkSession, HomeworkSessionSchema } from '@/lib/validation/session-schema';
import { openAntoniusDB, SESSION_STORE } from '@/lib/storage/db';

/**
 * Save or update a homework session in native IndexedDB.
 */
export async function saveSession(session: HomeworkSession): Promise<HomeworkSession> {
  const validated = HomeworkSessionSchema.parse(session);
  const db = await openAntoniusDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readwrite');
    const store = tx.objectStore(SESSION_STORE);
    const request = store.put(validated);

    request.onsuccess = () => resolve(validated);
    request.onerror = () => reject(request.error || new Error('Gagal menyimpan sesi ke IndexedDB.'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieve all homework sessions sorted newest updatedAt first.
 * Safely skips any corrupted records without crashing.
 */
export async function getAllSessions(): Promise<HomeworkSession[]> {
  try {
    const db = await openAntoniusDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSION_STORE, 'readonly');
      const store = tx.objectStore(SESSION_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawSessions = request.result || [];
        const validSessions: HomeworkSession[] = [];

        for (const raw of rawSessions) {
          const parsed = HomeworkSessionSchema.safeParse(raw);
          if (parsed.success) {
            validSessions.push(parsed.data);
          } else {
            console.warn('Skipping corrupted homework session id:', raw?.id);
          }
        }

        // Sort newest first by updatedAt timestamp
        validSessions.sort((a, b) => {
          const timeA = new Date(a.updatedAt).getTime();
          const timeB = new Date(b.updatedAt).getTime();
          return timeB - timeA;
        });

        resolve(validSessions);
      };

      request.onerror = () => reject(request.error || new Error('Gagal membaca sesi dari IndexedDB.'));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('IndexedDB read sessions error:', err);
    return [];
  }
}

/**
 * Retrieve a single homework session by its unique ID.
 */
export async function getSessionById(id: string): Promise<HomeworkSession | null> {
  try {
    const db = await openAntoniusDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSION_STORE, 'readonly');
      const store = tx.objectStore(SESSION_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const raw = request.result;
        if (!raw) return resolve(null);

        const parsed = HomeworkSessionSchema.safeParse(raw);
        if (parsed.success) {
          resolve(parsed.data);
        } else {
          console.warn('Session validation failed for id:', id);
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error || new Error('Gagal membaca sesi dari IndexedDB.'));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('IndexedDB read single session error:', err);
    return null;
  }
}

/**
 * Delete a specific homework session by ID.
 * CRITICAL: This deletes the session grouping only; referenced History Items are NOT touched.
 */
export async function deleteSession(id: string): Promise<boolean> {
  const db = await openAntoniusDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readwrite');
    const store = tx.objectStore(SESSION_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error('Gagal menghapus sesi dari IndexedDB.'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Clear all stored homework sessions.
 */
export async function clearAllSessions(): Promise<boolean> {
  const db = await openAntoniusDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readwrite');
    const store = tx.objectStore(SESSION_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error('Gagal membersihkan seluruh sesi di IndexedDB.'));
    tx.oncomplete = () => db.close();
  });
}
