/**
 * Shared native IndexedDB initialization for Antonius local storage.
 * Supports automated schema migrations while strictly preserving existing data.
 */

export const DB_NAME = 'antonius_db';
export const DB_VERSION = 2;
export const HISTORY_STORE = 'history_items';
export const SESSION_STORE = 'homework_sessions';

/**
 * Open the native IndexedDB database instance with automatic schema migration.
 */
export function openAntoniusDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak tersedia di lingkungan ini.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Milestone 7: History items store
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        historyStore.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      // Milestone 8: Homework sessions store
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        const sessionStore = db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
        sessionStore.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        sessionStore.createIndex('by_status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB Antonius.'));
  });
}
