const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

const playersAliveEl = document.getElementById('playersAlive');
const zoneTimerEl = document.getElementById('zoneTimer');
const rankValueEl = document.getElementById('rankValue');
const primaryWeaponEl = document.getElementById('primaryWeapon');
const secondaryWeaponEl = document.getElementById('secondaryWeapon');
const utilityWeaponEl = document.getElementById('utilityWeapon');
const inventoryListEl = document.getElementById('inventoryList');
const killFeedEl = document.getElementById('killFeed');
const nearbyPlayersEl = document.getElementById('nearbyPlayers');
const zoneRadiusEl = document.getElementById('zoneRadius');
const threatLevelEl = document.getElementById('threatLevel');
const nextCircleEl = document.getElementById('nextCircle');
const healthFillEl = document.getElementById('healthFill');
const healthTextEl = document.getElementById('healthText');
const ammoMagEl = document.getElementById('ammoMag');
const ammoReserveEl = document.getElementById('ammoReserve');
const abilityIconEl = document.getElementById('abilityIcon');
const abilityCooldownEl = document.getElementById('abilityCooldown');
const posXEl = document.getElementById('posX');
const posYEl = document.getElementById('posY');
const fpsEl = document.getElementById('fps');
const damageIndicatorEl = document.getElementById('damageIndicator');
const matchOverlayEl = document.getElementById('matchOverlay');
const overlayTitleEl = document.getElementById('overlayTitle');
const overlayDescEl = document.getElementById('overlayDesc');
const overlayEyebrowEl = document.getElementById('overlayEyebrow');
const deployButtonEl = document.getElementById('deployButton');
const agentSelectContainerEl = document.getElementById('agentSelectContainer');
const agentPanelEl = document.getElementById('agentPanel');

const world = {
  width: canvas.width,
  height: canvas.height,
  zone: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 400,
    shrinkRate: 14,
    shrinkCooldown: 25,
    timer: 60,
    nextTimer: 45
  }
};

const agents = {
  Vesper: {
    role: 'Shadow Dancer',
    primary: 'Bone Chime',
    secondary: 'Morrow Pistol',
    utility: 'Shadow Slip',
    color: '#a4a8ff',
    health: 100,
    speed: 220,
    maxAmmo: 30,
    reserveAmmo: 120,
    damage: 18,
    fireRate: 0.16,
    abilityCooldown: 3.4,
    abilityKey: 'S'
  },
  Mire: {
    role: 'Fog Warden',
    primary: 'Lantern Breaker',
    secondary: 'Gloom Sidearm',
    utility: 'Veil Pulse',
    color: '#8de9c8',
    health: 112,
    speed: 210,
    maxAmmo: 26,
    reserveAmmo: 110,
    damage: 16,
    fireRate: 0.18,
    abilityCooldown: 3.8,
    abilityKey: 'V'
  },
  Sable: {
    role: 'Sanctifier',
    primary: 'Hollow Spine',
    secondary: 'Sanctum Pistol',
    utility: 'Grace Field',
    color: '#ffd890',
    health: 118,
    speed: 205,
    maxAmmo: 34,
    reserveAmmo: 136,
    damage: 15,
    fireRate: 0.14,
    abilityCooldown: 4.2,
    abilityKey: 'G'
  },
  Rook: {
    role: 'Iron Bastion',
    primary: 'Ashen Reaper',
    secondary: 'Grim Sidearm',
    utility: 'Fortify',
    color: '#ff9e9e',
    health: 130,
    speed: 190,
    maxAmmo: 22,
    reserveAmmo: 90,
    damage: 21,
    fireRate: 0.22,
    abilityCooldown: 5,
    abilityKey: 'F'
  },
  Nox: {
    role: 'Echo Seeker',
    primary: 'Grave Echo',
    secondary: 'Signal Pistol',
    utility: 'Pulse Scan',
    color: '#9feaff',
    health: 96,
    speed: 230,
    maxAmmo: 18,
    reserveAmmo: 72,
    damage: 25,
    fireRate: 0.12,
    abilityCooldown: 4.4,
    abilityKey: 'Q'
  }
};

