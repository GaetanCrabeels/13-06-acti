let currentIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 0;
let answered = false;
let currentAnswerCorrect = false;
let currentHenrySelections = new Set();
let currentHenryPenaltyApplied = false;
const answerRegexCache = new Map();
const usedHints = new Set();

const HENRY_STARTING_SCORE = 800;
let henryRemaining = HENRY_STARTING_SCORE;
let henryInterval = null;
let henryStarted = false;
let henryAwarded = false;

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
const elMcqOptions = document.getElementById("mcq-options");
const elFreeForm = document.getElementById("free-form");
const elFreeInput = document.getElementById("free-input");
const elFreeSubmit = document.getElementById("free-submit");
const elHintWrap = document.getElementById("hint-wrap");
const elHintBtn = document.getElementById("hint-btn");
const elHintText = document.getElementById("hint-text");

const elAnswerIcon = document.getElementById("answer-icon");
const elAnswerTitle = document.getElementById("answer-title");
const elAnswerExact = document.getElementById("answer-exact");
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

const startButton = document.getElementById("btn-start");
startButton.addEventListener("click", startQuiz);

function startQuiz() {
  currentIndex = 0;
  score = 0;
  answered = false;
  currentAnswerCorrect = false;
  usedHints.clear();
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
}

function loadQuestion(index) {
  answered = false;
  currentAnswerCorrect = false;
  currentHenrySelections = new Set();
  currentHenryPenaltyApplied = false;

  const q = QUESTIONS[index];
  elQuestionNumber.textContent = index + 1;
  elQuestionTotal.textContent = QUESTIONS.length;
  updateScoreUI();
  elStageLabel.textContent = q.stage;
  elSection.textContent = q.section;
  elInstructions.textContent = q.instructions || "";
  elInstructions.style.display = q.instructions ? "block" : "none";
  elQuestionText.textContent = q.question;

  elQuestionImage.style.display = "none";

  configureHint(q);
  configureModeBadge(q);
  renderQuestionInput(q);
  configureTimer(q.timer);
}

function renderQuestionInput(q) {
  elMcqOptions.innerHTML = "";

  if (q.kind === "henry") {
    renderHenryOptions(q);
    elMcqOptions.style.display = "grid";
    elFreeForm.style.display = "none";
    return;
  }

  if (q.type === "mcq") {
    elMcqOptions.style.display = "grid";
    elFreeForm.style.display = "none";
    renderMcqOptions(q);
    return;
  }

  elMcqOptions.style.display = "none";
  elFreeForm.style.display = "flex";
  elFreeInput.value = "";
  elFreeInput.focus();
}

function renderMcqOptions(q) {
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleMcqAnswer(opt, q));
    elMcqOptions.appendChild(btn);
  });
}

function renderHenryOptions(q) {
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn henry-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleHenrySelection(opt, q, btn));
    elMcqOptions.appendChild(btn);
  });
}

function handleHenrySelection(selected, q, btn) {
  if (answered || btn.disabled) return;

  const isCorrectOption = isCorrectAnswer(q, selected);
  if (isCorrectOption) {
    if (!currentHenryPenaltyApplied) {
      henryRemaining = Math.max(0, henryRemaining - 10);
      currentHenryPenaltyApplied = true;
      updateModeBadgeText();
      updateScoreUI();
    }
    btn.disabled = true;
    btn.classList.add("wrong");
    return;
  }

  currentHenrySelections.add(selected);
  btn.disabled = true;
  btn.classList.add("selected");

  const wrongOptionsCount = q.options.filter((opt) => !isCorrectAnswer(q, opt)).length;
  if (currentHenrySelections.size >= wrongOptionsCount) {
    answered = true;
    stopTimer();
    setTimeout(() => {
      showAnswerScreen({ correct: true, addedPoints: 0, answerDisplay: getAnswerDisplay(q) }, q);
    }, 300);
  }
}

function configureHint(q) {
  if (!q.hint) {
    elHintWrap.style.display = "none";
    elHintText.textContent = "";
    return;
  }

  elHintWrap.style.display = "flex";
  elHintBtn.textContent = q.hint.label || "Voir l’indice";
  const alreadyUsed = usedHints.has(q.id);
  elHintBtn.disabled = alreadyUsed;
  elHintText.textContent = alreadyUsed ? q.hint.text : "";
}

