import * as THREE from 'three';
import { lerp } from './math';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private currentTarget = new THREE.Vector3();
  private height = 450;
  private zOffset = 260;
  private lookAheadFactor = 0.18; // mouse look-ahead
  private followSmoothing = 0.08;

  constructor(camera: THREE.PerspectiveCamera, initialX: number, initialZ: number) {
    this.camera = camera;
    this.currentTarget.set(initialX, 0, initialZ);
    this.camera.position.set(initialX, this.height, initialZ + this.zOffset);
    this.camera.lookAt(initialX, 0, initialZ);
  }

  public update(playerPos: THREE.Vector3, mouseWorld: THREE.Vector3, _dt: number): void {
    // 1. Calculate desired target with mouse look-ahead
    const offsetX = (mouseWorld.x - playerPos.x) * this.lookAheadFactor;
    const offsetZ = (mouseWorld.z - playerPos.z) * this.lookAheadFactor;

    const targetX = playerPos.x + offsetX;
    const targetZ = playerPos.z + offsetZ;

    // 2. Smoothly follow target
    this.currentTarget.x = lerp(this.currentTarget.x, targetX, this.followSmoothing);
    this.currentTarget.z = lerp(this.currentTarget.z, targetZ, this.followSmoothing);

    this.camera.position.set(
      this.currentTarget.x,
      this.height,
      this.currentTarget.z + this.zOffset
    );
    this.camera.lookAt(this.currentTarget.x, 0, this.currentTarget.z);
  }
}