let activeAgent = 'Vesper';
let gameState = 'menu';
let killFeed = [];
let nearbyPlayers = [];
let player = null;
let bots = [];
let projectiles = [];
let loot = [];
let lastFrame = 0;
let lastShotAt = 0;
let lastDamageFlash = 0;
let fpsCounter = 60;
let matchTime = 0;
let zoneTick = 0;
let selectedAgent = 'Vesper';

const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addKillFeed(text) {
  killFeed.unshift({ id: Date.now() + Math.random(), text });
  killFeed = killFeed.slice(0, 6);
}

function renderFeed() {
  killFeedEl.innerHTML = '';
  killFeed.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'feed-item';
    el.innerHTML = `<strong>${item.text}</strong>`;
    killFeedEl.appendChild(el);
  });
}

function renderNearby() {
  nearbyPlayersEl.innerHTML = '';
  const list = bots
    .filter((bot) => bot.alive && dist(bot, player) < 260)
    .slice(0, 5)
    .map((bot) => `Threat ${bot.name} • ${Math.ceil(dist(bot, player))}m`);

  if (!list.length) {
    nearbyPlayersEl.innerHTML = '<div class="nearby-item">No nearby threats detected.</div>';
    return;
  }

  list.forEach((entry) => {
    const el = document.createElement('div');
    el.className = 'nearby-item';
    el.textContent = entry;
    nearbyPlayersEl.appendChild(el);
  });
}

function renderInventory() {
  inventoryListEl.innerHTML = '';
  const items = [
    'Ritual Bandage',
    'Pulse Charger',
    'Smoke Flask',
    'Oath Key'
  ];

  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'inventory-item';
    el.textContent = item;
    inventoryListEl.appendChild(el);
  });
}

function updateAgentPanel() {
  agentPanelEl.innerHTML = '';
  Object.entries(agents).forEach(([name, data]) => {
    const card = document.createElement('div');
    card.className = 'agent-option ' + (selectedAgent === name ? 'active' : '');
    card.innerHTML = `<strong>${name}</strong><small>${data.role}</small>`;
    card.addEventListener('click', () => {
      selectedAgent = name;
      updateAgentPanel();
      renderSelector();
    });
    agentPanelEl.appendChild(card);
  });
}

function renderSelector() {
  agentSelectContainerEl.innerHTML = '';
  Object.keys(agents).forEach((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'agent-select-btn ' + (selectedAgent === name ? 'active' : '');
    button.textContent = name;
    button.addEventListener('click', () => {
      selectedAgent = name;
      renderSelector();
      updateAgentPanel();
    });
    agentSelectContainerEl.appendChild(button);
  });
}

function createPlayer() {
  const agent = agents[selectedAgent];
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 14,
    name: selectedAgent,
    color: agent.color,
    health: agent.health,
    maxHealth: agent.health,
    speed: agent.speed,
    damage: agent.damage,
    fireRate: agent.fireRate,
    maxAmmo: agent.maxAmmo,
    ammo: agent.maxAmmo,
    reserveAmmo: agent.reserveAmmo,
    ability: agent.utility,
    abilityCooldown: 0,
    abilityKey: agent.abilityKey,
    lastShot: 0,
    angle: 0,
    alive: true,
    reloading: false,
    reloadTime: 1.6
  };

  primaryWeaponEl.textContent = agent.primary;
  secondaryWeaponEl.textContent = agent.secondary;
  utilityWeaponEl.textContent = agent.utility;
  abilityIconEl.textContent = agent.abilityKey;
  ammoMagEl.textContent = String(player.ammo);
  ammoReserveEl.textContent = String(player.reserveAmmo);
  healthTextEl.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;
  healthFillEl.style.width = `${(player.health / player.maxHealth) * 100}%`;
}

