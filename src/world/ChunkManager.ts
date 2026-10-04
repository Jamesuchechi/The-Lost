import * as THREE from 'three';
import { TILE_SIZE, CHUNK_SIZE } from '@/config/constants';
import { PALETTE } from '@/config/palette';
import { ObstacleGrid } from './ObstacleGrid';
import type { LevelData } from './WorldGenerator';

interface ActiveChunk {
  key: string;
  cx: number;
  cy: number;
  group: THREE.Group;
}

export class ChunkManager {
  private scene: THREE.Scene;
  private levelData: LevelData;
  private activeChunks = new Map<string, ActiveChunk>();
  private loadRadius = 3; // radius in chunks around player

  // Shared Geometries & PBR Materials for optimal instancing/performance
  private materials = {
    grass: new THREE.MeshStandardMaterial({
      color: PALETTE.ground,
      roughness: 0.9,
      metalness: 0.05
    }),
    dirt: new THREE.MeshStandardMaterial({
      color: 0x473c2b,
      roughness: 0.95
    }),
    water: new THREE.MeshStandardMaterial({
      color: 0x162c33,
      roughness: 0.2,
      metalness: 0.1
    }),
    path: new THREE.MeshStandardMaterial({
      color: 0x3d352b,
      roughness: 0.9
    }),
    woodTrunk: new THREE.MeshStandardMaterial({
      color: 0x3b2818,
      roughness: 0.9
    }),
    foliage: new THREE.MeshStandardMaterial({
      color: PALETTE.canopy,
      roughness: 0.8
    }),
    rock: new THREE.MeshStandardMaterial({
      color: 0x4a4d4b,
      roughness: 0.85
    }),
    stoneAltar: new THREE.MeshStandardMaterial({
      color: 0x2e3330,
      roughness: 0.6
    }),
    clueGold: new THREE.MeshStandardMaterial({
      color: PALETTE.clueGold,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x443311
    })
  };

  constructor(scene: THREE.Scene, levelData: LevelData) {
    this.scene = scene;
    this.levelData = levelData;
  }

  public update(playerX: number, playerZ: number): void {
    const chunkWorldSize = CHUNK_SIZE * TILE_SIZE;
    const currentChunkX = Math.floor(playerX / chunkWorldSize);
    const currentChunkY = Math.floor(playerZ / chunkWorldSize);

    const neededKeys = new Set<string>();

    for (let dy = -this.loadRadius; dy <= this.loadRadius; dy++) {
      for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
        const cx = currentChunkX + dx;
        const cy = currentChunkY + dy;
        const maxChunkX = Math.ceil(this.levelData.width / CHUNK_SIZE);
        const maxChunkY = Math.ceil(this.levelData.height / CHUNK_SIZE);

        if (cx >= 0 && cx < maxChunkX && cy >= 0 && cy < maxChunkY) {
          const key = `${cx}_${cy}`;
          neededKeys.add(key);

          if (!this.activeChunks.has(key)) {
            const chunk = this.createChunk(cx, cy, key);
            this.activeChunks.set(key, chunk);
            this.scene.add(chunk.group);
          }
        }
      }
    }

