import * as THREE from 'three';
import { SIMULATION_STEP, PLAYER_CONFIG, TILE_SIZE } from './config/constants';
import { PALETTE } from './config/palette';
import { level1 } from './config/levels/level1';
import { generateLevel, type LevelData } from './world/WorldGenerator';
import { ChunkManager } from './world/ChunkManager';
import { Player } from './entities/Player';
import { InputController } from './core/InputController';
import { CameraController } from './core/CameraController';
import { DebugOverlay } from './ui/DebugOverlay';
import { EventBus } from './core/EventBus';
import type { GameEvents } from './core/types';
import { StaminaSystem } from './systems/StaminaSystem';
import { VisionSystem } from './systems/VisionSystem';
import { FogRenderer } from './systems/FogRenderer';
import { NoiseSystem } from './systems/NoiseSystem';
import { ScentTrail } from './systems/ScentTrail';
import { PerceptionSystem } from './systems/PerceptionSystem';
import { Pathfinding } from './world/Pathfinding';
import { Wolf } from './entities/enemies/Wolf';
import { SensoryDebugVisualizer } from './ui/SensoryDebugVisualizer';
import { Hud } from './ui/Hud';
import { Rng } from './core/rng';

export class App {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;

  private accumulator = 0;
  private lastTime = 0;
  private isRunning = true;

  // Systems & Entities
  private eventBus: EventBus<GameEvents>;
  private levelData: LevelData;
  private chunkManager: ChunkManager;
  private player: Player;
  private wolves: Wolf[] = [];
  private inputController: InputController;
  private cameraController: CameraController;
  private pathfinding: Pathfinding;
  private staminaSystem: StaminaSystem;
  private visionSystem: VisionSystem;
  private fogRenderer: FogRenderer;
  private noiseSystem: NoiseSystem;
  private scentTrail: ScentTrail;
  private perceptionSystem: PerceptionSystem;
  private sensoryDebugVisualizer: SensoryDebugVisualizer;
  private hud: Hud;
  private debugOverlay: DebugOverlay;

  private playerHealth = PLAYER_CONFIG.healthMax;
  private isDebug = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. URL Parameters (?seed=xyz, ?debug=1)
    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get('seed') || 'whispering-woods-alpha';
    this.isDebug = urlParams.get('debug') === '1';

    // 2. Core Event Bus & Generation
    this.eventBus = new EventBus<GameEvents>();
    this.levelData = generateLevel(level1, seed);
    this.pathfinding = new Pathfinding(this.levelData.grid);

    // 3. Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.fog);

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

    // 6. Lighting
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

    // 7. Instantiate Entities & Systems
    this.chunkManager = new ChunkManager(this.scene, this.levelData);
    this.player = new Player(this.levelData.spawnPos.x, this.levelData.spawnPos.y);
    this.scene.add(this.player.mesh);

    this.inputController = new InputController(this.camera, this.renderer.domElement);
    this.cameraController = new CameraController(
      this.camera,
      this.player.position.x,
      this.player.position.z
    );

    this.staminaSystem = new StaminaSystem(this.eventBus);
    this.visionSystem = new VisionSystem(level1.fog.visionRadius);
    this.fogRenderer = new FogRenderer(this.levelData.width, this.levelData.height);
    this.scene.add(this.fogRenderer.mesh);

    this.noiseSystem = new NoiseSystem(this.eventBus, this.scene);
    this.scentTrail = new ScentTrail();
    this.perceptionSystem = new PerceptionSystem(this.levelData.grid, this.scentTrail);

    // Forward noise events from EventBus to PerceptionSystem
    this.eventBus.on('noise', (noise) => {
      this.perceptionSystem.registerNoise(noise);
    });

    // 8. Spawn Wolves across Level 1
    this.spawnWolves(seed);

    this.sensoryDebugVisualizer = new SensoryDebugVisualizer(this.scene, this.isDebug);
    this.hud = new Hud();
    this.debugOverlay = new DebugOverlay(this.isDebug);

    // Initial chunk load around spawn
    this.chunkManager.update(this.player.position.x, this.player.position.z);
    this.fogRenderer.update(
      this.player.position.x,
      this.player.position.z,
      this.visionSystem.currentRadius
    );

    // 9. Event Listeners
    window.addEventListener('resize', this.onResize);

    // 10. Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private spawnWolves(seed: string): void {
    const aiRng = new Rng(seed, 'ai');
    let wolfIndex = 0;

