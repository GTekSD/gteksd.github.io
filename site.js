const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");
const searchInput = document.querySelector("#project-search");
const projectCards = [...document.querySelectorAll(".project-card")];
const filterButtons = [...document.querySelectorAll(".filter-button")];
const emptyState = document.querySelector("#empty-state");

if (searchInput && emptyState) {
  let activeFilter = "all";

  function updateProjects() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    for (const card of projectCards) {
      const categories = card.dataset.category.split(" ");
      const matchesFilter = activeFilter === "all" || categories.includes(activeFilter);
      const matchesSearch = `${card.dataset.search} ${card.textContent}`.toLowerCase().includes(query);
      const visible = matchesFilter && matchesSearch;

      card.hidden = !visible;
      visibleCount += Number(visible);
    }

    emptyState.hidden = visibleCount > 0;
  }

  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      for (const filterButton of filterButtons) {
        const selected = filterButton === button;
        filterButton.classList.toggle("is-active", selected);
        filterButton.setAttribute("aria-pressed", String(selected));
      }

      updateProjects();
    });
  }

  searchInput.addEventListener("input", updateProjects);

  document.addEventListener("keydown", (event) => {
    const isTyping = event.target instanceof HTMLElement
      && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      searchInput.focus();
    }
  });
}

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    const isNavigationControl = event.target instanceof Element
      && event.target.closest("a, button");

    if (isNavigationControl && window.matchMedia("(max-width: 700px)").matches) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });
}

const themeToggle = document.querySelector("[data-theme-toggle]");
if (themeToggle) {
  const themes = ["system", "light", "dark"];
  const themeIcons = { system: "◐", light: "☀", dark: "☾" };
  let theme = "system";

  function applyTheme(nextTheme) {
    theme = nextTheme;

    if (theme === "system") {
      delete document.body.dataset.theme;
    } else {
      document.body.dataset.theme = theme;
    }

    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    themeToggle.querySelector(".theme-toggle-icon").textContent = themeIcons[theme];
    themeToggle.querySelector("[data-theme-status]").textContent = `${theme} theme`;
    themeToggle.setAttribute("aria-label", `Color theme: ${theme}. Activate to switch to ${next}.`);
    themeToggle.title = `Color theme: ${theme} (next: ${next})`;
  }

  themeToggle.addEventListener("click", () => {
    applyTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  });

  applyTheme(theme);
}

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const glitchTrigger = document.querySelector("[data-glitch-trigger]");
if (glitchTrigger) {
  let glitchTimer;

  glitchTrigger.addEventListener("click", () => {
    document.body.classList.add("is-glitching");
    window.clearTimeout(glitchTimer);
    glitchTimer = window.setTimeout(() => {
      document.body.classList.remove("is-glitching");
    }, 750);
  });
}

const secretClueHints = {
  home: "A Roman ruler gave this cipher its name.",
  projects: "Move each letter backward through the alphabet.",
  portfolio: "The rotation is three places."
};
const secretStorageKeys = {
  clues: "gteksd-operator-clues",
  projects: "gteksd-operator-projects",
  achievements: "gteksd-operator-achievements",
  unlocked: "gteksd-operator-room-unlocked"
};

function readSecretSet(key) {
  return new Set((localStorage.getItem(key) || "").split(",").filter((value) => /^[a-z0-9-]+$/.test(value)));
}

function writeSecretSet(key, values) {
  localStorage.setItem(key, [...values].sort().join(","));
}

let secretToastTimer;
let secretToast = document.querySelector("[data-secret-toast]");

function showSecretToast(message) {
  if (!secretToast) {
    secretToast = document.createElement("div");
    secretToast.className = "secret-toast";
    secretToast.dataset.secretToast = "";
    secretToast.setAttribute("role", "status");
    secretToast.setAttribute("aria-live", "polite");
    document.body.append(secretToast);
  }

  secretToast.textContent = message;
  secretToast.classList.add("is-visible");
  window.clearTimeout(secretToastTimer);
  secretToastTimer = window.setTimeout(() => secretToast.classList.remove("is-visible"), 4200);
}

