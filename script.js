const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');
const agentList = document.getElementById('agentList');

const levelValue = document.getElementById('levelValue');
const weaponName = document.getElementById('weaponName');
const abilityName = document.getElementById('abilityName');
const healthValue = document.getElementById('healthValue');
const ammoValue = document.getElementById('ammoValue');
const scoreValue = document.getElementById('scoreValue');
const threatValue = document.getElementById('threatValue');
const zoneValue = document.getElementById('zoneValue');

const agentData = {
  Vesper: {
    className: 'Shadow Dancer',
    weapon: 'Bone Chime',
    ability: 'Shadow Slip',
    color: '#a5a3ff',
    health: 100,
    speed: 3.2,
    fireRate: 0.18,
    damage: 13,
    maxAmmo: 18,
    ammo: 18,
    reloadTime: 1.4
  },
  Mire: {
    className: 'Fog Warden',
    weapon: 'Lantern Breaker',
    ability: 'Veil Pulse',
    color: '#89f0c9',
    health: 112,
    speed: 2.8,
    fireRate: 0.22,
    damage: 14,
    maxAmmo: 12,
    ammo: 12,
    reloadTime: 1.7
  },
  Sable: {
    className: 'Sanctifier',
    weapon: 'Hollow Spine',
    ability: 'Grace Field',
    color: '#ffdb9d',
    health: 118,
    speed: 2.9,
    fireRate: 0.17,
    damage: 11,
    maxAmmo: 30,
    ammo: 30,
    reloadTime: 1.2
  },
  Rook: {
    className: 'Iron Bastion',
    weapon: 'Ashen Reaper',
    ability: 'Fortify',
    color: '#f7a3a3',
    health: 132,
    speed: 2.4,
    fireRate: 0.3,
    damage: 17,
    maxAmmo: 10,
    ammo: 10,
    reloadTime: 1.9
  },
  Nox: {
    className: 'Echo Seeker',
    weapon: 'Grave Echo',
    ability: 'Pulse Scan',
    color: '#aef5ff',
    health: 96,
    speed: 3.5,
    fireRate: 0.14,
    damage: 16,
    maxAmmo: 8,
    ammo: 8,
    reloadTime: 1.5
  }
};

const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };

let activeAgent = 'Vesper';
let gameRunning = false;
let lastTime = 0;
let score = 0;
let level = 1;
let threat = 1;
let objectiveIndex = 0;
let spawnTimer = 0;
let reloadTimer = 0;
let abilityCooldown = 0;
let cameraShake = 0;

const objectives = [
  { name: 'Valley Point', x: 180, y: 150, radius: 70 },
  { name: 'Chapel Lift', x: 700, y: 180, radius: 70 },
  { name: 'Signal Tower', x: 470, y: 420, radius: 90 }
];

const obstacles = [
  { x: 250, y: 80, w: 110, h: 52 },
  { x: 600, y: 80, w: 120, h: 52 },
  { x: 170, y: 260, w: 110, h: 90 },
  { x: 680, y: 250, w: 110, h: 90 },
  { x: 400, y: 260, w: 140, h: 58 },
  { x: 360, y: 430, w: 200, h: 60 }
];

function makeAgentButtons() {
  agentList.innerHTML = '';
  Object.entries(agentData).forEach(([name, data]) => {
    const card = document.createElement('button');
    card.className = 'agent-card active';
    if (name !== activeAgent) card.className = 'agent-card';
    card.type = 'button';
    card.innerHTML = `<strong>${name}</strong><small>${data.className}</small>`;
    card.addEventListener('click', () => {
      activeAgent = name;
      initPlayer();
      makeAgentButtons();
    });
    agentList.appendChild(card);
  });
}

function initPlayer() {
  const data = agentData[activeAgent];
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 16,
    health: data.health,
    speed: data.speed,
    weapon: data.weapon,
    ability: data.ability,
    color: data.color,
    fireRate: data.fireRate,
    damage: data.damage,
    maxAmmo: data.maxAmmo,
    ammo: data.ammo,
    reloadTime: data.reloadTime,
    lastShot: 0,
    reloading: false,
    level: 1,
    angle: 0,
    state: 'ready'
  };

  weaponName.textContent = data.weapon;
  abilityName.textContent = data.ability;
  healthValue.textContent = Math.ceil(player.health);
  ammoValue.textContent = `${player.ammo} / ${player.maxAmmo}`;
}

let player = null;

function resetGame() {
  initPlayer();
  score = 0;
  level = 1;
  threat = 1;
  objectiveIndex = 0;
  enemies = [];
  for (let i = 0; i < 7; i += 1) {
    enemies.push(createEnemy());
  }
}

function createEnemy() {
  const x = Math.random() * (canvas.width - 80) + 40;
  const y = Math.random() * (canvas.height - 80) + 40;
  return {
    x,
    y,
    radius: 14,
    health: 40 + level * 7,
    speed: 1.2 + Math.random() * 0.6 + threat * 0.2,
    color: '#ff5578',
    attackCooldown: 0,
    direction: Math.random() * Math.PI * 2
  };
}

