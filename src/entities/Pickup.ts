import * as THREE from 'three';
import { distance } from '@/core/math';

export type PickupType = 'bandage' | 'stick' | 'meat';

export class Pickup {
  public id: string;
  public type: PickupType;
  public position: THREE.Vector3;
  public mesh: THREE.Group;
  public isCollected = false;
  private bob = 0;

  constructor(id: string, type: PickupType, startX: number, startZ: number) {
    this.id = id;
    this.type = type;
    this.position = new THREE.Vector3(startX, 0, startZ);

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    if (type === 'bandage') {
      const geo = new THREE.CylinderGeometry(3, 3, 4, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.8,
        emissive: 0x222222
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 4;
      mesh.castShadow = true;
      this.mesh.add(mesh);
    } else if (type === 'stick') {
      const geo = new THREE.CylinderGeometry(0.8, 0.8, 28, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6b4f2c,
        roughness: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 3;
      mesh.rotation.z = Math.PI / 3;
      mesh.castShadow = true;
      this.mesh.add(mesh);
    }
  }

  public update(dt: number): void {
    if (this.isCollected) return;
    this.bob += dt * 3;
    this.mesh.position.y = Math.sin(this.bob) * 1.5;
    this.mesh.rotation.y += dt * 1.2;
  }

  public canInteract(playerPos: { x: number; y: number }): boolean {
    return (
      !this.isCollected &&
      distance(playerPos, { x: this.position.x, y: this.position.z }) <= 40
    );
  }

  public destroy(): void {
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }
}
