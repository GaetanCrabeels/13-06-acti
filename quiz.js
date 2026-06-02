let currentIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 0;
let answered = false;
let currentAnswerCorrect = false;
let currentQuestion = null;
let currentOptions = [];
let currentMatchSelection = null;
let currentMatchLinks = new Map();
let matchRightChoices = [];
let autoAdvanceTimeout = null;
const answerRegexCache = new Map();
const usedHints = new Set();
const pointsByGroup = new Map();

const HENRY_STARTING_SCORE = 500;
const HENRY_REVEAL_DELAY = 900;
const HENRY_WRONG_PENALTY = 15;
const MATCH_PLACEHOLDER = "Choisissez une démographie";
const START_QUESTION_INDEX = 0;
const QUIZ_TOTAL = QUESTIONS.length;
const LEAF_OBJECTIVE_UNLOCK_INDEX = (() => {
  const unlockIndex = QUESTIONS.findIndex((question) => question.section === "Épreuve feuilles");
  return unlockIndex >= 0 ? unlockIndex : Number.POSITIVE_INFINITY;
})();
const STEP_SEVEN_UNLOCK_INDEX = (() => {
  const unlockIndex = QUESTIONS.findIndex((question) => typeof question.stage === "string" && question.stage.startsWith("Étape 7"));
  return unlockIndex >= 0 ? unlockIndex : Number.POSITIVE_INFINITY;
})();
const STEP_EIGHT_UNLOCK_INDEX = (() => {
  const unlockIndex = QUESTIONS.findIndex((question) => typeof question.stage === "string" && question.stage.startsWith("Étape 8"));
  return unlockIndex >= 0 ? unlockIndex : Number.POSITIVE_INFINITY;
})();
let henryRemaining = HENRY_STARTING_SCORE;
let henryInterval = null;
let henryStarted = false;
let henryAwarded = false;
const completedMissions = new Set();

const screens = {
  start: document.getElementById("screen-start"),
  question: document.getElementById("screen-question"),
  answer: document.getElementById("screen-answer"),
  result: document.getElementById("screen-result"),
};

const elQuestionNumber = document.getElementById("question-number");
const elQuestionTotal = document.getElementById("question-total");
const elScore = document.getElementById("score");
const elStageLabel = document.getElementById("stage-label");
const elModeBadge = document.getElementById("mode-badge");
const elTimerValue = document.getElementById("timer-value");
const elTimerBar = document.getElementById("timer-bar");
const elTimerCard = document.getElementById("timer-block-card");
const elSection = document.getElementById("question-section");
const elInstructions = document.getElementById("question-instructions");
const elQuestionText = document.getElementById("question-text");
const elQuestionImage = document.getElementById("question-image");
const elHintMedia = document.getElementById("hint-media");
const elHintImage = document.getElementById("hint-image");
const elMcqOptions = document.getElementById("mcq-options");
const elMolkkyForm = document.getElementById("molkky-form");
const elMolkkyScoreInput = document.getElementById("molkky-score-input");
const elMolkkyObjectivesList = document.getElementById("molkky-objectives-list");
const elMolkkySubmit = document.getElementById("molkky-submit");
const elMatchForm = document.getElementById("match-form");
const elMatchRows = document.getElementById("match-rows");
const elMatchSubmit = document.getElementById("match-submit");
const elSliderForm = document.getElementById("slider-form");
const elRangeInput = document.getElementById("range-input");
const elRangeValue = document.getElementById("range-value");
const elRangeSubmit = document.getElementById("range-submit");
const elFreeForm = document.getElementById("free-form");
const elFreeInput = document.getElementById("free-input");
const elFreeSubmit = document.getElementById("free-submit");
const elAckForm = document.getElementById("ack-form");
const elAckSubmit = document.getElementById("ack-submit");
const elHintWrap = document.getElementById("hint-wrap");
const elHintBtn = document.getElementById("hint-btn");
const elHintText = document.getElementById("hint-text");

const elAnswerIcon = document.getElementById("answer-icon");
const elAnswerTitle = document.getElementById("answer-title");
const elAnswerExact = document.getElementById("answer-exact");
const elAnswerEasterEgg = document.getElementById("answer-easter-egg");
const elAnswerPoints = document.getElementById("answer-points");
const elCoordinatesBlock = document.getElementById("coordinates-block");
const elCoordinatesTitle = document.getElementById("coordinates-title");
const elCoordinatesValue = document.getElementById("coordinates-value");
const elCoordinatesLabel = document.getElementById("coordinates-label");
const elNextBtn = document.getElementById("btn-next");

const elFinalScore = document.getElementById("final-score");
const elFinalDetails = document.getElementById("final-details");
const elFinalMessage = document.getElementById("final-message");
const elRestartBtn = document.getElementById("btn-restart");
const elObjectivesTab = document.getElementById("objectives-tab");
const elMissionsTab = document.getElementById("missions-tab");
const elObjectivesPanel = document.getElementById("objectives-panel");
const elMissionsPanel = document.getElementById("missions-panel");
const elObjectivesContent = document.getElementById("objectives-content");
const elMissionsContent = document.getElementById("missions-content");
const elObjectivesProgressText = document.getElementById("objectives-progress-text");
const elObjectivesProgressBar = document.getElementById("objectives-progress-bar");
const elMissionsProgressText = document.getElementById("missions-progress-text");
const elMissionsProgressBar = document.getElementById("missions-progress-bar");
const objectiveCards = [
  {
    title: "Feuilles d’arbres",
    unlockIndex: LEAF_OBJECTIVE_UNLOCK_INDEX,
    items: [
      "Rapportez un maximum de feuilles d’arbres différentes.",
      "Comptage à l’arrivée : 50 points par feuille différente.",
    ],
  },
  {
    title: "Objectif étape 7",
    unlockIndex: STEP_SEVEN_UNLOCK_INDEX,
    items: ["Validez l’accès au défi des feuilles avec une estimation cohérente des berges."],
  },
  {
    title: "Objectif étape 8",
    unlockIndex: STEP_EIGHT_UNLOCK_INDEX,
    items: ["Terminez la zone finale puis confirmez le dernier choix bonus/malus."],
  },
];
const missionCards = [
  {
    id: "photo",
    title: "Mission photo",
    description: "Photo avec : un objet spécifique, papa, un petit oiseau et votre reflet à tous dans l’eau du lac.",
  },
  {
    id: "doigts-pieds",
    title: "Mission collective",
    description: "Tout le monde participe, avec uniquement le nombre de doigts et de pieds demandé dans votre mission.",
  },
  {
    id: "colour-hunt",
    title: "Colour hunt",
    description: "Faites un maximum de photos avec la couleur indiquée.",
  },
];

