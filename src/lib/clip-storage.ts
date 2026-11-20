import type { SavedClip } from "./clips";

const DB_NAME = "deckcoach-local";
const DB_VERSION = 1;
const STORE_NAME = "clips";
const MAX_PERSISTED_CLIPS = 10;

export interface StoredClipRecord {
  id: string;
  createdAt: number;
  clip: Omit<SavedClip, "videoUrl">;
  frameImages: Array<Blob | null>;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close();
        return;
      }
      settled = true;
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => finish(request.result);
    request.onerror = () => finish(null);
    // A blocked upgrade should not hang clip loading forever. If it later opens,
    // finish() closes the late connection rather than leaking it.
    request.onblocked = () => finish(null);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function requestInTransaction<T>(
  transaction: IDBTransaction,
  request: IDBRequest<T>,
): Promise<T> {
  const done = transactionDone(transaction);
  try {
    const result = await requestResult(request);
    await done;
    return result;
  } catch (error) {
    await done.catch(() => undefined);
    throw error;
  }
}

function isStoredClipRecord(value: unknown): value is StoredClipRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StoredClipRecord>;
  if (
    typeof record.id !== "string" ||
    !record.clip ||
    typeof record.clip !== "object" ||
    record.clip.id !== record.id ||
    typeof record.createdAt !== "number" ||
    !Number.isFinite(record.createdAt) ||
    !Array.isArray(record.frameImages)
  ) {
    return false;
  }
  return record.frameImages.every(
    (blob) => blob === null || (typeof Blob !== "undefined" && blob instanceof Blob),
  );
}

async function makeRoomForRecord(db: IDBDatabase, id: string): Promise<void> {
  const read = db.transaction(STORE_NAME, "readonly");
  const all = (await requestInTransaction(
    read,
    read.objectStore(STORE_NAME).getAll(),
  )) as unknown[];
  const valid = all.filter(isStoredClipRecord);
  if (valid.some((record) => record.id === id)) return;
  valid.sort((a, b) => b.createdAt - a.createdAt);
  const evict = valid.slice(Math.max(0, MAX_PERSISTED_CLIPS - 1));
  if (evict.length === 0) return;
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  for (const record of evict) store.delete(record.id);
  await transactionDone(transaction);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.56);
    } catch {
      resolve(null);
    }
  });
}

export async function saveClipRecord(
  clip: SavedClip,
  canvases: HTMLCanvasElement[],
): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  // Encode in small batches so a phone does not allocate dozens of canvas encoders at once.
  const frameImages: Array<Blob | null> = [];
  for (let index = 0; index < canvases.length; index += 8) {
    const batch = canvases.slice(index, index + 8);
    frameImages.push(...(await Promise.all(batch.map(canvasToBlob))));
  }
  const { videoUrl: _videoUrl, ...persistableClip } = clip;
  const record: StoredClipRecord = {
    id: clip.id,
    createdAt: clip.createdAt,
    clip: persistableClip,
    frameImages,
  };

  try {
    await makeRoomForRecord(db, clip.id);
    const transaction = db.transaction(STORE_NAME, "readwrite");
    await requestInTransaction(transaction, transaction.objectStore(STORE_NAME).put(record));
    db.close();
    return true;
  } catch {
    // Quota can be tight on mobile. Retry without frame stills, retaining the
    // encoded clip video and coaching metadata whenever the browser permits it.
    try {
      const reduced: StoredClipRecord = { ...record, frameImages: [] };
      await makeRoomForRecord(db, clip.id);
      const transaction = db.transaction(STORE_NAME, "readwrite");
      await requestInTransaction(transaction, transaction.objectStore(STORE_NAME).put(reduced));
      db.close();
      return true;
    } catch {
      db.close();
      return false;
    }
  }
}

export async function updateStoredClip(clip: SavedClip): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const read = db.transaction(STORE_NAME, "readonly");
    const existing = (await requestInTransaction(
      read,
      read.objectStore(STORE_NAME).get(clip.id),
    )) as StoredClipRecord | undefined;
    if (!existing || !isStoredClipRecord(existing)) {
      db.close();
      return false;
    }
    const { videoUrl: _videoUrl, ...persistableClip } = clip;
    const next: StoredClipRecord = { ...existing, clip: persistableClip };
    const write = db.transaction(STORE_NAME, "readwrite");
    await requestInTransaction(write, write.objectStore(STORE_NAME).put(next));
    db.close();
    return true;
  } catch {
    db.close();
    return false;
  }
}

export async function loadClipRecords(): Promise<StoredClipRecord[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const records = (await requestInTransaction(
      transaction,
      transaction.objectStore(STORE_NAME).getAll(),
    )) as unknown[];
    db.close();
    return records
      .filter(isStoredClipRecord)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_PERSISTED_CLIPS);
  } catch {
    db.close();
    return [];
  }
}

export async function deleteClipRecord(id: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    await requestInTransaction(transaction, transaction.objectStore(STORE_NAME).delete(id));
  } catch {
    // The in-memory clip is still removed even if persistent storage is unavailable.
  } finally {
    db.close();
  }
}
