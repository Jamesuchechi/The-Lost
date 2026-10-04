export const SIMULATION_HZ = 60;
export const SIMULATION_STEP = 1 / SIMULATION_HZ;

export const TILE_SIZE = 32; // world-unit / grid cell scale
export const CHUNK_SIZE = 16; // 16x16 tiles per chunk

export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 720;

// Player Defaults (from product.md §6)
export const PLAYER_CONFIG = {
  healthMax: 100,
  staminaMax: 100,
  walkSpeed: 120, // units/sec
  crouchSpeed: 60,
  sprintSpeed: 210,
  dodgeSpeed: 300,
  dodgeDurationSec: 0.35,
  dodgeIFrameSec: 0.25,
  sprintStaminaCostPerSec: 18,
  dodgeStaminaCost: 25,
  lightAttackStaminaCost: 12,
  heavyAttackStaminaCost: 28,
  staminaRegenPerSec: 14,
  staminaRegenDelaySec: 1.0,
  staminaExhaustionDurationSec: 2.5,
  baseVisionRadius: 220, // units
  collisionRadius: 12
} as const;

// Noise Radii (product.md §4.3)
export const NOISE_RADII = {
  crouch: 40,
  walk: 140,
  sprint: 280,
  meleeHit: 320,
  bowShot: 200,
  takingDamage: 240,
  thrownStone: 260,
  breath: 180,
  campfire: 120
} as const;

// Surface Noise Multipliers
export const SURFACE_MULTIPLIERS = {
  dirt: 1.0,
  grass: 0.9,
  water: 1.4,
  rock: 1.3,
  snow: 0.8
} as const;