const startButton = document.getElementById("btn-start");
startButton.addEventListener("click", startQuiz);
elObjectivesTab.addEventListener("click", () => toggleFloatingPanel(elObjectivesPanel, elObjectivesTab, elMissionsPanel, elMissionsTab));
elMissionsTab.addEventListener("click", () => toggleFloatingPanel(elMissionsPanel, elMissionsTab, elObjectivesPanel, elObjectivesTab));
renderMissionsPanel();
updateObjectivesPanel();

function toggleFloatingPanel(panel, button, otherPanel, otherButton) {
  const willOpen = !panel.classList.contains("open");
  panel.classList.toggle("open", willOpen);
  panel.setAttribute("aria-hidden", String(!willOpen));
  button.setAttribute("aria-expanded", String(willOpen));
  otherPanel.classList.remove("open");
  otherPanel.setAttribute("aria-hidden", "true");
  otherButton.setAttribute("aria-expanded", "false");
}

function updateObjectivesPanel() {
  if (!elObjectivesContent) return;
  const progressIndex = Math.max(0, currentIndex);
  const totalObjectives = objectiveCards.length;
  const unlockedObjectives = objectiveCards.filter((card) => progressIndex >= card.unlockIndex);
  const completedObjectives = objectiveCards.filter((card) => progressIndex > card.unlockIndex).length;
  const objectiveRatio = totalObjectives === 0 ? 0 : completedObjectives / totalObjectives;
  if (elObjectivesProgressText) {
    elObjectivesProgressText.textContent = `${completedObjectives} / ${totalObjectives}`;
  }
  if (elObjectivesProgressBar) {
    elObjectivesProgressBar.style.width = `${Math.round(objectiveRatio * 100)}%`;
  }

  if (!unlockedObjectives.length) {
    elObjectivesContent.innerHTML = "<p>Aucun objectif supplémentaire débloqué pour l’instant.</p>";
    return;
  }

  elObjectivesContent.innerHTML = unlockedObjectives
    .map(
      (card) => `
        <section class="floating-objective">
          <h4>${escapeHtml(card.title)}</h4>
          <ul>
            ${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `
    )
    .join("");
}

function renderMissionsPanel() {
  if (!elMissionsContent) return;
  elMissionsContent.innerHTML = missionCards
    .map(
      (mission) => `
        <label class="floating-mission">
          <input type="checkbox" data-mission-id="${escapeHtml(mission.id)}" />
          <span>
            <strong>${escapeHtml(mission.title)}</strong>
            <small>${escapeHtml(mission.description)}</small>
          </span>
        </label>
      `
    )
    .join("");

  Array.from(elMissionsContent.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const missionId = checkbox.dataset.missionId;
      if (!missionId) return;
      if (checkbox.checked) completedMissions.add(missionId);
      else completedMissions.delete(missionId);
      updateMissionProgress();
    });
  });
  updateMissionProgress();
}

function updateMissionProgress() {
  const total = missionCards.length;
  const done = completedMissions.size;
  const ratio = total === 0 ? 0 : done / total;
  if (elMissionsProgressText) {
    elMissionsProgressText.textContent = `${done} / ${total}`;
  }
  if (elMissionsProgressBar) {
    elMissionsProgressBar.style.width = `${Math.round(ratio * 100)}%`;
  }
}

function startQuiz() {
  currentIndex = START_QUESTION_INDEX;
  score = 0;
  answered = false;
  currentAnswerCorrect = false;
  usedHints.clear();
  pointsByGroup.clear();
  completedMissions.clear();
  if (elMissionsContent) {
    Array.from(elMissionsContent.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
      checkbox.checked = false;
    });
  }
  updateMissionProgress();
  resetHenryStage();
  showScreen("question");
  loadQuestion(currentIndex);
}

function resetHenryStage() {
  henryRemaining = HENRY_STARTING_SCORE;
  henryStarted = false;
  henryAwarded = false;
  clearInterval(henryInterval);
  henryInterval = null;
}

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
  updateObjectivesPanel();
}

function loadQuestion(index) {
  if (index < START_QUESTION_INDEX) {
    currentIndex = START_QUESTION_INDEX;
    index = START_QUESTION_INDEX;
  }
  if (index >= QUESTIONS.length) {
    showResultScreen();
    return;
  }

  clearAutoAdvance();
  answered = false;
  currentAnswerCorrect = false;
  currentQuestion = QUESTIONS[index];
  currentOptions = getQuestionOptions(currentQuestion);
  currentMatchSelection = null;
  currentMatchLinks = new Map();
  matchRightChoices = [];

  const q = currentQuestion;
  elQuestionNumber.textContent = Math.max(1, index - START_QUESTION_INDEX + 1);
  elQuestionTotal.textContent = QUIZ_TOTAL;
  updateScoreUI();
  elStageLabel.textContent = getDisplayStageLabel(q.stage);
  elSection.textContent = q.section;
  const instructionsText = getInstructionsText(q);
  elInstructions.textContent = instructionsText;
  elInstructions.style.display = instructionsText ? "block" : "none";
  elInstructions.classList.toggle("instructions-highlight", q.section === "Épreuve feuilles");
  elQuestionText.textContent = q.question;
  configureQuestionImage(q);

  configureHint(q);
  configureModeBadge(q);
  renderQuestionInput(q);
  configureTimer(q.timer);
  updateObjectivesPanel();
}

