export class EventBus<E extends object> {
  private handlers = new Map<keyof E, Set<(payload: never) => void>>();

  on<K extends keyof E>(type: K, fn: (payload: E[K]) => void): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    const handler = fn as (payload: never) => void;
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  emit<K extends keyof E>(type: K, payload: E[K]): void {
    const set = this.handlers.get(type);
    if (set) {
      for (const fn of set) {
        (fn as (p: E[K]) => void)(payload);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
