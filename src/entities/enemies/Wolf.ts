import * as THREE from 'three';
import { Entity } from '../Entity';
import { ENEMY_DEFS } from '@/config/enemies';
import { PALETTE } from '@/config/palette';
import { StateMachine } from '@/ai/StateMachine';
import type { PerceptionSystem, EnemyPerceptionState } from '@/systems/PerceptionSystem';
import type { Pathfinding } from '@/world/Pathfinding';
import type { Vec2 } from '@/core/math';
import { distance } from '@/core/math';

export type WolfState = 'Patrol' | 'Investigate' | 'Chase' | 'Search';

export class Wolf extends Entity {
  public def = ENEMY_DEFS.wolf;
  public stateMachine: StateMachine<WolfState>;
  public perception: EnemyPerceptionState;
  private pathfinder: Pathfinding;
  private waypoints: Vec2[] = [];
  private currentWaypointIdx = 0;

  // 3D Visual Sub-meshes
  private bodyMesh: THREE.Mesh;
  private legGroup: THREE.Group;
  private headGroup: THREE.Group;
  private tailMesh: THREE.Mesh;
  private markerSprite: THREE.Sprite;
  private markerCanvas: HTMLCanvasElement;
  private markerCtx: CanvasRenderingContext2D;
  private markerTexture: THREE.CanvasTexture;

  private runBob = 0;
  private searchTimer = 0;
  private patrolHome: Vec2;

  constructor(id: string, startX: number, startZ: number, pathfinder: Pathfinding) {
    super(id, 'enemy', startX, startZ, ENEMY_DEFS.wolf.health, ENEMY_DEFS.wolf.collisionRadius);
    this.pathfinder = pathfinder;
    this.patrolHome = { x: startX, y: startZ };

    this.perception = {
      awareness: 0,
      lastKnownPlayerPos: null,
      hasVisualContact: false,
      alertLevel: 'unaware'
    };

    // 1. Build 3D Wolf Model
    const wolfMat = new THREE.MeshStandardMaterial({
      color: PALETTE.wolfFur,
      roughness: 0.85,
      metalness: 0.05
    });

    const darkFurMat = new THREE.MeshStandardMaterial({
      color: 0x4a4c4d,
      roughness: 0.9
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xffae4d
    });

    // Torso & Back Stripe
    const torsoGeo = new THREE.BoxGeometry(12, 14, 28);
    this.bodyMesh = new THREE.Mesh(torsoGeo, wolfMat);
    this.bodyMesh.position.y = 15;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.mesh.add(this.bodyMesh);

    const stripeGeo = new THREE.BoxGeometry(6, 2, 26);
    const stripeMesh = new THREE.Mesh(stripeGeo, darkFurMat);
    stripeMesh.position.y = 7.5;
    this.bodyMesh.add(stripeMesh);

    // Legs
    this.legGroup = new THREE.Group();
    const legGeo = new THREE.CylinderGeometry(1.8, 1.4, 14, 6);
    const legPositions = [
      [-4.5, 7, 8],
      [4.5, 7, 8],
      [-4.5, 7, -8],
      [4.5, 7, -8]
    ];
    for (const [lx, ly, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeo, wolfMat);
      leg.position.set(lx!, ly!, lz!);
      leg.castShadow = true;
      this.legGroup.add(leg);
    }
    this.mesh.add(this.legGroup);

    // Head, Snout, Ears & Amber Eyes
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 19, 14);

    const headGeo = new THREE.BoxGeometry(9, 9, 10);
    const headMesh = new THREE.Mesh(headGeo, wolfMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    const snoutGeo = new THREE.BoxGeometry(5, 5, 8);
    const snoutMesh = new THREE.Mesh(snoutGeo, darkFurMat);
    snoutMesh.position.set(0, -1, 7);
    snoutMesh.castShadow = true;
    this.headGroup.add(snoutMesh);

    const earGeo = new THREE.ConeGeometry(2.5, 6, 4);
    const leftEar = new THREE.Mesh(earGeo, wolfMat);
    leftEar.position.set(-3.2, 6, -1);
    leftEar.castShadow = true;
    this.headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, wolfMat);
    rightEar.position.set(3.2, 6, -1);
    rightEar.castShadow = true;
    this.headGroup.add(rightEar);

    const eyeGeo = new THREE.SphereGeometry(1.0, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-2.5, 1.5, 5);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(2.5, 1.5, 5);
    this.headGroup.add(rightEye);

    this.mesh.add(this.headGroup);

    // Bushy Tail
    const tailGeo = new THREE.CylinderGeometry(2, 1, 16, 6);
    this.tailMesh = new THREE.Mesh(tailGeo, darkFurMat);
    this.tailMesh.position.set(0, 15, -16);
    this.tailMesh.rotation.x = -Math.PI / 4;
    this.tailMesh.castShadow = true;
    this.mesh.add(this.tailMesh);

    // 2. Floating Awareness Marker Canvas Sprite
    this.markerCanvas = document.createElement('canvas');
    this.markerCanvas.width = 128;
    this.markerCanvas.height = 128;
    const ctx = this.markerCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unsupported');
    this.markerCtx = ctx;

