export interface TikTokUser {
  username: string;
  date: string;
}

export interface FollowerSnapshot {
  id: string;
  label: string;
  timestamp: number;
  followers: TikTokUser[];
  following: TikTokUser[];
}

const DB_NAME = "TikTokFollowerDB";
const STORE_NAME = "snapshots";
const DB_VERSION = 1;

class TikTokFollowerDB {
  private db: IDBDatabase | null = null;

  public init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Lỗi khi mở IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    });
  }

  public async saveSnapshot(
    label: string,
    followers: TikTokUser[],
    following: TikTokUser[]
  ): Promise<FollowerSnapshot> {
    const db = await this.init();
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const snapshot: FollowerSnapshot = {
      id,
      label,
      timestamp: Date.now(),
      followers,
      following,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(snapshot);

      request.onsuccess = () => {
        resolve(snapshot);
      };

      request.onerror = () => {
        console.error("Lỗi khi lưu snapshot vào IndexedDB");
        reject(request.error);
      };
    });
  }

  public async getSnapshots(): Promise<FollowerSnapshot[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sắp xếp các bản ghi mới nhất lên đầu
        const list = request.result as FollowerSnapshot[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };

      request.onerror = () => {
        console.error("Lỗi khi lấy danh sách snapshot từ IndexedDB");
        reject(request.error);
      };
    });
  }

  public async deleteSnapshot(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Lỗi khi xóa snapshot khỏi IndexedDB");
        reject(request.error);
      };
    });
  }
}

export const dbInstance = new TikTokFollowerDB();