function createBot(id) {
  const names = ['Wraith', 'Ruin', 'Sable', 'Hex', 'Morrow', 'Rook', 'Gloom', 'Nyx', 'Grim', 'Vark'];
  const colorOptions = ['#ff6688', '#9bdcff', '#c8ff73', '#ffd166', '#b0ffca', '#d0a7ff'];
  const x = rand(60, canvas.width - 60);
  const y = rand(60, canvas.height - 60);

  return {
    id,
    name: names[id % names.length] + '-' + Math.floor(Math.random() * 90 + 10),
    x,
    y,
    radius: 11,
    angle: rand(0, Math.PI * 2),
    color: colorOptions[id % colorOptions.length],
    health: 60,
    maxHealth: 60,
    speed: rand(70, 120),
    cooldown: rand(0.3, 1.2),
    alive: true,
    damage: 10,
    fireRate: rand(0.5, 1.2),
    aimBias: rand(0.7, 1.4)
  };
}

function spawnBots(count = 18) {
  bots = [];
  for (let i = 0; i < count; i += 1) {
    bots.push(createBot(i));
  }
}

function startMatch() {
  selectedAgent = activeAgent;
  createPlayer();
  spawnBots(18);
  killFeed = [];
  addKillFeed('Match started - Ashen District');
  renderFeed();
  matchOverlayEl.classList.add('hidden');
  gameState = 'playing';
  world.zone.radius = 400;
  world.zone.timer = 60;
  world.zone.nextTimer = 45;
  matchTime = 0;
  zoneTick = 0;
  updateHud();
}

function weaponFire() {
  if (gameState !== 'playing' || !player || !player.alive) return;
  const now = performance.now();
  if (now - player.lastShot < player.fireRate * 1000) return;
  if (player.reloading) return;
  if (player.ammo <= 0) {
    if (player.reserveAmmo > 0) {
      player.reloadTime = 1.2;
      player.reloading = true;
      player.reloadUntil = performance.now() + 1200;
    }
    return;
  }

  player.lastShot = now;
  player.ammo -= 1;
  const shot = {
    x: player.x + Math.cos(player.angle) * 20,
    y: player.y + Math.sin(player.angle) * 20,
    vx: Math.cos(player.angle) * 450,
    vy: Math.sin(player.angle) * 450,
    radius: 4,
    ttl: 0.7,
    owner: 'player',
    damage: player.damage,
    color: '#f4d878'
  };

  projectiles.push(shot);
  ammoMagEl.textContent = String(player.ammo);
  ammoReserveEl.textContent = String(player.reserveAmmo);
}

function useAbility() {
  if (!player || !player.alive || player.abilityCooldown > 0) return;
  const a = agents[selectedAgent];
  if (a.utility === 'Shadow Slip') {
    const moveX = Math.cos(player.angle) * 52;
    const moveY = Math.sin(player.angle) * 52;
    player.x = clamp(player.x + moveX, 18, canvas.width - 18);
    player.y = clamp(player.y + moveY, 18, canvas.height - 18);
  }

  if (a.utility === 'Veil Pulse') {
    bots.forEach((bot) => {
      if (bot.alive && dist(bot, player) < 180) {
        bot.health -= 22;
      }
    });
  }

  if (a.utility === 'Grace Field') {
    player.health = clamp(player.health + 24, 0, player.maxHealth);
  }

  if (a.utility === 'Fortify') {
    player.health = clamp(player.health + 30, 0, player.maxHealth);
  }

  if (a.utility === 'Pulse Scan') {
    bots.forEach((bot) => {
      if (bot.alive) bot.color = '#dff8ff';
    });
  }

  player.abilityCooldown = a.abilityCooldown;
  abilityCooldownEl.textContent = `${a.abilityCooldown.toFixed(1)}s`;
}

function handleReload() {
  if (!player || player.ammo >= player.maxAmmo || player.reserveAmmo <= 0 || player.reloading) return;
  player.reloading = true;
  player.reloadUntil = performance.now() + 1200;
}

function updateReload(dt) {
  if (!player || !player.reloading) return;
  if (performance.now() >= player.reloadUntil) {
    const needed = Math.min(player.maxAmmo - player.ammo, player.reserveAmmo);
    player.ammo += needed;
    player.reserveAmmo -= needed;
    player.reloading = false;
    ammoMagEl.textContent = String(player.ammo);
    ammoReserveEl.textContent = String(player.reserveAmmo);
  }
}

