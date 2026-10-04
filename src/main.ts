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
import { CombatSystem } from './systems/CombatSystem';
import { Pathfinding } from './world/Pathfinding';
import { Wolf } from './entities/enemies/Wolf';
import { Pickup } from './entities/Pickup';
import { ClueTotem } from './entities/ClueTotem';
import { SensoryDebugVisualizer } from './ui/SensoryDebugVisualizer';
import { Hud } from './ui/Hud';
import { EndGameOverlay } from './ui/EndGameOverlay';
import { Rng } from './core/rng';
import { distance } from './core/math';

export class App {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;

  private accumulator = 0;
  private lastTime = 0;
  private isRunning = true;
  private gameTime = 0;

  // Systems & Entities
  private eventBus: EventBus<GameEvents>;
  private levelData: LevelData;
  private chunkManager: ChunkManager;
  private player: Player;
  private wolves: Wolf[] = [];
  private pickups: Pickup[] = [];
  private totems: ClueTotem[] = [];
  private inputController: InputController;
  private cameraController: CameraController;
  private pathfinding: Pathfinding;
  private staminaSystem: StaminaSystem;
  private visionSystem: VisionSystem;
  private fogRenderer: FogRenderer;
  private noiseSystem: NoiseSystem;
  private scentTrail: ScentTrail;
  private perceptionSystem: PerceptionSystem;
  private combatSystem: CombatSystem;
  private sensoryDebugVisualizer: SensoryDebugVisualizer;
  private hud: Hud;
  private endGameOverlays: EndGameOverlay;
  private debugOverlay: DebugOverlay;

  // Game State
  private playerHealth: number = PLAYER_CONFIG.healthMax;
  private stonesCollected = 0;
  private collectedStoneIndices = new Set<number>();
  private wolvesSlain = 0;
  private isGameOver = false;
  private isEscaping = false;
  private escapeTimer = 60.0;
  private isDebug = false;
  private seed: string;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. URL Parameters (?seed=xyz, ?debug=1)
    const urlParams = new URLSearchParams(window.location.search);
    this.seed = urlParams.get('seed') || 'whispering-woods-alpha';
    this.isDebug = urlParams.get('debug') === '1';

    // 2. Core Event Bus & Generation
    this.eventBus = new EventBus<GameEvents>();
    this.levelData = generateLevel(level1, this.seed);
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
    this.combatSystem = new CombatSystem(this.eventBus);

    // Event Bus Handlers
    this.eventBus.on('noise', (noise) => {
      this.perceptionSystem.registerNoise(noise);
    });

    this.eventBus.on('death', (data) => {
      if (data.faction === 'enemy') {
        this.wolvesSlain++;
      }
    });

    // 8. Spawn World Objects (Wolves, Pickups, Totems)
    this.spawnEntities(this.seed);

    this.sensoryDebugVisualizer = new SensoryDebugVisualizer(this.scene, this.isDebug);
    this.hud = new Hud();
    this.endGameOverlays = new EndGameOverlay();
    this.debugOverlay = new DebugOverlay(this.isDebug);

    // Initial chunk load
    this.chunkManager.update(this.player.position.x, this.player.position.z);
    this.fogRenderer.update(
      this.player.position.x,
      this.player.position.z,
      this.visionSystem.currentRadius
    );

    // 9. Event Listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onGlobalKeyDown);

    // 10. Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private spawnEntities(seed: string): void {
    const aiRng = new Rng(seed, 'ai');
    const lootRng = new Rng(seed, 'loot');
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

    // 1. One scout wolf near spawn perimeter
    trySpawnWolf(this.player.position.x, this.player.position.z - 450, 50, 150);

    // 2. Guards at each Ancient Stone Altar
    for (const stone of this.levelData.stoneLocations) {
      trySpawnWolf(stone.x, stone.y, 80, 200);
      trySpawnWolf(stone.x, stone.y, 120, 250);
    }

    // 3. Roaming pack in deep woods
    for (let i = 0; i < 3; i++) {
      const rx = aiRng.range(1000, this.levelData.width * TILE_SIZE - 1000);
      const rz = aiRng.range(1000, this.levelData.height * TILE_SIZE - 1000);
      trySpawnWolf(rx, rz, 50, 300);
    }

