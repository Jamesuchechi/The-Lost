export class EndGameOverlay {
  private element: HTMLElement | null = null;

  public showVictory(stats: {
    timeSec: number;
    stonesCollected: number;
    wolvesSlain: number;
    onRestart: () => void;
  }): void {
    this.remove();

    this.element = document.createElement('div');
    this.element.id = 'endgame-overlay';
    this.element.style.position = 'absolute';
    this.element.style.inset = '0';
    this.element.style.backgroundColor = 'rgba(10, 16, 12, 0.94)';
    this.element.style.backdropFilter = 'blur(10px)';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';
    this.element.style.zIndex = '10000';
    this.element.style.fontFamily = 'monospace';
    this.element.style.color = '#e2e8f0';

    const mins = Math.floor(stats.timeSec / 60);
    const secs = Math.floor(stats.timeSec % 60);

    this.element.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px; border: 1px solid rgba(214, 178, 94, 0.4); border-radius: 12px; background: rgba(20, 32, 24, 0.85); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
        <h1 style="font-size: 32px; font-weight: 800; color: #d6b25e; margin-bottom: 12px; letter-spacing: 2px;">ESCAPED THE WOODS</h1>
        <p style="color: #a0aec0; margin-bottom: 24px; font-size: 13px;">You claimed the three ancient stones and survived the hunt of the Whispering Woods.</p>

        <div style="display: flex; justify-content: space-around; margin-bottom: 30px; background: rgba(10, 16, 12, 0.7); padding: 16px; border-radius: 8px;">
          <div>
            <div style="font-size: 11px; color: #718096;">TIME</div>
            <div style="font-size: 20px; font-weight: 700; color: #68d391;">${mins}m ${secs}s</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #718096;">STONES</div>
            <div style="font-size: 20px; font-weight: 700; color: #d6b25e;">3 / 3</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #718096;">WOLVES SLAIN</div>
            <div style="font-size: 20px; font-weight: 700; color: #e0584a;">${stats.wolvesSlain}</div>
          </div>
        </div>

        <button id="btn-restart" style="padding: 14px 36px; background: linear-gradient(135deg, #d6b25e, #b7791f); border: none; border-radius: 6px; color: #0a100c; font-size: 14px; font-weight: 800; letter-spacing: 1px; cursor: pointer; transition: transform 0.1s; box-shadow: 0 4px 14px rgba(214, 178, 94, 0.4);">
          PLAY AGAIN
        </button>
      </div>
    `;

    document.body.appendChild(this.element);

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.remove();
      stats.onRestart();
    });
  }

  public showGameOver(stats: {
    causeOfDeath: string;
    timeSec: number;
    stonesCollected: number;
    onRestart: () => void;
  }): void {
    this.remove();

    this.element = document.createElement('div');
    this.element.id = 'endgame-overlay';
    this.element.style.position = 'absolute';
    this.element.style.inset = '0';
    this.element.style.backgroundColor = 'rgba(18, 10, 10, 0.95)';
    this.element.style.backdropFilter = 'blur(10px)';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';
    this.element.style.zIndex = '10000';
    this.element.style.fontFamily = 'monospace';
    this.element.style.color = '#e2e8f0';

    const mins = Math.floor(stats.timeSec / 60);
    const secs = Math.floor(stats.timeSec % 60);

    this.element.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px; border: 1px solid rgba(224, 88, 74, 0.4); border-radius: 12px; background: rgba(30, 15, 15, 0.85); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
        <h1 style="font-size: 34px; font-weight: 800; color: #e0584a; margin-bottom: 12px; letter-spacing: 3px;">YOU DIED</h1>
        <p style="color: #e2e8f0; margin-bottom: 24px; font-size: 14px;">${stats.causeOfDeath}</p>

        <div style="display: flex; justify-content: space-around; margin-bottom: 30px; background: rgba(10, 10, 10, 0.7); padding: 16px; border-radius: 8px;">
          <div>
            <div style="font-size: 11px; color: #718096;">TIME SURVIVED</div>
            <div style="font-size: 18px; font-weight: 700; color: #cbd5e0;">${mins}m ${secs}s</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #718096;">STONES FOUND</div>
            <div style="font-size: 18px; font-weight: 700; color: #d6b25e;">${stats.stonesCollected} / 3</div>
          </div>
        </div>

        <button id="btn-retry" style="padding: 14px 36px; background: linear-gradient(135deg, #e0584a, #c53030); border: none; border-radius: 6px; color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 1px; cursor: pointer; transition: transform 0.1s; box-shadow: 0 4px 14px rgba(224, 88, 74, 0.4);">
          TRY AGAIN
        </button>
      </div>
    `;

    document.body.appendChild(this.element);

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      this.remove();
      stats.onRestart();
    });
  }

  public remove(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
