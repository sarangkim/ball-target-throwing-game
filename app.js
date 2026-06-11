const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  appShell: document.querySelector(".app-shell"),
  stage: document.querySelector(".game-stage"),
  lobbyStatus: document.querySelector("#lobbyStatus"),
  lobbyGoogleButton: document.querySelector("#lobbyGoogleButton"),
  playComputerButton: document.querySelector("#playComputerButton"),
  refreshLobbyButton: document.querySelector("#refreshLobbyButton"),
  roomStatus: document.querySelector("#roomStatus"),
  soundButton: document.querySelector("#soundButton"),
  googleButton: document.querySelector("#googleButton"),
  backToLobbyButton: document.querySelector("#backToLobbyButton"),
  resetButton: document.querySelector("#resetButton"),
  difficultySelect: document.querySelector("#difficultySelect"),
  lobbyContent: document.querySelector("#lobbyContent"),
  challengeNotice: document.querySelector("#challengeNotice"),
  lobbyTabs: [...document.querySelectorAll("[data-lobby-tab]")],
  message: document.querySelector("#message"),
  playerOneRow: document.querySelector("#playerOneRow"),
  playerTwoRow: document.querySelector("#playerTwoRow"),
  playerOneName: document.querySelector("#playerOneName"),
  playerTwoName: document.querySelector("#playerTwoName"),
  playerOneScore: document.querySelector("#playerOneScore"),
  playerTwoScore: document.querySelector("#playerTwoScore"),
  roundLabel: document.querySelector("#roundLabel"),
  matchLabel: document.querySelector("#matchLabel"),
  playerOneRounds: document.querySelector("#playerOneRounds"),
  playerTwoRounds: document.querySelector("#playerTwoRounds"),
  starCount: document.querySelector("#starCount"),
  ticketCount: document.querySelector("#ticketCount"),
  missionLabel: document.querySelector("#missionLabel"),
  itemButtons: [...document.querySelectorAll("[data-item]")],
  ballsLeft: document.querySelector("#ballsLeft"),
  throwHistory: document.querySelector("#throwHistory")
};

const scoreRings = [
  { limit: 0.13, scores: [100] },
  { limit: 0.31, scores: [90, 70, 60, 80] },
  { limit: 0.52, scores: [30, 40, 50, 20, 50, 40, 30, 20] },
  { limit: 0.78, scores: [10, 10, 10, 10, 10, 10, 10, 10] }
];

const targetArtRings = [
  { outer: 0.78, inner: 0.52, scores: [10, 10, 10, 10, 10, 10, 10, 10] },
  { outer: 0.52, inner: 0.31, scores: [30, 40, 50, 20, 50, 40, 30, 20] },
  { outer: 0.31, inner: 0.13, scores: [90, 70, 60, 80] },
  { outer: 0.13, inner: 0, scores: [100] }
];
const targetVariants = [
  {
    name: "클래식",
    scoreRings,
    artRings: targetArtRings,
    rotation: 0,
    colorShift: 0
  },
  {
    name: "스파이럴",
    scoreRings: [
      { limit: 0.12, scores: [120] },
      { limit: 0.31, scores: [70, 90, 60, 80] },
      { limit: 0.54, scores: [20, 50, 30, 60, 40, 50, 20, 40] },
      { limit: 0.8, scores: [15, 10, 25, 10, 15, 10, 25, 10] }
    ],
    artRings: [
      { outer: 0.8, inner: 0.54, scores: [15, 10, 25, 10, 15, 10, 25, 10] },
      { outer: 0.54, inner: 0.31, scores: [20, 50, 30, 60, 40, 50, 20, 40] },
      { outer: 0.31, inner: 0.12, scores: [70, 90, 60, 80] },
      { outer: 0.12, inner: 0, scores: [120] }
    ],
    rotation: Math.PI / 8,
    colorShift: 1
  },
  {
    name: "키즈 챌린지",
    scoreRings: [
      { limit: 0.1, scores: [150] },
      { limit: 0.29, scores: [100, 40, 80, 60, 100, 40] },
      { limit: 0.5, scores: [30, 70, 20, 50, 30, 70, 20, 50] },
      { limit: 0.74, scores: [5, 20, 10, 30, 5, 20, 10, 30] }
    ],
    artRings: [
      { outer: 0.74, inner: 0.5, scores: [5, 20, 10, 30, 5, 20, 10, 30] },
      { outer: 0.5, inner: 0.29, scores: [30, 70, 20, 50, 30, 70, 20, 50] },
      { outer: 0.29, inner: 0.1, scores: [100, 40, 80, 60, 100, 40] },
      { outer: 0.1, inner: 0, scores: [150] }
    ],
    rotation: -Math.PI / 10,
    colorShift: 2
  }
];

const colors = ["#df4655", "#f3df46", "#81c962", "#2f6dc8"];
const playerBallStyles = [
  { ballColor: "#1245b9", ballHighlight: "#7ba2ff" },
  { ballColor: "#d93548", ballHighlight: "#ff9a8f" }
];
const defaultItems = { magnet: 1, double: 1, giant: 1, safe: 1, firework: 1 };
const itemLabels = {
  magnet: "자석 공",
  double: "두배 공",
  giant: "왕공",
  safe: "안전 공",
  firework: "폭죽 공"
};
const itemDescriptions = {
  magnet: "점수 판정 위치를 중심 쪽으로 당깁니다.",
  double: "이번 공의 점수를 2배로 만듭니다.",
  giant: "공이 커져 판정 범위가 넓어집니다.",
  safe: "과녁 밖으로 나가도 10점을 받습니다.",
  firework: "과녁에 맞히면 보너스 30점을 더합니다."
};
const shopItems = [
  { item: "magnet", cost: 1, label: "자석 공", help: "살짝 빗나가도 중심 쪽으로 보정됩니다." },
  { item: "double", cost: 2, label: "두배 공", help: "성공한 점수가 2배가 됩니다." },
  { item: "giant", cost: 1, label: "왕공", help: "실제 공이 커져 판정이 쉬워집니다." },
  { item: "safe", cost: 1, label: "안전 공", help: "실패해도 10점을 지켜줍니다." },
  { item: "firework", cost: 2, label: "폭죽 공", help: "맞히면 30점 보너스가 붙습니다." }
];