function renderQuestionInput(q) {
  elMcqOptions.innerHTML = "";
  if (elMolkkyObjectivesList) elMolkkyObjectivesList.innerHTML = "";
  if (elMatchRows) elMatchRows.innerHTML = "";
  elAckForm.style.display = "none";

  if (q.kind === "molkky-start") {
    elMcqOptions.style.display = "none";
    elMatchForm.style.display = "none";
    elSliderForm.style.display = "none";
    elFreeForm.style.display = "none";
    elMolkkyForm.style.display = "flex";
    renderMolkkyQuestion(q);
    return;
  }

  if (q.kind === "match-pairs") {
    elMcqOptions.style.display = "none";
    elMolkkyForm.style.display = "none";
    elSliderForm.style.display = "none";
    elFreeForm.style.display = "none";
    elMatchForm.style.display = "flex";
    renderMatchQuestion(q);
    return;
  }

  if (q.kind === "range-slider") {
    elMcqOptions.style.display = "none";
    elMatchForm.style.display = "none";
    elMolkkyForm.style.display = "none";
    elFreeForm.style.display = "none";
    elSliderForm.style.display = "flex";
    renderSliderQuestion(q);
    return;
  }

  if (q.kind === "acknowledgement") {
    elMcqOptions.style.display = "none";
    elMatchForm.style.display = "none";
    elMolkkyForm.style.display = "none";
    elSliderForm.style.display = "none";
    elFreeForm.style.display = "none";
    elAckForm.style.display = "block";
    return;
  }

  if (q.type === "mcq" || q.kind === "henry") {
    elMcqOptions.style.display = "grid";
    elMatchForm.style.display = "none";
    elMolkkyForm.style.display = "none";
    elSliderForm.style.display = "none";
    elFreeForm.style.display = "none";
    renderMcqOptions(q);
    return;
  }

  elMcqOptions.style.display = "none";
  elMatchForm.style.display = "none";
  elMolkkyForm.style.display = "none";
  elSliderForm.style.display = "none";
  elFreeForm.style.display = "flex";
  elFreeInput.value = "";
  elFreeInput.focus();
}

function renderMolkkyQuestion(q) {
  elMolkkyScoreInput.value = "";
  (q.objectives || []).forEach((objective, index) => {
    const label = document.createElement("label");
    label.className = "molkky-check";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(objective.points ?? 0);
    input.dataset.index = String(index);

    const text = document.createElement("span");
    text.textContent = `${objective.label} (+${objective.points ?? 0} pts)`;

    label.appendChild(input);
    label.appendChild(text);
    elMolkkyObjectivesList.appendChild(label);
  });

  elMolkkyScoreInput.focus();
}

function configureQuestionImage(q) {
  const imageSource = typeof q.image === "string" ? q.image.trim() : "";
  if (!imageSource) {
    elQuestionImage.removeAttribute("src");
    elQuestionImage.alt = "";
    elQuestionImage.style.display = "none";
    return;
  }

  elQuestionImage.src = imageSource;
  elQuestionImage.alt = q.imageAlt || "Illustration de la question";
  elQuestionImage.style.display = "block";
}

function renderMcqOptions(q) {
  currentOptions.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt.label;
    btn.dataset.value = opt.value;
    btn.addEventListener("click", () => handleMcqAnswer(opt.value, q));
    elMcqOptions.appendChild(btn);
  });
}

function renderMatchQuestion(q) {
  matchRightChoices = shuffleArray(q.pairs.map((pair) => pair.right));
  q.pairs.forEach((pair) => {
    const row = document.createElement("div");
    row.className = "match-row";
    row.dataset.left = pair.left;

    const label = document.createElement("div");
    label.className = "match-label";
    label.textContent = pair.left;

    const select = document.createElement("select");
    select.className = "match-select";
    select.dataset.left = pair.left;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = MATCH_PLACEHOLDER;
    select.appendChild(placeholder);

    matchRightChoices.forEach((right) => {
      const option = document.createElement("option");
      option.value = right;
      option.textContent = right;
      select.appendChild(option);
    });

    select.addEventListener("change", () => updateMatchSelection(pair.left, select.value));

    row.appendChild(label);
    row.appendChild(select);
    elMatchRows.appendChild(row);
  });
  updateMatchUI();
}

function renderSliderQuestion(q) {
  elRangeInput.min = String(q.slider?.min ?? 0);
  elRangeInput.max = String(q.slider?.max ?? 100);
  elRangeInput.step = String(q.slider?.step ?? 1);
  const startValue = Number(q.slider?.min ?? 0);
  elRangeInput.value = String(startValue);
  updateSliderValueLabel(startValue, q.slider?.unit || "");
}

function updateMatchSelection(leftValue, rightValue) {
  if (answered) return;
  currentMatchSelection = leftValue;
  if (!rightValue) {
    currentMatchLinks.delete(leftValue);
    updateMatchUI();
    return;
  }

  for (const [left, right] of currentMatchLinks.entries()) {
    if (right === rightValue && left !== leftValue) {
      currentMatchLinks.delete(left);
    }
  }

  currentMatchLinks.set(leftValue, rightValue);
  currentMatchSelection = null;
  updateMatchUI();
}

