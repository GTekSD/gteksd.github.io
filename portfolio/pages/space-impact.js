(() => {
  const canvas = document.querySelector("#space-board");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const audio = window.GTekSDArcadeAudio.create({
    game: "space-impact",
    button: document.querySelector("[data-arcade-sound]")
  });
  const scoreOutput = document.querySelector("[data-space-score]");
  const bestOutput = document.querySelector("[data-space-best]");
  const waveOutput = document.querySelector("[data-space-wave]");
  const livesOutput = document.querySelector("[data-space-lives]");
  const stateOutput = document.querySelector("[data-space-state]");
  const statusOutput = document.querySelector("[data-space-status]");
  const startButton = document.querySelector("[data-space-start]");
  const pauseButton = document.querySelector("[data-space-pause]");
  const restartButton = document.querySelector("[data-space-restart]");
  const aiButton = document.querySelector("[data-space-ai]");
  const aiLabel = document.querySelector("[data-space-ai-label]");
  const godButton = document.querySelector("[data-space-god]");
  const godLabel = document.querySelector("[data-space-god-label]");
  const difficultySelect = document.querySelector("[data-space-difficulty]");
  const directionButtons = document.querySelectorAll("[data-space-key]");
  const fireButton = document.querySelector("[data-space-fire]");
  const width = canvas.width;
  const height = canvas.height;
  const storageKey = "gteksd-space-impact-high-score";
  const difficulty = {
    rookie: { enemySpeed: 82, spawnTime: 1.35, enemyFire: 2.8 },
    pilot: { enemySpeed: 112, spawnTime: 1.05, enemyFire: 2.2 },
    ace: { enemySpeed: 148, spawnTime: 0.78, enemyFire: 1.65 }
  };
  const pressed = new Set();
  const stars = Array.from({ length: 92 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.7 + 0.3,
    speed: Math.random() * 80 + 20
  }));
  const player = { x: 118, y: height / 2, radius: 17, invulnerable: 0 };
  let state = "ready";
  let score = 0;
  let best = readBest();
  let lives = 3;
  let wave = 1;
  let aiEnabled = false;
  let godMode = false;
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let particles = [];
  let spawnTimer = 0;
  let enemyFireTimer = 1;
  let fireTimer = 0;
  let lastFrame = 0;
  let frameHandle = 0;
  let tapKey = "";
  let tapUntil = 0;
  let tapFireUntil = 0;

  function readBest() {
    try {
      const saved = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
      return Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch {
      statusOutput.textContent = "Browser storage is unavailable; your best score will reset when you leave.";
      return 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(storageKey, String(best));
    } catch {
      statusOutput.textContent = "Best score could not be saved in this browser.";
    }
  }

  function setStatus(message, nextState = state) {
    statusOutput.textContent = message;
    stateOutput.textContent = nextState.toUpperCase();
  }

  function updateScore() {
    scoreOutput.value = String(score).padStart(4, "0");
    scoreOutput.textContent = String(score).padStart(4, "0");
    bestOutput.value = String(best).padStart(4, "0");
    bestOutput.textContent = String(best).padStart(4, "0");
    waveOutput.value = String(wave).padStart(2, "0");
    waveOutput.textContent = String(wave).padStart(2, "0");
    livesOutput.value = String(lives);
    livesOutput.textContent = String(lives);
  }

  function updateModes() {
    aiButton.setAttribute("aria-pressed", String(aiEnabled));
    aiLabel.textContent = aiEnabled ? "ON" : "OFF";
    godButton.setAttribute("aria-pressed", String(godMode));
    godLabel.textContent = godMode ? "ON" : "OFF";
    for (const button of directionButtons) {
      button.disabled = aiEnabled;
    }
  }

  function resetMission() {
    score = 0;
    lives = 3;
    wave = 1;
    player.x = 118;
    player.y = height / 2;
    player.invulnerable = 0;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    spawnTimer = 0.4;
    enemyFireTimer = 1;
    fireTimer = 0;
    updateScore();
  }

  function startMission() {
    if (state === "running") {
      return;
    }
    resetMission();
    state = "running";
    startButton.disabled = true;
    startButton.textContent = "Mission active";
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
    setStatus(aiEnabled ? "Autopilot engaged. Hold on, pilot." : "Mission active. Clear the incoming wave.", "running");
    audio.play("start");
    draw();
    canvas.focus({ preventScroll: true });
  }

  function endMission() {
    state = "over";
    startButton.disabled = false;
    startButton.textContent = "Play again";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    pressed.clear();
    setStatus(`Mission over. Final score: ${score}.`, "game over");
    audio.play("gameover");
  }

  function pauseMission() {
    if (state === "running") {
      state = "paused";
      pressed.clear();
      pauseButton.textContent = "Resume";
      setStatus("Mission paused.", "paused");
      audio.play("pause");
    } else if (state === "paused") {
      state = "running";
      pauseButton.textContent = "Pause";
      setStatus(aiEnabled ? "Autopilot engaged." : "Mission resumed.", "running");
      audio.play("start");
    }
  }

  function fire() {
    bullets.push({ x: player.x + 18, y: player.y, speed: 740 });
    audio.play("shoot");
  }

  function addBurst(x, y, color, count = 12) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 180;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.45,
        color
      });
    }
  }

  function spawnEnemy() {
    const heavy = wave > 1 && Math.random() < Math.min(0.12 + wave * 0.025, 0.42);
    enemies.push({
      x: width + 26,
      y: 38 + Math.random() * (height - 76),
      baseY: 38 + Math.random() * (height - 76),
      radius: heavy ? 23 : 15,
      health: heavy ? 3 : 1,
      phase: Math.random() * Math.PI * 2,
      speed: difficulty[difficultySelect.value].enemySpeed * (heavy ? 0.68 : 1) + wave * 4,
      heavy
    });
  }

  function closestEnemy() {
    return enemies.reduce((nearest, enemy) => {
      if (!nearest || enemy.x < nearest.x) {
        return enemy;
      }
      return nearest;
    }, null);
  }

  function movePlayer(delta) {
    const activeKeys = new Set(pressed);
    if (tapKey && performance.now() < tapUntil) {
      activeKeys.add(tapKey);
    } else {
      tapKey = "";
    }

    let dx = Number(activeKeys.has("ArrowRight") || activeKeys.has("d"))
      - Number(activeKeys.has("ArrowLeft") || activeKeys.has("a"));
    let dy = Number(activeKeys.has("ArrowDown") || activeKeys.has("s"))
      - Number(activeKeys.has("ArrowUp") || activeKeys.has("w"));

    if (aiEnabled) {
      const target = closestEnemy();
      dx = target && target.x < width * 0.48 ? -0.5 : 0.2;
      if (target) {
        const evade = Math.abs(target.x - player.x) < 230;
        const preferredY = evade
          ? (target.y < player.y ? height - 90 : 90)
          : target.y;
        dy = Math.abs(preferredY - player.y) < 22 ? 0 : preferredY > player.y ? 1 : -1;
      } else {
        dy = Math.abs(height / 2 - player.y) < 20 ? 0 : height / 2 > player.y ? 1 : -1;
      }
      if (fireTimer <= 0) {
        fire();
        fireTimer = 0.2;
      }
    }

    const length = Math.hypot(dx, dy) || 1;
    const speed = 360;
    player.x = Math.max(34, Math.min(width - 48, player.x + (dx / length) * speed * delta));
    player.y = Math.max(34, Math.min(height - 34, player.y + (dy / length) * speed * delta));
  }

  function updateBullets(delta) {
    for (const bullet of bullets) {
      bullet.x += bullet.speed * delta;
    }
    bullets = bullets.filter((bullet) => bullet.x < width + 20);
    for (const bullet of enemyBullets) {
      bullet.x += bullet.vx * delta;
      bullet.y += bullet.vy * delta;
    }
    enemyBullets = enemyBullets.filter((bullet) => (
      bullet.x > -20 && bullet.x < width + 20 && bullet.y > -20 && bullet.y < height + 20
    ));
  }

  function damagePlayer() {
    if (state !== "running" || godMode || player.invulnerable > 0) {
      return;
    }
    lives -= 1;
    player.invulnerable = 1.1;
    addBurst(player.x, player.y, "#ff827d", 16);
    audio.play("hit");
    updateScore();
    if (lives <= 0) {
      endMission();
    } else {
      setStatus(`${lives} hull ${lives === 1 ? "point" : "points"} remaining. Keep moving.`);
    }
  }

  function update(delta) {
    if (state !== "running") {
      return;
    }

    const config = difficulty[difficultySelect.value];
    for (const star of stars) {
      star.x -= star.speed * delta;
      if (star.x < 0) {
        star.x = width;
        star.y = Math.random() * height;
      }
    }

    fireTimer -= delta;
    player.invulnerable = Math.max(0, player.invulnerable - delta);
    movePlayer(delta);
    if ((pressed.has(" ") || performance.now() < tapFireUntil) && !aiEnabled && fireTimer <= 0) {
      fire();
      fireTimer = 0.18;
    }

    spawnTimer -= delta;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(0.36, config.spawnTime - wave * 0.025);
    }

    enemyFireTimer -= delta;
    if (enemyFireTimer <= 0 && enemies.length) {
      const shooter = enemies[Math.floor(Math.random() * enemies.length)];
      const angle = Math.atan2(player.y - shooter.y, player.x - shooter.x);
      const enemySpeed = 190 + wave * 5;
      enemyBullets.push({
        x: shooter.x - shooter.radius,
        y: shooter.y,
        vx: Math.cos(angle) * enemySpeed,
        vy: Math.sin(angle) * enemySpeed
      });
      enemyFireTimer = config.enemyFire;
    }

    for (const enemy of enemies) {
      enemy.x -= enemy.speed * delta;
      enemy.y = enemy.baseY + Math.sin(performance.now() / 360 + enemy.phase) * (enemy.heavy ? 46 : 26);
    }

    for (const bullet of bullets) {
      const targetIndex = enemies.findIndex((enemy) => Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.radius + 5);
      if (targetIndex !== -1) {
        const target = enemies[targetIndex];
        bullet.x = width + 100;
        target.health -= 1;
        if (target.health <= 0) {
          addBurst(target.x, target.y, target.heavy ? "#ffc76b" : "#62e6ff", target.heavy ? 22 : 13);
          enemies.splice(targetIndex, 1);
          score += target.heavy ? 250 : 100;
          if (score > best) {
            best = score;
            saveBest();
          }
          const nextWave = Math.floor(score / 500) + 1;
          if (nextWave > wave) {
            wave = nextWave;
            audio.play("level");
            setStatus(`Wave ${wave} incoming. Threat level rising.`);
          } else {
            audio.play("collect");
          }
          updateScore();
        }
      }
    }
    bullets = bullets.filter((bullet) => bullet.x < width + 20);

    for (const bullet of enemyBullets) {
      if (Math.hypot(player.x - bullet.x, player.y - bullet.y) < player.radius + 5) {
        bullet.x = -100;
        damagePlayer();
      }
    }
    enemyBullets = enemyBullets.filter((bullet) => bullet.x > -20);

    for (const enemy of enemies) {
      if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius) {
        enemy.x = -100;
        damagePlayer();
      } else if (enemy.x < -30) {
        enemy.x = -100;
        if (!godMode) {
          damagePlayer();
        }
      }
    }
    enemies = enemies.filter((enemy) => enemy.x > -50);

    for (const particle of particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta;
    }
    particles = particles.filter((particle) => particle.life > 0);
  }

  function drawBackground() {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#07101f");
    gradient.addColorStop(0.55, "#0b1c34");
    gradient.addColorStop(1, "#10172d");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(102, 190, 230, .055)";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    for (const star of stars) {
      context.globalAlpha = 0.35 + star.radius / 3;
      context.fillStyle = "#b8efff";
      context.fillRect(star.x, star.y, star.radius * 1.5, star.radius * 1.5);
    }
    context.globalAlpha = 1;
  }

  function drawShip() {
    if (player.invulnerable > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      return;
    }
    context.save();
    context.translate(player.x, player.y);
    context.shadowBlur = godMode ? 22 : 12;
    context.shadowColor = godMode ? "#ffcb68" : "#61e8ff";
    context.fillStyle = godMode ? "#fff0a8" : "#9deaff";
    context.beginPath();
    context.moveTo(24, 0);
    context.lineTo(-14, -15);
    context.lineTo(-8, -4);
    context.lineTo(-20, 0);
    context.lineTo(-8, 4);
    context.lineTo(-14, 15);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#247ca1";
    context.fillRect(-10, -5, 17, 10);
    context.fillStyle = "#e9fbff";
    context.fillRect(1, -3, 5, 6);
    context.fillStyle = "#ffb36b";
    context.beginPath();
    context.moveTo(-14, -5);
    context.lineTo(-25 - Math.random() * 8, 0);
    context.lineTo(-14, 5);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawEnemy(enemy) {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.shadowBlur = enemy.heavy ? 18 : 10;
    context.shadowColor = enemy.heavy ? "#ffbb62" : "#ff648b";
    context.fillStyle = enemy.heavy ? "#ffb65c" : "#ff668e";
    context.beginPath();
    context.moveTo(-20, 0);
    context.lineTo(-7, -enemy.radius);
    context.lineTo(13, -enemy.radius * 0.6);
    context.lineTo(21, 0);
    context.lineTo(13, enemy.radius * 0.6);
    context.lineTo(-7, enemy.radius);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#301b32";
    context.fillRect(-5, -4, 12, 8);
    context.fillStyle = "#fff1bd";
    context.fillRect(2, -2, 4, 4);
    if (enemy.heavy) {
      context.fillStyle = "#572f37";
      context.fillRect(-19, -3, 5, 6);
      context.fillRect(12, -3, 5, 6);
    }
    context.restore();
  }

  function draw() {
    drawBackground();
    for (const particle of particles) {
      context.globalAlpha = Math.min(1, particle.life * 2.5);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, 3, 3);
    }
    context.globalAlpha = 1;

    for (const bullet of bullets) {
      context.fillStyle = "#b6f5ff";
      context.shadowBlur = 12;
      context.shadowColor = "#62e6ff";
      context.fillRect(bullet.x, bullet.y - 2, 15, 4);
    }
    context.shadowBlur = 0;
    for (const bullet of enemyBullets) {
      context.fillStyle = "#ff8d8d";
      context.beginPath();
      context.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
      context.fill();
    }
    for (const enemy of enemies) {
      drawEnemy(enemy);
    }
    drawShip();

    if (state !== "running") {
      context.fillStyle = "rgba(3, 9, 20, .58)";
      context.fillRect(0, 0, width, height);
      const title = state === "ready" ? "STAR PATROL" : state === "paused" ? "PAUSED" : "MISSION OVER";
      context.fillStyle = "#e4faff";
      context.textAlign = "center";
      context.font = "700 30px monospace";
      context.fillText(title, width / 2, height / 2 - 9);
      context.fillStyle = "#9ebfd0";
      context.font = "14px monospace";
      context.fillText(
        state === "ready" ? "Press Start and defend the sector" : state === "paused" ? "Resume when ready" : `Score ${score}  /  Wave ${wave}`,
        width / 2,
        height / 2 + 23
      );
    }
  }

  function frame(time) {
    const delta = Math.min(0.04, lastFrame ? (time - lastFrame) / 1000 : 0);
    lastFrame = time;
    update(delta);
    draw();
    frameHandle = window.requestAnimationFrame(frame);
  }

  function startHold(button, key) {
    const press = (event) => {
      event.preventDefault();
      if (button.setPointerCapture && event.pointerId !== undefined) {
        button.setPointerCapture(event.pointerId);
      }
      pressed.add(key);
    };
    const release = () => pressed.delete(key);
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("click", () => {
      if (key === " ") {
        tapFireUntil = performance.now() + 180;
      } else {
        tapKey = key;
        tapUntil = performance.now() + 180;
      }
    });
  }

  startButton.addEventListener("click", startMission);
  restartButton.addEventListener("click", startMission);
  pauseButton.addEventListener("click", pauseMission);
  aiButton.addEventListener("click", () => {
    aiEnabled = !aiEnabled;
    updateModes();
    audio.play("toggle");
    if (aiEnabled && (state === "ready" || state === "over")) {
      startMission();
    } else if (state === "running") {
      setStatus(aiEnabled ? "Autopilot engaged." : "Manual flight controls restored.");
    }
  });
  godButton.addEventListener("click", () => {
    godMode = !godMode;
    updateModes();
    audio.play("toggle");
    setStatus(godMode ? "God mode on. Hull damage disabled." : "God mode off. Protect the interceptor.");
  });
  difficultySelect.addEventListener("change", () => {
    setStatus(`Threat level set to ${difficultySelect.options[difficultySelect.selectedIndex].text}.`);
  });

  for (const button of directionButtons) {
    startHold(button, button.dataset.spaceKey);
  }
  startHold(fireButton, " ");

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName))) {
      return;
    }

    const key = event.key.toLowerCase();
    const mapped = {
      arrowup: "ArrowUp",
      arrowdown: "ArrowDown",
      arrowleft: "ArrowLeft",
      arrowright: "ArrowRight",
      w: "w",
      a: "a",
      s: "s",
      d: "d",
      " ": " ",
      spacebar: " "
    }[key];
    if (mapped) {
      event.preventDefault();
      pressed.add(mapped);
    } else if (event.key === "Escape" && state === "running") {
      pauseMission();
    } else if (event.key === "Enter" && (state === "ready" || state === "over")) {
      startMission();
    }
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    const mapped = {
      arrowup: "ArrowUp",
      arrowdown: "ArrowDown",
      arrowleft: "ArrowLeft",
      arrowright: "ArrowRight",
      w: "w",
      a: "a",
      s: "s",
      d: "d",
      " ": " ",
      spacebar: " "
    }[key];
    if (mapped) {
      pressed.delete(mapped);
    }
  });

  window.addEventListener("blur", () => pressed.clear());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running") {
      pauseMission();
    }
  });

  updateModes();
  updateScore();
  draw();
  frameHandle = window.requestAnimationFrame(frame);
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(frameHandle), { once: true });
})();
