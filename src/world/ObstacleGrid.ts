import { TILE_SIZE } from '@/config/constants';

export type TileType = 'grass' | 'dirt' | 'water' | 'tree' | 'rock' | 'path' | 'gate' | 'stoneAltar';

export class ObstacleGrid {
  public readonly width: number;
  public readonly height: number;
  public readonly tiles: Uint8Array;
  private readonly blockedBits: Uint8Array;

  // Tile type encoding
  public static readonly TYPE_GRASS = 0;
  public static readonly TYPE_DIRT = 1;
  public static readonly TYPE_WATER = 2;
  public static readonly TYPE_TREE = 3;
  public static readonly TYPE_ROCK = 4;
  public static readonly TYPE_PATH = 5;
  public static readonly TYPE_GATE = 6;
  public static readonly TYPE_ALTAR = 7;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const totalTiles = width * height;
    this.tiles = new Uint8Array(totalTiles);
    this.blockedBits = new Uint8Array(Math.ceil(totalTiles / 8));
  }

  public setTile(x: number, y: number, type: number, isBlocked: boolean): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const index = y * this.width + x;
    this.tiles[index] = type;

    const byteIndex = index >> 3;
    const bitMask = 1 << (index & 7);

    if (isBlocked) {
      this.blockedBits[byteIndex]! |= bitMask;
    } else {
      this.blockedBits[byteIndex]! &= ~bitMask;
    }
  }

  public getTile(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return ObstacleGrid.TYPE_TREE;
    }
    return this.tiles[y * this.width + x] ?? ObstacleGrid.TYPE_TREE;
  }

  public isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return true;
    }
    const index = y * this.width + x;
    const byteIndex = index >> 3;
    const bitMask = 1 << (index & 7);
    return ((this.blockedBits[byteIndex] ?? 0) & bitMask) !== 0;
  }

  public isBlockedWorld(worldX: number, worldY: number, radius = 0): boolean {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    if (radius <= 0) {
      return this.isBlocked(tileX, tileY);
    }

    const minTX = Math.floor((worldX - radius) / TILE_SIZE);
    const maxTX = Math.floor((worldX + radius) / TILE_SIZE);
    const minTY = Math.floor((worldY - radius) / TILE_SIZE);
    const maxTY = Math.floor((worldY + radius) / TILE_SIZE);

    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        if (this.isBlocked(tx, ty)) {
          // Precise circle-box distance check
          const nearestX = Math.max(tx * TILE_SIZE, Math.min(worldX, (tx + 1) * TILE_SIZE));
          const nearestY = Math.max(ty * TILE_SIZE, Math.min(worldY, (ty + 1) * TILE_SIZE));
          const dx = worldX - nearestX;
          const dy = worldY - nearestY;
          if (dx * dx + dy * dy < radius * radius) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // DDA Fast Line of Sight Raycast
  public hasLineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
    let t0x = Math.floor(x0 / TILE_SIZE);
    let t0y = Math.floor(y0 / TILE_SIZE);
    const t1x = Math.floor(x1 / TILE_SIZE);
    const t1y = Math.floor(y1 / TILE_SIZE);

    const dx = Math.abs(t1x - t0x);
    const dy = Math.abs(t1y - t0y);
    const sx = t0x < t1x ? 1 : -1;
    const sy = t0y < t1y ? 1 : -1;
    let err = dx - dy;

    while (t0x !== t1x || t0y !== t1y) {
      if (this.isBlocked(t0x, t0y)) {
        return false;
      }
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        t0x += sx;
      }
      if (e2 < dx) {
        err += dx;
        t0y += sy;
      }
    }

    return !this.isBlocked(t1x, t1y);
  }
}
