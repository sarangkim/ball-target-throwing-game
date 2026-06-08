const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  stage: document.querySelector(".game-stage"),
  roomStatus: document.querySelector("#roomStatus"),
  soundButton: document.querySelector("#soundButton"),
  googleButton: document.querySelector("#googleButton"),
  resetButton: document.querySelector("#resetButton"),
  difficultySelect: document.querySelector("#difficultySelect"),
  createRoomButton: document.querySelector("#createRoomButton"),
  joinRoomButton: document.querySelector("#joinRoomButton"),
  copyInviteButton: document.querySelector("#copyInviteButton"),
  roomCodeInput: document.querySelector("#roomCodeInput"),
  inviteLinkBox: document.querySelector("#inviteLinkBox"),
  onlineHint: document.querySelector("#onlineHint"),
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
  online: {
    enabled: false,
    db: null,
    auth: null,
    user: null,
    localPlayerIndex: null,
    pendingRoomCode: "",
    roomCode: "",
    unsub: null,
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
  const targetRadius = Math.min(w, h) * (isMobile ? 0.32 : 0.28);
  return {
    w,
    h,
    target: {
      x: w * (isMobile ? 0.46 : 0.43),
      y: h * (isMobile ? 0.36 : 0.44),
      r: targetRadius
    },
    ballHome: {
      x: w * (isMobile ? 0.68 : 0.73),
      y: h * (isMobile ? 0.66 : 0.77)
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
  ctx.save();
  ctx.translate(target.x, target.y);

  ctx.strokeStyle = "#242b39";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-target.r * 0.22, -target.r * 1.02);
  ctx.lineTo(0, -target.r * 1.25);
  ctx.lineTo(target.r * 0.22, -target.r * 1.02);
  ctx.stroke();

  targetArtRings.forEach((ring, ringIndex) => {
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
      ctx.fillStyle = ringIndex === 3 ? "#df4655" : colors[(i + ringIndex) % colors.length];
      ctx.fill();
      ctx.strokeStyle = "#f4f5f8";
      ctx.lineWidth = target.r * 0.035;
      ctx.stroke();

      const mid = (start + end) / 2;
      const textRadius = (outer + inner) / 2;
      ctx.fillStyle = colors[(i + ringIndex) % colors.length] === "#f3df46" ? "#c84652" : "#fff";
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
  ctx.restore();

  ctx.strokeStyle = "rgba(124, 70, 58, 0.26)";
  ctx.lineWidth = 1.5 * scale;
  drawPalmLine(-1, -2, 30, 8, scale);
  drawPalmLine(4, 13, 37, 22, scale);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
  drawPalmLine(-2, -18, 34, -20, scale);

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
  ctx.stroke();
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
  const dx = point.x - target.x;
  const dy = point.y - target.y;
  const distanceRatio = Math.max(0, Math.hypot(dx, dy) / target.r - bonusRadius);
  const ring = scoreRings.find((entry) => distanceRatio <= entry.limit);
  if (!ring) return 0;
  if (ring.scores.length === 1) return ring.scores[0];
  const angle = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
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
  setMessage(`${state.round}라운드 시작! ${state.players[state.currentPlayer].name} 먼저 던집니다.`);
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
    ...playerBallStyles[index],
    items: { ...defaultItems, ...(player.items || {}) },
    selectedItem: "",
    ...player
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
  setMessage("3판 2승 시작! 공을 뒤로 당겼다가 과녁을 향해 놓아보세요.");
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
    hydrateRoomFromUrl();
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
  updateOnlineUi();
  if (state.online.pendingRoomCode && !state.online.roomCode) {
    ui.roomCodeInput.value = state.online.pendingRoomCode;
    setMessage(`${state.online.pendingRoomCode} 방 코드가 준비됐습니다. 입장을 누르세요.`);
  } else {
    setMessage("Google 로그인 완료. 온라인 방을 만들 수 있어요.");
  }
  updateUi();
}

function hydrateRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get("room") || "").trim().toUpperCase();
  if (!code) return;
  state.online.pendingRoomCode = code;
  ui.roomCodeInput.value = code;
  ui.inviteLinkBox.textContent = makeInviteLink(code);
  ui.onlineHint.textContent = state.online.user ? `${code} 방에 입장할 수 있습니다.` : `${code} 초대 링크입니다. Google 로그인 후 입장하세요.`;
}

function makeInviteLink(code = state.online.roomCode) {
  if (!code) return "";
  const url = new URL(window.location.href);
  url.searchParams.set("room", code);
  url.searchParams.set("v", "online");
  return url.toString();
}

function setRoomUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", code);
  url.searchParams.set("v", "online");
  window.history.replaceState({}, "", url);
}