function startGame() {
  resetGame();
  gameRunning = true;
  overlay.classList.add('hidden');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function collidesCircleRect(x, y, radius, rect) {
  const closestX = clamp(x, rect.x, rect.x + rect.w);
  const closestY = clamp(y, rect.y, rect.y + rect.h);
  return Math.hypot(x - closestX, y - closestY) < radius;
}

function movePlayer(dt) {
  const data = agentData[activeAgent];
  let dx = 0;
  let dy = 0;

  if (keys['w'] || keys['ArrowUp']) dy -= 1;
  if (keys['s'] || keys['ArrowDown']) dy += 1;
  if (keys['a'] || keys['ArrowLeft']) dx -= 1;
  if (keys['d'] || keys['ArrowRight']) dx += 1;

  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const sprintBoost = keys['Shift'] ? 1.35 : 1;
    const nextX = player.x + (dx * player.speed * sprintBoost * dt * 60);
    const nextY = player.y + (dy * player.speed * sprintBoost * dt * 60);

    let validX = nextX;
    let validY = nextY;

    for (const rect of obstacles) {
      if (collidesCircleRect(validX, player.y, player.radius, rect)) validX = player.x;
      if (collidesCircleRect(player.x, validY, player.radius, rect)) validY = player.y;
    }

    player.x = clamp(validX, player.radius, canvas.width - player.radius);
    player.y = clamp(validY, player.radius, canvas.height - player.radius);
  }

  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.angle = angle;

  if (keys[' '] && abilityCooldown <= 0) {
    useAbility();
  }

  if (keys['r'] && !player.reloading && player.ammo < player.maxAmmo) {
    startReload();
  }

  if (player.reloading) {
    reloadTimer -= dt;
    if (reloadTimer <= 0) {
      const needed = player.maxAmmo - player.ammo;
      player.ammo += needed;
      player.reloading = false;
      ammoValue.textContent = `${player.ammo} / ${player.maxAmmo}`;
    }
  }

  abilityCooldown = Math.max(0, abilityCooldown - dt);
}

function startReload() {
  player.reloading = true;
  reloadTimer = player.reloadTime;
}

function useAbility() {
  const ability = player.ability;
  if (ability === 'Shadow Slip') {
    player.x = clamp(player.x + Math.cos(player.angle) * 42, player.radius, canvas.width - player.radius);
    player.y = clamp(player.y + Math.sin(player.angle) * 42, player.radius, canvas.height - player.radius);
  }

  if (ability === 'Veil Pulse') {
    for (const enemy of enemies) {
      if (distance(player, enemy) < 110) {
        enemy.health -= 18;
      }
    }
  }

  if (ability === 'Grace Field') {
    player.health = clamp(player.health + 18, 0, agentData[activeAgent].health);
    healthValue.textContent = Math.ceil(player.health);
  }

  if (ability === 'Fortify') {
    player.health = clamp(player.health + 24, 0, agentData[activeAgent].health);
  }

  if (ability === 'Pulse Scan') {
    for (const enemy of enemies) {
      enemy.color = '#d3f3ff';
    }
  }

  abilityCooldown = 3.2;
}

function shoot() {
  if (!gameRunning) return;
  const now = performance.now();
  if (now - player.lastShot < player.fireRate * 1000) return;
  if (player.reloading) return;
  if (player.ammo <= 0) {
    startReload();
    return;
  }

  player.lastShot = now;
  player.ammo -= 1;
  ammoValue.textContent = `${player.ammo} / ${player.maxAmmo}`;
  cameraShake = 6;

  const shot = {
    x: player.x + Math.cos(player.angle) * 20,
    y: player.y + Math.sin(player.angle) * 20,
    vx: Math.cos(player.angle) * 8,
    vy: Math.sin(player.angle) * 8,
    radius: 4,
    ttl: 0.4
  };

  projectiles.push(shot);

  let hitEnemy = false;
  for (const enemy of enemies) {
    const dist = distance({ x: shot.x, y: shot.y }, enemy);
    if (dist < enemy.radius + shot.radius + 2) {
      enemy.health -= player.damage;
      hitEnemy = true;
      if (enemy.health <= 0) {
        score += 25;
        level = Math.max(1, Math.floor(score / 100) + 1);
        scoreValue.textContent = String(score);
        levelValue.textContent = String(level);
        threat = Math.min(5, 1 + level * 0.25);
        threatValue.textContent = threat < 2 ? 'Low' : threat < 3 ? 'Medium' : threat < 4 ? 'High' : 'Extreme';
      }
      break;
    }
  }

  if (!hitEnemy) {
    cameraShake *= 0.6;
  }

  if (player.ammo <= 0) {
    startReload();
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i];
    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;
    p.ttl -= dt;

    if (p.ttl <= 0 || p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height) {
      projectiles.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    const distToPlayer = distance(player, enemy);

    if (distToPlayer < 160) {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.x += Math.cos(angle) * enemy.speed * dt * 60;
      enemy.y += Math.sin(angle) * enemy.speed * dt * 60;
      if (distToPlayer < 50 && enemy.attackCooldown <= 0) {
        player.health -= 8 + threat * 2;
        healthValue.textContent = Math.ceil(player.health);
        enemy.attackCooldown = 0.7;
        cameraShake = 8;
        if (player.health <= 0) {
          loseGame();
        }
      }
    }

    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    enemy.x = clamp(enemy.x, 10, canvas.width - 10);
    enemy.y = clamp(enemy.y, 10, canvas.height - 10);

    if (enemy.health <= 0) {
      enemies.splice(i, 1);
      if (enemies.length < 6 + level) {
        enemies.push(createEnemy());
      }
      score += 50;
      scoreValue.textContent = String(score);
      level = Math.max(1, Math.floor(score / 150) + 1);
      levelValue.textContent = String(level);
      threat = Math.min(5, 1 + level * 0.35);
      threatValue.textContent = threat < 2 ? 'Low' : threat < 3 ? 'Medium' : threat < 4 ? 'High' : 'Extreme';
    }
  }
}

