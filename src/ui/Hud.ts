export class Hud {
  private container: HTMLElement;
  private healthFill: HTMLElement;
  private staminaFill: HTMLElement;
  private healthText: HTMLElement;
  private staminaText: HTMLElement;
  private statusBadge: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'player-hud';
    this.container.style.position = 'absolute';
    this.container.style.top = '16px';
    this.container.style.left = '16px';
    this.container.style.width = '240px';
    this.container.style.padding = '12px 14px';
    this.container.style.backgroundColor = 'rgba(10, 16, 12, 0.82)';
    this.container.style.backdropFilter = 'blur(6px)';
    this.container.style.borderRadius = '8px';
    this.container.style.border = '1px solid rgba(80, 120, 95, 0.3)';
    this.container.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
    this.container.style.zIndex = '9000';
    this.container.style.pointerEvents = 'none';

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #a0aec0; text-transform: uppercase;">SURVIVOR</span>
        <span id="hud-status" style="font-size: 10px; font-weight: 700; color: #68d391; background: rgba(104, 211, 145, 0.15); padding: 2px 6px; border-radius: 4px;">STEADY</span>
      </div>

      <!-- Health Bar -->
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #cbd5e0; margin-bottom: 2px;">
          <span>HEALTH</span>
          <span id="hud-health-text">100 / 100</span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(30, 35, 32, 0.9); border-radius: 4px; overflow: hidden; border: 1px solid rgba(224, 88, 74, 0.3);">
          <div id="hud-health-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #c53030, #e0584a); transition: width 0.15s ease-out;"></div>
        </div>
      </div>

      <!-- Stamina Bar -->
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #cbd5e0; margin-bottom: 2px;">
          <span>STAMINA</span>
          <span id="hud-stamina-text">100 / 100</span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(30, 35, 32, 0.9); border-radius: 4px; overflow: hidden; border: 1px solid rgba(72, 187, 120, 0.3);">
          <div id="hud-stamina-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #2f855a, #48bb78); transition: width 0.08s ease-out;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.healthFill = document.getElementById('hud-health-fill')!;
    this.staminaFill = document.getElementById('hud-stamina-fill')!;
    this.healthText = document.getElementById('hud-health-text')!;
    this.staminaText = document.getElementById('hud-stamina-text')!;
    this.statusBadge = document.getElementById('hud-status')!;
  }

  public update(health: number, maxHealth: number, stamina: number, maxStamina: number, isWinded: boolean): void {
    const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    const staminaPct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));

    this.healthFill.style.width = `${healthPct}%`;
    this.staminaFill.style.width = `${staminaPct}%`;
    this.healthText.textContent = `${Math.round(health)} / ${maxHealth}`;
    this.staminaText.textContent = `${Math.round(stamina)} / ${maxStamina}`;

    if (isWinded) {
      this.statusBadge.textContent = 'EXHAUSTED';
      this.statusBadge.style.color = '#fc8181';
      this.statusBadge.style.background = 'rgba(245, 101, 101, 0.25)';
      this.staminaFill.style.background = '#e53e3e';
    } else if (staminaPct < 30) {
      this.statusBadge.textContent = 'TIRED';
      this.statusBadge.style.color = '#f6e05e';
      this.statusBadge.style.background = 'rgba(236, 201, 75, 0.2)';
      this.staminaFill.style.background = 'linear-gradient(90deg, #b7791f, #ecc94b)';
    } else {
      this.statusBadge.textContent = 'STEADY';
      this.statusBadge.style.color = '#68d391';
      this.statusBadge.style.background = 'rgba(104, 211, 145, 0.15)';
      this.staminaFill.style.background = 'linear-gradient(90deg, #2f855a, #48bb78)';
    }
  }

  public destroy(): void {
    this.container.remove();
  }
}
