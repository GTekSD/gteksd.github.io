(() => {
  const canvas = document.querySelector("#snake-board");
  if (!canvas) {
    return;
  }

  const audio = window.GTekSDArcadeAudio.create({
    game: "snake",
    button: document.querySelector("[data-arcade-sound]")
  });
  const gameLayout = document.querySelector("#snake-layout");
  const context = canvas.getContext("2d");
  const scoreOutput = document.querySelector("[data-snake-score]");
  const bestOutput = document.querySelector("[data-snake-best]");
  const foodOutput = document.querySelector("[data-snake-food]");
  const stateOutput = document.querySelector("[data-snake-state]");
  const statusOutput = document.querySelector("[data-snake-status]");
  const startButton = document.querySelector("[data-snake-start]");
  const pauseButton = document.querySelector("[data-snake-pause]");
  const restartButton = document.querySelector("[data-snake-restart]");
  const fullscreenButton = document.querySelector("[data-snake-fullscreen]");
  const speedOutput = document.querySelector("[data-snake-speed]");
  const speedDownButton = document.querySelector("[data-snake-speed-down]");
  const speedUpButton = document.querySelector("[data-snake-speed-up]");
  const aiButton = document.querySelector("[data-snake-ai]");
  const aiLabel = document.querySelector("[data-snake-ai-label]");
  const wallsButton = document.querySelector("[data-snake-walls]");
  const wallLabel = document.querySelector("[data-snake-wall-label]");
  const bodyButton = document.querySelector("[data-snake-body]");
  const bodyLabel = document.querySelector("[data-snake-body-label]");
  const foodCountSelect = document.querySelector("[data-snake-food-count]");
  const storageNote = document.querySelector("[data-snake-storage-note]");
  const directionButtons = document.querySelectorAll("[data-snake-direction]");
  const storageKey = "gteksd-snake-high-score";
  const cellSize = 16;
  const columns = canvas.width / cellSize;
  const rows = canvas.height / cellSize;
  const speeds = [
    { name: "Slow", interval: 200 },
    { name: "Normal", interval: 135 },
    { name: "Fast", interval: 90 },
    { name: "Turbo", interval: 60 }
  ];
  const foodTypes = [
    {
      name: "mouse",
      points: 10,
      pixels: [
        "....##..",
        "...####.",
        "..######",
        ".#######",
        ".######.",
        "..####..",
        "...##...",
        "..#..#.."
      ]
    },
    {
      name: "bird",
      points: 8,
      pixels: [
        "...##...",
        "..####..",
        ".######.",
        "########",
        ".######.",
        "..####.#",
        "...##..#",
        "........"
      ]
    },
    {
      name: "egg",
      points: 6,
      pixels: [
        "...##...",
        "..####..",
        ".######.",
        ".##+##..",
        ".######.",
        "..####..",
        "...##...",
        "........"
      ]
    },
    {
      name: "frog",
      points: 7,
      pixels: [
        ".++..++.",
        ".##..##.",
        "..####..",
        ".######.",
        "########",
        ".##++##.",
        "..####..",
        "...##..."
      ]
    },
    {
      name: "insect",
      points: 3,
      pixels: [
        "...##...",
        "..####..",
        ".##..##.",
        "..####..",
        ".##..##.",
        "..####..",
        "...##...",
        "...##..."
      ]
    }
  ];
  const directions = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }
  };
  const keyboardDirections = {
    arrowup: "up",
    w: "up",
    arrowright: "right",
    d: "right",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left"
  };

  function readBestScore() {
    try {
      const savedScore = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
      return Number.isFinite(savedScore) && savedScore > 0 ? savedScore : 0;
    } catch {
      storageNote.textContent = "Browser storage is unavailable; your best score will reset when you leave.";
      return 0;
    }
  }

  let bestScore = readBestScore();
  let snake = [];
  let foods = [];
  let direction = directions.right;
  let nextDirection = direction;
  let score = 0;
  let gameState = "ready";
  let speedIndex = 1;
  let aiEnabled = false;
  let wallsEnabled = true;
  let passThroughBody = false;
  let timer = null;
  let swipeStart = null;
  let fallbackFullscreen = false;

  function formatScore(value) {
    return String(value).padStart(3, "0");
  }

  function updateScore() {
    scoreOutput.value = formatScore(score);
    scoreOutput.textContent = formatScore(score);
    bestOutput.value = formatScore(bestScore);
    bestOutput.textContent = formatScore(bestScore);
    foodOutput.value = String(foods.length);
    foodOutput.textContent = String(foods.length);
  }

  function setStatus(message, state) {
    statusOutput.textContent = message;
    stateOutput.textContent = state;
  }

  function updateSettings() {
    speedOutput.textContent = speeds[speedIndex].name;
    speedDownButton.disabled = speedIndex === 0;
    speedUpButton.disabled = speedIndex === speeds.length - 1;

    aiButton.setAttribute("aria-pressed", String(aiEnabled));
    aiLabel.textContent = aiEnabled ? "ON" : "OFF";
    wallsButton.setAttribute("aria-pressed", String(wallsEnabled));
    wallLabel.textContent = wallsEnabled ? "ON" : "OFF";
    bodyButton.setAttribute("aria-pressed", String(passThroughBody));
    bodyLabel.textContent = passThroughBody ? "ON" : "OFF";

    for (const button of directionButtons) {
      button.disabled = aiEnabled;
    }
  }

  function isFullscreen() {
    return document.fullscreenElement === gameLayout
      || document.webkitFullscreenElement === gameLayout
      || fallbackFullscreen;
  }

  function updateFullscreenButton() {
    const active = isFullscreen();
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.textContent = active ? "Exit full screen" : "Full screen";
    fullscreenButton.setAttribute("aria-label", active ? "Exit full screen" : "Enter full screen");
  }

  function leaveFallbackFullscreen() {
    fallbackFullscreen = false;
    gameLayout.classList.remove("is-fullscreen-fallback");
    document.body.classList.remove("snake-fullscreen-active");
    updateFullscreenButton();
  }

  function enterFallbackFullscreen() {
    fallbackFullscreen = true;
    gameLayout.classList.add("is-fullscreen-fallback");
    document.body.classList.add("snake-fullscreen-active");
    updateFullscreenButton();
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement === gameLayout || document.webkitFullscreenElement === gameLayout) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          document.webkitExitFullscreen();
        }
      } catch (error) {
        setStatus(`Could not exit full screen: ${error.message}`, stateOutput.textContent);
      }
      return;
    }

    if (fallbackFullscreen) {
      leaveFallbackFullscreen();
      return;
    }

    if (gameLayout.requestFullscreen) {
      try {
        await gameLayout.requestFullscreen();
        return;
      } catch (error) {
        enterFallbackFullscreen();
        setStatus(`Using immersive mode because native full screen was unavailable: ${error.message}`, stateOutput.textContent);
        return;
      }
    }

    if (gameLayout.webkitRequestFullscreen) {
      try {
        gameLayout.webkitRequestFullscreen();
        return;
      } catch (error) {
        enterFallbackFullscreen();
        setStatus(`Using immersive mode because native full screen was unavailable: ${error.message}`, stateOutput.textContent);
        return;
      }
    }

    enterFallbackFullscreen();
  }

  function positionKey(position) {
    return `${position.x},${position.y}`;
  }

  function targetFoodCount() {
    return Number.parseInt(foodCountSelect.value, 10);
  }

  function fillFoods() {
    const occupied = new Set(snake.map(positionKey));
    for (const food of foods) {
      occupied.add(positionKey(food));
    }

    while (foods.length < targetFoodCount()) {
      const openCells = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const position = { x, y };
          if (!occupied.has(positionKey(position))) {
            openCells.push(position);
          }
        }
      }

      if (!openCells.length) {
        break;
      }

      const position = openCells[Math.floor(Math.random() * openCells.length)];
      const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
      foods.push({ ...position, ...type });
      occupied.add(positionKey(position));
    }
  }

  function resetBoard() {
    snake = [{ x: 13, y: 10 }, { x: 12, y: 10 }, { x: 11, y: 10 }];
    direction = directions.right;
    nextDirection = direction;
    score = 0;
    foods = [];
    fillFoods();
    updateScore();
    draw();
  }

  function drawBackground() {
    context.fillStyle = "#cbd6a4";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(36, 50, 30, .055)";
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        context.fillRect(x * cellSize + 2, y * cellSize + 2, 1, 1);
      }
    }

    if (wallsEnabled) {
      context.strokeStyle = "#263321";
      context.lineWidth = 3;
      context.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
    }
  }

  function drawFoods() {
    for (const food of foods) {
      const originX = food.x * cellSize;
      const originY = food.y * cellSize;
      for (let row = 0; row < food.pixels.length; row += 1) {
        for (let column = 0; column < food.pixels[row].length; column += 1) {
          const pixel = food.pixels[row][column];
          if (pixel === "#") {
            context.fillStyle = "#263321";
          } else if (pixel === "+") {
            context.fillStyle = "#65764c";
          } else {
            continue;
          }
          context.fillRect(originX + column * 2, originY + row * 2, 2, 2);
        }
      }
    }
  }

  function drawSnake() {
    for (let index = snake.length - 1; index >= 0; index -= 1) {
      const segment = snake[index];
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      context.fillStyle = index === 0 ? "#172117" : "#263321";
      context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      if (index > 0 && index % 2 === 0) {
        context.fillStyle = "#65764c";
        context.fillRect(x + 4, y + 4, 2, 2);
      }
    }

    drawEyes();
  }

  function drawEyes() {
    const head = snake[0];
    if (!head) {
      return;
    }

    const x = head.x * cellSize;
    const y = head.y * cellSize;
    const eyePositions = direction.x > 0
      ? [[x + 11, y + 4], [x + 11, y + 10]]
      : direction.x < 0
        ? [[x + 3, y + 4], [x + 3, y + 10]]
        : direction.y < 0
          ? [[x + 4, y + 3], [x + 10, y + 3]]
          : [[x + 4, y + 11], [x + 10, y + 11]];

    context.fillStyle = "#cbd6a4";
    for (const [eyeX, eyeY] of eyePositions) {
      context.fillRect(eyeX, eyeY, 2, 2);
    }
  }

  function drawMessage(message) {
    const boxWidth = Math.min(248, canvas.width - 32);
    const boxHeight = 42;
    const x = (canvas.width - boxWidth) / 2;
    const y = (canvas.height - boxHeight) / 2;

    context.fillStyle = "#cbd6a4";
    context.fillRect(x, y, boxWidth, boxHeight);
    context.strokeStyle = "#263321";
    context.lineWidth = 3;
    context.strokeRect(x + 1.5, y + 1.5, boxWidth - 3, boxHeight - 3);
    context.fillStyle = "#172117";
    context.font = "bold 16px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(message, canvas.width / 2, canvas.height / 2 + 1);
  }

  function draw() {
    drawBackground();
    drawFoods();
    drawSnake();

    if (gameState === "ready") {
      drawMessage("PRESS START");
    } else if (gameState === "paused") {
      drawMessage("PAUSED");
    } else if (gameState === "over") {
      drawMessage("GAME OVER");
    } else if (gameState === "won") {
      drawMessage("BOARD CLEARED");
    }
  }

  function nextCell(head, vector) {
    let x = head.x + vector.x;
    let y = head.y + vector.y;
    if (wallsEnabled) {
      if (x < 0 || x >= columns || y < 0 || y >= rows) {
        return null;
      }
    } else {
      x = (x + columns) % columns;
      y = (y + rows) % rows;
    }
    return { x, y };
  }

  function isReverse(candidate, current) {
    return candidate.x + current.x === 0 && candidate.y + current.y === 0;
  }

  function manhattanDistance(first, second) {
    let dx = Math.abs(first.x - second.x);
    let dy = Math.abs(first.y - second.y);
    if (!wallsEnabled) {
      dx = Math.min(dx, columns - dx);
      dy = Math.min(dy, rows - dy);
    }
    return dx + dy;
  }

  function reachableArea(start, blocked) {
    const queue = [start];
    const visited = new Set([positionKey(start)]);
    for (let index = 0; index < queue.length; index += 1) {
      for (const vector of Object.values(directions)) {
        const next = nextCell(queue[index], vector);
        if (!next) {
          continue;
        }
        const key = positionKey(next);
        if (!visited.has(key) && !blocked.has(key)) {
          visited.add(key);
          queue.push(next);
        }
      }
    }
    return visited.size;
  }

  function fallbackAIDirection(blocked) {
    const choices = Object.values(directions)
      .filter((vector) => !isReverse(vector, direction))
      .flatMap((vector) => {
        const next = nextCell(snake[0], vector);
        if (!next || (!passThroughBody && blocked.has(positionKey(next)))) {
          return [];
        }

        const area = reachableArea(next, passThroughBody ? new Set() : blocked);
        const distance = foods.length
          ? Math.min(...foods.map((food) => manhattanDistance(next, food)))
          : 0;
        return [{ vector, area, distance }];
      })
      .sort((first, second) => second.area - first.area || first.distance - second.distance);

    return choices[0]?.vector || direction;
  }

  function findAIDirection() {
    if (!foods.length) {
      return direction;
    }

    const blocked = passThroughBody
      ? new Set()
      : new Set(snake.slice(1, -1).map(positionKey));
    const foodPositions = new Set(foods.map(positionKey));
    const queue = [{ position: snake[0], firstDirection: null }];
    const visited = new Set([positionKey(snake[0])]);

    for (let index = 0; index < queue.length; index += 1) {
      const node = queue[index];
      for (const [name, vector] of Object.entries(directions)) {
        if (!node.firstDirection && isReverse(vector, direction)) {
          continue;
        }

        const next = nextCell(node.position, vector);
        if (!next) {
          continue;
        }
        const key = positionKey(next);
        if (visited.has(key) || blocked.has(key)) {
          continue;
        }

        const firstDirection = node.firstDirection || name;
        if (foodPositions.has(key)) {
          return directions[firstDirection];
        }
        visited.add(key);
        queue.push({ position: next, firstDirection });
      }
    }

    return fallbackAIDirection(blocked);
  }

  function saveBestScore() {
    try {
      localStorage.setItem(storageKey, String(bestScore));
    } catch {
      storageNote.textContent = "Browser storage is unavailable; your best score will reset when you leave.";
    }
  }

  function endGame(won) {
    window.clearInterval(timer);
    gameState = won ? "won" : "over";
    audio.play(won ? "level" : "gameover");
    startButton.disabled = false;
    startButton.textContent = "Play again";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    setStatus(
      `${won ? "Board cleared" : "Game over"}. Final score: ${score}.`,
      won ? "CLEARED" : "GAME OVER"
    );
    draw();
  }

  function tick() {
    if (aiEnabled) {
      nextDirection = findAIDirection();
    }
    direction = nextDirection;
    const head = nextCell(snake[0], direction);
    if (!head) {
      endGame(false);
      return;
    }

    const eatenIndex = foods.findIndex((food) => food.x === head.x && food.y === head.y);
    const eating = eatenIndex !== -1;
    const body = eating ? snake : snake.slice(0, -1);
    const hitBody = body.some((segment) => segment.x === head.x && segment.y === head.y);
    if (hitBody && !passThroughBody) {
      endGame(false);
      return;
    }

    snake.unshift(head);
    if (eating) {
      const food = foods.splice(eatenIndex, 1)[0];
      audio.play("collect");
      score += food.points;
      if (score > bestScore) {
        bestScore = score;
        saveBestScore();
      }
      fillFoods();
      updateScore();
      if (!foods.length) {
        endGame(true);
        return;
      }
      setStatus(
        `${aiEnabled ? "AI collected" : "Collected"} ${food.name} (+${food.points}).`,
        aiEnabled ? "AI PLAYING" : "PLAYING"
      );
    } else {
      snake.pop();
    }
    draw();
  }

  function setTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(tick, speeds[speedIndex].interval);
  }

  function beginGame() {
    window.clearInterval(timer);
    resetBoard();
    audio.play("start");
    gameState = "running";
    startButton.disabled = true;
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
    setStatus(
      aiEnabled ? "AI Snake is navigating the board." : "Run active. Collect the food.",
      aiEnabled ? "AI PLAYING" : "PLAYING"
    );
    draw();
    setTimer();
    canvas.focus({ preventScroll: true });
  }

  function pauseGame() {
    if (gameState === "running") {
      window.clearInterval(timer);
      audio.play("pause");
      gameState = "paused";
      pauseButton.textContent = "Resume";
      setStatus("Game paused. Resume when you are ready.", "PAUSED");
      draw();
    } else if (gameState === "paused") {
      audio.play("start");
      gameState = "running";
      pauseButton.textContent = "Pause";
      setStatus(
        aiEnabled ? "AI Snake is navigating the board." : "Run active. Collect the food.",
        aiEnabled ? "AI PLAYING" : "PLAYING"
      );
      draw();
      setTimer();
    }
  }

  function changeDirection(name) {
    const candidate = directions[name];
    if (!candidate || gameState !== "running" || aiEnabled || isReverse(candidate, direction)) {
      return;
    }
    nextDirection = candidate;
  }

  function changeSpeed(amount) {
    const nextIndex = Math.max(0, Math.min(speeds.length - 1, speedIndex + amount));
    if (nextIndex === speedIndex) {
      return;
    }
    speedIndex = nextIndex;
    updateSettings();
    if (gameState === "running") {
      setTimer();
    }
    setStatus(`Speed set to ${speeds[speedIndex].name.toLowerCase()}.`, stateOutput.textContent);
  }

  function toggleAI() {
    aiEnabled = !aiEnabled;
    updateSettings();
    if (aiEnabled && (gameState === "ready" || gameState === "over" || gameState === "won")) {
      beginGame();
    } else if (gameState === "running") {
      setStatus(
        aiEnabled ? "AI Snake is navigating the board." : "AI off. Use the direction controls.",
        aiEnabled ? "AI PLAYING" : "PLAYING"
      );
    } else if (gameState === "paused") {
      setStatus(aiEnabled ? "AI will navigate when you resume." : "Game paused.", "PAUSED");
    } else {
      setStatus(aiEnabled ? "AI Snake is ready to take over." : "Ready. Press Start to play.", "READY");
    }
  }

  startButton.addEventListener("click", () => {
    if (gameState !== "running" && gameState !== "paused") {
      beginGame();
    }
  });
  pauseButton.addEventListener("click", pauseGame);
  restartButton.addEventListener("click", beginGame);
  speedDownButton.addEventListener("click", () => changeSpeed(-1));
  speedUpButton.addEventListener("click", () => changeSpeed(1));
  aiButton.addEventListener("click", toggleAI);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

  wallsButton.addEventListener("click", () => {
    wallsEnabled = !wallsEnabled;
    updateSettings();
    draw();
    setStatus(
      wallsEnabled ? "Arena walls on. Avoid the edge." : "Arena walls off. The snake wraps around.",
      stateOutput.textContent
    );
  });

  bodyButton.addEventListener("click", () => {
    passThroughBody = !passThroughBody;
    updateSettings();
    setStatus(
      passThroughBody ? "Body pass-through on." : "Body pass-through off. Self-collision ends the run.",
      stateOutput.textContent
    );
  });

  foodCountSelect.addEventListener("change", () => {
    const requestedCount = targetFoodCount();
    foods = foods.slice(0, requestedCount);
    fillFoods();
    updateScore();
    draw();
    setStatus(`${foods.length} food ${foods.length === 1 ? "item" : "items"} on the board.`, stateOutput.textContent);
  });

  for (const button of directionButtons) {
    button.addEventListener("click", () => changeDirection(button.dataset.snakeDirection));
  }

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isInteractive = target instanceof HTMLElement
      && (target.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName));
    if (isInteractive) {
      if (event.key === "Escape" && fallbackFullscreen) {
        leaveFallbackFullscreen();
      }
      return;
    }

    if (event.key === "Escape" && fallbackFullscreen) {
      leaveFallbackFullscreen();
      return;
    }

    const directionName = keyboardDirections[event.key.toLowerCase()];
    if (directionName && gameState === "running" && !aiEnabled) {
      event.preventDefault();
      changeDirection(directionName);
      return;
    }

    if (event.code === "Space" && (gameState === "running" || gameState === "paused")) {
      event.preventDefault();
      pauseGame();
    } else if (event.key === "Enter" && (gameState === "ready" || gameState === "over" || gameState === "won")) {
      beginGame();
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!swipeStart) {
      return;
    }
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) {
      return;
    }
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      changeDirection(deltaX > 0 ? "right" : "left");
    } else {
      changeDirection(deltaY > 0 ? "down" : "up");
    }
  });
  canvas.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  resetBoard();
  updateSettings();
  updateFullscreenButton();
  updateScore();
  setStatus("Ready. Press Start to play.", "READY");
})();
