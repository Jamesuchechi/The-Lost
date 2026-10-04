export interface Vec2 {
  x: number;
  y: number;
}

export function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angleBetween(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a < -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

export function angleDiff(a: number, b: number): number {
  return Math.abs(normalizeAngle(a - b));
}

export function isInCone(
  origin: Vec2,
  forwardAngle: number,
  fovAngle: number,
  target: Vec2
): boolean {
  const angleToTarget = angleBetween(origin, target);
  return angleDiff(forwardAngle, angleToTarget) <= fovAngle / 2;
}
