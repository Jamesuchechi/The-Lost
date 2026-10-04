export class Hud {
  private container: HTMLElement;
  private healthFill: HTMLElement;
  private staminaFill: HTMLElement;
  private healthText: HTMLElement;
  private staminaText: HTMLElement;
  private statusBadge: HTMLElement;

  private hintBanner: HTMLElement;
  private interactBanner: HTMLElement;
  private escapeTimerBanner: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'player-hud';
    this.container.style.position = 'absolute';
    this.container.style.inset = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '9000';
    this.container.style.fontFamily = 'monospace';

    this.container.innerHTML = `
      <!-- Top Left: Health & Stamina -->
      <div style="position: absolute; top: 16px; left: 16px; width: 240px; padding: 12px 14px; background: rgba(10, 16, 12, 0.82); backdrop-filter: blur(6px); border-radius: 8px; border: 1px solid rgba(80, 120, 95, 0.3); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);">
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
      </div>

      <!-- Top Right: Ancient Stones Counter -->
      <div id="hud-stones" style="position: absolute; top: 16px; right: 16px; padding: 10px 16px; background: rgba(10, 16, 12, 0.85); backdrop-filter: blur(6px); border-radius: 8px; border: 1px solid rgba(214, 178, 94, 0.35); display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11px; font-weight: 700; color: #d6b25e; letter-spacing: 1px;">STONES:</span>
        <span id="stone-1" style="font-size: 16px; opacity: 0.25;">◆</span>
        <span id="stone-2" style="font-size: 16px; opacity: 0.25;">◆</span>
        <span id="stone-3" style="font-size: 16px; opacity: 0.25;">◆</span>
      </div>

      <!-- Top Center: Hint / Objective Banner -->
      <div id="hud-hint" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); padding: 8px 18px; background: rgba(10, 16, 12, 0.88); border-radius: 20px; border: 1px solid rgba(120, 194, 146, 0.25); color: #e2e8f0; font-size: 12px; font-weight: 600; text-align: center; max-width: 600px; display: none;">
      </div>

      <!-- Center-Bottom: Interaction Banner (Press E) -->
      <div id="hud-interact" style="position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); padding: 8px 20px; background: rgba(214, 178, 94, 0.9); color: #0a100c; font-size: 13px; font-weight: 700; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: none;">
        PRESS [E] TO INTERACT
      </div>

      <!-- Escape Charge Countdown -->
      <div id="hud-escape" style="position: absolute; top: 75px; left: 50%; transform: translateX(-50%); padding: 10px 24px; background: rgba(224, 88, 74, 0.9); color: #ffffff; font-size: 15px; font-weight: 800; border-radius: 8px; letter-spacing: 1px; display: none; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
        GATE CHARGING: 60s
      </div>
    `;

    document.body.appendChild(this.container);

    this.healthFill = document.getElementById('hud-health-fill')!;
    this.staminaFill = document.getElementById('hud-stamina-fill')!;
    this.healthText = document.getElementById('hud-health-text')!;
    this.staminaText = document.getElementById('hud-stamina-text')!;
    this.statusBadge = document.getElementById('hud-status')!;
    this.hintBanner = document.getElementById('hud-hint')!;
    this.interactBanner = document.getElementById('hud-interact')!;
    this.escapeTimerBanner = document.getElementById('hud-escape')!;
  }

  public update(
    health: number,
    maxHealth: number,
    stamina: number,
    maxStamina: number,
    isWinded: boolean,
    stonesCollected: number,
    hintText: string | null,
    canInteractPrompt: string | null,
    escapeSecondsRemaining: number | null
  ): void {
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

    // Update Stones Display
    for (let i = 1; i <= 3; i++) {
      const stoneElem = document.getElementById(`stone-${i}`);
      if (stoneElem) {
        if (i <= stonesCollected) {
          stoneElem.style.opacity = '1.0';
          stoneElem.style.color = '#d6b25e';
          stoneElem.style.textShadow = '0 0 10px #d6b25e';
        } else {
          stoneElem.style.opacity = '0.25';
          stoneElem.style.color = '#a0aec0';
          stoneElem.style.textShadow = 'none';
        }
      }
    }

    // Hint Banner
    if (hintText) {
      this.hintBanner.textContent = hintText;
      this.hintBanner.style.display = 'block';
    } else {
      this.hintBanner.style.display = 'none';
    }

    // Interaction Prompt
    if (canInteractPrompt) {
      this.interactBanner.textContent = canInteractPrompt;
      this.interactBanner.style.display = 'block';
    } else {
      this.interactBanner.style.display = 'none';
    }

    // Escape Countdown
    if (escapeSecondsRemaining !== null && escapeSecondsRemaining > 0) {
      this.escapeTimerBanner.textContent = `GATE CHARGING: ${Math.ceil(escapeSecondsRemaining)}s (SURVIVE!)`;
      this.escapeTimerBanner.style.display = 'block';
    } else if (escapeSecondsRemaining === 0) {
      this.escapeTimerBanner.textContent = `GATE OPEN! RUN TO THE NORTH EXIT!`;
      this.escapeTimerBanner.style.background = '#48bb78';
      this.escapeTimerBanner.style.display = 'block';
    } else {
      this.escapeTimerBanner.style.display = 'none';
    }
  }

  public destroy(): void {
    this.container.remove();
  }
}
