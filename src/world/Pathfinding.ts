import { TILE_SIZE } from '@/config/constants';
import { ObstacleGrid } from './ObstacleGrid';
import type { Vec2 } from '@/core/math';

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: PathNode;
}

export class Pathfinding {
  private grid: ObstacleGrid;

  constructor(grid: ObstacleGrid) {
    this.grid = grid;
  }

  public findPath(startX: number, startY: number, targetX: number, targetY: number): Vec2[] {
    // 1. Line-of-sight shortcut
    if (this.grid.hasLineOfSight(startX, startY, targetX, targetY)) {
      return [{ x: targetX, y: targetY }];
    }

    const startTileX = Math.floor(startX / TILE_SIZE);
    const startTileY = Math.floor(startY / TILE_SIZE);
    const targetTileX = Math.floor(targetX / TILE_SIZE);
    const targetTileY = Math.floor(targetY / TILE_SIZE);

    if (startTileX === targetTileX && startTileY === targetTileY) {
      return [{ x: targetX, y: targetY }];
    }

    const openList: PathNode[] = [];
    const closedSet = new Uint8Array(this.grid.width * this.grid.height);
    const gScore = new Float32Array(this.grid.width * this.grid.height).fill(Infinity);

    const startIndex = startTileY * this.grid.width + startTileX;
    const startNode: PathNode = {
      x: startTileX,
      y: startTileY,
      g: 0,
      h: this.heuristic(startTileX, startTileY, targetTileX, targetTileY),
      f: 0
    };
    startNode.f = startNode.h;
    gScore[startIndex] = 0;
    openList.push(startNode);

    const neighbors = [
      { dx: 0, dy: -1, cost: 1.0 },
      { dx: 0, dy: 1, cost: 1.0 },
      { dx: -1, dy: 0, cost: 1.0 },
      { dx: 1, dy: 0, cost: 1.0 },
      { dx: -1, dy: -1, cost: 1.414 },
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: 1, dy: 1, cost: 1.414 }
    ];

    let iterations = 0;
    const MAX_ITERATIONS = 400; // time budget limit

    while (openList.length > 0 && iterations++ < MAX_ITERATIONS) {
      // Pick node with lowest f
      let bestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i]!.f < openList[bestIdx]!.f) {
          bestIdx = i;
        }
      }
      const current = openList.splice(bestIdx, 1)[0]!;

      if (current.x === targetTileX && current.y === targetTileY) {
        return this.reconstructPath(current, targetX, targetY);
      }

      const currentIndex = current.y * this.grid.width + current.x;
      closedSet[currentIndex] = 1;

      for (const n of neighbors) {
        const nx = current.x + n.dx;
        const ny = current.y + n.dy;

        if (nx < 0 || nx >= this.grid.width || ny < 0 || ny >= this.grid.height) continue;
        if (this.grid.isBlocked(nx, ny)) continue;

        // Prevent diagonal corner cutting
        if (n.dx !== 0 && n.dy !== 0) {
          if (this.grid.isBlocked(current.x + n.dx, current.y) || this.grid.isBlocked(current.x, current.y + n.dy)) {
            continue;
          }
        }

        const nIndex = ny * this.grid.width + nx;
        if (closedSet[nIndex] === 1) continue;

        const tentativeG = current.g + n.cost * TILE_SIZE;
        if (tentativeG < (gScore[nIndex] ?? Infinity)) {
          gScore[nIndex] = tentativeG;
          const h = this.heuristic(nx, ny, targetTileX, targetTileY);
          const neighborNode: PathNode = {
            x: nx,
            y: ny,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current
          };
          openList.push(neighborNode);
        }
      }
    }

    // Fallback: direct waypoint
    return [{ x: targetX, y: targetY }];
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (dx + dy) * TILE_SIZE;
  }

  private reconstructPath(node: PathNode, targetX: number, targetY: number): Vec2[] {
    const waypoints: Vec2[] = [];
    let curr: PathNode | undefined = node;

    while (curr && curr.parent) {
      waypoints.unshift({
        x: (curr.x + 0.5) * TILE_SIZE,
        y: (curr.y + 0.5) * TILE_SIZE
      });
      curr = curr.parent;
    }

    if (waypoints.length > 0) {
      waypoints[waypoints.length - 1] = { x: targetX, y: targetY };
    }
    return waypoints;
  }
}