function updatePlayer(dt) {
  if (!player || !player.alive) return;

  let moveX = 0;
  let moveY = 0;

  if (keys.w || keys.ArrowUp) moveY -= 1;
  if (keys.s || keys.ArrowDown) moveY += 1;
  if (keys.a || keys.ArrowLeft) moveX -= 1;
  if (keys.d || keys.ArrowRight) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.hypot(moveX, moveY);
    moveX /= len;
    moveY /= len;
    const sprint = keys.Shift ? 1.35 : 1;
    const nextX = player.x + (moveX * player.speed * sprint * dt);
    const nextY = player.y + (moveY * player.speed * sprint * dt);
    player.x = clamp(nextX, 18, world.width - 18);
    player.y = clamp(nextY, 18, world.height - 18);
  }

  const mx = mouse.x - player.x;
  const my = mouse.y - player.y;
  player.angle = Math.atan2(my, mx);

  if (player.abilityCooldown > 0) {
    player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);
    const display = player.abilityCooldown > 0 ? `${player.abilityCooldown.toFixed(1)}s` : 'READY';
    abilityCooldownEl.textContent = display;
  }

  updateReload(dt);
  if (keys[' '] && player.abilityCooldown <= 0) {
    useAbility();
  }

  if (keys.r) {
    handleReload();
  }

  posXEl.textContent = Math.round(player.x);
  posYEl.textContent = Math.round(player.y);
}

function updateBots(dt) {
  bots.forEach((bot) => {
    if (!bot.alive) return;

    const dx = player.x - bot.x;
    const dy = player.y - bot.y;
    const d = Math.hypot(dx, dy) || 1;

    if (d < 240) {
      bot.angle = Math.atan2(dy, dx);
      bot.x += (dx / d) * bot.speed * dt * (player.health < 35 ? 1.2 : 1);
      bot.y += (dy / d) * bot.speed * dt * (player.health < 35 ? 1.2 : 1);
    } else {
      bot.x += Math.cos(bot.angle) * 30 * dt;
      bot.y += Math.sin(bot.angle) * 30 * dt;
      if (bot.x < 30 || bot.x > world.width - 30) bot.angle = Math.PI - bot.angle;
      if (bot.y < 30 || bot.y > world.height - 30) bot.angle = -bot.angle;
    }

    if (d < 170 && bot.cooldown <= 0) {
      const bullet = {
        x: bot.x + Math.cos(bot.angle) * 14,
        y: bot.y + Math.sin(bot.angle) * 14,
        vx: Math.cos(bot.angle) * 260,
        vy: Math.sin(bot.angle) * 260,
        radius: 3,
        ttl: 1.2,
        owner: 'bot',
        damage: bot.damage,
        color: '#ff7d7d'
      };
      projectiles.push(bullet);
      bot.cooldown = bot.fireRate;
    }

    bot.cooldown = Math.max(0, bot.cooldown - dt);
  });
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const shot = projectiles[i];
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.ttl -= dt;

    if (shot.ttl <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    if (shot.owner === 'player') {
      for (const bot of bots) {
        if (!bot.alive) continue;
        if (dist(shot, bot) < bot.radius + shot.radius) {
          bot.health -= player.damage;
          projectiles.splice(i, 1);
          if (bot.health <= 0) {
            bot.alive = false;
            addKillFeed(`${player.name} eliminated ${bot.name}`);
            renderFeed();
            if (player) {
              player.reserveAmmo += 12;
            }
          }
          break;
        }
      }
    } else if (shot.owner === 'bot') {
      if (player && dist(shot, player) < player.radius + shot.radius) {
        player.health -= shot.damage;
        damageIndicatorEl.style.background = 'rgba(255, 80, 110, 0.25)';
        lastDamageFlash = performance.now();
        projectiles.splice(i, 1);
        if (player.health <= 0) {
          player.alive = false;
          gameState = 'ended';
          matchOverlayEl.classList.remove('hidden');
          overlayEyebrowEl.textContent = 'Match Over';
          overlayTitleEl.textContent = 'You Were Eliminated';
          overlayDescEl.textContent = 'The nightmare closes in. Redeploy and try again.';
          deployButtonEl.textContent = 'Retry';
          addKillFeed('You were eliminated');
          renderFeed();
        }
      }
    }
  }
}

