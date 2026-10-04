const STORAGE_PREFIX = 'the_lost_save_v1_';

export class Storage {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // ignore
    }
  }

  static clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }
}