    const trySpawnWolf = (centerX: number, centerZ: number, radiusMin: number, radiusMax: number): void => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const angle = aiRng.range(0, Math.PI * 2);
        const dist = aiRng.range(radiusMin, radiusMax);
        const wx = centerX + Math.cos(angle) * dist;
        const wz = centerZ + Math.sin(angle) * dist;
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wz / TILE_SIZE);

        if (tx > 2 && tx < this.levelData.width - 3 && ty > 2 && ty < this.levelData.height - 3) {
          if (!this.levelData.grid.isBlocked(tx, ty)) {
            const wolf = new Wolf(`wolf_${wolfIndex++}`, wx, wz, this.pathfinding);
            this.wolves.push(wolf);
            this.scene.add(wolf.mesh);
            placed = true;
          }
        }
      }
    };

    // 1. One scout wolf patrolling north of player spawn (400 - 550 units away)
    trySpawnWolf(this.player.position.x, this.player.position.z - 450, 50, 150);

    // 2. Guards for each Ancient Stone (2 wolves per stone)
    for (const stone of this.levelData.stoneLocations) {
      trySpawnWolf(stone.x, stone.y, 80, 200);
      trySpawnWolf(stone.x, stone.y, 120, 250);
    }

    // 3. Wandering forest pack in the deep woods
    for (let i = 0; i < 3; i++) {
      const rx = aiRng.range(1000, this.levelData.width * TILE_SIZE - 1000);
      const rz = aiRng.range(1000, this.levelData.height * TILE_SIZE - 1000);
      trySpawnWolf(rx, rz, 50, 300);
    }
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
      this.isDebug = !this.isDebug;
      this.debugOverlay.toggle();
      this.sensoryDebugVisualizer.setVisible(this.isDebug);
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
    const playerPos2D = { x: this.player.position.x, y: this.player.position.z };

    // 1. Update Player & Stamina
    this.player.update(dt, input, this.levelData.grid, this.staminaSystem);
    this.staminaSystem.update(
      dt,
      this.player.isSprinting,
      this.player.isMoving,
      this.player.isCrouching,
      playerPos2D
    );

    // 2. Update Noise & Scent Trail
    this.noiseSystem.emitMovementNoise(
      dt,
      playerPos2D,
      this.player.isMoving,
      this.player.isSprinting,
      this.player.isCrouching,
      this.levelData.grid
    );
    this.noiseSystem.update(dt);
    this.scentTrail.update(dt, playerPos2D, this.player.isMoving);

    // 3. Update Wolves AI & Senses
    for (const wolf of this.wolves) {
      wolf.update(dt, playerPos2D, this.perceptionSystem, this.visionSystem.currentRadius);
    }
    this.perceptionSystem.clearFrameNoises();

    // 4. Update Vision & Fog
    this.visionSystem.update(dt, {});
    this.fogRenderer.update(
      this.player.position.x,
      this.player.position.z,
      this.visionSystem.currentRadius
    );

    // 5. Update World Streaming, Camera & Lighting
    this.chunkManager.update(this.player.position.x, this.player.position.z);
    this.cameraController.update(this.player.position, input.mouseWorld, dt);

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

    // 6. Update Sensory Debug Visualizer
    this.sensoryDebugVisualizer.update(this.wolves, this.scentTrail);

    // 7. Update HUD & Debug
    this.hud.update(
      this.playerHealth,
      PLAYER_CONFIG.healthMax,
      this.staminaSystem.current,
      this.staminaSystem.max,
      this.staminaSystem.isWinded
    );

    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    let state = 'Idle';
    if (this.staminaSystem.isWinded) state = 'Winded / Exhausted';
    else if (this.player.isCrouching && this.player.isMoving) state = 'Crouching';
    else if (this.player.isSprinting && this.player.isMoving) state = 'Sprinting';
    else if (this.player.isMoving) state = 'Walking';
    else if (this.player.isCrouching) state = 'Crouch Idle';

    // Check wolves awareness for debug summary
    const alertWolves = this.wolves.filter((w) => w.perception.alertLevel === 'alert').length;
    const suspWolves = this.wolves.filter((w) => w.perception.alertLevel === 'investigate').length;

    this.debugOverlay.update({
      seed: this.levelData.seed,
      posX: this.player.position.x,
      posZ: this.player.position.z,
      speed,
      chunkCount: this.chunkManager.getActiveChunkCount(),
      state: `${state} | Wolves: ${this.wolves.length} (!:${alertWolves} ?: ${suspWolves})`
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
    this.hud.destroy();
    this.noiseSystem.destroy();
    this.sensoryDebugVisualizer.destroy();
    this.fogRenderer.destroy();
    for (const wolf of this.wolves) {
      wolf.destroy();
    }
    this.renderer.dispose();
  }
}

// Bootstrap
const root = document.getElementById('app');
if (root) {
  new App(root);
}