function updateZone(dt) {
  world.zone.timer -= dt;
  world.zone.nextTimer -= dt;

  if (world.zone.nextTimer <= 0) {
    world.zone.radius = Math.max(140, world.zone.radius - 55);
    world.zone.nextTimer = 45;
  }

  const outside = dist(player, world.zone) > world.zone.radius;
  if (outside) {
    player.health -= dt * 11;
    damageIndicatorEl.style.background = 'rgba(255, 110, 90, 0.18)';
    if (player.health <= 0) {
      player.alive = false;
      gameState = 'ended';
      matchOverlayEl.classList.remove('hidden');
      overlayEyebrowEl.textContent = 'Match Over';
      overlayTitleEl.textContent = 'Zone Collapse';
      overlayDescEl.textContent = 'The cursed storm ended the run.';
      deployButtonEl.textContent = 'Retry';
    }
  }

  zoneTimerEl.textContent = `${Math.max(0, Math.ceil(world.zone.timer))}s`;
  nextCircleEl.textContent = `${Math.max(0, Math.ceil(world.zone.nextTimer))}s`;
  zoneRadiusEl.textContent = `${Math.round(world.zone.radius)}m`;
  threatLevelEl.textContent = world.zone.radius < 220 ? 'Extreme' : world.zone.radius < 300 ? 'High' : 'Low';
}

