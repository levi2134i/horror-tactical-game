* {
  box-sizing: border-box;
}

:root {
  --bg: #090d14;
  --panel: rgba(14, 20, 30, 0.86);
  --panel-border: rgba(149, 176, 255, 0.25);
  --primary: #90d3ff;
  --secondary: #8be6cb;
  --danger: #ff6284;
  --warning: #ffd166;
  --muted: #b9c9d6;
  --dark: #04070c;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: radial-gradient(circle at top, #162130 0%, #080d12 42%, #020509 100%);
  color: #ebf4ff;
  font-family: Arial, Helvetica, sans-serif;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hud-shell {
  width: min(1500px, calc(100vw - 30px));
  margin: 14px auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.game-title h1 {
  margin: 0;
  font-size: clamp(24px, 2vw, 36px);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--secondary);
}

.match-stats {
  display: flex;
  gap: 18px;
}

.stat-item {
  min-width: 130px;
  background: rgba(10, 14, 21, 0.8);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 10px 14px;
  text-align: center;
  box-shadow: 0 0 20px rgba(80, 160, 255, 0.18);
}

.stat-item span {
  display: block;
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-item strong {
  display: block;
  margin-top: 6px;
  font-size: 22px;
  color: var(--primary);
}

.game-container {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  gap: 14px;
}

.sidebar {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.sidebar h3 {
  margin: 0 0 12px;
  color: var(--primary);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.14em;
}

.agent-panel {
  display: grid;
  gap: 10px;
}

.agent-option {
  background: rgba(22, 31, 43, 0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.agent-option:hover,
.agent-option.active {
  border-color: rgba(144, 211, 255, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px rgba(144, 211, 255, 0.4);
}

.agent-option strong {
  display: block;
  margin-bottom: 4px;
}

.agent-option small {
  color: var(--muted);
}

.loadout-box, .zone-info {
  display: grid;
  gap: 10px;
}

.weapon-slot, .zone-info > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 8px;
}

.weapon-slot span, .zone-info span {
  color: var(--muted);
}

.inventory-list {
  display: grid;
  gap: 8px;
}

.inventory-item {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(16, 25, 36, 0.85);
  color: var(--muted);
  border: 1px solid rgba(255,255,255,0.06);
}

.game-area {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  background: linear-gradient(180deg, #040b12, #09141b 38%, #071218 100%);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.52);
}

#gameCanvas {
  display: block;
  width: 100%;
  height: auto;
  background: linear-gradient(180deg, #030a0d, #07151e 45%, #08151c 100%);
}

.crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.crosshair::before,
.crosshair::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,0.8);
}

.crosshair::before {
  width: 2px;
  height: 18px;
}

.crosshair::after {
  height: 2px;
  width: 18px;
}

.mini-map {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: 140px;
  height: 140px;
  background: rgba(6, 12, 17, 0.72);
  border: 1px solid rgba(144, 211, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 0 18px rgba(144, 211, 255, 0.18);
  padding: 8px;
}

#minimapCanvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 8px;
}

.damage-indicator {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgba(255, 70, 90, 0.0);
  transition: background 0.12s ease;
}

.match-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(4, 8, 12, 0.65);
  backdrop-filter: blur(5px);
}

.match-overlay.hidden {
  display: none;
}

.overlay-content {
  width: min(440px, 80%);
  background: rgba(11, 17, 25, 0.93);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  padding: 28px 22px;
  text-align: center;
  box-shadow: 0 28px 50px rgba(0,0,0,0.45);
}

.overlay-content h2 {
  margin: 0 0 12px;
  font-size: clamp(28px, 3vw, 42px);
}

.overlay-content p {
  margin: 0 0 14px;
  color: var(--muted);
  line-height: 1.6;
}

.agent-select-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin: 18px 0;
}

.agent-select-btn {
  background: rgba(20, 31, 42, 0.9);
  border: 1px solid rgba(255,255,255,0.08);
  color: white;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.agent-select-btn.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px rgba(144, 211, 255, 0.4);
}

.deploy-btn {
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #071017;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 14px;
  padding: 14px 26px;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(144, 211, 255, 0.26);
}

.kill-feed, .nearby-list {
  display: grid;
  gap: 10px;
}

.feed-item, .nearby-item {
  background: rgba(16, 25, 36, 0.84);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 9px 10px;
  color: var(--muted);
}

.feed-item strong {
  color: white;
}

.bottom-hud {
  display: grid;
  grid-template-columns: 1.2fr 0.4fr 0.3fr 0.5fr;
  gap: 18px;
  align-items: center;
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(10,14,20,0.8);
  border: 1px solid var(--panel-border);
}

.health-bar-container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.health-label, .ammo-label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 10px;
  color: var(--muted);
}

.health-bar {
  position: relative;
  height: 20px;
  background: rgba(255,255,255,0.08);
  border-radius: 99px;
  overflow: hidden;
}

.health-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 100%;
  background: linear-gradient(90deg, #47d36d, #53ec8a, #d7ff7d);
  border-radius: 99px;
}

.health-text {
  font-weight: 700;
  min-width: 80px;
  text-align: right;
}

.ammo-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ammo-counter {
  font-size: 22px;
  font-weight: 700;
}

.divider {
  opacity: 0.6;
}

.ability-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  width: 110px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}

.ability-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #071017;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.ability-cooldown {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--secondary);
}

.keybind {
  position: absolute;
  right: 8px;
  bottom: 6px;
  font-size: 9px;
  letter-spacing: 0.1em;
  opacity: 0.8;
}

.position-display {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
}

.position-display strong {
  color: white;
}

@media (max-width: 1050px) {
  .game-container {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .game-area {
    order: 1;
  }

  .bottom-hud {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .top-bar {
    display: block;
  }

  .match-stats {
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .bottom-hud {
    grid-template-columns: 1fr;
  }
}
