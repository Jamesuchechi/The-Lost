import * as THREE from 'three';
import type { Wolf } from '@/entities/enemies/Wolf';
import type { ScentTrail } from '@/systems/ScentTrail';

export class SensoryDebugVisualizer {
  private scene: THREE.Scene;
  private debugGroup: THREE.Group;
  public isVisible = false;

  private coneMaterial: THREE.MeshBasicMaterial;
  private scentMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, defaultVisible = false) {
    this.scene = scene;
    this.isVisible = defaultVisible;

    this.debugGroup = new THREE.Group();
    this.debugGroup.visible = this.isVisible;
    this.scene.add(this.debugGroup);

    this.coneMaterial = new THREE.MeshBasicMaterial({
      color: 0xffae4d,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });

    this.scentMaterial = new THREE.MeshBasicMaterial({
      color: 0x9f7aea,
      transparent: true,
      opacity: 0.6
    });
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.debugGroup.visible = this.isVisible;
  }

  public update(wolves: Wolf[], scentTrail: ScentTrail): void {
    if (!this.isVisible) return;

    // Clear old debug meshes
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children[0]!;
      this.debugGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    // 1. Render Scent Trail Nodes
    for (const node of scentTrail.nodes) {
      const geo = new THREE.CircleGeometry(3 * node.strength, 8);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, this.scentMaterial);
      mesh.position.set(node.x, 0.5, node.y);
      this.debugGroup.add(mesh);
    }

    // 2. Render Wolf Vision Cones
    for (const wolf of wolves) {
      if (!wolf.mesh.visible) continue;

      const fov = wolf.def.visionFovRad;
      const radius = wolf.def.visionRadius;
      const geo = new THREE.RingGeometry(0.1, radius, 12, 1, -fov / 2, fov);
      geo.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geo, this.coneMaterial);
      mesh.position.set(wolf.position.x, 1.5, wolf.position.z);
      mesh.rotation.y = wolf.facingAngle - Math.PI / 2;
      this.debugGroup.add(mesh);
    }
  }

  public destroy(): void {
    this.scene.remove(this.debugGroup);
  }
}
