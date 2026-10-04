const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

const interactButton = document.getElementById("interact");
const messageBox = document.getElementById("message");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

const world = {
  width: 1600,
  height: 1600
};

const player = {
  x: 800,
  y: 900,
  width: 28,
  height: 38,
  speed: 190,
  hp: 100,
  gold: 10,
  dir: "down"
};

const buildings = [
  { name: "성", x: 650, y: 100, w: 300, h: 190 },
  { name: "훈련장", x: 180, y: 420, w: 260, h: 180 },
  { name: "시장", x: 1160, y: 420, w: 260, h: 180 },
  { name: "주점", x: 310, y: 850, w: 220, h: 170 },
  { name: "대장간", x: 1070, y: 850, w: 220, h: 170 },
  { name: "집", x: 680, y: 1150, w: 240, h: 170 },
  { name: "농장", x: 600, y: 1420, w: 400, h: 130 }
];

const npcs = [
  { name: "마르틴", role: "대장장이", x: 1030, y: 1080 },
  { name: "엘라", role: "상인", x: 1170, y: 650 },
  { name: "로웬", role: "용병", x: 420, y: 680 }
];

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

let joystickVector = { x: 0, y: 0 };
let joystickActive = false;

function moveJoystick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = clientX - centerX;
  let dy = clientY - centerY;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = 38;

  if (distance > maxDistance) {
    dx = dx / distance * maxDistance;
    dy = dy / distance * maxDistance;
  }

  stick.style.transform = `translate(${dx}px, ${dy}px)`;

  joystickVector.x = dx / maxDistance;
  joystickVector.y = dy / maxDistance;
}

joystick.addEventListener("pointerdown", e => {
  joystickActive = true;
  joystick.setPointerCapture(e.pointerId);
  moveJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointermove", e => {
  if (!joystickActive) return;
  moveJoystick(e.clientX, e.clientY);
});

function stopJoystick() {
  joystickActive = false;
  joystickVector.x = 0;
  joystickVector.y = 0;
  stick.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerup", stopJoystick);
joystick.addEventListener("pointercancel", stopJoystick);

function collides(x, y) {
  const left = x - player.width / 2;
  const right = x + player.width / 2;
  const top = y - player.height / 2;
  const bottom = y + player.height / 2;

  for (const building of buildings) {
    if (
      right > building.x &&
      left < building.x + building.w &&
      bottom > building.y &&
      top < building.y + building.h
    ) {
      return true;
    }
  }

  return false;
}

function getNearbyNPC() {
  let closest = null;
  let closestDistance = 90;

  for (const npc of npcs) {
    const dx = npc.x - player.x;
    const dy = npc.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < closestDistance) {
      closest = npc;
      closestDistance = distance;
    }
  }

  return closest;
}

let nearbyNPC = null;

interactButton.addEventListener("pointerdown", () => {
  if (!nearbyNPC) return;
  showMessage(`${nearbyNPC.name} · ${nearbyNPC.role}`);
});

let messageTimer;

function showMessage(text) {
  messageBox.textContent = text;
  messageBox.style.display = "block";

  clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {
    messageBox.style.display = "none";
  }, 2500);
}

function update(dt) {
  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  dx += joystickVector.x;
  dy += joystickVector.y;

  const length = Math.sqrt(dx * dx + dy * dy);

  if (length > 0) {
    dx /= length;
    dy /= length;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.dir = dx > 0 ? "right" : "left";
    } else {
      player.dir = dy > 0 ? "down" : "up";
    }

    const nextX = player.x + dx * player.speed * dt;
    const nextY = player.y + dy * player.speed * dt;

    if (!collides(nextX, player.y)) {
      player.x = nextX;
    }

    if (!collides(player.x, nextY)) {
      player.y = nextY;
    }
  }

  player.x = Math.max(
    player.width / 2,
    Math.min(world.width - player.width / 2, player.x)
  );

  player.y = Math.max(
    player.height / 2,
    Math.min(world.height - player.height / 2, player.y)
  );

  nearbyNPC = getNearbyNPC();
  interactButton.style.display = nearbyNPC ? "block" : "none";
}

function getCamera() {
  let x = player.x - canvas.width / 2;
  let y = player.y - canvas.height / 2;

  x = Math.max(0, Math.min(world.width - canvas.width, x));
  y = Math.max(0, Math.min(world.height - canvas.height, y));

  return { x, y };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const camera = getCamera();

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = "#76945b";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "#b89b72";
  ctx.fillRect(730, 0, 140, world.height);
  ctx.fillRect(0, 650, world.width, 150);

  for (const building of buildings) {
    ctx.fillStyle = "#73533b";
    ctx.fillRect(building.x, building.y, building.w, building.h);

    ctx.fillStyle = "#553526";
    ctx.fillRect(
      building.x - 10,
      building.y - 18,
      building.w + 20,
      35
    );

    ctx.fillStyle = "white";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      building.name,
      building.x + building.w / 2,
      building.y + building.h / 2
    );
  }

  for (const npc of npcs) {
    ctx.fillStyle = "#e2b66d";
    ctx.fillRect(npc.x - 12, npc.y - 18, 24, 36);

    ctx.fillStyle = "white";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(npc.name, npc.x, npc.y - 27);
  }

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(
    player.x,
    player.y + 17,
    15,
    7,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "#365d8d";
  ctx.fillRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );

  ctx.fillStyle = "#e4bd91";
  ctx.fillRect(
    player.x - 9,
    player.y - 25,
    18,
    15
  );

  ctx.restore();
}

let previousTime = performance.now();

function loop(time) {
  const dt = Math.min(
    (time - previousTime) / 1000,
    0.05
  );

  previousTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