function updateMatchUI() {
  const usedRightValues = new Set(currentMatchLinks.values());
  Array.from(elMatchRows.children).forEach((row) => {
    const left = row.dataset.left;
    const select = row.querySelector("select");
    const selectedValue = currentMatchLinks.get(left) || "";
    select.value = selectedValue;
    row.classList.toggle("is-complete", Boolean(selectedValue));

    Array.from(select.options).forEach((option) => {
      if (!option.value) {
        option.disabled = false;
        return;
      }
      option.disabled = usedRightValues.has(option.value) && option.value !== selectedValue;
    });
  });
}

function submitMatchAnswer() {
  if (answered) return;
  const q = currentQuestion;
  if (q.kind !== "match-pairs") return;
  if (currentMatchLinks.size !== q.pairs.length) return;

  answered = true;
  stopTimer();
  const correctMatches = q.pairs.filter((pair) => currentMatchLinks.get(pair.left) === pair.right).length;
  const addedPoints = correctMatches * (q.pointsPerMatch ?? 0);
  showAnswerScreen(
    {
      correct: true,
      addedPoints,
      answerDisplay: `${correctMatches} bonne(s) liaison(s) sur ${q.pairs.length}.`,
      customTitle: "Liaisons enregistrées",
    },
    q
  );
}

function submitSliderAnswer() {
  if (answered) return;
  const q = currentQuestion;
  if (q.kind !== "range-slider") return;

  answered = true;
  stopTimer();
  const result = evaluateAnswer(q, elRangeInput.value);
  showAnswerScreen(result, q);
}

function updateSliderValueLabel(value, unit) {
  elRangeValue.textContent = `${value} ${unit}`.trim();
}

if (elMatchSubmit) elMatchSubmit.addEventListener("click", submitMatchAnswer);
if (elMolkkySubmit) elMolkkySubmit.addEventListener("click", submitMolkkyAnswer);
if (elRangeInput) {
  elRangeInput.addEventListener("input", () => {
    if (!currentQuestion || currentQuestion.kind !== "range-slider") return;
    updateSliderValueLabel(elRangeInput.value, currentQuestion.slider?.unit || "");
  });
}
if (elRangeSubmit) elRangeSubmit.addEventListener("click", submitSliderAnswer);
if (elAckSubmit) elAckSubmit.addEventListener("click", submitAcknowledgement);

function submitAcknowledgement() {
  if (answered) return;
  const q = currentQuestion;
  if (q.kind !== "acknowledgement") return;

  answered = true;
  stopTimer();
  showAnswerScreen(
    {
      correct: true,
      addedPoints: q.points ?? 0,
      answerDisplay: q.answerDisplay,
      customTitle: "Étape enregistrée",
    },
    q
  );
}

function submitMolkkyAnswer() {
  if (answered) return;
  const q = currentQuestion;
  if (q.kind !== "molkky-start") return;

  const reachedScore = Number.parseInt(elMolkkyScoreInput.value, 10);
  if (!Number.isFinite(reachedScore) || reachedScore < 0) return;

  const selectedObjectives = Array.from(elMolkkyObjectivesList.querySelectorAll("input:checked"));
  const bonusPoints = selectedObjectives.reduce((total, input) => total + Number.parseInt(input.value, 10), 0);
  const exactBonus = reachedScore === q.targetScore ? q.points ?? 0 : 0;

  answered = true;
  showAnswerScreen(
    {
      correct: true,
      addedPoints: exactBonus + bonusPoints,
      answerDisplay:
        reachedScore === q.targetScore
          ? `Score atteint : ${reachedScore}/50. Les objectifs annexes cochés ont bien été enregistrés.`
          : `Score atteint : ${reachedScore}. Les 1000 points du défi principal ne sont accordés que pour un score exact de 50.`,
      customTitle: "Mölkky enregistré",
    },
    q
  );
}

function configureHint(q) {
  if (!q.hint) {
    elHintWrap.style.display = "none";
    elHintText.textContent = "";
    elHintText.classList.remove("visible");
    elHintMedia.classList.remove("visible");
    elHintImage.removeAttribute("src");
    elHintImage.alt = "";
    elHintBtn.disabled = false;
    elHintBtn.setAttribute("aria-expanded", "false");
    elHintBtn.title = "Afficher l’indice";
    elHintBtn.textContent = "💡 Indice";
    return;
  }

  elHintWrap.style.display = "inline-flex";
  const alreadyUsed = usedHints.has(q.id);
  elHintBtn.disabled = alreadyUsed;
  elHintBtn.setAttribute("aria-expanded", alreadyUsed ? "true" : "false");
  const hintLabel = q.hint.label || "Indice";
  elHintBtn.title = hintLabel;
  elHintBtn.textContent = `💡 ${hintLabel}`;
  elHintText.textContent = q.hint.text;
  elHintText.classList.toggle("visible", alreadyUsed);
  const hintImage = typeof q.hint.image === "string" ? q.hint.image.trim() : "";
  if (hintImage) {
    elHintImage.src = hintImage;
    elHintImage.alt = q.hint.imageAlt || "Indice visuel";
    elHintMedia.classList.toggle("visible", alreadyUsed);
  } else {
    elHintMedia.classList.remove("visible");
    elHintImage.removeAttribute("src");
    elHintImage.alt = "";
  }
}

elHintBtn.addEventListener("click", () => {
  const q = QUESTIONS[currentIndex];
  if (!q.hint || usedHints.has(q.id)) return;
  usedHints.add(q.id);
  score += q.hint.penalty ?? 0;
  updateScoreUI();
  elHintText.classList.add("visible");
  if (q.hint.image) elHintMedia.classList.add("visible");
  elHintBtn.setAttribute("aria-expanded", "true");
  elHintBtn.disabled = true;
});