    // 4. Spawn Clue Totems pointing towards stones
    for (const clue of this.levelData.clueLocations) {
      const targetStone = this.levelData.stoneLocations[clue.targetStoneIndex];
      if (targetStone) {
        const totem = new ClueTotem(clue.x, clue.y, targetStone.x, targetStone.y);
        this.totems.push(totem);
        this.scene.add(totem.mesh);
      }
    }

    // 5. Spawn Pickups (Bandages & Sticks near clearings)
    for (let i = 0; i < 8; i++) {
      const px = lootRng.range(800, this.levelData.width * TILE_SIZE - 800);
      const pz = lootRng.range(800, this.levelData.height * TILE_SIZE - 800);
      const type = i % 2 === 0 ? 'bandage' : 'stick';
      const pickup = new Pickup(`pickup_${i}`, type, px, pz);
      this.pickups.push(pickup);
      this.scene.add(pickup.mesh);
    }
  }

  private onGlobalKeyDown = (e: KeyboardEvent): void => {
    // Q to use bandage
    if (e.code === 'KeyQ' && this.player.bandagesCount > 0 && this.playerHealth < PLAYER_CONFIG.healthMax) {
      this.player.bandagesCount--;
      this.playerHealth = Math.min(PLAYER_CONFIG.healthMax, this.playerHealth + 35);
    }
  };

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
    if (this.isGameOver) return;
    this.gameTime += dt;

    const playerPos2D = { x: this.player.position.x, y: this.player.position.z };

    // 1. Handle Player Attacks (LMB / Heavy)
    if (
      (input.isLightAttacking || input.isHeavyAttacking) &&
      this.player.attackCooldown <= 0 &&
      !this.player.isDodging
    ) {
      const isHeavy = input.isHeavyAttacking;
      const staminaCost = isHeavy
        ? PLAYER_CONFIG.heavyAttackStaminaCost
        : PLAYER_CONFIG.lightAttackStaminaCost;

      if (this.staminaSystem.drain(staminaCost)) {
        this.player.triggerAttackAnimation(isHeavy);
        this.combatSystem.executeMeleeAttack(
          'player',
          playerPos2D,
          this.player.facingAngle,
          this.player.activeWeapon,
          isHeavy,
          this.wolves
        );
      }
    }

    // 2. Update Player & Stamina
    this.player.update(dt, input, this.levelData.grid, this.staminaSystem);
    this.staminaSystem.update(
      dt,
      this.player.isSprinting,
      this.player.isMoving,
      this.player.isCrouching,
      playerPos2D
    );

    // 3. Update Pickups & Interaction Prompts
    let activeInteractPrompt: string | null = null;
    let activeHintText: string | null = null;

    for (const pickup of this.pickups) {
      pickup.update(dt);
      if (pickup.canInteract(playerPos2D)) {
        activeInteractPrompt = `[E] PICK UP ${pickup.type.toUpperCase()}`;
        if (input.interact) {
          pickup.isCollected = true;
          this.scene.remove(pickup.mesh);
          pickup.destroy();
          if (pickup.type === 'bandage') this.player.bandagesCount++;
        }
      }
    }

    // Check Ancient Stone Altars
    for (const stone of this.levelData.stoneLocations) {
      if (!this.collectedStoneIndices.has(stone.index)) {
        const dist = distance(playerPos2D, { x: stone.x, y: stone.y });
        if (dist <= 52) {
          activeInteractPrompt = `[E] CLAIM ANCIENT STONE #${stone.index + 1}`;
          if (input.interact) {
            this.collectedStoneIndices.add(stone.index);
            this.stonesCollected++;
            this.eventBus.emit('stoneCollected', {
              index: stone.index,
              total: this.stonesCollected
            });

            if (this.stonesCollected >= 3 && !this.isEscaping) {
              this.isEscaping = true;
              this.escapeTimer = 60.0;
              this.eventBus.emit('exitUnlocked', undefined);
            }
          }
        }
      }
    }

    // Check Clue Totems
    for (const totem of this.totems) {
      const hint = totem.getHintText(playerPos2D);
      if (hint) {
        activeHintText = hint;
      }
    }

    // 4. Escape Sequence & Win Condition
    let escapeSecondsRemaining: number | null = null;
    if (this.isEscaping) {
      if (this.escapeTimer > 0) {
        this.escapeTimer -= dt;
        escapeSecondsRemaining = this.escapeTimer;
      } else {
        escapeSecondsRemaining = 0;
        // Check if player reached the northern exit gate
        const distToExit = distance(playerPos2D, {
          x: this.levelData.exitLocation.x,
          y: this.levelData.exitLocation.y
        });
        if (distToExit <= 64) {
          this.triggerVictory();
          return;
        }
      }
    }

    // 5. Update Noise & Scent Trail
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

    // 6. Update Wolves AI, Senses & Attack Handling
    for (const wolf of this.wolves) {
      wolf.update(
        dt,
        playerPos2D,
        this.perceptionSystem,
        this.visionSystem.currentRadius,
        (damage) => {
          // Wolf bites player
          if (!this.player.isInvulnerable) {
            this.playerHealth = Math.max(0, this.playerHealth - damage);
            this.eventBus.emit('damage', {
              sourceId: wolf.id,
              targetId: 'player',
              amount: damage,
              knockback: 20,
              kind: 'melee'
            });

            if (this.playerHealth <= 0) {
              this.triggerDeath('Slain by Timber Wolves in the dark');
            }
          }
        }
      );
    }
    this.perceptionSystem.clearFrameNoises();

    // 7. Update Vision & Fog
    this.visionSystem.update(dt, {});
    this.fogRenderer.update(
      this.player.position.x,
      this.player.position.z,
      this.visionSystem.currentRadius
    );

    // 8. Update World Streaming, Camera & Lighting
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

    // 9. Update Sensory Debug Visualizer
    this.sensoryDebugVisualizer.update(this.wolves, this.scentTrail);

    // 10. Update HUD & Debug
    this.hud.update(
      this.playerHealth,
      PLAYER_CONFIG.healthMax,
      this.staminaSystem.current,
      this.staminaSystem.max,
      this.staminaSystem.isWinded,
      this.stonesCollected,
      activeHintText,
      activeInteractPrompt,
      escapeSecondsRemaining
    );

    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    let state = 'Idle';
    if (this.staminaSystem.isWinded) state = 'Winded / Exhausted';
    else if (this.player.isDodging) state = 'Dodge Rolling';
    else if (this.player.isCrouching && this.player.isMoving) state = 'Crouching';
    else if (this.player.isSprinting && this.player.isMoving) state = 'Sprinting';
    else if (this.player.isMoving) state = 'Walking';
    else if (this.player.isCrouching) state = 'Crouch Idle';

    const alertWolves = this.wolves.filter((w) => w.perception.alertLevel === 'alert').length;
    const suspWolves = this.wolves.filter((w) => w.perception.alertLevel === 'investigate').length;

    this.debugOverlay.update({
      seed: this.levelData.seed,
      posX: this.player.position.x,
      posZ: this.player.position.z,
      speed,
      chunkCount: this.chunkManager.getActiveChunkCount(),
      state: `${state} | Wolves: ${this.wolves.length} (!:${alertWolves} ?: ${suspWolves}) | Bandages: ${this.player.bandagesCount}`
    });
  }

  private triggerVictory(): void {
    this.isGameOver = true;
    this.endGameOverlays.showVictory({
      timeSec: this.gameTime,
      stonesCollected: this.stonesCollected,
      wolvesSlain: this.wolvesSlain,
      onRestart: () => this.restartGame()
    });
  }

  private triggerDeath(cause: string): void {
    this.isGameOver = true;
    this.endGameOverlays.showGameOver({
      causeOfDeath: cause,
      timeSec: this.gameTime,
      stonesCollected: this.stonesCollected,
      onRestart: () => this.restartGame()
    });
  }

  private restartGame(): void {
    window.location.reload();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onGlobalKeyDown);
    this.inputController.destroy();
    this.debugOverlay.destroy();
    this.hud.destroy();
    this.endGameOverlays.remove();
    this.noiseSystem.destroy();
    this.sensoryDebugVisualizer.destroy();
    this.fogRenderer.destroy();
    for (const wolf of this.wolves) {
      wolf.destroy();
    }
    for (const pickup of this.pickups) {
      pickup.destroy();
    }
    for (const totem of this.totems) {
      totem.destroy();
    }
    this.renderer.dispose();
  }
}

// Bootstrap
const root = document.getElementById('app');
if (root) {
  new App(root);
}
