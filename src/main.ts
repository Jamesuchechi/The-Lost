import * as THREE from 'three';
import { SIMULATION_STEP } from './config/constants';
import { PALETTE } from './config/palette';

export class App {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private accumulator = 0;
  private lastTime = 0;
  private isRunning = true;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.fog);
    this.scene.fog = new THREE.FogExp2(PALETTE.fog, 0.0035);

    // 2. Camera (Top-down 3D perspective with subtle forward tilt for depth)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    this.camera.position.set(0, 450, 260);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting (Atmospheric moonlight + soft ambient)
    const ambientLight = new THREE.AmbientLight(0x1a2e22, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x9fc2b0, 2.0);
    dirLight.position.set(100, 300, 150);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 1000;
    const d = 400;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // 5. Window resize listener
    window.addEventListener('resize', this.onResize);

    // 6. Start loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaMs = Math.min(timestamp - this.lastTime, 100); // clamp max 100ms
    this.lastTime = timestamp;
    this.accumulator += deltaMs / 1000;

    // Fixed timestep simulation
    while (this.accumulator >= SIMULATION_STEP) {
      this.simulate(SIMULATION_STEP);
      this.accumulator -= SIMULATION_STEP;
    }

    // Render decoupled at monitor refresh rate
    this.render(this.accumulator / SIMULATION_STEP);
    requestAnimationFrame(this.loop);
  };

  private simulate(_dt: number): void {
    // Tick simulation systems (Player, Enemies, Stamina, Perception, AI)
  }

  private render(_alpha: number): void {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}

// Bootstrap
const root = document.getElementById('app');
if (root) {
  new App(root);
}