const difficultyProfiles = {
  easy: { center: 0.14, inner: 0.46, mid: 0.86, spread: 1.22, label: "쉬움" },
  normal: { center: 0.24, inner: 0.72, mid: 0.94, spread: 1, label: "보통" },
  hard: { center: 0.36, inner: 0.84, mid: 0.98, spread: 0.72, label: "어려움" }
};
const missions = [
  { text: "미션: 50점 이상 맞히기", test: (score) => score >= 50 },
  { text: "미션: 80점 이상 대박 노리기", test: (score) => score >= 80 },
  { text: "미션: 과녁 안에 꼭 붙이기", test: (score) => score > 0 },
  { text: "미션: 100점 중앙 도전", test: (score) => score === 100 }
];
const stageThemes = [
  {
    name: "회전목마 광장",
    wall: ["#fff7e9", "#f6d2b4", "#d99a75"],
    floor: "#fff0cf",
    rail: "#d6a25d",
    accent: "#e04852",
    melody: [523, 659, 784, 659, 587, 698, 880, 698],
    tempo: 280
  },
  {
    name: "야간 퍼레이드",
    wall: ["#eaf2ff", "#a9c9ff", "#5b74c9"],
    floor: "#dff5ff",
    rail: "#5b74c9",
    accent: "#f4df42",
    melody: [392, 494, 587, 740, 659, 587, 494, 587],
    tempo: 240
  },
  {
    name: "캔디 부스",
    wall: ["#fff3f8", "#ffc0d6", "#80ca62"],
    floor: "#f8ffe1",
    rail: "#e0488c",
    accent: "#2f6ec8",
    melody: [659, 784, 988, 880, 784, 659, 587, 659],
    tempo: 260
  }
];
const state = {
  players: [
    { name: "플레이어 1", score: 0, throws: [], roundWins: 0, stars: 0, tickets: 0, combo: 0, items: { ...defaultItems }, selectedItem: "", ...playerBallStyles[0] },
    { name: "컴퓨터", score: 0, throws: [], roundWins: 0, stars: 0, tickets: 0, combo: 0, items: { ...defaultItems }, selectedItem: "", isComputer: true, ...playerBallStyles[1] }
  ],
  currentPlayer: 0,
  throwsPerPlayer: 3,
  round: 1,
  targetRoundWins: 2,
  roundOver: false,
  missionIndex: 0,
  currentMission: missions[0],
  vsComputer: true,
  computerThinking: false,
  computerDifficulty: "normal",
  ball: null,
  dragging: false,
  dragStart: null,
  dragNow: null,
  releaseHand: null,
  flying: false,
  lastHit: null,
  gameOver: false,
  audioOn: false,
  screen: "lobby",
  sessionSeed: Math.floor(Math.random() * targetVariants.length),
  online: {
    enabled: false,
    db: null,
    auth: null,
    user: null,
    localPlayerIndex: null,
    pendingRoomCode: "",
    roomCode: "",
    unsub: null,
    usersUnsub: null,
    challengeUnsub: null,
    onlineUsers: [],
    incomingChallenge: null,
    lobbyTab: "players",
    syncing: false
  }
};

let audio = null;
let lastTime = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  resetBall();
}

function layout() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const isMobile = w < 760;
  const targetRadius = Math.min(w, h) * (isMobile ? 0.32 : 0.31);
  return {
    w,
    h,
    target: {
      x: w * (isMobile ? 0.38 : 0.42),
      y: h * (isMobile ? 0.34 : 0.43),
      r: targetRadius
    },
    ballHome: {
      x: w * (isMobile ? 0.72 : 0.78),
      y: h * (isMobile ? 0.66 : 0.76)
    }
  };
}

function resetBall() {
  const { ballHome } = layout();
  const player = state.players[state.currentPlayer];
  const rainbow = shouldUseRainbowBall();
  const item = player.selectedItem || "";
  const itemColor = item === "double" ? "#f4df42" : item === "magnet" ? "#20c7d6" : item === "safe" ? "#80ca62" : item === "firework" ? "#e04852" : player.ballColor;
  const itemHighlight = item ? "#ffffff" : player.ballHighlight;
  const baseRadius = Math.max(18, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.035);
  state.ball = {
    x: ballHome.x,
    y: ballHome.y,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: baseRadius * (item === "giant" ? 1.45 : 1),
    spin: 0,
    color: rainbow ? "#f3df46" : itemColor,
    highlight: rainbow ? "#ffffff" : itemHighlight,
    rainbow,
    item,
    scoreBonusRadius: item === "giant" ? 0.12 : 0
  };
  state.dragging = false;
  state.dragStart = null;
  state.dragNow = null;
  state.releaseHand = null;
  state.flying = false;
}

function draw() {
  const { w, h, target } = layout();
  ctx.clearRect(0, 0, w, h);
  drawRoom(w, h);
  drawTarget(target);
  drawAimLine();
  drawHand();
  drawBall();
  if (state.lastHit) drawHitPulse();
}

function drawRoom(w, h) {
  const theme = currentTheme();
  ctx.save();
  const wall = ctx.createLinearGradient(0, 0, w, h * 0.72);
  wall.addColorStop(0, theme.wall[0]);
  wall.addColorStop(0.56, theme.wall[1]);
  wall.addColorStop(1, theme.wall[2]);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffffff";
  for (let x = -20; x < w; x += 92) {
    ctx.fillRect(x, 0, 42, h * 0.68);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.floor;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.strokeStyle = colorWithAlpha(theme.rail, 0.26);
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.68);
    ctx.lineTo(x + 24, h);
    ctx.stroke();
  }
  ctx.strokeStyle = colorWithAlpha(theme.accent, 0.28);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.68);
  ctx.lineTo(w, h * 0.68);
  ctx.stroke();
  ctx.restore();
}