function configureModeBadge(q) {
  if (isHenryQuestion(q) && !henryAwarded) {
    if (!henryStarted) startHenryTimer();
    elModeBadge.style.display = "inline-flex";
    updateModeBadgeText();
    return;
  }

  elModeBadge.style.display = "none";
}

function updateModeBadgeText() {
  if (!henryAwarded) {
    elModeBadge.textContent = `Henryesque : ${henryRemaining} pts restants`;
  }
}

function startHenryTimer() {
  henryStarted = true;
  clearInterval(henryInterval);
  henryInterval = setInterval(() => {
    henryRemaining = Math.max(0, henryRemaining - 1);
    updateModeBadgeText();
  }, 1000);
}

function stopHenryTimer() {
  clearInterval(henryInterval);
  henryInterval = null;
  henryStarted = false;
}

function startTimer(seconds) {
  clearInterval(timerInterval);
  timeLeft = seconds;
  updateTimerUI(seconds, seconds);

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerUI(timeLeft, seconds);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function configureTimer(seconds) {
  if (Number.isFinite(seconds) && seconds > 0) {
    elTimerCard.style.display = "flex";
    startTimer(seconds);
    return;
  }

  stopTimer();
  elTimerCard.style.display = "none";
}

function updateTimerUI(remaining, total) {
  elTimerValue.textContent = remaining;
  const pct = Math.max(0, (remaining / total) * 100);
  elTimerBar.style.width = pct + "%";
  elTimerBar.className = "timer-bar-fill";
  if (pct <= 25) {
    elTimerBar.classList.add("danger");
  } else if (pct <= 50) {
    elTimerBar.classList.add("warning");
  }
}

function stopTimer() {
  clearInterval(timerInterval);
}

function handleMcqAnswer(selected, q) {
  if (answered) return;
  answered = true;
  stopTimer();

  const result = evaluateAnswer(q, selected);
  if (q.kind === "henry" && !result.correct && !henryAwarded) {
    henryRemaining = Math.max(0, henryRemaining - HENRY_WRONG_PENALTY);
    updateModeBadgeText();
  }
  highlightMcqOptions(selected, q, result.correct);

  if (q.kind === "henry") {
    handleHenryAnswer(result, q);
    return;
  }

  setTimeout(() => showAnswerScreen(result, q), 300);
}

function highlightMcqOptions(selected, q, isCorrect) {
  Array.from(elMcqOptions.children).forEach((btn) => {
    btn.disabled = true;
    if (q.kind === "choice-award") {
      if (btn.dataset.value === selected) btn.classList.add("selected");
      return;
    }

    if (q.kind === "henry") {
      const isRealAnswer = isHenryCorrectAnswer(q, btn.dataset.value);
      if (btn.dataset.value === selected && isCorrect) {
        btn.classList.add("selected");
      } else if (btn.dataset.value === selected && !isCorrect) {
        btn.classList.add("wrong");
      }
      if (isRealAnswer) btn.classList.add("henry-reveal");
      return;
    }

    if (isCorrectAnswer(q, btn.dataset.value)) {
      btn.classList.add("correct");
    } else if (btn.dataset.value === selected && !isCorrect) {
      btn.classList.add("wrong");
    }
  });
}

elFreeSubmit.addEventListener("click", submitFreeAnswer);
elFreeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitFreeAnswer();
});
elFreeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitFreeAnswer();
});

function submitFreeAnswer() {
  if (answered) return;
  const q = QUESTIONS[currentIndex];
  const value = elFreeInput.value.trim();
  if (!value) return;

  answered = true;
  stopTimer();
  const result = evaluateAnswer(q, value);
  showAnswerScreen(result, q);
}

function handleTimeout() {
  if (answered) return;
  answered = true;
  const q = QUESTIONS[currentIndex];

  if ((q.type === "mcq" || q.kind === "henry") && q.kind !== "choice-award") {
    highlightMcqOptions("__none__", q, false);
  }

  showAnswerScreen({ correct: false, addedPoints: 0, answerDisplay: getAnswerDisplay(q), timeout: true }, q);
}

function handleHenryAnswer(result, q) {
  clearAutoAdvance();
  currentAnswerCorrect = result.correct;

  if (result.correct && q.henryFinal && !henryAwarded) {
    score += henryRemaining;
    henryAwarded = true;
    updateScoreUI();
  }

  const nextQuestion = QUESTIONS[currentIndex + 1];
  if (q.henryFinal || !isHenryQuestion(nextQuestion)) {
    stopHenryTimer();
  }

  autoAdvanceTimeout = window.setTimeout(() => {
    advanceToNextQuestion();
  }, HENRY_REVEAL_DELAY);
}

