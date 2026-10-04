import * as THREE from 'three';
import { NOISE_RADII, SURFACE_MULTIPLIERS } from '@/config/constants';
import type { EventBus } from '@/core/EventBus';
import type { GameEvents, NoiseEvent } from '@/core/types';
import { ObstacleGrid } from '@/world/ObstacleGrid';

interface Ripple {
  mesh: THREE.Mesh;
  maxRadius: number;
  currentRadius: number;
  duration: number;
  age: number;
}

export class NoiseSystem {
  private eventBus: EventBus<GameEvents>;
  private scene: THREE.Scene;
  private ripples: Ripple[] = [];
  private stepAccumulator = 0;
  private ringMaterial: THREE.MeshBasicMaterial;
  public showDebugRings = true;

  constructor(eventBus: EventBus<GameEvents>, scene: THREE.Scene) {
    this.eventBus = eventBus;
    this.scene = scene;

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x68d391,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    this.eventBus.on('noise', this.onNoiseEvent);
  }

  private onNoiseEvent = (event: NoiseEvent): void => {
    if (!this.showDebugRings) return;
    this.spawnRipple(event.x, event.y, event.radius);
  };

  public emitMovementNoise(
    dt: number,
    playerPos: { x: number; y: number },
    isMoving: boolean,
    isSprinting: boolean,
    isCrouching: boolean,
    grid: ObstacleGrid
  ): void {
    if (!isMoving) {
      this.stepAccumulator = 0;
      return;
    }

    // Step frequency
    const stepInterval = isSprinting ? 0.3 : isCrouching ? 0.65 : 0.45;
    this.stepAccumulator += dt;

    if (this.stepAccumulator >= stepInterval) {
      this.stepAccumulator = 0;

      // Base radius
      let baseRadius: number = NOISE_RADII.walk;
      if (isCrouching) baseRadius = NOISE_RADII.crouch;
      else if (isSprinting) baseRadius = NOISE_RADII.sprint;

      // Surface tile multiplier
      const tileType = grid.getTile(
        Math.floor(playerPos.x / 32),
        Math.floor(playerPos.y / 32)
      );

      let surfaceMultiplier: number = SURFACE_MULTIPLIERS.dirt;
      if (tileType === ObstacleGrid.TYPE_GRASS) surfaceMultiplier = SURFACE_MULTIPLIERS.grass;
      else if (tileType === ObstacleGrid.TYPE_WATER) surfaceMultiplier = SURFACE_MULTIPLIERS.water;
      else if (tileType === ObstacleGrid.TYPE_ROCK) surfaceMultiplier = SURFACE_MULTIPLIERS.rock;

      const finalRadius = baseRadius * surfaceMultiplier;

      this.eventBus.emit('noise', {
        x: playerPos.x,
        y: playerPos.y,
        radius: finalRadius,
        sourceId: 'player',
        kind: 'step'
      });
    }
  }

  private spawnRipple(x: number, z: number, radius: number): void {
    const geo = new THREE.RingGeometry(0.5, 2.5, 24);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, this.ringMaterial.clone());
    mesh.position.set(x, 1.0, z);
    this.scene.add(mesh);

    this.ripples.push({
      mesh,
      maxRadius: radius,
      currentRadius: 2,
      duration: 0.6,
      age: 0
    });
  }

  public update(dt: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i]!;
      r.age += dt;
      const progress = r.age / r.duration;

      if (progress >= 1.0) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        this.ripples.splice(i, 1);
      } else {
        const scale = (r.maxRadius / 2) * progress;
        r.mesh.scale.set(scale, 1, scale);
        const mat = r.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4 * (1.0 - progress);
      }
    }
  }

  public destroy(): void {
    for (const r of this.ripples) {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    }
    this.ripples = [];
  }
}
