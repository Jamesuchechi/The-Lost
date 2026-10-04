export interface WeaponDef {
  id: string;
  name: string;
  kind: 'melee' | 'ranged';
  lightDamage: number;
  heavyDamage: number;
  range: number; // reach in units
  arcRad: number; // attack cone in radians
  lightCooldownSec: number;
  heavyCooldownSec: number;
  maxDurability: number;
}

export const WEAPON_DEFS: Record<string, WeaponDef> = {
  spear: {
    id: 'spear',
    name: 'Hunting Spear',
    kind: 'melee',
    lightDamage: 18,
    heavyDamage: 38,
    range: 48,
    arcRad: (75 * Math.PI) / 180,
    lightCooldownSec: 0.45,
    heavyCooldownSec: 0.9,
    maxDurability: 40
  },
  stick: {
    id: 'stick',
    name: 'Sharpened Branch',
    kind: 'melee',
    lightDamage: 10,
    heavyDamage: 22,
    range: 36,
    arcRad: (80 * Math.PI) / 180,
    lightCooldownSec: 0.4,
    heavyCooldownSec: 0.8,
    maxDurability: 15
  }
};