function drawTarget(target) {
  const variant = currentTargetVariant();
  ctx.save();
  ctx.translate(target.x, target.y);

  ctx.strokeStyle = "#242b39";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-target.r * 0.22, -target.r * 1.02);
  ctx.lineTo(0, -target.r * 1.25);
  ctx.lineTo(target.r * 0.22, -target.r * 1.02);
  ctx.stroke();

  ctx.rotate(variant.rotation || 0);
  variant.artRings.forEach((ring, ringIndex) => {
    const outer = target.r * ring.outer;
    const inner = target.r * ring.inner;
    const pieces = ring.scores.length;
    const values = ring.scores;
    for (let i = 0; i < pieces; i += 1) {
      const start = -Math.PI / 2 + (i * Math.PI * 2) / pieces;
      const end = start + (Math.PI * 2) / pieces;
      ctx.beginPath();
      ctx.arc(0, 0, outer, start, end);
      ctx.arc(0, 0, inner, end, start, true);
      ctx.closePath();
      ctx.fillStyle = ringIndex === 3 ? "#df4655" : colors[(i + ringIndex + variant.colorShift) % colors.length];
      ctx.fill();
      ctx.strokeStyle = "#f4f5f8";
      ctx.lineWidth = target.r * 0.035;
      ctx.stroke();

      const mid = (start + end) / 2;
      const textRadius = (outer + inner) / 2;
      ctx.fillStyle = colors[(i + ringIndex + variant.colorShift) % colors.length] === "#f3df46" ? "#c84652" : "#fff";
      ctx.font = `800 ${Math.max(18, target.r * (ringIndex === 0 ? 0.18 : 0.12))}px Segoe UI, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(values[i % values.length], Math.cos(mid) * textRadius, Math.sin(mid) * textRadius);
    }
  });

  ctx.strokeStyle = "#242b39";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, target.r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHand() {
  if (state.flying) {
    drawReleaseHand();
    return;
  }
  const b = state.ball;
  drawHandAt(b.x, b.y, b.radius, -0.22, 1);
}

function drawReleaseHand() {
  if (!state.releaseHand) return;
  const age = performance.now() - state.releaseHand.time;
  if (age > 420) {
    state.releaseHand = null;
    return;
  }
  const progress = age / 420;
  drawHandAt(
    state.releaseHand.x + progress * state.releaseHand.radius * 0.35,
    state.releaseHand.y + progress * state.releaseHand.radius * 0.18,
    state.releaseHand.radius,
    -0.38 - progress * 0.35,
    1 - progress * 0.5
  );
}

function drawHandAt(x, y, radius, rotation, alpha) {
  const b = { x, y, radius };
  const scale = b.radius / 28;
  const wristGradient = ctx.createLinearGradient(0, -b.radius, b.radius * 3, b.radius);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x + b.radius * 1.18, b.y + b.radius * 0.42);
  ctx.rotate(rotation);

  ctx.fillStyle = "rgba(21, 28, 43, 0.12)";
  roundedRect(-6 * scale, 16 * scale, 92 * scale, 34 * scale, 15 * scale);
  ctx.fill();

  wristGradient.addColorStop(0, "#f8cabd");
  wristGradient.addColorStop(1, "#de927e");
  ctx.fillStyle = wristGradient;
  roundedRect(34 * scale, 4 * scale, 70 * scale, 38 * scale, 15 * scale);
  ctx.fill();

  ctx.fillStyle = "#f5b9a8";
  roundedRect(-10 * scale, -16 * scale, 62 * scale, 56 * scale, 24 * scale);
  ctx.fill();

  ctx.fillStyle = "#f8c7b8";
  drawFinger(-18, -48, 17, 58, -0.1, scale);
  drawFinger(2, -56, 17, 66, -0.03, scale);
  drawFinger(22, -51, 16, 61, 0.05, scale);
  drawFinger(40, -39, 14, 50, 0.16, scale);

  ctx.save();
  ctx.translate(-18 * scale, 10 * scale);
  ctx.rotate(0.68);
  roundedRect(-7 * scale, -8 * scale, 20 * scale, 56 * scale, 10 * scale);
  ctx.fill();
  ctx.strokeStyle = "rgba(124, 70, 58, 0.2)";
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(-2 * scale, 18 * scale);
  ctx.lineTo(9 * scale, 17 * scale);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(124, 70, 58, 0.26)";
  ctx.lineWidth = 1.5 * scale;
  drawPalmLine(-1, -2, 30, 8, scale);
  drawPalmLine(4, 13, 37, 22, scale);
  drawPalmLine(10, -10, 44, -2, scale);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
  drawPalmLine(-2, -18, 34, -20, scale);

  ctx.fillStyle = "rgba(145, 84, 70, 0.18)";
  ctx.beginPath();
  ctx.ellipse(14 * scale, 8 * scale, 23 * scale, 10 * scale, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFinger(x, y, width, height, rotation, scale) {
  ctx.save();
  ctx.translate(x * scale, y * scale);
  ctx.rotate(rotation);
  roundedRect(0, 0, width * scale, height * scale, (width / 2) * scale);
  ctx.fill();
  ctx.strokeStyle = "rgba(124, 70, 58, 0.18)";
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(3 * scale, height * 0.56 * scale);
  ctx.lineTo((width - 3) * scale, height * 0.56 * scale);
  ctx.moveTo(4 * scale, height * 0.28 * scale);
  ctx.lineTo((width - 4) * scale, height * 0.28 * scale);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 238, 232, 0.72)";
  ctx.beginPath();
  ctx.ellipse((width / 2) * scale, 9 * scale, (width * 0.28) * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPalmLine(x1, y1, x2, y2, scale) {
  ctx.beginPath();
  ctx.moveTo(x1 * scale, y1 * scale);
  ctx.quadraticCurveTo(((x1 + x2) / 2) * scale, (y1 - 8) * scale, x2 * scale, y2 * scale);
  ctx.stroke();
}

function drawBall() {
  const b = state.ball;
  ctx.save();
  const shadowScale = Math.max(0.25, 1 - b.z * 0.003);
  ctx.fillStyle = "rgba(21,28,43,0.18)";
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + b.radius * 1.15, b.radius * shadowScale, b.radius * 0.28 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(b.x, b.y - b.z);
  ctx.rotate(b.spin);
  if (b.rainbow) {
    const rainbowGrad = ctx.createConicGradient(b.spin, 0, 0);
    rainbowGrad.addColorStop(0, "#e04852");
    rainbowGrad.addColorStop(0.25, "#f4df42");
    rainbowGrad.addColorStop(0.5, "#80ca62");
    rainbowGrad.addColorStop(0.75, "#2f6ec8");
    rainbowGrad.addColorStop(1, "#e04852");
    ctx.fillStyle = rainbowGrad;
  } else {
    const grad = ctx.createRadialGradient(-b.radius * 0.35, -b.radius * 0.45, b.radius * 0.15, 0, 0, b.radius);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.18, b.highlight || "#7ba2ff");
    grad.addColorStop(1, b.color || "#1245b9");
    ctx.fillStyle = grad;
  }
  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(5, b.radius * 0.28);
  ctx.beginPath();
  ctx.moveTo(-b.radius * 1.2, 0);
  ctx.lineTo(b.radius * 1.2, 0);
  ctx.moveTo(0, -b.radius * 1.2);
  ctx.lineTo(0, b.radius * 1.2);
  ctx.stroke();
  ctx.restore();
}

function drawAimLine() {
  if (!state.dragging || !state.dragStart || !state.dragNow) return;
  ctx.save();
  ctx.strokeStyle = "rgba(224,72,82,0.72)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(state.ball.x, state.ball.y);
  ctx.lineTo(state.ball.x + (state.dragStart.x - state.dragNow.x) * 1.4, state.ball.y + (state.dragStart.y - state.dragNow.y) * 1.4);
  ctx.stroke();
  ctx.restore();
}

function drawHitPulse() {
  const hit = state.lastHit;
  const age = performance.now() - hit.time;
  if (age > 900) {
    state.lastHit = null;
    return;
  }
  const alpha = 1 - age / 900;
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(hit.x, hit.y, hit.radius + age * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(23,32,54,${alpha})`;
  ctx.font = "900 34px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`+${hit.score}`, hit.x, hit.y - 28 - age * 0.04);
  ctx.restore();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function currentTheme() {
  return stageThemes[(state.round - 1) % stageThemes.length];
}

function currentTargetVariant() {
  return targetVariants[(state.sessionSeed + state.round - 1) % targetVariants.length];
}

function colorWithAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function update(time) {
  const dt = Math.min(32, time - lastTime || 16) / 16.67;
  lastTime = time;
  if (state.flying) {
    const b = state.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;
    b.vz -= 0.42 * dt;
    b.spin += 0.22 * dt;
    b.vx *= 0.992;
    b.vy *= 0.992;
    if (b.z <= 0 && b.vz < 0) {
      b.z = 0;
      finishThrow();
    }
  }
  draw();
  requestAnimationFrame(update);
}

function pointer(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function onPointerDown(event) {
  if (state.gameOver || state.roundOver || state.flying || isComputerTurn()) return;
  if (!isLocalPlayerTurn()) {
    setMessage("상대가 던질 차례입니다.");
    return;
  }
  const p = pointer(event);
  const b = state.ball;
  const distance = Math.hypot(p.x - b.x, p.y - b.y);
  if (distance <= b.radius * 2.1) {
    canvas.setPointerCapture(event.pointerId);
    state.dragging = true;
    state.dragStart = p;
    state.dragNow = p;
    setMessage("힘과 방향을 맞춘 뒤 손을 놓으세요.");
    ensureAudio();
  }
}

function onPointerMove(event) {
  if (!state.dragging) return;
  state.dragNow = pointer(event);
}

function onPointerUp() {
  if (!state.dragging || !state.dragStart || !state.dragNow) return;
  const dx = state.dragStart.x - state.dragNow.x;
  const dy = state.dragStart.y - state.dragNow.y;
  const power = Math.min(34, Math.hypot(dx, dy) * 0.09);
  if (power < 3) {
    resetBall();
    setMessage("조금 더 뒤로 당기면 공이 멀리 날아갑니다.");
    return;
  }
  state.ball.vx = dx * 0.18;
  state.ball.vy = dy * 0.18;
  state.ball.vz = power;
  state.releaseHand = { x: state.ball.x, y: state.ball.y, radius: state.ball.radius, time: performance.now() };
  state.dragging = false;
  state.flying = true;
  playThrow();
}

function finishThrow() {
  state.flying = false;
  const { target } = layout();
  const impact = { x: state.ball.x, y: state.ball.y };
  const scoringPoint = state.ball.item === "magnet" ? magnetPoint(impact, target) : impact;
  const rawScore = scoreAtPoint(scoringPoint, target, state.ball.scoreBonusRadius || 0);
  const baseScore = state.ball.item === "safe" && rawScore === 0 ? 10 : rawScore;
  const bonusScore = state.ball.item === "firework" && baseScore > 0 ? baseScore + 30 : baseScore;
  const itemScore = state.ball.item === "double" ? bonusScore * 2 : bonusScore;
  const score = state.ball.rainbow ? Math.round(itemScore * 1.5) : itemScore;
  const player = state.players[state.currentPlayer];
  player.score += score;
  player.throws.push(score);
  const rewards = awardThrowRewards(player, baseScore, score);
  consumeSelectedItem(player, state.ball.item);
  state.lastHit = { ...impact, score, radius: state.ball.radius, time: performance.now() };
  playHit(score);
  if (state.ball.item) playItemEffect(state.ball.item);
  if (rewards.length) playRewardSound(rewards.length);

  advanceTurn(player, score, rewards);
  updateUi();
  syncRoom();
  setTimeout(() => {
    if (!state.gameOver && !state.roundOver) {
      resetBall();
      maybeStartComputerTurn();
    }
  }, 760);
}

function magnetPoint(point, target) {
  return {
    x: target.x + (point.x - target.x) * 0.72,
    y: target.y + (point.y - target.y) * 0.72
  };
}

function scoreAtPoint(point, target, bonusRadius = 0) {
  const variant = currentTargetVariant();
  const dx = point.x - target.x;
  const dy = point.y - target.y;
  const distanceRatio = Math.max(0, Math.hypot(dx, dy) / target.r - bonusRadius);
  const ring = variant.scoreRings.find((entry) => distanceRatio <= entry.limit);
  if (!ring) return 0;
  if (ring.scores.length === 1) return ring.scores[0];
  const angle = (Math.atan2(dy, dx) + Math.PI / 2 - (variant.rotation || 0) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.floor((angle / (Math.PI * 2)) * ring.scores.length) % ring.scores.length;
  return ring.scores[index];
}

function awardThrowRewards(player, baseScore, finalScore) {
  const rewards = [];
  player.combo = baseScore > 0 ? player.combo + 1 : 0;

  if (state.currentMission.test(baseScore)) {
    player.stars += 1;
    rewards.push("미션 별 +1");
  }
  if (player.combo >= 2) {
    player.stars += 1;
    rewards.push("콤보 별 +1");
  }
  if (baseScore >= 80) {
    player.stars += 1;
    rewards.push("대박 별 +1");
  }
  if (player.selectedItem && player.selectedItem !== "double") {
    rewards.push(`${itemLabels[player.selectedItem]} 효과`);
  }
  if (finalScore > baseScore && player.selectedItem === "double") {
    rewards.push(`${itemLabels[player.selectedItem]} 효과`);
  } else if (finalScore > baseScore && !player.selectedItem) {
    rewards.push("무지개 공 1.5배");
  }

  return rewards;
}

function consumeSelectedItem(player, item) {
  if (!item || !player.items?.[item]) {
    player.selectedItem = "";
    return;
  }
  player.items[item] -= 1;
  player.selectedItem = "";
}

function advanceTurn(lastPlayer, score, rewards = []) {
  const rewardText = rewards.length ? ` (${rewards.join(", ")})` : "";
  const scoreText = score > 0 ? `${lastPlayer.name} ${score}점!${rewardText}` : `${lastPlayer.name} 아깝습니다. 과녁 밖이에요.`;
  const allDone = state.players.every((player) => player.throws.length >= state.throwsPerPlayer);
  if (allDone) {
    finishRound(scoreText);
    return;
  }

  const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
  state.currentPlayer = state.players[nextPlayer].throws.length < state.throwsPerPlayer ? nextPlayer : state.currentPlayer;
  setMessage(`${scoreText} 다음은 ${state.players[state.currentPlayer].name} 차례입니다.`);
  maybeStartComputerTurn();
}

function finishRound(scoreText) {
  state.roundOver = true;
  const [one, two] = state.players;
  if (one.score !== two.score) {
    const winner = one.score > two.score ? one : two;
    winner.roundWins += 1;
    winner.tickets += 1;
    winner.stars += 2;
  } else {
    one.stars += 1;
    two.stars += 1;
  }

  const matchWinner = state.players.find((player) => player.roundWins >= state.targetRoundWins);
  if (matchWinner) {
    state.gameOver = true;
    const result = `${matchWinner.name} 최종 승리!`;
    setMessage(`${scoreText} ${state.round}라운드 종료. ${result}`);
    playFinale();
    return;
  }

  const roundResult = one.score === two.score ? "무승부" : `${one.score > two.score ? one.name : two.name} 라운드 승리`;
  setMessage(`${scoreText} ${state.round}라운드 종료: ${roundResult}. 다음 라운드가 곧 시작됩니다.`);
  playFinale();
  setTimeout(startNextRound, 2100);
}

function startNextRound() {
  state.round += 1;
  state.roundOver = false;
  state.currentPlayer = state.round % 2 === 1 ? 0 : 1;
  state.players.forEach((player) => {
    player.score = 0;
    player.throws = [];
    player.combo = 0;
  });
  state.missionIndex = pickMissionIndex();
  state.currentMission = missions[state.missionIndex];
  restartBgmForTheme();
  resetBall();
  updateUi();
  syncRoom(true);
  setMessage(`${state.round}라운드 ${currentTargetVariant().name} 과녁! ${state.players[state.currentPlayer].name} 먼저 던집니다.`);
  maybeStartComputerTurn();
}

function isComputerTurn() {
  return Boolean(state.vsComputer && state.players[state.currentPlayer]?.isComputer);
}

function maybeStartComputerTurn() {
  if (!isComputerTurn() || state.computerThinking || state.gameOver || state.roundOver || state.flying) return;
  state.computerThinking = true;
  setMessage("컴퓨터가 조준 중입니다...");
  setTimeout(() => {
    state.computerThinking = false;
    if (isComputerTurn() && !state.gameOver && !state.roundOver && !state.flying) {
      throwComputerBall();
    }
  }, 900);
}

function throwComputerBall() {
  const { target } = layout();
  const aim = chooseComputerAim(target);
  const b = state.ball;
  const vz = 15 + Math.random() * 3;
  const frames = (2 * vz) / 0.42;
  const damp = 0.992;
  const effectiveFrames = (1 - damp ** frames) / (1 - damp);
  b.vx = (aim.x - b.x) / effectiveFrames;
  b.vy = (aim.y - b.y) / effectiveFrames;
  b.vz = vz;
  state.releaseHand = { x: b.x, y: b.y, radius: b.radius, time: performance.now() };
  state.dragging = false;
  state.flying = true;
  playThrow();
}

function chooseComputerAim(target) {
  const roll = Math.random();
  const angle = Math.random() * Math.PI * 2;
  const profile = difficultyProfiles[state.computerDifficulty] || difficultyProfiles.normal;
  const roundBoost = Math.min(0.08, (state.round - 1) * 0.025);
  let ringRatio = 0.2;

  if (state.currentMission.text.includes("100")) {
    ringRatio = (0.05 + Math.random() * 0.08) * profile.spread;
  } else if (roll < profile.center + roundBoost) {
    ringRatio = Math.random() * 0.12;
  } else if (roll < profile.inner + roundBoost) {
    ringRatio = 0.14 + Math.random() * 0.18;
  } else if (roll < profile.mid) {
    ringRatio = 0.32 + Math.random() * 0.22;
  } else {
    ringRatio = 0.55 + Math.random() * 0.18;
  }

  const distance = target.r * ringRatio * profile.spread + target.r * 0.018 * (Math.random() - 0.5);
  return {
    x: target.x + Math.cos(angle) * distance,
    y: target.y + Math.sin(angle) * distance
  };
}

function isLocalPlayerTurn() {
  if (!state.online.roomCode || state.online.localPlayerIndex === null) return true;
  return state.currentPlayer === state.online.localPlayerIndex;
}

function onlinePlayerName(fallback) {
  return state.online.user?.displayName || fallback;
}

function configureOnlinePlayers(localIndex) {
  state.vsComputer = false;
  state.online.localPlayerIndex = localIndex;
  state.computerThinking = false;
  state.players = state.players.map((player, index) => ({
    ...player,
    name: index === localIndex ? onlinePlayerName(`플레이어 ${index + 1}`) : player.name.replace("컴퓨터", "상대 대기"),
    isComputer: false
  }));
  updateOnlineUi();
}

function resetScoresForCurrentMode() {
  state.players.forEach((player, index) => {
    player.score = 0;
    player.throws = [];
    player.roundWins = 0;
    player.stars = 0;
    player.tickets = 0;
    player.combo = 0;
    player.items = { ...defaultItems };
    player.selectedItem = "";
    player.isComputer = state.vsComputer && index === 1;
    if (state.vsComputer) {
      player.name = index === 1 ? "컴퓨터" : onlinePlayerName(`플레이어 ${index + 1}`);
    }
  });
}

function pickMissionIndex() {
  return Math.floor(Math.random() * missions.length);
}

function shouldUseRainbowBall() {
  const player = state.players[state.currentPlayer];
  const opponent = state.players[state.currentPlayer === 0 ? 1 : 0];
  const isLastThrow = player.throws.length === state.throwsPerPlayer - 1;
  return isLastThrow && player.score + 40 < opponent.score;
}

function updateUi() {
  state.players = state.players.map((player, index) => ({
    ...player,
    items: { ...defaultItems, ...(player.items || {}) },
    selectedItem: player.selectedItem || "",
    ...playerBallStyles[index]
  }));
  const theme = currentTheme();
  ui.stage.style.setProperty("--stage-wall-a", theme.wall[0]);
  ui.stage.style.setProperty("--stage-wall-b", theme.wall[1]);
  ui.stage.style.setProperty("--stage-wall-c", theme.wall[2]);
  ui.stage.style.setProperty("--stage-accent", theme.accent);
  ui.playerOneName.textContent = state.players[0].name;
  ui.playerTwoName.textContent = state.players[1].name;
  ui.roundLabel.textContent = `${state.round}라운드`;
  ui.matchLabel.textContent = `${state.targetRoundWins}승 먼저`;
  ui.playerOneRow.style.setProperty("--ball-color", state.players[0].ballColor);
  ui.playerTwoRow.style.setProperty("--ball-color", state.players[1].ballColor);
  ui.playerOneScore.textContent = state.players[0].score;
  ui.playerTwoScore.textContent = state.players[1].score;
  ui.playerOneRounds.textContent = state.players[0].roundWins;
  ui.playerTwoRounds.textContent = state.players[1].roundWins;
  ui.starCount.textContent = state.players[0].stars + state.players[1].stars;
  ui.ticketCount.textContent = state.players[0].tickets + state.players[1].tickets;
  ui.missionLabel.textContent = state.currentMission.text;
  updateItemButtons();
  updateOnlineUi();
  renderLobby();
  ui.playerOneRow.classList.toggle("active", state.currentPlayer === 0 && !state.gameOver);
  ui.playerTwoRow.classList.toggle("active", state.currentPlayer === 1 && !state.gameOver);
  ui.ballsLeft.textContent = Math.max(0, state.throwsPerPlayer - state.players[state.currentPlayer].throws.length);
  ui.throwHistory.innerHTML = "";
  state.players[state.currentPlayer].throws.forEach((score) => {
    const chip = document.createElement("span");
    chip.textContent = score;
    chip.style.background = score >= 80 ? "#df4655" : score >= 40 ? "#2f6dc8" : score > 0 ? "#6aa94e" : "#293142";
    ui.throwHistory.append(chip);
  });
}

function updateItemButtons() {
  const player = state.players[state.currentPlayer];
  const canUseItem = !state.gameOver && !state.roundOver && !state.flying && isLocalPlayerTurn() && !isComputerTurn();
  ui.itemButtons.forEach((button) => {
    const item = button.dataset.item;
    const count = player.items?.[item] || 0;
    button.querySelector("span").textContent = count;
    button.classList.toggle("selected", player.selectedItem === item);
    button.disabled = !canUseItem || count <= 0;
  });
}

function localRewardPlayer() {
  return state.players[state.online.localPlayerIndex ?? 0] || state.players[0];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLobby() {
  if (!ui.lobbyContent) return;
  ui.lobbyTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.lobbyTab === state.online.lobbyTab);
  });

  renderChallengeNotice();

  const player = localRewardPlayer();
  const tab = state.online.lobbyTab;
  if (tab === "players") {
    const users = state.online.onlineUsers.filter((user) => user.uid !== state.online.user?.uid);
    const userCards = users.length
      ? users.map((user) => `
        <div class="lobby-user">
          <div>
            <strong>${escapeHtml(user.name || "이름 없는 플레이어")}</strong>
            <span>${user.inRoom ? "게임 중" : "도전 가능"}</span>
          </div>
          <button type="button" data-challenge-uid="${escapeHtml(user.uid)}">도전</button>
        </div>
      `).join("")
      : `<p class="lobby-empty">${state.online.user ? "아직 접속한 상대가 없습니다. 다른 기기에서 로그인하면 여기에 나타납니다." : "Google 로그인 후 접속한 사람에게 도전할 수 있습니다."}</p>`;
    ui.lobbyContent.innerHTML = `<h2>로그인 유저</h2>${userCards}`;
    return;
  }

  if (tab === "profile") {
    ui.lobbyContent.innerHTML = `
      <h2>내정보</h2>
      <div class="profile-grid">
        <span>이름</span><strong>${escapeHtml(state.online.user?.displayName || player.name)}</strong>
        <span>별</span><strong>${player.stars || 0}</strong>
        <span>티켓</span><strong>${player.tickets || 0}</strong>
        <span>라운드 승리</span><strong>${player.roundWins || 0}</strong>
      </div>
    `;
    return;
  }

  if (tab === "missions") {
    ui.lobbyContent.innerHTML = `
      <h2>미션</h2>
      ${missions.map((mission, index) => `
        <div class="mission-card ${index === state.missionIndex ? "active" : ""}">
          <strong>${index === state.missionIndex ? "진행 중" : `미션 ${index + 1}`}</strong>
          <span>${escapeHtml(mission.text.replace("미션: ", ""))}</span>
        </div>
      `).join("")}
    `;
    return;
  }

  if (tab === "shop") {
    ui.lobbyContent.innerHTML = `
      <h2>상점</h2>
      <p class="lobby-empty">티켓 ${player.tickets || 0}장으로 아이템을 충전합니다.</p>
      ${shopItems.map((entry) => `
        <div class="shop-card">
          <div>
            <strong>${escapeHtml(entry.label)} <span>${player.items?.[entry.item] || 0}개</span></strong>
            <small>${escapeHtml(entry.help)}</small>
          </div>
          <button type="button" data-buy-item="${entry.item}">${entry.cost}티켓</button>
        </div>
      `).join("")}
    `;
    return;
  }

  ui.lobbyContent.innerHTML = `
    <h2>도움말</h2>
    <div class="help-list">
      <p><strong>도전:</strong> 로그인 유저 목록에서 상대를 골라 바로 방을 만들고 도전장을 보냅니다.</p>
      <p><strong>던지기:</strong> 공을 뒤로 당긴 뒤 과녁 방향으로 놓으면 날아갑니다.</p>
      <p><strong>자석 공:</strong> 실제 도착점이 중심 쪽으로 조금 보정됩니다.</p>
      <p><strong>왕공:</strong> 공이 실제로 커지고 판정 범위도 넓어집니다.</p>
      <p><strong>상점:</strong> 라운드 승리로 받은 티켓을 아이템으로 바꿉니다.</p>
    </div>
  `;
}

function renderChallengeNotice() {
  if (!ui.challengeNotice) return;
  const challenge = state.online.incomingChallenge;
  if (!challenge || challenge.status !== "pending") {
    ui.challengeNotice.innerHTML = "";
    ui.challengeNotice.classList.remove("active");
    return;
  }
  ui.challengeNotice.classList.add("active");
  ui.challengeNotice.innerHTML = `
    <strong>${escapeHtml(challenge.fromName || "상대")}님의 도전!</strong>
    <div>
      <button type="button" data-accept-challenge>수락</button>
      <button type="button" data-decline-challenge>거절</button>
    </div>
  `;
}

function buyItem(item) {
  const entry = shopItems.find((shopItem) => shopItem.item === item);
  const player = localRewardPlayer();
  if (!entry || !player) return;
  if ((player.tickets || 0) < entry.cost) {
    setMessage("티켓이 부족합니다. 라운드에서 이기면 티켓을 받을 수 있어요.");
    return;
  }
  player.tickets -= entry.cost;
  player.items = { ...defaultItems, ...(player.items || {}) };
  player.items[item] += 1;
  updateUi();
  syncRoom(true);
  setMessage(`${entry.label}을 구입했습니다.`);
  playRewardSound(1);
}

function selectItem(item) {
  const player = state.players[state.currentPlayer];
  if (!player || !isLocalPlayerTurn() || isComputerTurn() || state.flying || state.roundOver || state.gameOver) return;
  if (!player.items?.[item]) {
    setMessage(`${itemLabels[item]}이 남아 있지 않습니다.`);
    return;
  }
  player.selectedItem = player.selectedItem === item ? "" : item;
  resetBall();
  updateUi();
  setMessage(player.selectedItem ? `${itemLabels[item]} 선택! ${itemDescriptions[item]}` : "아이템 선택을 취소했습니다.");
  playItemSelect();
}

function setMessage(text) {
  ui.message.textContent = text;
}

function setScreen(screen) {
  state.screen = screen;
  ui.appShell.classList.toggle("is-lobby", screen === "lobby");
  ui.appShell.classList.toggle("is-game", screen === "game");
  updateOnlineUi();
  if (screen === "game") {
    requestAnimationFrame(resizeCanvas);
  } else {
    updateLobbyPresence();
    renderLobby();
  }
}

function playComputerGame() {
  if (state.online.unsub) {
    state.online.unsub();
    state.online.unsub = null;
  }
  state.online.roomCode = "";
  state.online.localPlayerIndex = null;
  state.vsComputer = true;
  state.players[1].name = "컴퓨터";
  state.players[1].isComputer = true;
  state.sessionSeed = Math.floor(Math.random() * targetVariants.length);
  setScreen("game");
  resetGame();
  updateLobbyPresence();
}

function resetGame() {
  resetScoresForCurrentMode();
  state.currentPlayer = 0;
  state.computerThinking = false;
  state.round = 1;
  state.roundOver = false;
  state.gameOver = false;
  state.missionIndex = 0;
  state.currentMission = missions[state.missionIndex];
  restartBgmForTheme();
  resetBall();
  updateUi();
  syncRoom(true);
  ui.roomStatus.textContent = state.vsComputer ? "컴퓨터 대전" : `온라인 방 ${state.online.roomCode}`;
  setMessage(`${currentTargetVariant().name} 과녁! 3판 2승 시작. 공을 뒤로 당겼다가 과녁을 향해 놓아보세요.`);
  maybeStartComputerTurn();
}

function ensureAudio() {
  if (!audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audio = {
      context: new AudioContext(),
      bgmTimer: null,
      step: 0
    };
  }
  if (audio.context.state === "suspended") audio.context.resume();
  if (state.audioOn) startBgm();
}

function tone(freq, duration, type = "sine", gain = 0.08, delay = 0) {
  if (!audio) return;
  const now = audio.context.currentTime + delay;
  const osc = audio.context.createOscillator();
  const amp = audio.context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(gain, now + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(amp).connect(audio.context.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function startBgm() {
  if (!audio || audio.bgmTimer) return;
  audio.bgmTimer = setInterval(() => {
    const theme = currentTheme();
    const melody = theme.melody;
    const freq = melody[audio.step % melody.length];
    tone(freq, 0.22, "triangle", 0.035);
    tone(freq / 2, 0.28, "sine", 0.018);
    if (audio.step % 4 === 0) tone(freq * 1.5, 0.1, "square", 0.014);
    audio.step += 1;
  }, currentTheme().tempo);
}

function stopBgm() {
  if (audio?.bgmTimer) {
    clearInterval(audio.bgmTimer);
    audio.bgmTimer = null;
  }
}

function restartBgmForTheme() {
  if (!state.audioOn || !audio) return;
  stopBgm();
  startBgm();
}

function playThrow() {
  ensureAudio();
  tone(220, 0.12, "sawtooth", 0.035);
  tone(330, 0.16, "triangle", 0.03, 0.08);
}

function playHit(score) {
  ensureAudio();
  if (score >= 120) {
    [659, 784, 988, 1175, 1568].forEach((freq, i) => tone(freq, 0.15, "square", 0.06, i * 0.06));
  } else if (score >= 80) {
    [659, 784, 988, 1318].forEach((freq, i) => tone(freq, 0.16, "triangle", 0.055, i * 0.07));
  } else if (score >= 40) {
    [523, 659, 784].forEach((freq, i) => tone(freq, 0.14, "triangle", 0.045, i * 0.08));
  } else if (score > 0) {
    [392, 523].forEach((freq, i) => tone(freq, 0.15, "sine", 0.04, i * 0.1));
  } else {
    tone(160, 0.18, "sawtooth", 0.035);
    tone(120, 0.22, "sine", 0.025, 0.12);
  }
}

function playItemSelect() {
  ensureAudio();
  [740, 988].forEach((freq, i) => tone(freq, 0.08, "triangle", 0.03, i * 0.05));
}

function playItemEffect(item) {
  ensureAudio();
  const patterns = {
    magnet: [440, 660, 880],
    double: [523, 1046, 1318],
    giant: [220, 330, 440],
    safe: [392, 523, 659],
    firework: [784, 988, 1175, 1568]
  };
  (patterns[item] || [523, 659]).forEach((freq, i) => tone(freq, 0.12, i % 2 ? "square" : "triangle", 0.035, i * 0.055));
}

function playRewardSound(level) {
  ensureAudio();
  const base = level > 2 ? 988 : 784;
  [base, base * 1.25, base * 1.5].forEach((freq, i) => tone(freq, 0.09, "sine", 0.025, 0.04 + i * 0.045));
}

function playFinale() {
  [523, 659, 784, 1046, 1318].forEach((freq, i) => tone(freq, 0.18, "triangle", 0.06, i * 0.1));
}

async function initFirebase() {
  try {
    const { firebaseConfig } = await import("./firebase-config.js");
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") return;
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js");
    const authModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js");
    const dbModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js");
    const app = appModule.initializeApp(firebaseConfig);
    state.online.auth = authModule.getAuth(app);
    state.online.db = {
      api: dbModule,
      instance: dbModule.getFirestore(app)
    };
    state.online.provider = new authModule.GoogleAuthProvider();
    state.online.enabled = true;
    authModule.onAuthStateChanged(state.online.auth, async (user) => {
      if (!user) return;
      state.online.user = user;
      state.players[0].name = user.displayName || "Google 플레이어";
      ui.googleButton.textContent = state.players[0].name;
      ui.lobbyGoogleButton.textContent = state.players[0].name;
      await registerLobbyPresence();
      updateUi();
    });
    updateOnlineUi();
  } catch (error) {
    console.warn("Firebase 초기화 실패", error);
  }
}

async function signInWithGoogle() {
  if (!state.online.enabled) {
    setMessage("Firebase 설정을 먼저 입력하면 Google 로그인이 켜집니다.");
    return;
  }
  const authModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js");
  const result = await authModule.signInWithPopup(state.online.auth, state.online.provider);
  state.online.user = result.user;
  state.players[0].name = result.user.displayName || "Google 플레이어";
  ui.googleButton.textContent = state.players[0].name;
  ui.lobbyGoogleButton.textContent = state.players[0].name;
  await registerLobbyPresence();
  updateOnlineUi();
  setMessage("Google 로그인 완료. 로비에서 접속한 상대에게 도전할 수 있어요.");
  updateUi();
}

async function registerLobbyPresence() {
  if (!state.online.db || !state.online.user) return;
  const { api, instance } = state.online.db;
  const user = state.online.user;
  const userRef = api.doc(instance, "ball-target-users", user.uid);
  await api.setDoc(userRef, {
    uid: user.uid,
    name: user.displayName || "Google 플레이어",
    photoURL: user.photoURL || "",
    inRoom: Boolean(state.online.roomCode),
    roomCode: state.online.roomCode || "",
    lastSeen: Date.now()
  }, { merge: true });

  if (state.online.usersUnsub) state.online.usersUnsub();
  state.online.usersUnsub = api.onSnapshot(api.collection(instance, "ball-target-users"), (snapshot) => {
    const now = Date.now();
    state.online.onlineUsers = snapshot.docs
      .map((docSnap) => docSnap.data())
      .filter((entry) => entry.uid && now - (entry.lastSeen || 0) < 15 * 60 * 1000)
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    renderLobby();
  });

  if (state.online.challengeUnsub) state.online.challengeUnsub();
  const challengeRef = api.doc(instance, "ball-target-challenges", user.uid);
  state.online.challengeUnsub = api.onSnapshot(challengeRef, (snapshot) => {
    state.online.incomingChallenge = snapshot.exists() ? snapshot.data() : null;
    renderLobby();
    if (state.online.incomingChallenge?.status === "pending") {
      setMessage(`${state.online.incomingChallenge.fromName || "상대"}님이 도전했습니다. 로비에서 수락하세요.`);
      playRewardSound(1);
    }
  });
}

async function updateLobbyPresence() {
  if (!state.online.db || !state.online.user) return;
  const { api, instance } = state.online.db;
  await api.setDoc(api.doc(instance, "ball-target-users", state.online.user.uid), {
    inRoom: Boolean(state.online.roomCode),
    roomCode: state.online.roomCode || "",
    lastSeen: Date.now()
  }, { merge: true });
}

function hydrateRoomFromUrl() {
  state.online.pendingRoomCode = "";
}

function makeInviteLink(code = state.online.roomCode) {
  return code ? window.location.href.split("?")[0] : "";
}

function setRoomUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", url);
}

function updateOnlineUi() {
  const status = state.online.roomCode ? `온라인 방 ${state.online.roomCode}` : state.screen === "game" && state.vsComputer ? "컴퓨터 대전" : "로비 대기";
  if (!state.online.enabled) {
    ui.lobbyStatus.textContent = "Firebase 설정 후 온라인 대전이 활성화됩니다.";
  } else if (!state.online.user) {
    ui.lobbyStatus.textContent = "Google 로그인 후 접속한 사람에게 도전할 수 있습니다.";
  } else if (state.online.roomCode) {
    ui.lobbyStatus.textContent = `${status}에서 플레이 중입니다.`;
  } else {
    ui.lobbyStatus.textContent = "접속자 목록에서 상대에게 도전하세요.";
  }
  ui.roomStatus.textContent = status;
  if (state.online.user) {
    const name = state.online.user.displayName || "Google 플레이어";
    ui.googleButton.textContent = name;
    ui.lobbyGoogleButton.textContent = name;
  }
}

function roomPayload() {
  return {
    players: state.players,
    currentPlayer: state.currentPlayer,
    vsComputer: state.vsComputer,
    computerDifficulty: state.computerDifficulty,
    round: state.round,
    roundOver: state.roundOver,
    missionIndex: state.missionIndex,
    sessionSeed: state.sessionSeed,
    gameOver: state.gameOver,
    updatedAt: Date.now()
  };
}

async function createRoom() {
  if (!canUseOnline()) return;
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  state.online.roomCode = code;
  state.online.pendingRoomCode = "";
  configureOnlinePlayers(0);
  state.players[1].name = "상대 대기";
  state.sessionSeed = Math.floor(Math.random() * targetVariants.length);
  resetGame();
  await saveRoom(true);
  listenRoom();
  ui.roomStatus.textContent = `온라인 방 ${code}`;
  setRoomUrl(code);
  updateLobbyPresence();
  updateOnlineUi();
  setMessage(`온라인 방 ${code} 생성 완료. 로비에서 상대에게 도전하세요.`);
}

async function joinRoom(codeOverride = "") {
  if (!canUseOnline()) return;
  const code = codeOverride.trim().toUpperCase();
  if (!code) {
    setMessage("입장할 온라인 방 정보가 없습니다.");
    return;
  }
  state.online.roomCode = code;
  state.online.pendingRoomCode = "";
  const roomData = await fetchRoom(code);
  if (!roomData) {
    setMessage(`${code} 방을 찾을 수 없습니다.`);
    return;
  }
  applyRoomData(roomData);
  configureOnlinePlayers(1);
  state.players[1].name = onlinePlayerName("플레이어 2");
  await saveRoom(false);
  listenRoom();
  ui.roomStatus.textContent = `온라인 방 ${code}`;
  setRoomUrl(code);
  updateLobbyPresence();
  updateOnlineUi();
  setScreen("game");
  setMessage(`${code} 방에 입장했습니다.`);
}

async function challengeUser(uid) {
  if (!canUseOnline()) return;
  if (uid === state.online.user.uid) return;
  const opponent = state.online.onlineUsers.find((user) => user.uid === uid);
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  state.online.roomCode = code;
  state.online.pendingRoomCode = "";
  configureOnlinePlayers(0);
  state.players[1].name = opponent?.name || "상대 대기";
  state.sessionSeed = Math.floor(Math.random() * targetVariants.length);
  resetGame();
  await saveRoom(true);
  listenRoom();
  ui.roomStatus.textContent = `온라인 방 ${code}`;
  setRoomUrl(code);
  await updateLobbyPresence();

  const { api, instance } = state.online.db;
  await api.setDoc(api.doc(instance, "ball-target-challenges", uid), {
    status: "pending",
    roomCode: code,
    fromUid: state.online.user.uid,
    fromName: onlinePlayerName("플레이어 1"),
    toUid: uid,
    createdAt: Date.now()
  }, { merge: true });
  setScreen("game");
  setMessage(`${opponent?.name || "상대"}님에게 도전을 보냈습니다.`);
  renderLobby();
}

async function acceptChallenge() {
  const challenge = state.online.incomingChallenge;
  if (!challenge?.roomCode) return;
  await joinRoom(challenge.roomCode);
  const { api, instance } = state.online.db;
  await api.setDoc(api.doc(instance, "ball-target-challenges", state.online.user.uid), {
    status: "accepted",
    acceptedAt: Date.now()
  }, { merge: true });
  state.online.incomingChallenge = null;
  renderLobby();
}

async function declineChallenge() {
  if (!state.online.user || !state.online.db) return;
  const { api, instance } = state.online.db;
  await api.setDoc(api.doc(instance, "ball-target-challenges", state.online.user.uid), {
    status: "declined",
    declinedAt: Date.now()
  }, { merge: true });
  state.online.incomingChallenge = null;
  renderLobby();
  setMessage("도전을 거절했습니다.");
}

async function fetchRoom(code) {
  const { api, instance } = state.online.db;
  const ref = api.doc(instance, "ball-target-rooms", code);
  const snapshot = await api.getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}

function canUseOnline() {
  if (!state.online.enabled || !state.online.user) {
    setMessage("Google 로그인 후 온라인 기능을 사용할 수 있습니다.");
    return false;
  }
  return true;
}

async function saveRoom(reset = false) {
  const { api, instance } = state.online.db;
  const ref = api.doc(instance, "ball-target-rooms", state.online.roomCode);
  const roleData = state.online.localPlayerIndex === 0
    ? { hostUid: state.online.user.uid, hostName: onlinePlayerName("플레이어 1") }
    : { guestUid: state.online.user.uid, guestName: onlinePlayerName("플레이어 2") };
  await api.setDoc(ref, {
    ...roomPayload(),
    ...roleData,
    reset
  }, { merge: true });
}

function syncRoom(force = false) {
  if (!state.online.enabled || !state.online.roomCode || state.online.syncing) return;
  if (force || state.players.some((player) => player.throws.length > 0) || state.gameOver) {
    saveRoom().catch((error) => console.warn("방 저장 실패", error));
  }
}

function listenRoom() {
  if (state.online.unsub) state.online.unsub();
  const { api, instance } = state.online.db;
  const ref = api.doc(instance, "ball-target-rooms", state.online.roomCode);
  state.online.unsub = api.onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    state.online.syncing = true;
    applyRoomData(data);
    updateUi();
    state.online.syncing = false;
  });
}

function applyRoomData(data) {
  state.players = data.players || state.players;
  if (data.hostName && state.players[0]) state.players[0].name = data.hostName;
  if (data.guestName && state.players[1]) state.players[1].name = data.guestName;
  state.currentPlayer = data.currentPlayer || 0;
  state.vsComputer = Boolean(data.vsComputer);
  state.computerDifficulty = data.computerDifficulty || state.computerDifficulty;
  ui.difficultySelect.value = state.computerDifficulty;
  state.round = data.round || 1;
  state.roundOver = Boolean(data.roundOver);
  state.missionIndex = Number.isInteger(data.missionIndex) ? data.missionIndex : 0;
  state.sessionSeed = Number.isInteger(data.sessionSeed) ? data.sessionSeed : state.sessionSeed;
  state.currentMission = missions[state.missionIndex] || missions[0];
  state.gameOver = Boolean(data.gameOver);
  ui.roomStatus.textContent = state.online.roomCode ? `온라인 방 ${state.online.roomCode}` : "컴퓨터 대전";
  updateOnlineUi();
}

window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
ui.resetButton.addEventListener("click", resetGame);
ui.googleButton.addEventListener("click", signInWithGoogle);
ui.lobbyGoogleButton.addEventListener("click", signInWithGoogle);
ui.playComputerButton.addEventListener("click", playComputerGame);
ui.refreshLobbyButton.addEventListener("click", () => {
  updateLobbyPresence();
  renderLobby();
  setMessage("로비 목록을 새로 확인했습니다.");
});
ui.backToLobbyButton.addEventListener("click", () => setScreen("lobby"));
ui.difficultySelect.addEventListener("change", () => {
  state.computerDifficulty = ui.difficultySelect.value;
  setMessage(`컴퓨터 난이도: ${difficultyProfiles[state.computerDifficulty].label}`);
  syncRoom(true);
});
ui.itemButtons.forEach((button) => {
  button.addEventListener("click", () => selectItem(button.dataset.item));
});
ui.lobbyTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.online.lobbyTab = button.dataset.lobbyTab;
    renderLobby();
  });
});
ui.lobbyContent.addEventListener("click", (event) => {
  const challengeButton = event.target.closest("[data-challenge-uid]");
  if (challengeButton) {
    challengeUser(challengeButton.dataset.challengeUid).catch((error) => {
      console.warn("도전 전송 실패", error);
      setMessage("도전을 보내지 못했습니다. Firestore 권한을 확인해 주세요.");
    });
    return;
  }
  const buyButton = event.target.closest("[data-buy-item]");
  if (buyButton) buyItem(buyButton.dataset.buyItem);
});
ui.challengeNotice.addEventListener("click", (event) => {
  if (event.target.closest("[data-accept-challenge]")) {
    acceptChallenge().catch((error) => {
      console.warn("도전 수락 실패", error);
      setMessage("도전을 수락하지 못했습니다. 방이 사라졌거나 권한이 부족합니다.");
    });
  }
  if (event.target.closest("[data-decline-challenge]")) {
    declineChallenge().catch((error) => console.warn("도전 거절 실패", error));
  }
});
ui.soundButton.addEventListener("click", () => {
  ensureAudio();
  state.audioOn = !state.audioOn;
  ui.soundButton.textContent = state.audioOn ? "Ⅱ" : "♪";
  if (state.audioOn) startBgm();
  else stopBgm();
});

resizeCanvas();
updateUi();
initFirebase();
requestAnimationFrame(update);
