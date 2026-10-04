export class DebugOverlay {
  private element: HTMLElement;
  private isVisible: boolean;
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private currentFps = 60;

  constructor(defaultVisible = false) {
    this.isVisible = defaultVisible;

    this.element = document.createElement('div');
    this.element.id = 'debug-overlay';
    this.element.style.position = 'absolute';
    this.element.style.top = '12px';
    this.element.style.right = '12px';
    this.element.style.padding = '10px 14px';
    this.element.style.backgroundColor = 'rgba(10, 16, 12, 0.85)';
    this.element.style.color = '#78c292';
    this.element.style.fontFamily = 'monospace';
    this.element.style.fontSize = '12px';
    this.element.style.lineHeight = '1.5';
    this.element.style.borderRadius = '6px';
    this.element.style.border = '1px solid rgba(120, 194, 146, 0.3)';
    this.element.style.pointerEvents = 'none';
    this.element.style.zIndex = '9999';
    this.element.style.display = this.isVisible ? 'block' : 'none';

    document.body.appendChild(this.element);
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.element.style.display = this.isVisible ? 'block' : 'none';
  }

  public update(stats: {
    seed: string | number;
    posX: number;
    posZ: number;
    speed: number;
    chunkCount: number;
    state: string;
  }): void {
    if (!this.isVisible) return;

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    this.element.innerHTML = `
      <div style="font-weight: bold; color: #d6b25e; margin-bottom: 4px;">THE LOST [DEBUG F3]</div>
      <div>FPS: <span style="color: ${this.currentFps >= 55 ? '#68d391' : '#f56565'}">${this.currentFps}</span></div>
      <div>Seed: <span>${stats.seed}</span></div>
      <div>Pos: <span>${stats.posX.toFixed(1)}, ${stats.posZ.toFixed(1)}</span></div>
      <div>Speed: <span>${stats.speed.toFixed(1)} u/s</span></div>
      <div>Chunks: <span>${stats.chunkCount}</span></div>
      <div>State: <span>${stats.state}</span></div>
    `;
  }

  public destroy(): void {
    this.element.remove();
  }
}