function evaluateAnswer(q, value) {
  if (q.kind === "choice-award") {
    return {
      correct: true,
      addedPoints: q.choicePoints[value] ?? 0,
      answerDisplay: q.answerDisplay,
      customTitle: "Choix enregistré",
    };
  }

  if (q.kind === "numeric-bonus") {
    const regex = getCachedRegex(q.answerPattern);
    if (!regex.test(value.trim())) {
      return {
        correct: false,
        addedPoints: 0,
        answerDisplay: q.answerDisplay,
        wrongMessage: q.outOfRangeMessage || "Entrez un nombre valide pour continuer.",
      };
    }
    const count = Number.parseInt(value, 10);
    const minValue = Number.isFinite(q.minValue) ? q.minValue : Number.NEGATIVE_INFINITY;
    const maxValue = Number.isFinite(q.maxValue) ? q.maxValue : Number.POSITIVE_INFINITY;
    if (count < minValue || count > maxValue) {
      const absurdValue = count < 0 || count > maxValue * 2;
      return {
        correct: false,
        addedPoints: 0,
        answerDisplay: q.answerDisplay,
        wrongMessage: absurdValue && q.absurdWrongMessage ? q.absurdWrongMessage : q.outOfRangeMessage,
      };
    }
    const computedPoints = Number((count * (q.unitPoints ?? 0)).toFixed(2));
    return {
      correct: true,
      addedPoints: computedPoints,
      answerDisplay: q.answerDisplay,
      customTitle: "Bonus enregistré",
    };
  }

  if (q.kind === "range-bonus") {
    const cleaned = value.replace(",", ".");
    const regex = getCachedRegex(q.answerPattern);
    if (!regex.test(cleaned)) {
      return { correct: false, addedPoints: 0, answerDisplay: q.answerDisplay };
    }
    const numericValue = Number.parseFloat(cleaned);
    const withinRange = numericValue >= q.range.min && numericValue <= q.range.max;
    return {
      correct: withinRange,
      addedPoints: withinRange ? q.points ?? 0 : 0,
      answerDisplay: q.answerDisplay,
    };
  }

  if (q.kind === "range-slider") {
    const numericValue = Number.parseFloat(String(value).replace(",", "."));
    if (!Number.isFinite(numericValue)) {
      return { correct: false, addedPoints: 0, answerDisplay: q.answerDisplay };
    }
    const tolerance = Number(q.tolerance ?? 0);
    const target = Number(q.target ?? 0);
    const withinRange = Math.abs(numericValue - target) <= tolerance;
    return {
      correct: withinRange,
      addedPoints: withinRange ? q.points ?? 0 : 0,
      answerDisplay: q.answerDisplay,
    };
  }

  const correct = isCorrectAnswer(q, value);
  return {
    correct,
    addedPoints: correct ? q.points ?? 0 : 0,
    answerDisplay: getAnswerDisplay(q),
  };
}

function getQuestionGroupKey(q) {
  return `${q.stage}::${q.section}`;
}

function addGroupPoints(q, value) {
  const key = getQuestionGroupKey(q);
  const previous = pointsByGroup.get(key) ?? 0;
  pointsByGroup.set(key, previous + value);
}

function getGroupPoints(q) {
  return pointsByGroup.get(getQuestionGroupKey(q)) ?? 0;
}

function shouldShowPointsBadge(q, addedPoints) {
  return !(addedPoints === 0 && (q.section === "Signe distinctif" || q.kind === "acknowledgement"));
}

function showAnswerScreen(result, q) {
  clearAutoAdvance();
  if (isHenryQuestion(q)) stopHenryTimer();
  showScreen("answer");
  currentAnswerCorrect = result.correct;
  elAnswerEasterEgg.textContent = "";
  elAnswerEasterEgg.style.display = "none";

  let addedPoints = result.correct ? result.addedPoints ?? 0 : 0;
  if (result.correct && q.henryFinal && !henryAwarded) {
    addedPoints += henryRemaining;
    henryAwarded = true;
    stopHenryTimer();
  }

  if (result.correct) {
    score += addedPoints;
    addGroupPoints(q, addedPoints);
    updateScoreUI();
    elAnswerIcon.textContent = "✅";
    elAnswerIcon.className = "answer-icon correct";
    elAnswerTitle.textContent = result.customTitle || getAnswerTitle(q, result);
    elAnswerPoints.textContent = formatPoints(addedPoints);
    elAnswerPoints.className = `points-badge ${addedPoints === 0 ? "" : addedPoints > 0 ? "gain" : "loss"}`.trim();
    elAnswerPoints.style.display = shouldShowPointsBadge(q, addedPoints) ? "inline-block" : "none";
    const bubbleText = getAnswerBubbleText(q, result);
    setAnswerExactContent(bubbleText, q, Boolean(bubbleText));
    if (q.easterEgg?.text) {
      elAnswerEasterEgg.textContent = `${q.easterEgg.icon || "✨"} ${q.easterEgg.text}`;
      elAnswerEasterEgg.style.display = "block";
    }
    renderNextBlock(q.nextBlock);
  } else {
    elAnswerIcon.textContent = result.timeout ? "⏰" : "❌";
    elAnswerIcon.className = "answer-icon wrong";
    elAnswerTitle.textContent = getAnswerTitle(q, result);
    elAnswerPoints.textContent = q.kind === "henry" ? `Henry : -${HENRY_WRONG_PENALTY} pts` : "+0 point";
    elAnswerPoints.className = "points-badge";
    elAnswerPoints.style.display = shouldShowPointsBadge(q, 0) ? "inline-block" : "none";
    const bubbleText = getAnswerBubbleText(q, result);
    if (shouldShowAnswerBubbleOnWrong(q) && bubbleText) {
      setAnswerExactContent(bubbleText, q, true);
    } else {
      setAnswerExactContent(getWrongAnswerText(q, result), q, false);
    }
    elCoordinatesBlock.style.display = "none";
  }

  const isLast = currentIndex >= QUESTIONS.length - 1;
  elNextBtn.textContent =
    !result.correct && q.section === "Signe distinctif"
      ? "Réessayer →"
      : isLast
        ? "Voir mon score 🏆"
        : "Question suivante →";

  if (shouldAutoAdvance(q, result)) {
    autoAdvanceTimeout = window.setTimeout(() => {
      elNextBtn.click();
    }, 900);
  }
}

function renderNextBlock(block) {
  const resolvedBlock = getResolvedNextBlock(block, currentQuestion);
  if (!resolvedBlock) {
    elCoordinatesBlock.style.display = "none";
    return;
  }

  elCoordinatesBlock.style.display = "block";
  elCoordinatesTitle.textContent = resolvedBlock.title || "Suite";
  elCoordinatesValue.textContent = resolvedBlock.value || "";
  elCoordinatesValue.classList.toggle("textual", !looksLikeCoordinates(resolvedBlock.value || ""));
  elCoordinatesLabel.textContent = resolvedBlock.label || "";
}

