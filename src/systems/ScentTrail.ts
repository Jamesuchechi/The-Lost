import { distance } from '@/core/math';
import type { Vec2 } from '@/core/math';

export interface ScentNode {
  x: number;
  y: number;
  age: number; // 0 .. 30s
  strength: number; // 1.0 down to 0.0
}

export class ScentTrail {
  public nodes: ScentNode[] = [];
  private dropInterval = 0.5; // drop node every 0.5s
  private dropAccumulator = 0;
  private maxLifetime = 30.0; // 30s scent lifetime

  public update(dt: number, playerPos: Vec2, isMoving: boolean): void {
    // 1. Age and decay existing scent nodes
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i]!;
      node.age += dt;
      node.strength = Math.max(0, 1.0 - node.age / this.maxLifetime);

      if (node.age >= this.maxLifetime) {
        this.nodes.splice(i, 1);
      }
    }

    // 2. Drop new scent node if player is moving
    if (isMoving) {
      this.dropAccumulator += dt;
      if (this.dropAccumulator >= this.dropInterval) {
        this.dropAccumulator = 0;
        this.nodes.push({
          x: playerPos.x,
          y: playerPos.y,
          age: 0,
          strength: 1.0
        });
      }
    }
  }

  public getStrongestScentNearby(pos: Vec2, radius: number): ScentNode | null {
    let bestNode: ScentNode | null = null;
    let bestScore = -1;

    for (const node of this.nodes) {
      const d = distance(pos, { x: node.x, y: node.y });
      if (d <= radius) {
        // Prefer newer, stronger scent nodes that are closer
        const score = node.strength * (1.0 - d / radius);
        if (score > bestScore) {
          bestScore = score;
          bestNode = node;
        }
      }
    }
    return bestNode;
  }
}
