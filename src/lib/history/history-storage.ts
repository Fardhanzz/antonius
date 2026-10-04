import { HistoryItem, HistoryItemSchema } from '@/lib/validation/history-schema';
import { openAntoniusDB, HISTORY_STORE } from '@/lib/storage/db';

const STORE_NAME = HISTORY_STORE;

/**
 * Save or update a history item in native IndexedDB.
 */
export async function saveItem(item: HistoryItem): Promise<HistoryItem> {
  // Validate data integrity before saving
  const validated = HistoryItemSchema.parse(item);
  const db = await openAntoniusDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(validated);

    request.onsuccess = () => resolve(validated);
    request.onerror = () => reject(request.error || new Error('Gagal menyimpan riwayat ke IndexedDB.'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieve all history items sorted newest first.
 * Gracefully filters out any corrupted records without crashing.
 */
export async function getAllItems(): Promise<HistoryItem[]> {
  try {
    const db = await openAntoniusDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawItems = request.result || [];
        const validItems: HistoryItem[] = [];

        for (const raw of rawItems) {
          const parsed = HistoryItemSchema.safeParse(raw);
          if (parsed.success) {
            validItems.push(parsed.data);
          } else {
            // Safely skip corrupted record without leaking data
            console.warn('Skipping corrupted history item id:', raw?.id);
          }
        }

        // Sort newest first by createdAt timestamp
        validItems.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA;
        });

        resolve(validItems);
      };

      request.onerror = () => reject(request.error || new Error('Gagal membaca riwayat dari IndexedDB.'));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('IndexedDB read error:', err);
    return [];
  }
}

/**
 * Retrieve a single history item by its unique ID.
 */
export async function getItemById(id: string): Promise<HistoryItem | null> {
  try {
    const db = await openAntoniusDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const raw = request.result;
        if (!raw) return resolve(null);

        const parsed = HistoryItemSchema.safeParse(raw);
        if (parsed.success) {
          resolve(parsed.data);
        } else {
          console.warn('History item validation failed for id:', id);
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error || new Error('Gagal membaca item dari IndexedDB.'));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('IndexedDB read single item error:', err);
    return null;
  }
}

/**
 * Delete a specific history item by ID.
 */
export async function deleteItem(id: string): Promise<boolean> {
  const db = await openAntoniusDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error('Gagal menghapus riwayat dari IndexedDB.'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Clear all stored history items.
 */
export async function clearAll(): Promise<boolean> {
  const db = await openAntoniusDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error('Gagal membersihkan riwayat di IndexedDB.'));
    tx.oncomplete = () => db.close();
  });
}
