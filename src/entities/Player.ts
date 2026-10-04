import * as THREE from 'three';
import { PLAYER_CONFIG } from '@/config/constants';
import { PALETTE } from '@/config/palette';
import { ObstacleGrid } from '@/world/ObstacleGrid';
import type { InputState } from '@/core/InputController';

export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public facingAngle = 0; // radians
  public isMoving = false;
  public isSprinting = false;
  public isCrouching = false;
  public radius = PLAYER_CONFIG.collisionRadius;

  // Visual sub-meshes for animation & realism
  private bodyGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private scarfMesh: THREE.Mesh;
  private backpackMesh: THREE.Mesh;
  private weaponMesh: THREE.Mesh;
  private walkBob = 0;

  constructor(startX: number, startZ: number) {
    this.position = new THREE.Vector3(startX, 0, startZ);
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Realistic PBR materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: PALETTE.jacket,
      roughness: 0.85,
      metalness: 0.1
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x242a26,
      roughness: 0.9,
      metalness: 0.05
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: PALETTE.skin,
      roughness: 0.6,
      metalness: 0.0
    });

    const scarfMat = new THREE.MeshStandardMaterial({
      color: PALETTE.scarf,
      roughness: 0.9
    });

    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x826442,
      roughness: 0.95
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.7
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xa0a8a4,
      metalness: 0.8,
      roughness: 0.3
    });

    // 1. Legs / Pants
    const legGeo = new THREE.CylinderGeometry(2.5, 2.5, 14, 8);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-4, 7, 0);
    leftLeg.castShadow = true;
    this.bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(4, 7, 0);
    rightLeg.castShadow = true;
    this.bodyGroup.add(rightLeg);

    // 2. Torso with Muted Green Jacket
    const torsoGeo = new THREE.BoxGeometry(14, 16, 10);
    const torsoMesh = new THREE.Mesh(torsoGeo, jacketMat);
    torsoMesh.position.set(0, 20, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.bodyGroup.add(torsoMesh);

    // 3. Red Scarf
    const scarfGeo = new THREE.TorusGeometry(5.5, 2.2, 8, 16);
    this.scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
    this.scarfMesh.rotation.x = Math.PI / 2;
    this.scarfMesh.position.set(0, 28.5, 0);
    this.scarfMesh.castShadow = true;
    this.bodyGroup.add(this.scarfMesh);

    // 4. Head with Hair
    const headGeo = new THREE.SphereGeometry(4.8, 12, 12);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 32, 0);
    this.headMesh.castShadow = true;
    this.bodyGroup.add(this.headMesh);

    const hairGeo = new THREE.SphereGeometry(5.1, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 32.5, 0);
    this.bodyGroup.add(hairMesh);

    // 5. Backpack with Bedroll
    const backpackGeo = new THREE.BoxGeometry(10, 12, 6);
    this.backpackMesh = new THREE.Mesh(backpackGeo, backpackMat);
    this.backpackMesh.position.set(0, 21, -6.5);
    this.backpackMesh.castShadow = true;
    this.bodyGroup.add(this.backpackMesh);

    const bedrollGeo = new THREE.CylinderGeometry(2.5, 2.5, 12, 8);
    const bedrollMesh = new THREE.Mesh(bedrollGeo, backpackMat);
    bedrollMesh.rotation.z = Math.PI / 2;
    bedrollMesh.position.set(0, 28, -7);
    bedrollMesh.castShadow = true;
    this.bodyGroup.add(bedrollMesh);

    // 6. Spear in Right Hand
    const staffGeo = new THREE.CylinderGeometry(0.8, 0.8, 38, 8);
    const staffMesh = new THREE.Mesh(staffGeo, woodMat);
    staffMesh.rotation.x = Math.PI / 2.5;
    staffMesh.position.set(9, 18, 5);
    staffMesh.castShadow = true;

    const tipGeo = new THREE.ConeGeometry(2, 6, 6);
    const tipMesh = new THREE.Mesh(tipGeo, metalMat);
    tipMesh.rotation.x = -Math.PI / 2;
    tipMesh.position.set(0, 19, 0);
    staffMesh.add(tipMesh);

    this.weaponMesh = staffMesh;
    this.bodyGroup.add(this.weaponMesh);
  }

  public update(
    dt: number,
    input: InputState,
    grid: ObstacleGrid,
    staminaSystem: { canSprint: () => boolean; isWinded: boolean }
  ): void {
    const wantsSprint = input.isSprinting && !input.isCrouching;
    this.isSprinting = wantsSprint && staminaSystem.canSprint();
    this.isCrouching = input.isCrouching;

    // Speed determination
    let currentSpeed: number = PLAYER_CONFIG.walkSpeed;
    if (this.isCrouching) {
      currentSpeed = PLAYER_CONFIG.crouchSpeed;
    } else if (this.isSprinting) {
      currentSpeed = PLAYER_CONFIG.sprintSpeed;
    } else if (staminaSystem.isWinded) {
      currentSpeed = PLAYER_CONFIG.walkSpeed * 0.75; // slowed while exhausted
    }

    // Velocity
    const vx = input.moveX * currentSpeed;
    const vz = input.moveY * currentSpeed;
    this.velocity.set(vx, 0, vz);

    const speedMag = Math.hypot(vx, vz);
    this.isMoving = speedMag > 0.1;

    // Move with wall-sliding collision against ObstacleGrid
    const nextX = this.position.x + vx * dt;
    const nextZ = this.position.z + vz * dt;

    if (!grid.isBlockedWorld(nextX, this.position.z, this.radius)) {
      this.position.x = nextX;
    }

    if (!grid.isBlockedWorld(this.position.x, nextZ, this.radius)) {
      this.position.z = nextZ;
    }

    this.mesh.position.copy(this.position);

    // Aim / Face towards mouse cursor in world coordinates
    const dx = input.mouseWorld.x - this.position.x;
    const dz = input.mouseWorld.z - this.position.z;
    if (Math.hypot(dx, dz) > 5) {
      this.facingAngle = Math.atan2(dx, dz);
      this.bodyGroup.rotation.y = this.facingAngle;
    }

    // Walking animation bob
    if (this.isMoving) {
      this.walkBob += dt * (this.isSprinting ? 16 : 10);
      this.bodyGroup.position.y = Math.abs(Math.sin(this.walkBob)) * 2.5;
      this.weaponMesh.rotation.z = Math.sin(this.walkBob) * 0.15;
    } else {
      this.walkBob = 0;
      this.bodyGroup.position.y = 0;
      this.weaponMesh.rotation.z = 0;
    }
  }
}