function updateOperatorInterface() {
  const clues = readSecretSet(secretStorageKeys.clues);
  const projects = readSecretSet(secretStorageKeys.projects);
  const achievements = readSecretSet(secretStorageKeys.achievements);
  const roomUnlocked = localStorage.getItem(secretStorageKeys.unlocked) === "true";

  for (const [clue, hint] of Object.entries(secretClueHints)) {
    const clueStatus = document.querySelector(`[data-clue-status="${clue}"]`);
    if (clueStatus) {
      clueStatus.classList.toggle("is-found", clues.has(clue));
      clueStatus.querySelector(".operator-clue-state").textContent = clues.has(clue) ? "Recovered" : "Not recovered";
    }

    for (const trigger of document.querySelectorAll(`[data-secret-clue="${clue}"]`)) {
      trigger.setAttribute("aria-pressed", String(clues.has(clue)));
      trigger.classList.toggle("is-found", clues.has(clue));
      trigger.title = clues.has(clue) ? "Clue recovered" : "There is a clue here";
    }
  }

  const clueCount = Object.keys(secretClueHints).filter((clue) => clues.has(clue)).length;
  const progress = document.querySelector("[data-room-progress]");
  if (progress) {
    progress.textContent = `${clueCount} / 3 clues`;
  }

  for (const linkProgress of document.querySelectorAll("[data-operator-progress]")) {
    linkProgress.textContent = `${clueCount}/3`;
  }

  const lockMessage = document.querySelector("[data-room-lock]");
  const answerInput = document.querySelector("#cipher-answer");
  const submitButton = document.querySelector("[data-cipher-form] button[type='submit']");
  const reveal = document.querySelector("[data-room-reveal]");
  if (lockMessage) {
    lockMessage.textContent = roomUnlocked
      ? "Decoder complete. Operator access is saved in this browser."
      : clueCount === 3
        ? "All clues recovered. Decode the message to unlock the room."
        : `Collect all three clues to enable the decoder. Hints are hidden in plain sight on the Home, Projects, and Portfolio pages. (${clueCount}/3 recovered)`;
  }
  if (answerInput) {
    answerInput.disabled = clueCount !== 3 || roomUnlocked;
  }
  if (submitButton) {
    submitButton.disabled = clueCount !== 3 || roomUnlocked;
  }
  if (reveal) {
    reveal.hidden = !roomUnlocked;
  }

  const projectCount = projects.size;
  const badgeStates = {
    scout: projectCount >= 3,
    cartographer: projectCount >= 10,
    sequence: achievements.has("operator-mode")
  };
  for (const [badge, earned] of Object.entries(badgeStates)) {
    const badgeElement = document.querySelector(`[data-achievement="${badge}"]`);
    if (badgeElement) {
      badgeElement.classList.toggle("is-earned", earned);
      badgeElement.querySelector(".achievement-status").textContent = earned ? "Earned" : "Locked";
    }
  }
}

for (const trigger of document.querySelectorAll("[data-secret-clue]")) {
  trigger.addEventListener("click", () => {
    const clue = trigger.dataset.secretClue;
    const hint = secretClueHints[clue];
    if (!hint) {
      return;
    }

    const clues = readSecretSet(secretStorageKeys.clues);
    if (clues.has(clue)) {
      showSecretToast(`Clue already recovered: ${hint}`);
      return;
    }

    clues.add(clue);
    writeSecretSet(secretStorageKeys.clues, clues);
    updateOperatorInterface();
    showSecretToast(`Clue ${clues.size}/3 recovered — ${hint}`);
  });
}

if (projectCards.length) {
  const seenProjects = readSecretSet(secretStorageKeys.projects);
  const recordProject = (card) => {
    const name = card.querySelector("h3")?.textContent.trim();
    if (!name) {
      return;
    }

    const project = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!project || seenProjects.has(project)) {
      return;
    }

    seenProjects.add(project);
    writeSecretSet(secretStorageKeys.projects, seenProjects);
    updateOperatorInterface();

    if (seenProjects.size === 3 || seenProjects.size === 10) {
      showSecretToast(seenProjects.size === 3
        ? "Achievement earned: Workbench Scout."
        : "Achievement earned: Project Cartographer.");
    }
  };

  if ("IntersectionObserver" in window) {
    const projectObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          recordProject(entry.target);
          projectObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.3 });

    for (const card of projectCards) {
      projectObserver.observe(card);
    }
  }

  for (const card of projectCards) {
    card.addEventListener("pointerenter", () => recordProject(card), { once: true });
    card.addEventListener("focusin", () => recordProject(card), { once: true });
  }
}

const cipherForm = document.querySelector("[data-cipher-form]");
if (cipherForm) {
  cipherForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const answer = document.querySelector("#cipher-answer").value.trim().replace(/\s+/g, " ").toUpperCase();
    const feedback = document.querySelector("[data-cipher-feedback]");
    if (answer === "THE KEY IS THREE") {
      localStorage.setItem(secretStorageKeys.unlocked, "true");
      feedback.textContent = "Correct. The signal is yours.";
      updateOperatorInterface();
    } else {
      feedback.textContent = "Not quite. Use the three clues to decode the message.";
    }
  });
}

let sequencePosition = 0;
let operatorModeTimer;
const operatorSequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
document.addEventListener("keydown", (event) => {
  const isTyping = event.target instanceof HTMLElement
    && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  sequencePosition = key === operatorSequence[sequencePosition]
    ? sequencePosition + 1
    : key === operatorSequence[0] ? 1 : 0;

  if (sequencePosition === operatorSequence.length) {
    sequencePosition = 0;
    const achievements = readSecretSet(secretStorageKeys.achievements);
    const firstDiscovery = !achievements.has("operator-mode");
    achievements.add("operator-mode");
    writeSecretSet(secretStorageKeys.achievements, achievements);
    updateOperatorInterface();
    document.body.classList.add("is-operator-mode");
    window.clearTimeout(operatorModeTimer);
    operatorModeTimer = window.setTimeout(() => document.body.classList.remove("is-operator-mode"), 2600);
    showSecretToast(firstDiscovery
      ? "Operator mode activated. Achievement earned."
      : "Operator mode activated.");
  }
});

updateOperatorInterface();
