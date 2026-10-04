import type { LevelConfig } from './types';

export const level1: LevelConfig = {
  id: 1,
  name: 'The Whispering Woods',
  biome: 'forest',
  mapSize: { w: 256, h: 256 },
  fog: {
    visionRadius: 220,
    density: 0.0035,
    floor: 0.15
  },
  time: {
    startHour: 18,
    dayLengthSec: 360
  },
  stones: {
    count: 3,
    minDistFromSpawn: 1200,
    minDistBetween: 800,
    decoys: 1,
    guards: ['hidden', 'guarded', 'trapped']
  },
  clues: {
    perStone: 3,
    vagueness: 0.2
  },
  enemies: [
    {
      type: 'wolf',
      count: 8,
      aggression: 0.4
    }
  ],
  loot: {
    weapons: 4,
    healing: 8,
    ammo: 6
  },
  events: {
    intervalSec: [60, 90],
    pool: ['fogSurge', 'packRelease'],
    maxIntensityToRoll: 0.7
  },
  escape: {
    chargeSec: 60,
    waves: 2
  },
  boss: null,
  audio: {
    ambience: 'forest_wind',
    music: 'mist_drone'
  }
};
