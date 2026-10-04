import type { BiomeId, EnemyType } from '@/core/types';

export interface LevelConfig {
  id: number;
  name: string;
  biome: BiomeId;
  mapSize: { w: number; h: number }; // in tiles (e.g. 256x256)
  fog: { visionRadius: number; density: number; floor: number };
  time: { startHour: number; dayLengthSec: number };
  stones: {
    count: 3;
    minDistFromSpawn: number;
    minDistBetween: number;
    decoys: number;
    guards: ('hidden' | 'guarded' | 'trapped')[];
  };
  clues: { perStone: number; vagueness: number };
  enemies: { type: EnemyType; count: number; aggression: number; speedMul?: number }[];
  loot: { weapons: number; healing: number; ammo: number };
  events: { intervalSec: [number, number]; pool: string[]; maxIntensityToRoll: number };
  escape: { chargeSec: number; waves: number };
  boss: { type: 'alphaLion' | 'chief' | 'guardian'; guardsStone: 1 | 2 | 3 } | null;
  audio: { ambience: string; music: string };
}
