export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seed: string | number, stream: string): number {
  const s = `${seed}:${stream}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private next: () => number;

  constructor(seed: string | number, stream: string) {
    this.next = mulberry32(hashSeed(seed, stream));
  }

  float(): number {
    return this.next();
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, maxInclusive: number): number {
    return Math.floor(this.range(min, maxInclusive + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const index = Math.floor(this.next() * arr.length);
    const item = arr[index];
    if (item === undefined) {
      throw new Error(`Index ${index} out of bounds`);
    }
    return item;
  }

  weighted<T>(items: readonly { item: T; weight: number }[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty weighted list');
    }
    const total = items.reduce((s, i) => s + i.weight, 0);
    if (total <= 0) {
      const first = items[0];
      if (!first) throw new Error('Empty weighted items');
      return first.item;
    }
    let r = this.next() * total;
    for (const i of items) {
      r -= i.weight;
      if (r <= 0) return i.item;
    }
    const last = items[items.length - 1];
    if (!last) throw new Error('Empty weighted items');
    return last.item;
  }
}
