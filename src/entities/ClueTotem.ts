import * as THREE from 'three';
import { distance, angleBetween } from '@/core/math';
import { PALETTE } from '@/config/palette';

export class ClueTotem {
  public position: THREE.Vector3;
  public targetStonePos: { x: number; y: number };
  public mesh: THREE.Group;
  private glyphMesh: THREE.Mesh;

  constructor(startX: number, startZ: number, targetStoneX: number, targetStoneZ: number) {
    this.position = new THREE.Vector3(startX, 0, startZ);
    this.targetStonePos = { x: targetStoneX, y: targetStoneZ };

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Carved Wood Totem Pole
    const poleGeo = new THREE.CylinderGeometry(2.5, 3.5, 28, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.95
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 14;
    pole.castShadow = true;
    pole.receiveShadow = true;
    this.mesh.add(pole);

    // Glowing Arrow Runic Pointer pointing towards target stone
    const arrowGeo = new THREE.ConeGeometry(3, 8, 4);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: PALETTE.clueGold
    });
    this.glyphMesh = new THREE.Mesh(arrowGeo, arrowMat);
    this.glyphMesh.position.y = 28;
    this.glyphMesh.rotation.x = Math.PI / 2;

    const angleToStone = angleBetween(
      { x: startX, y: startZ },
      { x: targetStoneX, y: targetStoneZ }
    );
    this.glyphMesh.rotation.z = -angleToStone;
    this.mesh.add(this.glyphMesh);
  }

  public getHintText(playerPos: { x: number; y: number }): string | null {
    const dist = distance(playerPos, { x: this.position.x, y: this.position.z });
    if (dist > 70) return null;

    const dx = this.targetStonePos.x - playerPos.x;
    const dz = this.targetStonePos.y - playerPos.y;
    let dirName = 'north';
    if (dz > 0 && Math.abs(dx) < dz * 0.5) dirName = 'south';
    else if (dz < 0 && Math.abs(dx) < -dz * 0.5) dirName = 'north';
    else if (dx > 0 && Math.abs(dz) < dx * 0.5) dirName = 'east';
    else if (dx < 0 && Math.abs(dz) < -dx * 0.5) dirName = 'west';
    else if (dx > 0 && dz < 0) dirName = 'northeast';
    else if (dx < 0 && dz < 0) dirName = 'northwest';
    else if (dx > 0 && dz > 0) dirName = 'southeast';
    else if (dx < 0 && dz > 0) dirName = 'southwest';

    return `ANCIENT TOTEM: A carved glyph points ${dirName} (${Math.round(Math.hypot(dx, dz))}m)`;
  }

  public destroy(): void {
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }
}
