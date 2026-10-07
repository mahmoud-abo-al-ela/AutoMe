/**
 * Drafts kept in the browser, in IndexedDB rather than localStorage: a draft
 * holds photos, and IndexedDB stores File objects as they are (structured
 * clone) with room for them, where localStorage holds only strings in a few
 * megabytes.
 *
 * Best effort throughout. A browser that refuses storage (a private window,
 * blocked site data, an old engine) gets nothing saved and an empty read —
 * the form works exactly as it would without drafts.
 */

const DATABASE = "autome";
const STORE = "drafts";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = act(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export const draftStore = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return ((await run("readonly", (store) => store.get(key))) as T | undefined) ?? null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown): Promise<void> {
    try {
      await run("readwrite", (store) => store.put(value, key));
    } catch {
      // Out of quota or storage blocked: the draft simply isn't kept.
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await run("readwrite", (store) => store.delete(key));
    } catch {
      // Nothing to clear.
    }
  },
};
