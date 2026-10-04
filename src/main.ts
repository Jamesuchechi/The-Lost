import * as THREE from 'three';
import { SIMULATION_STEP } from './config/constants';
import { PALETTE } from './config/palette';
import { level1 } from './config/levels/level1';
import { generateLevel, type LevelData } from './world/WorldGenerator';
import { ChunkManager } from './world/ChunkManager';
import { Player } from './entities/Player';
import { InputController } from './core/InputController';
import { CameraController } from './core/CameraController';
import { DebugOverlay } from './ui/DebugOverlay';

export class App {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;

  private accumulator = 0;
  private lastTime = 0;
  private isRunning = true;

  // Game Systems & Entities
  private levelData: LevelData;
  private chunkManager: ChunkManager;
  private player: Player;
  private inputController: InputController;
  private cameraController: CameraController;
  private debugOverlay: DebugOverlay;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. URL Parameters (?seed=xyz, ?debug=1)
    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get('seed') || 'whispering-woods-alpha';
    const isDebug = urlParams.get('debug') === '1';

    // 2. Pure World Generation
    this.levelData = generateLevel(level1, seed);

    // 3. Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.fog);
    this.scene.fog = new THREE.FogExp2(PALETTE.fog, 0.0018);

    // 4. Camera Setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2500);

    // 5. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 6. Realistic 3D Atmosphere & Lighting
    const ambientLight = new THREE.AmbientLight(0x182820, 1.4);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0x8fae9f, 2.2);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 1200;
    const shadowDist = 450;
    this.dirLight.shadow.camera.left = -shadowDist;
    this.dirLight.shadow.camera.right = shadowDist;
    this.dirLight.shadow.camera.top = shadowDist;
    this.dirLight.shadow.camera.bottom = -shadowDist;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // 7. Instantiate Entities & Managers
    this.chunkManager = new ChunkManager(this.scene, this.levelData);
    this.player = new Player(this.levelData.spawnPos.x, this.levelData.spawnPos.y);
    this.scene.add(this.player.mesh);

    this.inputController = new InputController(this.camera, this.renderer.domElement);
    this.cameraController = new CameraController(
      this.camera,
      this.player.position.x,
      this.player.position.z
    );
    this.debugOverlay = new DebugOverlay(isDebug);

    // Initial chunk load around spawn
    this.chunkManager.update(this.player.position.x, this.player.position.z);

    // 8. Event Listeners
    window.addEventListener('resize', this.onResize);

    // 9. Start Loop
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

    const deltaMs = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;
    this.accumulator += deltaMs / 1000;

    const input = this.inputController.update();
    if (input.toggleDebug) {
      this.debugOverlay.toggle();
    }

    // Fixed timestep simulation (60 Hz)
    while (this.accumulator >= SIMULATION_STEP) {
      this.simulate(SIMULATION_STEP, input);
      this.accumulator -= SIMULATION_STEP;
    }

    // Render decoupled
    this.render();
    requestAnimationFrame(this.loop);
  };

  private simulate(dt: number, input: ReturnType<InputController['update']>): void {
    this.player.update(dt, input, this.levelData.grid);
    this.chunkManager.update(this.player.position.x, this.player.position.z);
    this.cameraController.update(this.player.position, input.mouseWorld, dt);

    // Align directional shadow light with player
    this.dirLight.position.set(
      this.player.position.x + 120,
      350,
      this.player.position.z + 180
    );
    this.dirLight.target.position.set(
      this.player.position.x,
      0,
      this.player.position.z
    );

    // Update Debug Overlay
    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    let state = 'Idle';
    if (this.player.isCrouching && this.player.isMoving) state = 'Crouching';
    else if (this.player.isSprinting && this.player.isMoving) state = 'Sprinting';
    else if (this.player.isMoving) state = 'Walking';
    else if (this.player.isCrouching) state = 'Crouch Idle';

    this.debugOverlay.update({
      seed: this.levelData.seed,
      posX: this.player.position.x,
      posZ: this.player.position.z,
      speed,
      chunkCount: this.chunkManager.getActiveChunkCount(),
      state
    });
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize);
    this.inputController.destroy();
    this.debugOverlay.destroy();
    this.renderer.dispose();
  }
}

// Bootstrap
const root = document.getElementById('app');
if (root) {
  new App(root);
}
