export interface NoiseEvent {
  x: number;
  y: number;
  radius: number;
  sourceId: string;
  kind: 'step' | 'attack' | 'shot' | 'hurt' | 'distraction' | 'breath' | 'fire';
}

export interface DamageEvent {
  sourceId: string;
  targetId: string;
  amount: number;
  knockback: number;
  kind: 'melee' | 'ranged' | 'trap' | 'env';
}

export type GameEvents = {
  noise: NoiseEvent;
  damage: DamageEvent;
  death: { id: string; faction: 'player' | 'enemy' };
  stoneCollected: { index: number; total: number };
  exitUnlocked: undefined;
  directorEvent: { id: string; narratorLine: string; durationSec: number };
  awarenessChanged: { enemyId: string; level: number; state: string };
  levelComplete: { levelId: number; timeSec: number };
};

export type BiomeId = 'forest' | 'swamp' | 'savanna' | 'snow' | 'ruins';

export type EnemyType = 'wolf' | 'hunter' | 'lion';