function updateHud() {
  const aliveCount = (player && player.alive ? 1 : 0) + bots.filter((bot) => bot.alive).length;
  playersAliveEl.textContent = String(aliveCount);
  rankValueEl.textContent = `#${Math.max(1, 101 - aliveCount)}`;

  if (aliveCount === 1 && player.alive) {
    gameState = 'ended';
    matchOverlayEl.classList.remove('hidden');
    overlayEyebrowEl.textContent = 'Winner Winner';
    overlayTitleEl.textContent = 'Last One Standing';
    overlayDescEl.textContent = 'You survived the Ashen District and claimed the match.';
    deployButtonEl.textContent = 'Play Again';
  }

  if (player && player.alive) {
    healthFillEl.style.width = `${(player.health / player.maxHealth) * 100}%`;
    healthTextEl.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;
    ammoMagEl.textContent = String(player.ammo);
    ammoReserveEl.textContent = String(player.reserveAmmo);
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, world.width, world.height);

  const grd = ctx.createLinearGradient(0, 0, 0, world.height);
  grd.addColorStop(0, '#07151d');
  grd.addColorStop(0.5, '#0b1b25');
  grd.addColorStop(1, '#081019');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.height);
    ctx.stroke();
  }
  for (let y = 0; y <= world.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(world.zone.x, world.zone.y, world.zone.radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#69d2ff';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(120, 220, 255, 0.05)';
  ctx.fillRect(0, 0, world.width, world.height);
}

function drawLoot() {
  loot.forEach((item) => {
    ctx.fillStyle = '#9df0ff';
    ctx.fillRect(item.x - 5, item.y - 5, 10, 10);
  });
}

function drawPlayer() {
  if (!player || !player.alive) return;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eaf4ff';
  ctx.fillRect(14, -2, 16, 4);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(player.name, player.x - 18, player.y - 22);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(player.x - 18, player.y - 30, 36, 6);
  ctx.fillStyle = '#8ef0b0';
  ctx.fillRect(player.x - 18, player.y - 30, 36 * (player.health / player.maxHealth), 6);
}

function drawBots() {
  bots.forEach((bot) => {
    if (!bot.alive) return;
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText(bot.name.split('-')[0], bot.x - 12, bot.y - 16);

    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(bot.x - 16, bot.y - 24, 32, 5);
    ctx.fillStyle = '#ff7f7f';
    ctx.fillRect(bot.x - 16, bot.y - 24, 32 * (bot.health / bot.maxHealth), 5);
  });
}

function drawProjectiles() {
  projectiles.forEach((shot) => {
    ctx.fillStyle = shot.color;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMinimap() {
  minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  minimapCtx.fillStyle = '#0b1620';
  minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  minimapCtx.strokeStyle = '#7dd9ff';
  minimapCtx.beginPath();
  minimapCtx.arc(minimapCanvas.width / 2, minimapCanvas.height / 2, 52, 0, Math.PI * 2);
  minimapCtx.stroke();

  if (player) {
    const px = (player.x / world.width) * minimapCanvas.width;
    const py = (player.y / world.height) * minimapCanvas.height;
    minimapCtx.fillStyle = '#8de9c8';
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  bots.forEach((bot) => {
    if (!bot.alive) return;
    const bx = (bot.x / world.width) * minimapCanvas.width;
    const by = (bot.y / world.height) * minimapCanvas.height;
    minimapCtx.fillStyle = '#ff708d';
    minimapCtx.beginPath();
    minimapCtx.arc(bx, by, 3, 0, Math.PI * 2);
    minimapCtx.fill();
  });
}

function updateDamageIndicator() {
  if (performance.now() - lastDamageFlash > 120) {
    damageIndicatorEl.style.background = 'rgba(255, 70, 90, 0.0)';
  }
}

function loop(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const dt = Math.min((timestamp - lastFrame) / 1000, 0.033);
  lastFrame = timestamp;

  if (gameState === 'playing') {
    matchTime += dt;
    zoneTick += dt;
    updatePlayer(dt);
    updateBots(dt);
    updateProjectiles(dt);
    updateZone(dt);
    updateHud();
    renderNearby();
  }

  drawBackground();
  drawLoot();
  drawProjectiles();
  drawBots();
  drawPlayer();
  drawMinimap();
  updateDamageIndicator();

  if (gameState === 'playing' && player && player.alive) {
    const aliveCount = bots.filter((bot) => bot.alive).length + 1;
    playersAliveEl.textContent = String(aliveCount);
  }

  fpsCounter = 1 / Math.max(dt, 0.016);
  fpsEl.textContent = String(Math.round(fpsCounter));

  requestAnimationFrame(loop);
}

function bindEvents() {
  document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (event.key === ' ') {
      event.preventDefault();
    }
  });

  document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });

  canvas.addEventListener('mousedown', () => {
    mouse.down = true;
    if (gameState === 'playing') weaponFire();
  });

  canvas.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  window.addEventListener('blur', () => {
    Object.keys(keys).forEach((key) => {
      keys[key] = false;
    });
    mouse.down = false;
  });

  deployButtonEl.addEventListener('click', () => {
    activeAgent = selectedAgent;
    startMatch();
  });
}

function init() {
  renderFeed();
  renderSelector();
  updateAgentPanel();
  renderInventory();
  createPlayer();
  spawnBots(18);
  bindEvents();
  updateHud();
  requestAnimationFrame(loop);
}

init();

window.focus();

setInterval(() => {
  if (gameState === 'playing' && player && mouse.down) {
    weaponFire();
  }
}, 30);

setInterval(() => {
  if (gameState === 'playing' && player && player.alive) {
    renderNearby();
  }
}, 250);

setInterval(() => {
  if (gameState === 'playing' && player && player.alive && player.abilityCooldown > 0) {
    abilityCooldownEl.textContent = `${player.abilityCooldown.toFixed(1)}s`;
  }
}, 100);





























































































































































































































































































































































































































































































































































































































































































































































































































































































n



























































































































































































































































































n








































n








































n




















n




















n














n










n


n










n










n


n
n







n


n


n

n




n

n




a

n

n

n

n

n

n

n

n

n

n

n

n



n

n

n

n

n

n

n

n


n

n
n

n

n

n

n

n
n

n

n

n

n
n

n

n

n

n

n

n

n

n

n

n

n
n


n

n
n

n

n
n

n

n

n

n

a

n

n
n

n

n

n

n
n

n

n

n


n

n

n

n
n

n
n

n

n

n

n

n

n

n

n

n
n

n

n

n
n
n

n

n

n

n

n
n

n

n

n

n
n

n

n

n

n

n

n

n

n

n


n

n

n

n

n

"}]} ivoq to=functions.push_files  (commentary to=functions.push_files  in=multi_tool_use.parallel  ???sessions to=multi_tool_use.parallel  ???)  