function checkObjectives() {
  const objective = objectives[objectiveIndex];
  if (distance(player, objective) < objective.radius + 8) {
    objectiveIndex += 1;
    if (objectiveIndex >= objectives.length) {
      objectiveIndex = 0;
      score += 200;
      scoreValue.textContent = String(score);
      level += 1;
      levelValue.textContent = String(level);
    }
  }
  zoneValue.textContent = objectives[objectiveIndex].name;
}

function loseGame() {
  gameRunning = false;
  overlay.classList.remove('hidden');
  document.querySelector('.overlay-card h2').textContent = 'Mission Failed';
  document.querySelector('.overlay-card p').textContent = 'The fog took the district. Re-deploy and try a new run.';
  startButton.textContent = 'Retry';
}

function drawBackground() {
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1f2d3b';
  for (const obj of obstacles) {
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  }

  for (let i = 0; i < objectives.length; i += 1) {
    const obj = objectives[i];
    const active = i === objectiveIndex;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.strokeStyle = active ? '#8cd3ff' : '#7d8ea3';
    ctx.lineWidth = active ? 4 : 2;
    ctx.setLineDash(active ? [12, 6] : [4, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = '#2d4251';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eaf6ff';
  ctx.fillRect(12, -2, 18, 4);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(player.ability, player.x - 26, player.y - 24);
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0e1822';
    ctx.fillRect(enemy.x - 18, enemy.y - 22, 36, 6);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(enemy.x - 18, enemy.y - 22, 36 * (Math.max(enemy.health, 0) / 60), 6);
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawUI() {
  ctx.fillStyle = 'rgba(10, 12, 18, 0.8)';
  ctx.fillRect(16, 16, 250, 64);
  ctx.fillStyle = '#dfeeff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`Agent: ${activeAgent}`, 30, 40);
  ctx.fillText(`Health: ${Math.ceil(player.health)}`, 30, 60);
}

let projectiles = [];
let enemies = [];

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.033);
  lastTime = timestamp;

  if (gameRunning) {
    if (player) {
      movePlayer(dt);
      updateProjectiles(dt);
      updateEnemies(dt);
      checkObjectives();
    }

    spawnTimer += dt;
    if (spawnTimer > 2.2 && enemies.length < 9) {
      spawnTimer = 0;
      enemies.push(createEnemy());
    }
  }

  drawBackground();
  if (player) {
    drawPlayer();
    drawProjectiles();
    drawEnemies();
    drawUI();
  }

  if (cameraShake > 0) {
    ctx.translate(Math.random() * cameraShake - cameraShake / 2, Math.random() * cameraShake - cameraShake / 2);
    cameraShake *= 0.85;
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('mousedown', () => {
  mouse.down = true;
  shoot();
});

canvas.addEventListener('mouseup', () => {
  mouse.down = false;
});

startButton.addEventListener('click', () => {
  document.querySelector('.overlay-card h2').textContent = 'Hold the Night';
  document.querySelector('.overlay-card p').textContent = 'Survive the cursed horde and secure the three control points in the abandoned district before the fog consumes the city.';
  startButton.textContent = 'Deploy';
  startGame();
});

makeAgentButtons();
initPlayer();
resetGame();
scoreValue.textContent = '0';
levelValue.textContent = '1';
zoneValue.textContent = 'Valley Point';
requestAnimationFrame(gameLoop);

setInterval(() => {
  if (gameRunning && mouse.down) shoot();
}, 10);

window.addEventListener('blur', () => {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  mouse.down = false;
});

setInterval(() => {
  if (gameRunning) {
    const objective = objectives[objectiveIndex];
    if (objective) {
      zoneValue.textContent = objective.name;
    }
  }
}, 250);

const info = document.getElementById('missionList');
info.innerHTML = objectives.map((objective) => `<li>${objective.name}</li>`).join('');

if (!player) {
  initPlayer();
}

window.focus();

console.log('Nightfall Protocol loaded.');

// For simple playtesting, keep the game active after initial build.
startGame();



































