elHintBtn.addEventListener("click", () => {
  const q = QUESTIONS[currentIndex];
  if (!q.hint || usedHints.has(q.id)) return;
  usedHints.add(q.id);
  score += q.hint.penalty ?? 0;
  updateScoreUI();
  elHintText.textContent = q.hint.text;
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
  highlightMcqOptions(selected, q, result.correct);

  setTimeout(() => showAnswerScreen(result, q), 300);
}

function highlightMcqOptions(selected, q, isCorrect) {
  Array.from(elMcqOptions.children).forEach((btn) => {
    btn.disabled = true;
    if (q.kind === "choice-award") {
      if (btn.textContent === selected) btn.classList.add("selected");
      return;
    }

    if (isCorrectAnswer(q, btn.textContent)) {
      btn.classList.add("correct");
    } else if (btn.textContent === selected && !isCorrect) {
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

  if (q.type === "mcq" && q.kind !== "choice-award") {
    highlightMcqOptions("__none__", q, false);
  }

  showAnswerScreen({ correct: false, addedPoints: 0, answerDisplay: getAnswerDisplay(q), timeout: true }, q);
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
      return { correct: false, addedPoints: 0, answerDisplay: q.answerDisplay };
    }
    const count = Number.parseInt(value, 10);
    return {
      correct: true,
      addedPoints: count * (q.unitPoints ?? 0),
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

  const correct = isCorrectAnswer(q, value);
  return {
    correct,
    addedPoints: correct ? q.points ?? 0 : 0,
    answerDisplay: getAnswerDisplay(q),
  };
}

function showAnswerScreen(result, q) {
  showScreen("answer");
  currentAnswerCorrect = result.correct;

  let addedPoints = result.correct ? result.addedPoints ?? 0 : 0;
  if (result.correct && q.henryFinal && !henryAwarded) {
    addedPoints += henryRemaining;
    henryAwarded = true;
    stopHenryTimer();
  }

  if (result.correct) {
    score += addedPoints;
    updateScoreUI();
    elAnswerIcon.textContent = "✅";
    elAnswerIcon.className = "answer-icon correct";
    elAnswerTitle.textContent = result.customTitle || "Bonne réponse !";
    elAnswerPoints.textContent = formatPoints(addedPoints);
    elAnswerPoints.className = `points-badge ${addedPoints === 0 ? "" : addedPoints > 0 ? "gain" : "loss"}`.trim();
    elAnswerExact.textContent = result.answerDisplay ? `Référence : ${result.answerDisplay}` : "";
    renderNextBlock(q.nextBlock);
  } else {
    elAnswerIcon.textContent = result.timeout ? "⏰" : "❌";
    elAnswerIcon.className = "answer-icon wrong";
    elAnswerTitle.textContent = result.timeout ? "Temps écoulé !" : "Mauvaise réponse…";
    elAnswerPoints.textContent = "+0 point";
    elAnswerPoints.className = "points-badge";
    elAnswerExact.textContent = "Ce n’est pas la bonne réponse, réessayez.";
    elCoordinatesBlock.style.display = "none";
  }

  if (!result.correct) {
    elNextBtn.textContent = "Réessayer ↺";
  } else {
    const isLast = currentIndex >= QUESTIONS.length - 1;
    elNextBtn.textContent = isLast ? "Voir mon score 🏆" : "Question suivante →";
  }
}

function renderNextBlock(block) {
  if (!block) {
    elCoordinatesBlock.style.display = "none";
    return;
  }

  elCoordinatesBlock.style.display = "block";
  elCoordinatesTitle.textContent = block.title || "Suite";
  elCoordinatesValue.textContent = block.value || "";
  elCoordinatesValue.classList.toggle("textual", !looksLikeCoordinates(block.value || ""));
  elCoordinatesLabel.textContent = block.label || "";
}

elNextBtn.addEventListener("click", () => {
  if (!currentAnswerCorrect) {
    showScreen("question");
    loadQuestion(currentIndex);
    return;
  }

  currentIndex += 1;
  if (currentIndex >= QUESTIONS.length) {
    showResultScreen();
  } else {
    showScreen("question");
    loadQuestion(currentIndex);
  }
});

function showResultScreen() {
  stopTimer();
  stopHenryTimer();
  showScreen("result");

  elFinalScore.textContent = score;
  elFinalDetails.textContent = "Total final avec bonus et malus variables.";

  let message;
  if (score >= 5000) {
    message = "🌟 Parcours maîtrisé : vous avez enchaîné les étapes, bonus et énigmes comme des pros.";
  } else if (score >= 3000) {
    message = "👏 Belle balade : les compartiments Vrai/Faux, Henryesque et devinettes ont bien été gérés.";
  } else if (score >= 1500) {
    message = "🌿 Parcours validé : encore quelques bonus à grappiller, mais l’essentiel est là.";
  } else {
    message = "🍃 Balade terminée : vous avez les bases, il ne reste plus qu’à optimiser les bonus.";
  }
  elFinalMessage.textContent = message;
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

function looksLikeCoordinates(value) {
  return /\d+\.\d+\s*,\s*\d+\.\d+/.test(value);
}

function formatPoints(value) {
  if (value > 0) return `+${value} points`;
  if (value < 0) return `${value} points`;
  return "+0 points";
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
  const cleanValue = String(value).trim();
  const normalisedValue = normalise(cleanValue);
  if (q.acceptAny) return cleanValue.length > 0;

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
    answerRegexCache.set(pattern, new RegExp(pattern, "u"));
  }
  return answerRegexCache.get(pattern);
}