    this.markerTexture = new THREE.CanvasTexture(this.markerCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.markerTexture,
      transparent: true,
      depthTest: false
    });
    this.markerSprite = new THREE.Sprite(spriteMat);
    this.markerSprite.position.set(0, 38, 0);
    this.markerSprite.scale.set(16, 16, 1);
    this.mesh.add(this.markerSprite);

    // 3. Setup State Machine
    this.stateMachine = new StateMachine<WolfState>('Patrol');
    this.setupStateMachine();
  }

  private setupStateMachine(): void {
    this.stateMachine
      .registerState({
        name: 'Patrol',
        onEnter: () => {
          this.pickNewPatrolPoint();
        },
        update: (dt) => {
          this.moveAlongWaypoints(this.def.walkSpeed, dt);
          if (this.waypoints.length === 0) {
            this.pickNewPatrolPoint();
          }
          if (this.perception.alertLevel === 'alert') {
            this.stateMachine.transitionTo('Chase');
          } else if (this.perception.alertLevel === 'investigate') {
            this.stateMachine.transitionTo('Investigate');
          }
        }
      })
      .registerState({
        name: 'Investigate',
        onEnter: () => {
          if (this.perception.lastKnownPlayerPos) {
            this.waypoints = this.pathfinder.findPath(
              this.position.x,
              this.position.z,
              this.perception.lastKnownPlayerPos.x,
              this.perception.lastKnownPlayerPos.y
            );
            this.currentWaypointIdx = 0;
          }
        },
        update: (dt) => {
          this.moveAlongWaypoints(this.def.walkSpeed * 1.2, dt);
          if (this.perception.alertLevel === 'alert') {
            this.stateMachine.transitionTo('Chase');
          } else if (this.perception.alertLevel === 'unaware') {
            this.stateMachine.transitionTo('Patrol');
          }
        }
      })
      .registerState({
        name: 'Chase',
        update: (dt) => {
          if (this.perception.lastKnownPlayerPos) {
            this.waypoints = this.pathfinder.findPath(
              this.position.x,
              this.position.z,
              this.perception.lastKnownPlayerPos.x,
              this.perception.lastKnownPlayerPos.y
            );
            this.currentWaypointIdx = 0;
          }
          this.moveAlongWaypoints(this.def.runSpeed, dt);

          if (!this.perception.hasVisualContact && this.perception.awareness < 0.6) {
            this.stateMachine.transitionTo('Search');
          }
        }
      })
      .registerState({
        name: 'Search',
        onEnter: () => {
          this.searchTimer = 4.0;
        },
        update: (dt) => {
          this.searchTimer -= dt;
          this.facingAngle += dt * 2.0; // spin/sniff around
          this.mesh.rotation.y = this.facingAngle;

          if (this.perception.alertLevel === 'alert') {
            this.stateMachine.transitionTo('Chase');
          } else if (this.searchTimer <= 0 || this.perception.alertLevel === 'unaware') {
            this.stateMachine.transitionTo('Patrol');
          }
        }
      });
  }

  private pickNewPatrolPoint(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 160;
    const targetX = this.patrolHome.x + Math.cos(angle) * dist;
    const targetZ = this.patrolHome.y + Math.sin(angle) * dist;

    this.waypoints = this.pathfinder.findPath(
      this.position.x,
      this.position.z,
      targetX,
      targetZ
    );
    this.currentWaypointIdx = 0;
  }

  private moveAlongWaypoints(speed: number, dt: number): void {
    if (this.currentWaypointIdx >= this.waypoints.length) return;

    const target = this.waypoints[this.currentWaypointIdx]!;
    const dx = target.x - this.position.x;
    const dz = target.y - this.position.z;
    const distToTarget = Math.hypot(dx, dz);

    if (distToTarget <= 8) {
      this.currentWaypointIdx++;
      return;
    }

    const moveDist = Math.min(distToTarget, speed * dt);
    const dirX = dx / distToTarget;
    const dirZ = dz / distToTarget;

    this.position.x += dirX * moveDist;
    this.position.z += dirZ * moveDist;
    this.mesh.position.copy(this.position);

    this.facingAngle = Math.atan2(dirX, dirZ);
    this.mesh.rotation.y = this.facingAngle;

    // Running animation bob
    this.runBob += dt * 12;
    this.bodyMesh.position.y = 15 + Math.abs(Math.sin(this.runBob)) * 2;
    this.tailMesh.rotation.z = Math.sin(this.runBob) * 0.2;
  }

  public update(
    dt: number,
    playerPos: Vec2,
    perceptionSystem: PerceptionSystem,
    playerVisionRadius: number
  ): void {
    // 1. Evaluate Senses (Sight, Hearing, Scent)
    perceptionSystem.evaluateEnemy(
      dt,
      { x: this.position.x, y: this.position.z },
      this.facingAngle,
      this.def,
      playerPos,
      this.perception
    );

    // 2. Update AI State Machine
    this.stateMachine.update(dt);

    // 3. Update Floating Awareness Marker
    this.updateMarker();

    // 4. Live Vision Culling: Hide if outside player live vision radius
    const distToPlayer = distance({ x: this.position.x, y: this.position.z }, playerPos);
    this.mesh.visible = distToPlayer <= playerVisionRadius;
  }

  private updateMarker(): void {
    this.markerCtx.clearRect(0, 0, 128, 128);

    if (this.perception.awareness >= 0.25) {
      const isAlert = this.perception.awareness >= 0.6;
      this.markerCtx.fillStyle = isAlert ? '#e0584a' : '#ffae4d';
      this.markerCtx.font = 'bold 64px monospace';
      this.markerCtx.textAlign = 'center';
      this.markerCtx.textBaseline = 'middle';
      this.markerCtx.fillText(isAlert ? '!' : '?', 64, 50);

      // Mini Awareness Bar
      this.markerCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.markerCtx.fillRect(24, 95, 80, 12);
      this.markerCtx.fillStyle = isAlert ? '#e0584a' : '#ffae4d';
      this.markerCtx.fillRect(26, 97, 76 * this.perception.awareness, 8);

      this.markerSprite.visible = true;
    } else {
      this.markerSprite.visible = false;
    }

    this.markerTexture.needsUpdate = true;
  }

  public destroy(): void {
    this.markerTexture.dispose();
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }
}
