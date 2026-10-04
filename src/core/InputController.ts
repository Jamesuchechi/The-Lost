import * as THREE from 'three';

export interface InputState {
  moveX: number; // -1 .. 1
  moveY: number; // -1 .. 1
  isSprinting: boolean;
  isCrouching: boolean;
  isDodging: boolean;
  isLightAttacking: boolean;
  isHeavyAttacking: boolean;
  isRangedAttacking: boolean;
  interact: boolean;
  toggleMap: boolean;
  toggleDebug: boolean;
  pause: boolean;
  mouseWorld: THREE.Vector3;
  mouseScreen: { x: number; y: number };
}

export class InputController {
  private keys: Record<string, boolean> = {};
  private mouseScreen = { x: 0, y: 0 };
  private mouseWorld = new THREE.Vector3(0, 0, 0);
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private camera: THREE.Camera;
  private domElement: HTMLElement;

  private justPressed: Record<string, boolean> = {};
  private isMouseDown = false;
  private mouseDownTime = 0;
  private isRightMouseDown = false;

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('contextmenu', this.onContextMenu);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (!this.keys[code]) {
      this.justPressed[code] = true;
    }
    this.keys[code] = true;

    if (code === 'Tab' || code === 'Space' || code === 'F3') {
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouseScreen.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseScreen.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isMouseDown = true;
      this.mouseDownTime = performance.now();
    } else if (e.button === 2) {
      this.isRightMouseDown = true;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isMouseDown = false;
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
    }
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  public update(): InputState {
    // 1. Raycast mouse screen coordinates onto ground plane (y = 0)
    this.raycaster.setFromCamera(
      new THREE.Vector2(this.mouseScreen.x, this.mouseScreen.y),
      this.camera
    );
    const intersectPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
      this.mouseWorld.copy(intersectPoint);
    }

    // 2. Compute movement axes
    let moveX = 0;
    let moveY = 0; // in world coordinates: Z is depth/forward, X is lateral

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Normalize diagonal movement
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
    }

    const isSprinting = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const isCrouching = Boolean(
      this.keys['ControlLeft'] || this.keys['ControlRight'] || this.keys['KeyC']
    );
    const isDodging = Boolean(this.consumeJustPressed('Space'));
    const interact = Boolean(this.consumeJustPressed('KeyE'));
    const toggleMap = Boolean(this.consumeJustPressed('Tab'));
    const toggleDebug = Boolean(this.consumeJustPressed('F3'));
    const pause = Boolean(this.consumeJustPressed('Escape'));

    const pressDuration = this.isMouseDown ? performance.now() - this.mouseDownTime : 0;
    const isHeavyAttacking = this.isMouseDown && pressDuration >= 400;
    const isLightAttacking = this.isMouseDown && !isHeavyAttacking;

    return {
      moveX,
      moveY,
      isSprinting,
      isCrouching,
      isDodging,
      isLightAttacking,
      isHeavyAttacking,
      isRangedAttacking: this.isRightMouseDown,
      interact,
      toggleMap,
      toggleDebug,
      pause,
      mouseWorld: this.mouseWorld.clone(),
      mouseScreen: { ...this.mouseScreen }
    };
  }

  private consumeJustPressed(code: string): boolean {
    if (this.justPressed[code]) {
      this.justPressed[code] = false;
      return true;
    }
    return false;
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }
}
