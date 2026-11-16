(() => {
  "use strict";

  const canvas = document.querySelector("#bounce-board");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const ui = {
    start: document.querySelector("[data-bounce-start]"),
    overlayStart: document.querySelector("[data-bounce-overlay-start]"),
    pause: document.querySelector("[data-bounce-pause]"),
    restart: document.querySelector("[data-bounce-restart]"),
    state: document.querySelector("[data-bounce-state]"),
    status: document.querySelector("[data-bounce-status]"),
    score: document.querySelector("[data-bounce-score]"),
    level: document.querySelector("[data-bounce-level]"),
    lives: document.querySelector("[data-bounce-lives]"),
    best: document.querySelector("[data-bounce-best]"),
    speed: document.querySelector("[data-bounce-speed]"),
    ai: document.querySelector("[data-bounce-ai]"),
    aiLabel: document.querySelector("[data-bounce-ai-label]"),
    god: document.querySelector("[data-bounce-god]"),
    godLabel: document.querySelector("[data-bounce-god-label]"),
    overlay: document.querySelector("[data-bounce-overlay]"),
    overlayTitle: document.querySelector("[data-bounce-overlay-title]"),
    overlayCopy: document.querySelector("[data-bounce-overlay-copy]"),
    sound: document.querySelector("[data-arcade-sound]")
  };

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GRAVITY = 1450;
  const BASE_BOUNCE = -600;
  const MAX_RUN_SPEED = 300;
  const levels = [
    {
      name: "Cloudline",
      height: 920,
      spawn: { x: 82, y: 430 },
      exit: { x: 1638, y: 136 },
      platforms: [
        { x: 0, y: 480, w: 230, h: 36 },
        { x: 294, y: 414, w: 168, h: 22 },
        { x: 532, y: 338, w: 156, h: 22 },
        { x: 765, y: 415, w: 166, h: 22 },
        { x: 1007, y: 335, w: 158, h: 22 },
        { x: 1242, y: 258, w: 154, h: 22 },
        { x: 1468, y: 192, w: 230, h: 26 },
        { x: 865, y: 242, w: 110, h: 18 }
      ],
      shards: [
        { x: 362, y: 363 }, { x: 596, y: 287 }, { x: 827, y: 362 },
        { x: 1072, y: 284 }, { x: 1301, y: 207 }, { x: 1579, y: 145 }
      ],
      hazards: [
        { x: 405, y: 394, w: 33, h: 20 }, { x: 1090, y: 315, w: 38, h: 20 },
        { x: 1516, y: 170, w: 42, h: 22 }
      ],
      checkpoint: { x: 956, y: 309 },
      stars: 34
    },
    {
      name: "Ember Drift",
      height: 1010,
      spawn: { x: 72, y: 450 },
      exit: { x: 1685, y: 102 },
      platforms: [
        { x: 0, y: 500, w: 230, h: 36 },
        { x: 281, y: 420, w: 150, h: 22 },
        { x: 500, y: 333, w: 158, h: 22 },
        { x: 730, y: 255, w: 146, h: 22 },
        { x: 950, y: 356, w: 164, h: 22 },
        { x: 1192, y: 277, w: 154, h: 22 },
        { x: 1418, y: 190, w: 150, h: 22 },
        { x: 1600, y: 148, w: 155, h: 26 },
        { x: 856, y: 170, w: 86, h: 18 }
      ],
      shards: [
        { x: 332, y: 369 }, { x: 558, y: 282 }, { x: 783, y: 203 },
        { x: 1009, y: 307 }, { x: 1250, y: 227 }, { x: 1468, y: 140 },
        { x: 1660, y: 100 }
      ],
      hazards: [
        { x: 380, y: 400, w: 36, h: 20 }, { x: 1000, y: 335, w: 38, h: 20 },
        { x: 1240, y: 255, w: 36, h: 20 }, { x: 1642, y: 126, w: 38, h: 22 }
      ],
      checkpoint: { x: 910, y: 321 },
      stars: 47
    },
    {
      name: "The High Blue",
      height: 1080,
      spawn: { x: 72, y: 456 },
      exit: { x: 1678, y: 98 },
      platforms: [
        { x: 0, y: 505, w: 224, h: 36 },
        { x: 278, y: 410, w: 150, h: 22 },
        { x: 494, y: 326, w: 145, h: 22 },
        { x: 710, y: 233, w: 148, h: 22 },
        { x: 932, y: 317, w: 144, h: 22 },
        { x: 1148, y: 225, w: 148, h: 22 },
        { x: 1365, y: 151, w: 140, h: 22 },
        { x: 1578, y: 143, w: 185, h: 26 },
        { x: 852, y: 146, w: 70, h: 18 }
      ],
      shards: [
        { x: 324, y: 358 }, { x: 540, y: 273 }, { x: 758, y: 181 },
        { x: 978, y: 264 }, { x: 1195, y: 171 }, { x: 1410, y: 100 },
        { x: 1641, y: 98 }
      ],
      hazards: [
        { x: 366, y: 390, w: 36, h: 20 }, { x: 536, y: 306, w: 40, h: 20 },
        { x: 974, y: 297, w: 37, h: 20 }, { x: 1611, y: 120, w: 38, h: 22 }
      ],
      checkpoint: { x: 893, y: 284 },
      stars: 61
    }
  ];

  const audio = window.GTekSDArcadeAudio.create({
    game: "bounce",
    button: document.querySelector("[data-arcade-sound]")
  });

  const keys = new Set();
  const held = { left: false, right: false };
  const storage = {
    get(key, fallback) {
      try {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) && value >= 0 ? value : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
      } catch {
        // The game remains playable when browser storage is unavailable.
      }
    }
  };

  let best = storage.get("gteksd-bounce-best", 0);
  let levelIndex = 0;
  let score = 0;
  let lives = 3;
  let gameState = "ready";
  let cameraX = 0;
  let cameraY = 0;
  let lastTime = 0;
  let animationFrame = 0;
  let elapsed = 0;
  let checkpointActive = false;
  let levelData = null;
  let levelShards = [];
  let player = null;
  let particles = [];

  const playerRadius = 17;
  const colors = {
    mint: "#8df2cd",
    gold: "#ffd475",
    pink: "#ff8e9d",
    blue: "#73c7ff"
  };

  function makePlayer(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      r: playerRadius,
      onGround: false,
      invulnerable: 0,
      squash: 0
    };
  }

  function loadLevel(index, announce = false) {
    levelIndex = index;
    levelData = levels[levelIndex];
    levelShards = levelData.shards.map((shard) => ({ ...shard, collected: false }));
    player = makePlayer(levelData.spawn);
    checkpointActive = false;
    cameraX = 0;
    cameraY = 0;
    particles = [];
    if (announce) {
      say(`${levelData.name}! New sky, new shards.`, "LEVEL");
      playSound("level");
    }
    updateHud();
  }

  function playSound(kind) {
    try {
      audio?.play(kind);
    } catch {
      // Audio must never interrupt a run.
    }
  }

  function say(message, state = gameState.toUpperCase()) {
    ui.status.textContent = message;
    ui.state.textContent = state;
  }

  function showOverlay(title, copy, buttonText = "Start run") {
    ui.overlayTitle.textContent = title;
    ui.overlayCopy.textContent = copy;
    ui.overlayStart.textContent = buttonText;
    ui.overlay.hidden = false;
  }

  function hideOverlay() {
    ui.overlay.hidden = true;
  }

  function updateHud() {
    ui.score.textContent = String(score).padStart(3, "0");
    ui.level.textContent = String(levelIndex + 1).padStart(2, "0");
    ui.lives.textContent = `${"♥ ".repeat(Math.max(0, lives)).trim()}${lives ? "" : "—"}`;
    ui.best.textContent = String(best).padStart(3, "0");
    ui.pause.disabled = gameState !== "running";
    ui.pause.textContent = gameState === "paused" ? "Resume" : "Pause";
    ui.start.disabled = gameState === "running";
  }

  function setState(next, message) {
    gameState = next;
    if (message) say(message, next.toUpperCase());
    updateHud();
    if (next === "running") hideOverlay();
  }

  function startGame() {
    if (gameState === "complete" || gameState === "gameover") resetRun();
    setState("running", "Go! Gather the star shards and bounce to the gate.");
    canvas.focus({ preventScroll: true });
    lastTime = performance.now();
    if (!animationFrame) animationFrame = requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (gameState === "running") {
      setState("paused", "Run paused. Press P or Resume when you're ready.");
      showOverlay("Paused", "Your sky is right where you left it.", "Resume run");
    } else if (gameState === "paused") {
      startGame();
    }
  }

  function resetRun() {
    score = 0;
    lives = 3;
    loadLevel(0);
    setState("ready", "Fresh run. Collect shards and find the gate.");
    showOverlay("Ready to bounce?", "Collect the shards. Find the gate.", "Start run");
  }

  function loseLife(message) {
    if (player.invulnerable > 0) return;
    lives -= 1;
    playSound("hit");
    updateHud();
    if (lives <= 0) {
      setState("gameover", "Out of lives. Restart to try the skies again.");
      playSound("gameover");
      showOverlay("Run over", `You found ${score} shards. Ready for another flight?`, "Try again");
      return;
    }

    const spawn = checkpointActive ? levelData.checkpoint : levelData.spawn;
    player = makePlayer({ x: spawn.x, y: spawn.y - 30 });
    player.invulnerable = 1.5;
    say(`${message} ${lives} ${lives === 1 ? "life" : "lives"} left.`, "HIT");
    emitParticles(player.x, player.y, colors.pink, 12);
    updateHud();
  }

  function finishLevel() {
    if (levelIndex === levels.length - 1) {
      setState("complete", `Sky conquered! Final score: ${score} shards.`);
      playSound("gameover");
      showOverlay("All skies cleared!", `A bright run: ${score} shards collected.`, "Play again");
      return;
    }
    loadLevel(levelIndex + 1, true);
    setState("running", `${levelData.name} unlocked. Keep climbing!`);
  }

  function doJump(boost = false) {
    if (gameState !== "running" || ui.ai.getAttribute("aria-pressed") === "true") return;
    if (player.onGround || boost) {
      player.vy = boost ? BASE_BOUNCE * 1.18 : BASE_BOUNCE * 1.12;
      player.onGround = false;
      player.squash = 0.18;
      playSound("jump");
      emitParticles(player.x, player.y + player.r, colors.mint, 5);
    }
  }

  function toggleMode(button, label, enabledText, disabledText) {
    const enabled = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(enabled));
    label.textContent = enabled ? enabledText : disabledText;
    return enabled;
  }

  function update(dt) {
    elapsed += dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.squash = Math.max(0, player.squash - dt);
    particles = particles.filter((particle) => particle.life > 0);
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 220 * dt;
      particle.life -= dt;
    }

    const ai = ui.ai.getAttribute("aria-pressed") === "true";
    const speed = Number(ui.speed.value) || 1;
    let direction = (held.right || keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0)
      - (held.left || keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);

    if (ai) {
      const target = levelShards.find((shard) => !shard.collected) || levelData.exit;
      const deltaX = target.x - player.x;
      direction = Math.abs(deltaX) > 22 ? Math.sign(deltaX) : 0;
      if (player.onGround) doJump(true);
    }

    const targetSpeed = direction * MAX_RUN_SPEED * speed;
    const acceleration = player.onGround ? 1800 : 1100;
    player.vx += Math.max(-acceleration * dt, Math.min(acceleration * dt, targetSpeed - player.vx));
    if (!direction) player.vx *= Math.pow(player.onGround ? 0.0008 : 0.18, dt);
    player.vx = Math.max(-MAX_RUN_SPEED * speed, Math.min(MAX_RUN_SPEED * speed, player.vx));

    const previousX = player.x;
    const previousY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.vy += GRAVITY * dt;
    player.onGround = false;

    for (const platform of levelData.platforms) {
      const overlapsX = player.x + player.r > platform.x && player.x - player.r < platform.x + platform.w;
      const overlapsY = player.y + player.r > platform.y && player.y - player.r < platform.y + platform.h;
      if (!overlapsX || !overlapsY) continue;

      if (previousY + player.r <= platform.y && player.vy >= 0) {
        player.y = platform.y - player.r;
        player.vy = BASE_BOUNCE;
        player.onGround = true;
        player.squash = 0.13;
        emitParticles(player.x, platform.y, colors.mint, 4);
        playSound("jump");
      } else if (previousY - player.r >= platform.y + platform.h && player.vy < 0) {
        player.y = platform.y + platform.h + player.r;
        player.vy = 80;
      } else if (previousX + player.r <= platform.x && player.vx > 0) {
        player.x = platform.x - player.r;
        player.vx = 0;
      } else if (previousX - player.r >= platform.x + platform.w && player.vx < 0) {
        player.x = platform.x + platform.w + player.r;
        player.vx = 0;
      }
    }

    player.x = Math.max(player.r, Math.min(1790 - player.r, player.x));
    for (const shard of levelShards) {
      if (!shard.collected && Math.hypot(player.x - shard.x, player.y - shard.y) < player.r + 15) {
        shard.collected = true;
        score += 1;
        if (score > best) {
          best = score;
          storage.set("gteksd-bounce-best", best);
        }
        playSound("collect");
        emitParticles(shard.x, shard.y, colors.gold, 13);
        say(`Shard collected! ${levelShards.filter((item) => !item.collected).length} left in this sky.`, "NICE!");
        updateHud();
      }
    }

    const checkpoint = levelData.checkpoint;
    if (!checkpointActive && Math.hypot(player.x - checkpoint.x, player.y - (checkpoint.y - 30)) < 45) {
      checkpointActive = true;
      say("Checkpoint lit! You'll return here if you fall.", "SAVED");
      playSound("collect");
      emitParticles(checkpoint.x, checkpoint.y - 30, colors.blue, 18);
    }

    if (ui.god.getAttribute("aria-pressed") !== "true") {
      for (const hazard of levelData.hazards) {
        const nearestX = Math.max(hazard.x, Math.min(player.x, hazard.x + hazard.w));
        const nearestY = Math.max(hazard.y, Math.min(player.y, hazard.y + hazard.h));
        if (Math.hypot(player.x - nearestX, player.y - nearestY) < player.r + 4) {
          loseLife("A spark caught you.");
          break;
        }
      }
    }

    const allCollected = levelShards.every((shard) => shard.collected);
    if (allCollected && Math.abs(player.x - levelData.exit.x) < 44 && Math.abs(player.y - levelData.exit.y) < 55) {
      finishLevel();
      return;
    }

    if (player.y > levelData.height + 80) loseLife("The clouds slipped away.");
    cameraX = Math.max(0, Math.min(1790 - WIDTH, player.x - WIDTH * 0.43));
    cameraY = Math.max(0, Math.min(levelData.height - HEIGHT, player.y - HEIGHT * 0.63));
  }

  function emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const speed = 35 + Math.random() * 125;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        color,
        life: 0.32 + Math.random() * 0.32,
        maxLife: 0.64,
        size: 2 + Math.random() * 3
      });
    }
  }

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#132339");
    gradient.addColorStop(1, "#182534");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < 80; i += 1) {
      const x = ((i * 197 + 43) % 1870) - cameraX * (0.18 + (i % 3) * 0.08);
      const y = ((i * 131 + 19) % levelData.height) - cameraY * 0.32;
      const sx = ((x % WIDTH) + WIDTH) % WIDTH;
      const sy = ((y % HEIGHT) + HEIGHT) % HEIGHT;
      const shimmer = 0.35 + (Math.sin(elapsed * (0.8 + (i % 5) * 0.12) + i) + 1) * 0.28;
      ctx.globalAlpha = shimmer;
      ctx.fillStyle = i % 7 === 0 ? "#ffc96a" : "#b9d7e2";
      ctx.fillRect(sx, sy, i % 8 === 0 ? 3 : 2, i % 8 === 0 ? 3 : 2);
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 257 + 73 - cameraX * (0.08 + i * 0.01)) % 1950 + 1950) % 1950;
      const y = ((i * 173 + 104 - cameraY * 0.19) % HEIGHT + HEIGHT) % HEIGHT;
      ctx.fillStyle = "rgba(133, 186, 206, .045)";
      ctx.beginPath();
      ctx.ellipse(x, y, 80 + (i % 3) * 30, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatform(platform) {
    const x = platform.x - cameraX;
    const y = platform.y - cameraY;
    if (x + platform.w < -30 || x > WIDTH + 30 || y + platform.h < -30 || y > HEIGHT + 30) return;
    ctx.shadowColor = "rgba(101, 220, 196, .2)";
    ctx.shadowBlur = 12;
    roundRect(x, y, platform.w, platform.h, 8);
    ctx.fillStyle = "#29465a";
    ctx.fill();
    ctx.shadowBlur = 0;
    roundRect(x + 2, y + 2, platform.w - 4, 6, 4);
    ctx.fillStyle = "#69d8ba";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.12)";
    for (let dot = 0; dot < Math.floor(platform.w / 32); dot += 1) {
      ctx.fillRect(x + 12 + dot * 32, y + 13, 3, 3);
    }
  }

  function drawHazard(hazard) {
    const x = hazard.x - cameraX;
    const y = hazard.y - cameraY;
    if (x + hazard.w < -20 || x > WIDTH + 20 || y + hazard.h < -20 || y > HEIGHT + 20) return;
    const spikes = Math.max(2, Math.floor(hazard.w / 13));
    ctx.fillStyle = "#ff8296";
    ctx.shadowColor = "rgba(255, 102, 132, .48)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x, y + hazard.h);
    for (let i = 0; i < spikes; i += 1) {
      const left = x + (hazard.w * i) / spikes;
      ctx.lineTo(left + hazard.w / spikes / 2, y + 1 + (i % 2) * 4);
      ctx.lineTo(left + hazard.w / spikes, y + hazard.h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(71, 23, 48, .55)";
    ctx.fillRect(x, y + hazard.h - 4, hazard.w, 4);
  }

  function drawShard(shard) {
    if (shard.collected) return;
    const x = shard.x - cameraX;
    const y = shard.y - cameraY + Math.sin(elapsed * 3.2 + shard.x) * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = "rgba(255, 211, 119, .8)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffcf70";
    ctx.fillRect(-8, -8, 16, 16);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff1bd";
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }

  function drawCheckpoint() {
    const x = levelData.checkpoint.x - cameraX;
    const y = levelData.checkpoint.y - cameraY;
    ctx.strokeStyle = checkpointActive ? "#7bd2ff" : "rgba(156, 189, 201, .56)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 30);
    ctx.lineTo(x, y - 23);
    ctx.stroke();
    ctx.fillStyle = checkpointActive ? "#7bd2ff" : "#728c9b";
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 21);
    ctx.lineTo(x + 23, y - 13);
    ctx.lineTo(x + 1, y - 5);
    ctx.closePath();
    ctx.fill();
    if (checkpointActive) {
      ctx.globalAlpha = 0.2 + (Math.sin(elapsed * 4) + 1) * 0.11;
      ctx.fillStyle = "#7bd2ff";
      ctx.beginPath();
      ctx.arc(x, y - 20, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawExit() {
    const exit = levelData.exit;
    const x = exit.x - cameraX;
    const y = exit.y - cameraY;
    const open = levelShards.every((shard) => shard.collected);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = open ? "#8df2cd" : "#77919f";
    ctx.lineWidth = 6;
    ctx.shadowColor = open ? "rgba(141, 242, 205, .7)" : "transparent";
    ctx.shadowBlur = open ? 22 : 0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25 + Math.sin(elapsed * 2) * 2, 35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = open ? "rgba(141, 242, 205, .19)" : "rgba(119, 145, 159, .12)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 27, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = open ? "#e5fff5" : "#a2b3ba";
    ctx.font = "700 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(open ? "GO" : "LOCK", 0, 4);
    ctx.restore();
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(elapsed * 14) % 2 === 0) return;
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    const squash = player.squash > 0 ? Math.sin((player.squash / 0.18) * Math.PI) * 0.13 : 0;
    const scaleX = 1 + squash;
    const scaleY = 1 - squash;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    ctx.shadowColor = "rgba(119, 234, 205, .68)";
    ctx.shadowBlur = 21;
    const orb = ctx.createRadialGradient(-6, -8, 2, 0, 0, player.r + 2);
    orb.addColorStop(0, "#effff5");
    orb.addColorStop(0.35, "#99f2ce");
    orb.addColorStop(1, "#39a88f");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, .72)";
    ctx.beginPath();
    ctx.ellipse(-6, -8, 5, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#254b52";
    ctx.beginPath();
    ctx.arc(-5, 1, 2, 0, Math.PI * 2);
    ctx.arc(5, 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x - cameraX, particle.y - cameraY, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    drawBackground();
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "rgba(136, 174, 193, .16)";
    ctx.lineWidth = 1;
    for (let x = -cameraX % 80; x < WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    ctx.restore();
    levelData.platforms.forEach(drawPlatform);
    levelData.hazards.forEach(drawHazard);
    levelShards.forEach(drawShard);
    drawCheckpoint();
    drawExit();
    drawParticles();
    drawPlayer();
    if (!levelShards.every((shard) => shard.collected)) {
      const remaining = levelShards.filter((shard) => !shard.collected).length;
      ctx.fillStyle = "rgba(8, 15, 23, .68)";
      roundRect(18, 16, 154, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#d7e6e7";
      ctx.font = "600 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${remaining} SHARDS TO UNLOCK`, 30, 36);
    }
  }

  function loop(now) {
    animationFrame = 0;
    const dt = Math.min(0.032, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (gameState === "running") update(dt);
    draw();
    if (gameState === "running") animationFrame = requestAnimationFrame(loop);
  }

  function requestDraw() {
    draw();
  }

  ui.start.addEventListener("click", startGame);
  ui.overlayStart.addEventListener("click", startGame);
  ui.pause.addEventListener("click", pauseGame);
  ui.restart.addEventListener("click", () => {
    resetRun();
    startGame();
  });
  ui.ai.addEventListener("click", () => {
    const enabled = toggleMode(ui.ai, ui.aiLabel, "ON", "OFF");
    if (enabled && gameState === "running") say("Autoplay pilot engaged. You can still take the controls.", "AUTO");
  });
  ui.god.addEventListener("click", () => {
    const enabled = toggleMode(ui.god, ui.godLabel, "ON", "OFF");
    say(enabled ? "God mode on. Hazards can't hurt you." : "God mode off. Watch those sparks!", "MODE");
  });
  ui.speed.addEventListener("change", () => {
    say(`Speed set to ${ui.speed.selectedOptions[0].text.toLowerCase()}.`, "SPEED");
  });

  document.querySelectorAll("[data-bounce-move]").forEach((button) => {
    const direction = button.dataset.bounceMove;
    const release = () => { held[direction] = false; };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      held[direction] = true;
      button.setPointerCapture?.(event.pointerId);
      if (gameState === "ready") startGame();
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  });
  document.querySelector("[data-bounce-jump]").addEventListener("click", () => {
    if (gameState === "ready") startGame();
    doJump(true);
  });

  window.addEventListener("keydown", (event) => {
    const code = event.code;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(code)) event.preventDefault();
    if (code === "KeyP" || code === "Escape") {
      if (gameState === "running" || gameState === "paused") pauseGame();
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(code)) {
      keys.add(code);
      if (gameState === "ready" && code !== "ArrowLeft" && code !== "ArrowRight" && code !== "KeyA" && code !== "KeyD") startGame();
    }
    if (["Space", "ArrowUp", "KeyW"].includes(code) && !event.repeat) doJump(true);
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => {
    keys.clear();
    held.left = false;
    held.right = false;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && gameState === "running") pauseGame();
  });

  loadLevel(0);
  ui.best.textContent = String(best).padStart(3, "0");
  showOverlay("Ready to bounce?", "Collect the shards. Find the gate.", "Start run");
  say("Ready. Start a run when you're set.", "READY");
  draw();
})();
