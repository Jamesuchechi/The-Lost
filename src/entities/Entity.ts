import * as THREE from 'three';

export interface Health {
  current: number;
  max: number;
  isDead: boolean;
}

export abstract class Entity {
  public id: string;
  public faction: 'player' | 'enemy' | 'neutral';
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public facingAngle = 0; // in radians
  public radius: number;
  public health: Health;
  public mesh: THREE.Group;

  constructor(
    id: string,
    faction: 'player' | 'enemy' | 'neutral',
    startX: number,
    startZ: number,
    maxHealth: number,
    radius: number
  ) {
    this.id = id;
    this.faction = faction;
    this.position = new THREE.Vector3(startX, 0, startZ);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = radius;
    this.health = {
      current: maxHealth,
      max: maxHealth,
      isDead: false
    };
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
  }

  public takeDamage(amount: number): boolean {
    if (this.health.isDead) return false;
    this.health.current = Math.max(0, this.health.current - amount);
    if (this.health.current <= 0) {
      this.health.isDead = true;
    }
    return true;
  }

  public abstract update(dt: number, ...args: unknown[]): void;
}