elNextBtn.addEventListener("click", () => {
  clearAutoAdvance();
  const q = QUESTIONS[currentIndex];
  if (!currentAnswerCorrect) {
    if (shouldSkipRetryOnWrong(q)) {
      advanceToNextQuestion();
    } else {
      showScreen("question");
      loadQuestion(currentIndex);
    }
    return;
  }

  advanceToNextQuestion();
});

function showResultScreen() {
  clearAutoAdvance();
  stopTimer();
  stopHenryTimer();
  showScreen("result");

  const maxScore = getComputedMaxScore();
  const scoreRatio = maxScore > 0 ? score / maxScore : 0;
  elFinalScore.textContent = score;
  elFinalDetails.textContent = `Score maximal de référence : ${maxScore} pts (inclut +200 de compensation pour l’épreuve variable).`;

  let medal = "🥉 Médaille de bronze";
  let message = "Balade terminée : mission accomplie, même si quelques bonus ont filé.";
  if (scoreRatio >= 0.8) {
    medal = "🥇 Médaille d’or";
    message = "Parcours magistral : vous avez percé les mystères et optimisé les points.";
  } else if (scoreRatio >= 0.65) {
    medal = "🥈 Médaille d’argent";
    message = "Très belle progression : encore un petit effort pour viser l’or.";
  } else if (scoreRatio < 0.65 && scoreRatio > 0.5) {
    medal = "🥉 Médaille de bronze";
    message = "Parcours solide : vous êtes proche du niveau argent, continuez comme ça.";
  } else {
    medal = "🥉 Médaille de bronze";
    message = "Vous avez tenu jusqu’au bout : prochaine tentative, vous grimperez vite.";
  }
  elFinalMessage.textContent = `${medal} — ${message}`;
}

function getComputedMaxScore() {
  let maxScore = 0;
  QUESTIONS.forEach((question) => {
    if (question.kind === "numeric-bonus" || question.kind === "range-bonus") return;
    if (question.kind === "choice-award") {
      const options = Object.values(question.choicePoints || {});
      const bestChoice = options.length ? Math.max(...options) : 0;
      maxScore += bestChoice;
      return;
    }
    if (question.kind === "match-pairs") {
      const pairCount = Array.isArray(question.pairs) ? question.pairs.length : 0;
      maxScore += pairCount * (question.pointsPerMatch ?? 0);
      return;
    }
    maxScore += question.points ?? 0;
    if (question.henryFinal) maxScore += HENRY_STARTING_SCORE;
  });
  return maxScore + 200;
}

elRestartBtn.addEventListener("click", () => {
  showScreen("start");
});

function updateScoreUI() {
  elScore.textContent = score;
}

function isHenryQuestion(q) {
  return typeof q.kind === "string" && q.kind.startsWith("henry") && !henryAwarded;
}

function isHenryCorrectAnswer(q, value) {
  return isCorrectAnswer({ ...q, kind: "mcq" }, value);
}

function shouldAutoAdvance(q, result) {
  const isCorrect = Boolean(result.correct);
  const isTimed = Boolean(q.timer);
  const isHenry = isHenryQuestion(q);
  const hasTransitionBlock = Boolean(q.nextBlock);
  const hasFollowingQuestion = currentIndex < QUESTIONS.length - 1;
  return isCorrect && !isTimed && !isHenry && !hasTransitionBlock && hasFollowingQuestion;
}

function clearAutoAdvance() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
}

function advanceToNextQuestion() {
  currentIndex += 1;
  if (currentIndex >= QUESTIONS.length) {
    showResultScreen();
    return;
  }
  showScreen("question");
  loadQuestion(currentIndex);
}

function looksLikeCoordinates(value) {
  return /\d+\.\d+\s*,\s*\d+\.\d+/.test(value);
}

function renumberStepMentions(value) {
  return String(value || "").replace(/Étape\s+(\d+)/giu, (_, stepText) => {
    const step = Number.parseInt(stepText, 10);
    if (!Number.isFinite(step) || step <= 0) return `Étape ${stepText}`;
    return `Étape ${Math.max(1, step - 1)}`;
  });
}

function getDisplayStageLabel(stageText) {
  const renumbered = renumberStepMentions(stageText);
  const coordinatesMatch = renumbered.match(/(Étape\s+\d+)\s*[–-]\s*([0-9.,\s]+)/iu);
  if (!coordinatesMatch) return renumbered;
  const stepLabel = coordinatesMatch[1];
  const coordinates = coordinatesMatch[2].trim();
  return `${stepLabel} — Rendez-vous aux coordonnées ${coordinates}`;
}

function formatPoints(value) {
  const formattedValue =
    Number.isInteger(value) ? String(value) : String(Number(value).toFixed(2)).replace(/\.?0+$/u, "");
  if (value > 0) return `+${formattedValue} points`;
  if (value < 0) return `${formattedValue} points`;
  return "+0 points";
}

function shouldSkipRetryOnWrong(q) {
  if (!q) return true;
  if (q.section === "Signe distinctif" || q.section === "Énigme") return false;
  if (q.kind === "numeric-bonus") return false;
  return true;
}

function getQuestionOptions(q) {
  if (!Array.isArray(q.options)) return [];
  const shuffled = shuffleArray(q.options);
  return shuffled.map((value) => ({ value, label: formatOptionLabel(value) }));
}

function formatOptionLabel(value) {
  return String(value).replace(/\s*\([^)]*\)\s*/gu, " ").replace(/\s{2,}/gu, " ").trim();
}

function getAnswerBubbleText(q, result) {
  if (q.kind === "henry") return `La vraie réponse à éviter était : ${getAnswerDisplay(q)}`;
  if (q.answerBubble) return q.answerBubble;
  const answerDisplay = getAnswerDisplay(q);
  if (result?.answerDisplay && result.answerDisplay !== answerDisplay) return result.answerDisplay;
  const fromAnswer = extractParenthetical(answerDisplay);
  if (fromAnswer) return fromAnswer;
  return "";
}