function updateOnlineUi() {
  const code = state.online.roomCode || state.online.pendingRoomCode || ui.roomCodeInput.value.trim().toUpperCase();
  const link = makeInviteLink(code);
  ui.copyInviteButton.disabled = !code;
  ui.inviteLinkBox.textContent = link || "방을 만들면 초대 링크가 여기에 표시됩니다.";
  if (!state.online.enabled) {
    ui.onlineHint.textContent = "Firebase 설정 후 온라인 대전이 활성화됩니다.";
  } else if (!state.online.user) {
    ui.onlineHint.textContent = code ? "Google 로그인 후 초대받은 방에 입장하세요." : "Google 로그인 후 방을 만들거나 초대 링크로 입장하세요.";
  } else if (state.online.roomCode) {
    ui.onlineHint.textContent = state.online.localPlayerIndex === 0 ? "초대 링크를 상대에게 보내세요." : "상대와 연결됐습니다. 내 차례에 던지세요.";
  } else {
    ui.onlineHint.textContent = "방을 만들거나 상대의 방 코드로 입장하세요.";
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
  resetGame();
  await saveRoom(true);
  listenRoom();
  ui.roomCodeInput.value = code;
  ui.roomStatus.textContent = `온라인 방 ${code}`;
  setRoomUrl(code);
  updateOnlineUi();
  setMessage(`방 ${code} 생성 완료. 초대 링크를 상대에게 보내세요.`);
}

async function joinRoom() {
  if (!canUseOnline()) return;
  const code = ui.roomCodeInput.value.trim().toUpperCase();
  if (!code) {
    setMessage("입장할 방 코드를 입력해주세요.");
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
  updateOnlineUi();
  setMessage(`${code} 방에 입장했습니다.`);
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
ui.createRoomButton.addEventListener("click", createRoom);
ui.joinRoomButton.addEventListener("click", joinRoom);
ui.copyInviteButton.addEventListener("click", async () => {
  const code = state.online.roomCode || state.online.pendingRoomCode || ui.roomCodeInput.value.trim().toUpperCase();
  const link = makeInviteLink(code);
  if (!link) {
    setMessage("먼저 방을 만들거나 방 코드를 입력하세요.");
    return;
  }
  try {
    await navigator.clipboard.writeText(link);
    setMessage("초대 링크를 복사했습니다.");
  } catch {
    ui.inviteLinkBox.textContent = link;
    setMessage("복사가 막혔습니다. 표시된 링크를 길게 눌러 복사하세요.");
  }
});
ui.roomCodeInput.addEventListener("input", () => {
  ui.roomCodeInput.value = ui.roomCodeInput.value.toUpperCase();
  state.online.pendingRoomCode = ui.roomCodeInput.value.trim().toUpperCase();
  updateOnlineUi();
});
ui.difficultySelect.addEventListener("change", () => {
  state.computerDifficulty = ui.difficultySelect.value;
  setMessage(`컴퓨터 난이도: ${difficultyProfiles[state.computerDifficulty].label}`);
  syncRoom(true);
});
ui.itemButtons.forEach((button) => {
  button.addEventListener("click", () => selectItem(button.dataset.item));
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
