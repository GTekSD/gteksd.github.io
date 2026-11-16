(() => {
  const sounds = {
    start: { notes: [440, 660], duration: 0.09, gap: 0.1 },
    toggle: { notes: [620], duration: 0.07, gap: 0.06 },
    jump: { notes: [330, 520], duration: 0.08, gap: 0.06 },
    shoot: { notes: [760, 420], duration: 0.055, gap: 0.035 },
    collect: { notes: [660, 880, 1100], duration: 0.07, gap: 0.055 },
    hit: { notes: [240, 150], duration: 0.13, gap: 0.1 },
    level: { notes: [520, 740, 980], duration: 0.11, gap: 0.09 },
    gameover: { notes: [440, 330, 220], duration: 0.2, gap: 0.17 },
    pause: { notes: [500, 300], duration: 0.09, gap: 0.08 }
  };

  function create({ game, button }) {
    if (!/^[a-z0-9-]+$/.test(game) || !(button instanceof HTMLButtonElement)) {
      throw new TypeError("Arcade audio requires a game id and sound button.");
    }

    const storageKey = `gteksd-${game}-sound`;
    let enabled = true;
    let audioContext;

    try {
      enabled = localStorage.getItem(storageKey) !== "off";
    } catch {
      button.title = "Sound works for this visit; browser storage is unavailable.";
    }

    function updateButton() {
      button.textContent = `Sound: ${enabled ? "ON" : "OFF"}`;
      button.setAttribute("aria-label", `Turn game sound ${enabled ? "off" : "on"}`);
      button.setAttribute("aria-pressed", String(enabled));
    }

    function getAudioContext() {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) {
        button.disabled = true;
        button.title = "Sound is not supported by this browser.";
        return null;
      }

      if (!audioContext) {
        audioContext = new Context();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {
          button.title = "Sound is blocked by the browser. Try pressing the sound button again.";
        });
      }
      return audioContext;
    }

    function play(kind) {
      if (!enabled) {
        return;
      }

      const sound = sounds[kind];
      if (!sound) {
        throw new RangeError(`Unknown arcade sound: ${kind}`);
      }

      const context = getAudioContext();
      if (!context) {
        return;
      }

      const startedAt = context.currentTime;
      sound.notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const noteStart = startedAt + index * sound.gap;
        const noteEnd = noteStart + sound.duration;

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        volume.gain.setValueAtTime(0.0001, noteStart);
        volume.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd);
      });
    }

    button.addEventListener("click", () => {
      enabled = !enabled;
      try {
        localStorage.setItem(storageKey, enabled ? "on" : "off");
      } catch {
        button.title = "Sound setting will reset when you leave this page.";
      }
      updateButton();
      if (enabled) {
        play("toggle");
      }
    });

    updateButton();
    return {
      get enabled() {
        return enabled;
      },
      play
    };
  }

  window.GTekSDArcadeAudio = { create };
})();
