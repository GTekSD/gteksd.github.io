<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#090d12">
  <meta name="description" content="Play an original, monochrome LCD-inspired Snake arcade game by GTekSD.">
  <link rel="icon" href="../data/favicon/favicon.ico">
  <link rel="stylesheet" href="../../site.css">
  <link rel="stylesheet" href="snake-game.css">
  <script src="../../site.js" defer></script>
  <script src="arcade-audio.js" defer></script>
  <script src="snake-game.js" defer></script>
  <title>Snake Game — GTekSD</title>
</head>
<body class="snake-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="../../index.html" aria-label="GTekSD home">
        <span class="brand-mark" aria-hidden="true">&gt;_</span>
        <span class="brand-name">GTekSD<span class="brand-caption">OPERATOR ARCADE</span></span>
      </a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
        <span class="menu-icon" aria-hidden="true"></span>
        <span class="sr-only">Toggle navigation</span>
      </button>
      <nav class="primary-nav" id="primary-nav" aria-label="Main navigation">
        <a href="../../index.html">Home</a>
        <a href="../../projects.html">Projects</a>
        <a href="../portfolio.html">Portfolio</a>
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Color theme: system. Activate to switch to light.">
          <span class="theme-toggle-icon" aria-hidden="true">◐</span>
          <span class="sr-only" data-theme-status>System theme</span>
        </button>
      </nav>
    </div>
  </header>

  <main id="main" class="snake-main">
    <section class="snake-hero">
      <div class="shell snake-shell">
        <a class="snake-back-link" href="../../operator-room.html">← Back to the Operator Room</a>
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> GTekSD / monochrome arcade</p>
        <h1>Snake <span class="text-gradient">in pixels.</span></h1>
        <p class="snake-intro">A small, original LCD-inspired arcade game. Guide the growing snake, collect pixels, and try to beat your best run.</p>

        <div class="snake-layout" id="snake-layout">
          <section class="snake-machine" aria-label="Snake arcade">
            <div class="snake-machine-top">
              <span class="snake-machine-mark"><span aria-hidden="true">▦</span> GT / POCKET ARCADE</span>
              <span class="snake-machine-state" data-snake-state>READY</span>
            </div>
            <div class="snake-screen">
              <div class="snake-scorebar" aria-label="Game score">
                <p><span>SCORE</span><output data-snake-score>000</output></p>
                <p><span>BEST</span><output data-snake-best>000</output></p>
                <p><span>FOOD</span><output data-snake-food>1</output></p>
              </div>
              <div class="snake-board-frame">
                <canvas id="snake-board" width="480" height="320" tabindex="0" aria-label="Monochrome Snake game board" aria-describedby="snake-instructions">
                  Snake game board. Use the arrow keys or WASD to move.
                </canvas>
              </div>
              <p class="snake-status" data-snake-status role="status" aria-live="polite">Ready. Press Start to play.</p>
            </div>
            <div class="snake-machine-foot">
              <span>ORIGINAL GTekSD GAME</span>
              <span aria-hidden="true">● ● ●</span>
            </div>
          </section>

          <aside class="snake-controls" aria-label="Game controls and settings">
            <p class="eyebrow"><span class="section-index">01</span> Game controls</p>
            <div class="snake-action-buttons">
              <button class="button button-primary" type="button" data-snake-start>Start game</button>
              <button class="button button-quiet" type="button" data-snake-pause disabled>Pause</button>
              <button class="button button-quiet" type="button" data-snake-restart>Restart</button>
              <button class="button button-quiet snake-fullscreen-button" type="button" data-snake-fullscreen aria-pressed="false">Full screen</button>
              <button class="button button-quiet" type="button" data-arcade-sound>Sound: ON</button>
            </div>

            <div class="snake-setting">
              <div>
                <span class="snake-setting-label">Speed</span>
                <output data-snake-speed>Standard</output>
              </div>
              <div class="snake-speed-buttons" role="group" aria-label="Game speed">
                <button type="button" data-snake-speed-down aria-label="Decrease speed">−</button>
                <button type="button" data-snake-speed-up aria-label="Increase speed">+</button>
              </div>
            </div>

            <button class="snake-mode-toggle" type="button" data-snake-ai aria-pressed="false">
              <span>AI Snake</span>
              <strong data-snake-ai-label>OFF</strong>
            </button>
            <button class="snake-arena-toggle" type="button" data-snake-walls aria-pressed="true">
              <span>Arena walls</span>
              <strong data-snake-wall-label>ON</strong>
            </button>
            <button class="snake-mode-toggle" type="button" data-snake-body aria-pressed="false">
              <span>Pass through body</span>
              <strong data-snake-body-label>OFF</strong>
            </button>
            <p class="snake-option-note">Turn walls off to wrap across edges. Enable body pass-through to ignore self-collisions.</p>

            <label class="snake-food-setting">
              <span>Food on screen</span>
              <select data-snake-food-count aria-label="Food items on screen">
                <option value="1">1 item</option>
                <option value="2">2 items</option>
                <option value="3">3 items</option>
                <option value="5">5 items</option>
              </select>
            </label>

            <div class="snake-dpad" role="group" aria-label="Touch direction controls">
              <span></span>
              <button type="button" data-snake-direction="up" aria-label="Move up">↑</button>
              <span></span>
              <button type="button" data-snake-direction="left" aria-label="Move left">←</button>
              <button type="button" data-snake-direction="down" aria-label="Move down">↓</button>
              <button type="button" data-snake-direction="right" aria-label="Move right">→</button>
            </div>
            <p id="snake-instructions" class="snake-instructions">Use the arrow keys or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to turn. On touchscreens, swipe the board or use the direction pad. Press <kbd>Space</kbd> to pause. AI mode plays automatically.</p>
            <p class="snake-local-note" data-snake-storage-note>Your best score is saved in this browser.</p>
          </aside>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="shell footer-inner">
      <a class="brand footer-brand" href="../../index.html" aria-label="GTekSD home">
        <span class="brand-mark" aria-hidden="true">&gt;_</span>
        <span class="brand-name">GTekSD<span class="brand-caption">BUILD CAREFULLY. SHARE WHAT YOU LEARN.</span></span>
      </a>
      <p>Curiosity is a feature.</p>
      <div class="footer-links">
        <a href="../../operator-room.html">Operator Room</a>
        <a href="Bounce.html">Bounce</a>
        <a href="Space-Impact.html">Space Impact</a>
        <a href="../pages/Matrix-Rain.html">Matrix Rain</a>
        <a href="../portfolio.html">Portfolio</a>
      </div>
      <small>© 2020 - <span id="current-year">2026</span> GTekSD</small>
    </div>
  </footer>
</body>
</html>
