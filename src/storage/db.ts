import { DB_NAME, DB_VERSION, STORE_NAME, type CachedTranscriptRecord } from './types';

let dbInstance: IDBDatabase | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
      }
    };
  });
}

export async function addTranscript(
  record: CachedTranscriptRecord
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onerror = () => {
      reject(new Error(`Failed to add transcript: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function getTranscript(hash: string): Promise<CachedTranscriptRecord | undefined> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(hash);

    request.onerror = () => {
      reject(new Error(`Failed to get transcript: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export async function clearDatabase(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error(`Failed to clear database: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
