import * as THREE from 'three';
import { TILE_SIZE } from '@/config/constants';
import { PALETTE } from '@/config/palette';

export class FogRenderer {
  public mesh: THREE.Mesh;
  private exploredCanvas: HTMLCanvasElement;
  private exploredCtx: CanvasRenderingContext2D;
  private exploredTexture: THREE.CanvasTexture;
  private fogMaterial: THREE.ShaderMaterial;
  public readonly mapWorldWidth: number;
  public readonly mapWorldHeight: number;

  constructor(mapWidthTiles: number, mapHeightTiles: number) {
    this.mapWorldWidth = mapWidthTiles * TILE_SIZE;
    this.mapWorldHeight = mapHeightTiles * TILE_SIZE;

    // 1. Explored Memory Canvas (1 pixel per tile)
    this.exploredCanvas = document.createElement('canvas');
    this.exploredCanvas.width = mapWidthTiles;
    this.exploredCanvas.height = mapHeightTiles;
    const ctx = this.exploredCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.exploredCtx = ctx;

    // Initialize with pitch black (unexplored)
    this.exploredCtx.fillStyle = '#000000';
    this.exploredCtx.fillRect(0, 0, mapWidthTiles, mapHeightTiles);

    this.exploredTexture = new THREE.CanvasTexture(this.exploredCanvas);
    this.exploredTexture.minFilter = THREE.LinearFilter;
    this.exploredTexture.magFilter = THREE.LinearFilter;

    // 2. Custom Volumetric Fog Shader
    const fogColor = new THREE.Color(PALETTE.fog);
    this.fogMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uExploredMap: { value: this.exploredTexture },
        uPlayerPos: { value: new THREE.Vector2(0, 0) },
        uVisionRadius: { value: 220.0 },
        uMapWorldSize: { value: new THREE.Vector2(this.mapWorldWidth, this.mapWorldHeight) },
        uFogColor: { value: fogColor }
      },
      vertexShader: `
        varying vec2 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uExploredMap;
        uniform vec2 uPlayerPos;
        uniform float uVisionRadius;
        uniform vec2 uMapWorldSize;
        uniform vec3 uFogColor;

        varying vec2 vWorldPos;

        void main() {
          // Explored memory UV
          vec2 mapUV = vWorldPos / uMapWorldSize;
          float explored = texture2D(uExploredMap, mapUV).r;

          // Live vision distance from player
          float dist = distance(vWorldPos, uPlayerPos);
          float innerRadius = uVisionRadius * 0.75;
          float outerRadius = uVisionRadius;

          // Live vision factor (0 = fully visible / clear, 1 = dark)
          float liveVision = smoothstep(innerRadius, outerRadius, dist);

          // Fog opacity:
          // Inside live vision: liveVision (0.0 to 1.0)
          // In explored memory outside live vision: blend down to 0.75 (dimly visible remembered world)
          // In unexplored shroud: 1.0 (pure pitch black)
          float alpha = 1.0;

          if (dist < outerRadius) {
            alpha = liveVision * (1.0 - explored * 0.25);
          } else {
            alpha = 1.0 - (explored * 0.28); // 72% fog opacity for explored memory
          }

          gl_FragColor = vec4(uFogColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false
    });

    // 3. Fog Plane Geometry covering the full level, positioned at y=32 (above ground & characters)
    const fogGeo = new THREE.PlaneGeometry(this.mapWorldWidth, this.mapWorldHeight);
    fogGeo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(fogGeo, this.fogMaterial);
    this.mesh.position.set(this.mapWorldWidth / 2, 34, this.mapWorldHeight / 2);
  }

  public update(playerX: number, playerZ: number, visionRadius: number): void {
    // 1. Update Shader Uniforms
    this.fogMaterial.uniforms.uPlayerPos!.value.set(playerX, playerZ);
    this.fogMaterial.uniforms.uVisionRadius!.value = visionRadius;

    // 2. Paint explored memory around player position
    const tileX = playerX / TILE_SIZE;
    const tileY = playerZ / TILE_SIZE;
    const radiusTiles = visionRadius / TILE_SIZE;

    this.exploredCtx.fillStyle = '#ffffff';
    this.exploredCtx.beginPath();
    this.exploredCtx.arc(tileX, tileY, radiusTiles, 0, Math.PI * 2);
    this.exploredCtx.fill();

    this.exploredTexture.needsUpdate = true;
  }

  public destroy(): void {
    this.mesh.geometry.dispose();
    this.fogMaterial.dispose();
    this.exploredTexture.dispose();
  }
}