    // Unload chunks out of range
    for (const [key, chunk] of this.activeChunks.entries()) {
      if (!neededKeys.has(key)) {
        this.scene.remove(chunk.group);
        this.disposeChunk(chunk);
        this.activeChunks.delete(key);
      }
    }
  }

  private createChunk(cx: number, cy: number, key: string): ActiveChunk {
    const group = new THREE.Group();
    const startTileX = cx * CHUNK_SIZE;
    const startTileY = cy * CHUNK_SIZE;
    const chunkWorldSize = CHUNK_SIZE * TILE_SIZE;

    // 1. Terrain Ground Mesh for Chunk
    const groundGeo = new THREE.PlaneGeometry(
      chunkWorldSize,
      chunkWorldSize,
      CHUNK_SIZE,
      CHUNK_SIZE
    );
    groundGeo.rotateX(-Math.PI / 2);

    const groundMesh = new THREE.Mesh(groundGeo, this.materials.grass);
    groundMesh.position.set(
      (cx + 0.5) * chunkWorldSize,
      0,
      (cy + 0.5) * chunkWorldSize
    );
    groundMesh.receiveShadow = true;
    group.add(groundMesh);

    // 2. Populate 3D Obstacles & Objects
    for (let ty = 0; ty < CHUNK_SIZE; ty++) {
      for (let tx = 0; tx < CHUNK_SIZE; tx++) {
        const mapTileX = startTileX + tx;
        const mapTileY = startTileY + ty;

        if (mapTileX >= this.levelData.width || mapTileY >= this.levelData.height) continue;

        const tileType = this.levelData.grid.getTile(mapTileX, mapTileY);
        const worldX = (mapTileX + 0.5) * TILE_SIZE;
        const worldZ = (mapTileY + 0.5) * TILE_SIZE;

        if (tileType === ObstacleGrid.TYPE_TREE) {
          const treeGroup = this.createTreeMesh(worldX, worldZ);
          group.add(treeGroup);
        } else if (tileType === ObstacleGrid.TYPE_ROCK) {
          const rockMesh = this.createRockMesh(worldX, worldZ);
          group.add(rockMesh);
        } else if (tileType === ObstacleGrid.TYPE_ALTAR) {
          const altarMesh = this.createAltarMesh(worldX, worldZ);
          group.add(altarMesh);
        } else if (tileType === ObstacleGrid.TYPE_GATE) {
          const gateMesh = this.createGateMesh(worldX, worldZ);
          group.add(gateMesh);
        }
      }
    }

    return { key, cx, cy, group };
  }

  private createTreeMesh(x: number, z: number): THREE.Group {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(3, 4.5, 36, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.woodTrunk);
    trunk.position.y = 18;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Realistic Foliage Tiers (Layered pine/pine-cone canopies)
    const tiers = [
      { radius: 24, height: 26, y: 36 },
      { radius: 18, height: 22, y: 52 },
      { radius: 12, height: 18, y: 66 }
    ];

    for (const tier of tiers) {
      const foliageGeo = new THREE.ConeGeometry(tier.radius, tier.height, 8);
      const foliage = new THREE.Mesh(foliageGeo, this.materials.foliage);
      foliage.position.y = tier.y;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      tree.add(foliage);
    }

    return tree;
  }

  private createRockMesh(x: number, z: number): THREE.Mesh {
    const rockGeo = new THREE.DodecahedronGeometry(12, 1);
    const rock = new THREE.Mesh(rockGeo, this.materials.rock);
    rock.position.set(x, 7, z);
    rock.scale.set(1.1, 0.7, 0.9);
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  private createAltarMesh(x: number, z: number): THREE.Group {
    const altar = new THREE.Group();
    altar.position.set(x, 0, z);

    // Pedestal
    const baseGeo = new THREE.BoxGeometry(24, 10, 24);
    const base = new THREE.Mesh(baseGeo, this.materials.stoneAltar);
    base.position.y = 5;
    base.castShadow = true;
    base.receiveShadow = true;
    altar.add(base);

    // Glowing Ancient Stone
    const stoneGeo = new THREE.OctahedronGeometry(6, 0);
    const stone = new THREE.Mesh(stoneGeo, this.materials.clueGold);
    stone.position.y = 15;
    stone.castShadow = true;
    altar.add(stone);

    return altar;
  }

  private createGateMesh(x: number, z: number): THREE.Group {
    const gate = new THREE.Group();
    gate.position.set(x, 0, z);

    const pillarGeo = new THREE.BoxGeometry(8, 48, 8);
    const p1 = new THREE.Mesh(pillarGeo, this.materials.stoneAltar);
    p1.position.set(-20, 24, 0);
    p1.castShadow = true;
    gate.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, this.materials.stoneAltar);
    p2.position.set(20, 24, 0);
    p2.castShadow = true;
    gate.add(p2);

    const beamGeo = new THREE.BoxGeometry(54, 8, 8);
    const beam = new THREE.Mesh(beamGeo, this.materials.stoneAltar);
    beam.position.set(0, 48, 0);
    beam.castShadow = true;
    gate.add(beam);

    return gate;
  }

  private disposeChunk(chunk: ActiveChunk): void {
    chunk.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }

  public getActiveChunkCount(): number {
    return this.activeChunks.size;
  }
}
