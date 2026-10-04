import { describe, it, expect } from 'vitest';
import {
  distance,
  distanceSq,
  clamp,
  lerp,
  angleBetween,
  normalizeAngle,
  angleDiff,
  isInCone
} from '@/core/math';

describe('Math utilities', () => {
  it('calculates distance correctly', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distanceSq({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });

  it('clamps and lerps correctly', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('calculates angles and cone inclusion', () => {
    const origin = { x: 0, y: 0 };
    const right = { x: 10, y: 0 };
    const behind = { x: -10, y: 0 };

    expect(angleBetween(origin, right)).toBeCloseTo(0);
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(angleDiff(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);

    // Facing right (angle 0) with a 90-degree FOV (PI / 2)
    const fov = Math.PI / 2;
    expect(isInCone(origin, 0, fov, right)).toBe(true);
    expect(isInCone(origin, 0, fov, behind)).toBe(false);
  });
});
