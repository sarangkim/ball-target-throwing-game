const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  stage: document.querySelector(".game-stage"),
  roomStatus: document.querySelector("#roomStatus"),
  soundButton: document.querySelector("#soundButton"),
  googleButton: document.querySelector("#googleButton"),
  resetButton: document.querySelector("#resetButton"),
  createRoomButton: document.querySelector("#createRoomButton"),
  joinRoomButton: document.querySelector("#joinRoomButton"),
  roomCodeInput: document.querySelector("#roomCodeInput"),
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
    { name: "플레이어 1", score: 0, throws: [], roundWins: 0, stars: 0, tickets: 0, combo: 0, ...playerBallStyles[0] },
    { name: "플레이어 2", score: 0, throws: [], roundWins: 0, stars: 0, tickets: 0, combo: 0, ...playerBallStyles[1] }
  ],
  currentPlayer: 0,
  throwsPerPlayer: 3,
  round: 1,
  targetRoundWins: 2,
  roundOver: false,
  missionIndex: 0,
  currentMission: missions[0],
  ball: null,
  dragging: false,
  dragStart: null,
  dragNow: null,
  flying: false,
  lastHit: null,
  gameOver: false,
  audioOn: false,
  online: {
    enabled: false,
    db: null,
    auth: null,
    user: null,
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
  const targetRadius = Math.min(w, h) * (isMobile ? 0.34 : 0.28);
  return {
    w,
    h,
    target: {
      x: w * (isMobile ? 0.46 : 0.43),
      y: h * (isMobile ? 0.38 : 0.44),
      r: targetRadius
    },
    ballHome: {
      x: w * (isMobile ? 0.68 : 0.73),
      y: h * (isMobile ? 0.78 : 0.77)
    }
  };
}

function resetBall() {
  const { ballHome } = layout();
  const player = state.players[state.currentPlayer];
  const rainbow = shouldUseRainbowBall();
  state.ball = {
    x: ballHome.x,
    y: ballHome.y,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: Math.max(18, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.035),
    spin: 0,
    color: rainbow ? "#f3df46" : player.ballColor,
    highlight: rainbow ? "#ffffff" : player.ballHighlight,
    rainbow
  };
  state.dragging = false;
  state.dragStart = null;
  state.dragNow = null;
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
  if (state.flying) return;
  const b = state.ball;
  const scale = b.radius / 28;
  const wristGradient = ctx.createLinearGradient(0, -b.radius, b.radius * 3, b.radius);
  ctx.save();
  ctx.translate(b.x + b.radius * 1.18, b.y + b.radius * 0.42);
  ctx.rotate(-0.22);

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
  if (state.gameOver || state.roundOver || state.flying) return;
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
  state.dragging = false;
  state.flying = true;
  playThrow();
}

function finishThrow() {
  state.flying = false;
  const { target } = layout();
  const impact = { x: state.ball.x, y: state.ball.y };
  const baseScore = scoreAtPoint(impact, target);
  const score = state.ball.rainbow ? Math.round(baseScore * 1.5) : baseScore;
  const player = state.players[state.currentPlayer];
  player.score += score;
  player.throws.push(score);
  const rewards = awardThrowRewards(player, baseScore, score);
  state.lastHit = { ...impact, score, radius: state.ball.radius, time: performance.now() };
  playHit(score);

  advanceTurn(player, score, rewards);
  updateUi();
  syncRoom();
  setTimeout(() => {
    if (!state.gameOver && !state.roundOver) resetBall();
  }, 760);
}

function scoreAtPoint(point, target) {
  const dx = point.x - target.x;
  const dy = point.y - target.y;
  const distanceRatio = Math.hypot(dx, dy) / target.r;
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
  if (finalScore > baseScore) {
    rewards.push("무지개 공 1.5배");
  }

  return rewards;
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
  state.players = state.players.map((player, index) => ({ ...playerBallStyles[index], ...player }));
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

function setMessage(text) {
  ui.message.textContent = text;
}

function resetGame() {
  state.players.forEach((player, index) => {
    player.score = 0;
    player.throws = [];
    player.roundWins = 0;
    player.stars = 0;
    player.tickets = 0;
    player.combo = 0;
    if (!state.online.user) player.name = `플레이어 ${index + 1}`;
  });
  if (state.online.user) state.players[0].name = state.online.user.displayName || "Google 플레이어";
  state.currentPlayer = 0;
  state.round = 1;
  state.roundOver = false;
  state.gameOver = false;
  state.missionIndex = 0;
  state.currentMission = missions[state.missionIndex];
  restartBgmForTheme();
  resetBall();
  updateUi();
  syncRoom(true);
  setMessage("3판 2승 시작! 공을 뒤로 당겼다가 과녁을 향해 놓아보세요.");
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
  if (score >= 80) {
    [659, 784, 988, 1318].forEach((freq, i) => tone(freq, 0.16, "square", 0.055, i * 0.07));
  } else if (score >= 40) {
    [523, 659, 784].forEach((freq, i) => tone(freq, 0.14, "triangle", 0.045, i * 0.08));
  } else if (score > 0) {
    [392, 523].forEach((freq, i) => tone(freq, 0.15, "sine", 0.04, i * 0.1));
  } else {
    tone(160, 0.18, "sawtooth", 0.035);
    tone(120, 0.22, "sine", 0.025, 0.12);
  }
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
    ui.onlineHint.textContent = "Google 로그인 후 방을 만들거나 코드로 입장할 수 있습니다.";
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
  setMessage("Google 로그인 완료. 온라인 방을 만들 수 있어요.");
  updateUi();
}

function roomPayload() {
  return {
    players: state.players,
    currentPlayer: state.currentPlayer,
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
  await saveRoom(true);
  listenRoom();
  ui.roomCodeInput.value = code;
  ui.roomStatus.textContent = `온라인 방 ${code}`;
  setMessage(`방 코드 ${code}를 친구에게 알려주세요.`);
}

async function joinRoom() {
  if (!canUseOnline()) return;
  const code = ui.roomCodeInput.value.trim().toUpperCase();
  if (!code) {
    setMessage("입장할 방 코드를 입력해주세요.");
    return;
  }
  state.online.roomCode = code;
  listenRoom();
  ui.roomStatus.textContent = `온라인 방 ${code}`;
  setMessage(`${code} 방에 입장했습니다.`);
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
  await api.setDoc(ref, {
    ...roomPayload(),
    host: state.online.user.uid,
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
    state.players = data.players || state.players;
    state.currentPlayer = data.currentPlayer || 0;
    state.round = data.round || 1;
    state.roundOver = Boolean(data.roundOver);
    state.missionIndex = Number.isInteger(data.missionIndex) ? data.missionIndex : 0;
    state.currentMission = missions[state.missionIndex] || missions[0];
    state.gameOver = Boolean(data.gameOver);
    updateUi();
    state.online.syncing = false;
  });
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