function setAnswerExactContent(text, q, asBubble) {
  if (!asBubble) {
    elAnswerExact.textContent = text || "";
    elAnswerExact.classList.remove("info-bubble", "info-bubble-detailed");
    return;
  }

  const bubbleText = String(text || "");
  elAnswerExact.classList.add("info-bubble");
  if (q?.section === "Vrai/Faux") {
    elAnswerExact.innerHTML = formatAnswerBubbleHtml(bubbleText);
    elAnswerExact.classList.add("info-bubble-detailed");
    return;
  }

  elAnswerExact.textContent = `💡 ${bubbleText}`;
  elAnswerExact.classList.remove("info-bubble-detailed");
}

function formatAnswerBubbleHtml(text) {
  const sections = text
    .split(/\n{2,}/u)
    .map((section) => section.trim())
    .filter(Boolean);

  const blocks = sections
    .map((section) => {
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const groups = [];
      let currentType = null;
      let currentItems = [];

      lines.forEach((line) => {
        const isBullet = line.startsWith("• ");
        const type = isBullet ? "bullet" : "text";
        const value = isBullet ? line.slice(2).trim() : line;

        if (type !== currentType && currentItems.length > 0) {
          groups.push({ type: currentType, items: currentItems });
          currentItems = [];
        }

        currentType = type;
        currentItems.push(value);
      });

      if (currentItems.length > 0) {
        groups.push({ type: currentType, items: currentItems });
      }

      const htmlGroups = groups
        .map((group) => {
          if (group.type === "bullet") {
            const items = group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
            return `<ul class="answer-detail-list">${items}</ul>`;
          }

          return `<p class="answer-detail-text">${group.items.map((item) => escapeHtml(item)).join(" ")}</p>`;
        })
        .join("");

      return `<div class="answer-detail-block">${htmlGroups}</div>`;
    })
    .join("");

  return `<div class="answer-detail-wrap"><p class="answer-detail-intro">💡 Explication détaillée</p>${blocks}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

function shouldShowAnswerBubbleOnWrong(q) {
  return q.section === "Vrai/Faux";
}

function getInstructionsText(q) {
  if (q.instructions) return q.instructions;
  return "";
}

function getAnswerTitle(q, result) {
  if (q.kind === "henry") {
    return result.correct ? "Réponse révélée" : "Mauvais choix";
  }
  if (result.timeout) return "Temps écoulé !";
  return result.correct ? "Bonne réponse !" : "Mauvaise réponse…";
}

function getWrongAnswerText(q, result) {
  if (result?.wrongMessage) return result.wrongMessage;
  if (q.kind === "henry") {
    return `Vous avez cliqué sur une vraie réponse. Le capital Henryesque perd ${HENRY_WRONG_PENALTY} points et continue jusqu’à la question suivante.`;
  }
  if (q.section === "Signe distinctif") {
    return "Ce n’est pas encore ça. Réessayez sur place jusqu’à trouver le bon signe distinctif.";
  }
  if (q.section === "Énigme") {
    return "Ce n’est pas la bonne combinaison. Réessayez : vous devez résoudre l’énigme pour continuer.";
  }
  if (q.kind === "numeric-bonus") {
    return "Valeur non retenue. Réessayez avec une estimation valide.";
  }
  if (result.timeout) {
    return "Pas de point pour cette question. On passe à la suivante.";
  }
  return "Pas de point pour cette question. On passe à la suivante.";
}

function getResolvedNextBlock(block, q) {
  if (!block) return null;
  if (q?.henryFinal) {
    return {
      title: "Rendez-vous aux coordonnées suivantes",
      value: block.value || "",
      label: renumberStepMentions(`Vous avez récolté ${henryRemaining} points lors des questions Henryesque. ${block.label || ""}`.trim()),
    };
  }

  const summary = block.summaryTemplate
    ? block.summaryTemplate.replace("{points}", String(getGroupPoints(q)))
    : "";
  const label = renumberStepMentions([summary, block.label].filter(Boolean).join(" "));
  const title = renumberStepMentions(block.title || "");
  return { ...block, title, label };
}

function extractParenthetical(value) {
  const matches = Array.from(String(value || "").matchAll(/\(([^)]+)\)/gu), (match) => match[1].trim()).filter(Boolean);
  return matches.join(" · ");
}

function shuffleArray(values) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findButtonByValue(container, value) {
  return Array.from(container.children).find((btn) => btn.dataset.value === value) ?? null;
}

function normalise(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrectAnswer(q, value) {
  if (value == null) return false;
  const cleanValue = String(value).trim();
  const normalisedValue = normalise(cleanValue);
  if (q.acceptAny) return cleanValue.length > 0;

  if (q.kind === "henry") {
    return !isHenryCorrectAnswer(q, cleanValue);
  }

  if (q.answerPattern && q.kind !== "numeric-bonus" && q.kind !== "range-bonus") {
    const regex = getCachedRegex(q.answerPattern);
    return regex.test(cleanValue);
  }

  if (Array.isArray(q.answers)) {
    return q.answers.some((answer) => normalise(answer) === normalisedValue);
  }

  return normalise(q.answer ?? "") === normalisedValue;
}

function getAnswerDisplay(q) {
  if (q.answerDisplay) return q.answerDisplay;
  if (Array.isArray(q.answers) && q.answers.length > 0) return q.answers.join(" / ");
  return q.answer ?? "—";
}

function getCachedRegex(pattern) {
  if (!answerRegexCache.has(pattern)) {
    answerRegexCache.set(pattern, new RegExp(pattern, "iu"));
  }
  return answerRegexCache.get(pattern);
}
