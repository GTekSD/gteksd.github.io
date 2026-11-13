(() => {
  const canvas = document.querySelector("#snake-board");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const scoreOutput = document.querySelector("[data-snake-score]");
  const bestOutput = document.querySelector("[data-snake-best]");
  const foodOutput = document.querySelector("[data-snake-food]");
  const stateOutput = document.querySelector("[data-snake-state]");
  const statusOutput = document.querySelector("[data-snake-status]");
  const startButton = document.querySelector("[data-snake-start]");
  const pauseButton = document.querySelector("[data-snake-pause]");
  const restartButton = document.querySelector("[data-snake-restart]");
  const aiButton = document.querySelector("[data-snake-ai]");
  const speedOutput = document.querySelector("[data-snake-speed]");
  const speedDownButton = document.querySelector("[data-snake-speed-down]");
  const speedUpButton = document.querySelector("[data-snake-speed-up]");
  const wallsToggle = document.querySelector("[data-snake-walls]");
  const passThroughToggle = document.querySelector("[data-snake-pass-through]");
  const directionButtons = document.querySelectorAll("[data-snake-direction]");
  const storageKey = "gteksd-snake-high-score";
  const cellSize = 20;
  const cellCount = canvas.width / cellSize;
  const speedLevels = [
    { label: "Slow", interval: 200 },
    { label: "Normal", interval: 135 },
    { label: "Fast", interval: 90 },
    { label: "Turbo", interval: 60 }
  ];
  const foodTypes = [
    { emoji: "🐁", name: "mouse", points: 10 },
    { emoji: "🐦", name: "bird", points: 8 },
    { emoji: "🥚", name: "egg", points: 6 },
    { emoji: "🐸", name: "frog", points: 7 },
    { emoji: "🦗", name: "insect", points: 3 }
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

  const storedBest = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
  let bestScore = Number.isFinite(storedBest) && storedBest > 0 ? storedBest : 0;
  let snake = [];
  let food = null;
  let direction = directions.right;
  let nextDirection = direction;
  let score = 0;
  let gameState = "ready";
  let aiEnabled = false;
  let speedIndex = 1;
  let timer = null;

  function resetBoard() {
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    direction = directions.right;
    nextDirection = direction;
    score = 0;
    food = placeFood();
    scoreOutput.value = String(score);
    scoreOutput.textContent = String(score);
    bestOutput.value = String(bestScore);
    bestOutput.textContent = String(bestScore);
    updateFoodLabel();
    draw();
  }

  function placeFood() {
    const emptyCells = [];
    for (let y = 0; y < cellCount; y += 1) {
      for (let x = 0; x < cellCount; x += 1) {
        if (!snake.some((segment) => segment.x === x && segment.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (!emptyCells.length) {
      return null;
    }

    return {
      ...emptyCells[Math.floor(Math.random() * emptyCells.length)],
      ...foodTypes[Math.floor(Math.random() * foodTypes.length)]
    };
  }

  function updateFoodLabel() {
    foodOutput.textContent = food ? `${food.emoji} ${food.name}` : "—";
  }

  function drawRoundedRect(x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  function drawBodySegment(segment, index) {
    const x = segment.x * cellSize + 1;
    const y = segment.y * cellSize + 1;
    const inset = 2;
    drawRoundedRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2, 5);
    const bodyGradient = context.createLinearGradient(x + 2, y + 2, x + cellSize - 2, y + cellSize - 2);
    bodyGradient.addColorStop(0, index % 2 ? "#b1f68b" : "#91ed83");
    bodyGradient.addColorStop(.52, index % 2 ? "#69d978" : "#53c66f");
    bodyGradient.addColorStop(1, "#278b50");
    context.fillStyle = bodyGradient;
    context.fill();
    context.strokeStyle = "rgba(8, 39, 24, .65)";
    context.lineWidth = 1;
    context.stroke();

    context.strokeStyle = "rgba(8, 39, 24, .68)";
    context.lineWidth = 1.35;
    context.beginPath();
    context.moveTo(x + 5, y + 7);
    context.quadraticCurveTo(x + 10, y + 12, x + 15, y + 7);
    context.moveTo(x + 5, y + 10);
    context.quadraticCurveTo(x + 10, y + 16, x + 15, y + 10);
    context.stroke();

    context.strokeStyle = "rgba(239, 255, 207, .58)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + 5, y + 4);
    context.quadraticCurveTo(x + 8, y + 2.5, x + 11, y + 4);
    context.stroke();
  }

  function drawTail() {
    const tail = snake[snake.length - 1];
    const parent = snake[snake.length - 2];
    if (!tail || !parent) {
      return;
    }

    let dx = tail.x - parent.x;
    let dy = tail.y - parent.y;
    if (!wallsToggle.checked && Math.abs(dx) === cellCount - 1) {
      dx = -Math.sign(dx);
    }
    if (!wallsToggle.checked && Math.abs(dy) === cellCount - 1) {
      dy = -Math.sign(dy);
    }

    const centerX = tail.x * cellSize + cellSize / 2;
    const centerY = tail.y * cellSize + cellSize / 2;
    const perpendicularX = -dy * 5;
    const perpendicularY = dx * 5;
    const tailGradient = context.createLinearGradient(
      centerX - dx * 6,
      centerY - dy * 6,
      centerX + dx * 8,
      centerY + dy * 8
    );
    tailGradient.addColorStop(0, "#8de87a");
    tailGradient.addColorStop(1, "#288b50");
    context.fillStyle = tailGradient;
    context.strokeStyle = "rgba(8, 39, 24, .78)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(centerX - dx * 5 + perpendicularX, centerY - dy * 5 + perpendicularY);
    context.lineTo(centerX - dx * 5 - perpendicularX, centerY - dy * 5 - perpendicularY);
    context.lineTo(centerX + dx * 8, centerY + dy * 8);
    context.closePath();
    context.fill();
    context.stroke();
  }

  function drawHead(head) {
    const x = head.x * cellSize + 1;
    const y = head.y * cellSize + 1;
    drawRoundedRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 7);
    const headGradient = context.createLinearGradient(x, y, x + cellSize, y + cellSize);
    headGradient.addColorStop(0, "#f1ffbd");
    headGradient.addColorStop(.55, "#c4ff91");
    headGradient.addColorStop(1, "#69cf68");
    context.fillStyle = headGradient;
    context.fill();
    context.strokeStyle = "#285638";
    context.lineWidth = 1.5;
    context.stroke();

    let eyes;
    if (direction.x > 0) {
      eyes = [[x + 14, y + 6], [x + 14, y + 14]];
    } else if (direction.x < 0) {
      eyes = [[x + 6, y + 6], [x + 6, y + 14]];
    } else if (direction.y < 0) {
      eyes = [[x + 6, y + 6], [x + 14, y + 6]];
    } else {
      eyes = [[x + 6, y + 14], [x + 14, y + 14]];
    }

    context.fillStyle = "#f3ffe5";
    for (const [eyeX, eyeY] of eyes) {
      context.beginPath();
      context.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#092013";
      context.beginPath();
      context.arc(eyeX + direction.x * .5, eyeY + direction.y * .5, 1.25, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#f3ffe5";
    }

    const noseX = x + cellSize / 2 + direction.x * 6;
    const noseY = y + cellSize / 2 + direction.y * 6;
    context.fillStyle = "#367c45";
    context.beginPath();
    context.arc(noseX, noseY, 1, 0, Math.PI * 2);
    context.fill();
  }

  function drawFood() {
    if (!food) {
      return;
    }

    const centerX = food.x * cellSize + cellSize / 2;
    const centerY = food.y * cellSize + cellSize / 2;
    context.beginPath();
    context.arc(centerX, centerY, 8, 0, Math.PI * 2);
    context.fillStyle = "rgba(109, 232, 210, .16)";
    context.fill();
    context.strokeStyle = "rgba(109, 232, 210, .75)";
    context.lineWidth = 1;
    context.stroke();
    context.font = "15px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(food.emoji, centerX, centerY + .5);
  }

  function draw() {
    context.fillStyle = "#0b160f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "rgba(166, 243, 109, .1)";
    context.lineWidth = 1;
    for (let index = 0; index <= cellCount; index += 1) {
      const position = index * cellSize + .5;
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, canvas.height);
      context.stroke();
      context.beginPath();
      context.moveTo(0, position);
      context.lineTo(canvas.width, position);
      context.stroke();
    }

    drawFood();
    for (let index = snake.length - 2; index > 0; index -= 1) {
      drawBodySegment(snake[index], index);
    }
    drawTail();
    if (snake[0]) {
      drawHead(snake[0]);
    }

    if (gameState === "ready") {
      drawRoundedRect(canvas.width / 2 - 92, 8, 184, 34, 7);
      context.fillStyle = "rgba(5, 10, 11, .8)";
      context.fill();
      context.fillStyle = "#c4ff91";
      context.font = "600 15px Consolas, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("PRESS START", canvas.width / 2, 25);
    } else if (gameState === "paused" || gameState === "over" || gameState === "won") {
      context.fillStyle = "rgba(5, 10, 11, .62)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(canvas.width / 2 - 92, canvas.height / 2 - 22, 184, 44, 7);
      context.fillStyle = "rgba(5, 10, 11, .8)";
      context.fill();
      context.fillStyle = "#c4ff91";
      context.font = "600 15px Consolas, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      const message = gameState === "paused" ? "PAUSED" : gameState === "won" ? "BOARD CLEARED" : "RUN COMPLETE";
      context.fillText(message, canvas.width / 2, canvas.height / 2);
    }
  }

  function updateStatus(message, stateLabel) {
    statusOutput.textContent = message;
    stateOutput.textContent = stateLabel;
  }

  function updateSpeedControls() {
    speedOutput.textContent = speedLevels[speedIndex].label;
    speedDownButton.disabled = speedIndex === 0;
    speedUpButton.disabled = speedIndex === speedLevels.length - 1;
  }

  function startTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(tick, speedLevels[speedIndex].interval);
  }

  function changeSpeed(amount) {
    const nextIndex = Math.max(0, Math.min(speedLevels.length - 1, speedIndex + amount));
    if (nextIndex === speedIndex) {
      return;
    }

    speedIndex = nextIndex;
    updateSpeedControls();
    if (gameState === "running") {
      startTimer();
    }
    updateStatus(
      `Speed set to ${speedLevels[speedIndex].label.toLowerCase()}.`,
      stateOutput.textContent
    );
  }

  function beginGame() {
    window.clearInterval(timer);
    resetBoard();
    gameState = "running";
    updateStatus(
      aiEnabled ? "AI Snake is navigating the arena." : "Run active. Collect the food.",
      aiEnabled ? "AI ACTIVE" : "RUNNING"
    );
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
    startButton.textContent = "Start game";
    startButton.disabled = true;
    startTimer();
    draw();
    canvas.focus({ preventScroll: true });
  }

  function pauseGame() {
    if (gameState === "running") {
      window.clearInterval(timer);
      gameState = "paused";
      pauseButton.textContent = "Resume";
      updateStatus(aiEnabled ? "AI run paused. Resume when you are ready." : "Run paused. Resume when you are ready.", "PAUSED");
      draw();
    } else if (gameState === "paused") {
      gameState = "running";
      pauseButton.textContent = "Pause";
      updateStatus(
        aiEnabled ? "AI Snake is navigating the arena." : "Run active. Collect the food.",
        aiEnabled ? "AI ACTIVE" : "RUNNING"
      );
      startTimer();
    }
  }

  function endGame(won) {
    window.clearInterval(timer);
    gameState = won ? "won" : "over";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    startButton.disabled = false;
    startButton.textContent = "Play again";
    updateStatus(
      won ? `Board cleared. Final score: ${score}.` : `Run complete. Final score: ${score}.`,
      won ? "CLEARED" : "GAME OVER"
    );
    draw();
  }

  function positionKey(position) {
    return `${position.x},${position.y}`;
  }

  function nextPosition(position, vector) {
    let x = position.x + vector.x;
    let y = position.y + vector.y;
    if (wallsToggle.checked) {
      if (x < 0 || x >= cellCount || y < 0 || y >= cellCount) {
        return null;
      }
    } else {
      x = (x + cellCount) % cellCount;
      y = (y + cellCount) % cellCount;
    }

    return { x, y };
  }

  function isReverse(candidate, current) {
    return candidate.x + current.x === 0 && candidate.y + current.y === 0;
  }

  function distanceToFood(position) {
    let dx = Math.abs(position.x - food.x);
    let dy = Math.abs(position.y - food.y);
    if (!wallsToggle.checked) {
      dx = Math.min(dx, cellCount - dx);
      dy = Math.min(dy, cellCount - dy);
    }
    return dx + dy;
  }

  function reachableArea(start, blocked) {
    const queue = [start];
    const visited = new Set([positionKey(start)]);
    for (let index = 0; index < queue.length; index += 1) {
      for (const vector of Object.values(directions)) {
        const next = nextPosition(queue[index], vector);
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
    const choices = Object.entries(directions)
      .filter(([, vector]) => !isReverse(vector, direction))
      .flatMap(([name, vector]) => {
        const next = nextPosition(snake[0], vector);
        if (!next || blocked.has(positionKey(next))) {
          return [];
        }

        return [{
          direction: vector,
          area: reachableArea(next, blocked),
          distance: distanceToFood(next)
        }];
      })
      .sort((a, b) => b.area - a.area || a.distance - b.distance);

    return choices[0]?.direction || direction;
  }

  function findAIDirection() {
    if (!food) {
      return null;
    }

    const blocked = new Set(snake.slice(1, -1).map(positionKey));
    const targetKey = positionKey(food);
    const queue = [{ position: snake[0], firstDirection: null }];
    const visited = new Set([positionKey(snake[0])]);

    for (let index = 0; index < queue.length; index += 1) {
      const node = queue[index];
      for (const [name, vector] of Object.entries(directions)) {
        if (!node.firstDirection && isReverse(vector, direction)) {
          continue;
        }

        const next = nextPosition(node.position, vector);
        if (!next) {
          continue;
        }

        const key = positionKey(next);
        if (visited.has(key) || blocked.has(key)) {
          continue;
        }

        const firstDirection = node.firstDirection || name;
        if (key === targetKey) {
          return directions[firstDirection];
        }

        visited.add(key);
        queue.push({ position: next, firstDirection });
      }
    }

    return fallbackAIDirection(blocked);
  }

  function tick() {
    if (aiEnabled) {
      nextDirection = findAIDirection() || nextDirection;
    }
    direction = nextDirection;
    const head = nextPosition(snake[0], direction);
    if (!head) {
      endGame(false);
      return;
    }

    const eating = food && head.x === food.x && head.y === food.y;
    const bodyToCheck = eating ? snake : snake.slice(0, -1);
    const hitSelf = !passThroughToggle.checked
      && bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);

    if (hitSelf) {
      endGame(false);
      return;
    }

    snake.unshift(head);
    if (eating) {
      score += food.points;
      scoreOutput.value = String(score);
      scoreOutput.textContent = String(score);
      if (score > bestScore) {
        bestScore = score;
        bestOutput.value = String(bestScore);
        bestOutput.textContent = String(bestScore);
        localStorage.setItem(storageKey, String(bestScore));
      }
      const eatenFood = food;
      food = placeFood();
      updateFoodLabel();
      if (!food) {
        endGame(true);
        return;
      }
      updateStatus(
        `${aiEnabled ? "AI Snake found" : "Collected"} ${eatenFood.name} (+${eatenFood.points}).`,
        aiEnabled ? "AI ACTIVE" : "RUNNING"
      );
    } else {
      snake.pop();
    }

    draw();
  }

  function changeDirection(name) {
    const candidate = directions[name];
    if (!candidate || gameState !== "running" || aiEnabled) {
      return;
    }

    if (isReverse(candidate, direction)) {
      return;
    }
    nextDirection = candidate;
  }

  function toggleAI() {
    aiEnabled = !aiEnabled;
    aiButton.setAttribute("aria-pressed", String(aiEnabled));
    aiButton.textContent = `AI Snake: ${aiEnabled ? "On" : "Off"}`;
    for (const button of directionButtons) {
      button.disabled = aiEnabled;
    }

    if (aiEnabled && (gameState === "ready" || gameState === "over" || gameState === "won")) {
      beginGame();
    } else if (gameState === "running") {
      updateStatus(
        aiEnabled ? "AI Snake is navigating the arena." : "AI off. Use the direction controls.",
        aiEnabled ? "AI ACTIVE" : "RUNNING"
      );
    } else if (gameState === "paused") {
      updateStatus(
        aiEnabled ? "AI will navigate when you resume." : "Run paused. Resume when you are ready.",
        "PAUSED"
      );
    } else if (gameState === "over" || gameState === "won") {
      updateStatus(
        `Run complete. Final score: ${score}.`,
        gameState === "won" ? "CLEARED" : "GAME OVER"
      );
    } else {
      updateStatus(
        aiEnabled ? "AI Snake is ready to take over." : "Ready when you are. Start a game to begin.",
        "READY"
      );
    }
  }

  startButton.addEventListener("click", () => {
    if (gameState !== "running" && gameState !== "paused") {
      beginGame();
    }
  });

  pauseButton.addEventListener("click", pauseGame);
  restartButton.addEventListener("click", beginGame);
  aiButton.addEventListener("click", toggleAI);
  speedDownButton.addEventListener("click", () => changeSpeed(-1));
  speedUpButton.addEventListener("click", () => changeSpeed(1));

  for (const button of directionButtons) {
    button.addEventListener("click", () => changeDirection(button.dataset.snakeDirection));
  }

  wallsToggle.addEventListener("change", draw);
  passThroughToggle.addEventListener("change", draw);

  document.addEventListener("keydown", (event) => {
    const directionName = keyboardDirections[event.key.toLowerCase()];
    const isFormControl = event.target instanceof HTMLElement
      && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
    if (!directionName || gameState !== "running" || aiEnabled || isFormControl) {
      return;
    }

    event.preventDefault();
    changeDirection(directionName);
  });

  resetBoard();
  updateSpeedControls();
  updateStatus("Ready when you are. Start a game to begin.", "READY");
})();
