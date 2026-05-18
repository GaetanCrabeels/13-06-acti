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
const elMatchForm = document.getElementById("match-form");
const elMatchLeft = document.getElementById("match-left");
const elMatchRight = document.getElementById("match-right");
const elMatchLines = document.getElementById("match-lines");
const elMatchSubmit = document.getElementById("match-submit");
const elSliderForm = document.getElementById("slider-form");
const elRangeInput = document.getElementById("range-input");
const elRangeValue = document.getElementById("range-value");
const elRangeSubmit = document.getElementById("range-submit");
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
  currentQuestion = QUESTIONS[index];
  currentOptions = getQuestionOptions(currentQuestion);
  currentMatchSelection = null;
  currentMatchLinks = new Map();

  const q = currentQuestion;
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
  elMatchLeft.innerHTML = "";
  elMatchRight.innerHTML = "";
  elMatchLines.innerHTML = "";

  if (q.kind === "match-pairs") {
    elMcqOptions.style.display = "none";
    elSliderForm.style.display = "none";
    elFreeForm.style.display = "none";
    elMatchForm.style.display = "flex";
    renderMatchQuestion(q);
    return;
  }

  if (q.kind === "range-slider") {
    elMcqOptions.style.display = "none";
    elMatchForm.style.display = "none";
    elFreeForm.style.display = "none";
    elSliderForm.style.display = "flex";
    renderSliderQuestion(q);
    return;
  }

  if (q.type === "mcq" || q.kind === "henry") {
    elMcqOptions.style.display = "grid";
    elMatchForm.style.display = "none";
    elSliderForm.style.display = "none";
    elFreeForm.style.display = "none";
    renderMcqOptions(q);
    return;
  }

  elMcqOptions.style.display = "none";
  elMatchForm.style.display = "none";
  elSliderForm.style.display = "none";
  elFreeForm.style.display = "flex";
  elFreeInput.value = "";
  elFreeInput.focus();
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
  const leftItems = shuffleArray(q.pairs.map((pair) => pair.left));
  const rightItems = shuffleArray(q.pairs.map((pair) => pair.right));

  leftItems.forEach((left) => {
    const btn = document.createElement("button");
    btn.className = "option-btn match-item";
    btn.textContent = left;
    btn.dataset.value = left;
    btn.addEventListener("click", () => selectMatchLeft(left));
    elMatchLeft.appendChild(btn);
  });

  rightItems.forEach((right) => {
    const btn = document.createElement("button");
    btn.className = "option-btn match-item";
    btn.textContent = right;
    btn.dataset.value = right;
    btn.addEventListener("click", () => linkMatchRight(right));
    elMatchRight.appendChild(btn);
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

function selectMatchLeft(leftValue) {
  if (answered) return;
  currentMatchSelection = leftValue;
  updateMatchUI();
}

function linkMatchRight(rightValue) {
  if (answered || !currentMatchSelection) return;

  for (const [left, right] of currentMatchLinks.entries()) {
    if (right === rightValue && left !== currentMatchSelection) {
      currentMatchLinks.delete(left);
    }
  }

  currentMatchLinks.set(currentMatchSelection, rightValue);
  currentMatchSelection = null;
  updateMatchUI();
}

function updateMatchUI() {
  Array.from(elMatchLeft.children).forEach((btn) => {
    const value = btn.dataset.value;
    const isActive = value === currentMatchSelection;
    const isMatched = currentMatchLinks.has(value);
    btn.classList.toggle("active", isActive);
    btn.classList.toggle("matched", isMatched);
  });

  const usedRightValues = new Set(currentMatchLinks.values());
  Array.from(elMatchRight.children).forEach((btn) => {
    const value = btn.dataset.value;
    btn.classList.toggle("matched", usedRightValues.has(value));
  });

  drawMatchLines();
}

function drawMatchLines() {
  elMatchLines.innerHTML = "";
  const boardRect = elMatchLines.getBoundingClientRect();
  elMatchLines.setAttribute("viewBox", `0 0 ${boardRect.width || 70} ${boardRect.height || 10}`);
  for (const [left, right] of currentMatchLinks.entries()) {
    const leftBtn = elMatchLeft.querySelector(`[data-value="${cssEscape(left)}"]`);
    const rightBtn = elMatchRight.querySelector(`[data-value="${cssEscape(right)}"]`);
    if (!leftBtn || !rightBtn) continue;
    const leftRect = leftBtn.getBoundingClientRect();
    const rightRect = rightBtn.getBoundingClientRect();
    const y1 = leftRect.top + leftRect.height / 2 - boardRect.top;
    const y2 = rightRect.top + rightRect.height / 2 - boardRect.top;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "4");
    line.setAttribute("x2", String((boardRect.width || 70) - 4));
    line.setAttribute("y1", String(y1));
    line.setAttribute("y2", String(y2));
    elMatchLines.appendChild(line);
  }
}

function submitMatchAnswer() {
  if (answered) return;
  const q = currentQuestion;
  if (q.kind !== "match-pairs") return;
  if (currentMatchLinks.size !== q.pairs.length) return;

  answered = true;
  stopTimer();
  const allCorrect = q.pairs.every((pair) => currentMatchLinks.get(pair.left) === pair.right);
  showAnswerScreen({ correct: allCorrect, addedPoints: allCorrect ? q.points ?? 0 : 0 }, q);
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

elMatchSubmit.addEventListener("click", submitMatchAnswer);
elRangeInput.addEventListener("input", () => {
  if (!currentQuestion || currentQuestion.kind !== "range-slider") return;
  updateSliderValueLabel(elRangeInput.value, currentQuestion.slider?.unit || "");
});
elRangeSubmit.addEventListener("click", submitSliderAnswer);
window.addEventListener("resize", () => {
  if (currentQuestion?.kind === "match-pairs" && !answered) {
    drawMatchLines();
  }
});

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
    henryRemaining = Math.max(0, henryRemaining - 10);
    updateModeBadgeText();
  }
  highlightMcqOptions(selected, q, result.correct);

  setTimeout(() => showAnswerScreen(result, q), 300);
}

function highlightMcqOptions(selected, q, isCorrect) {
  Array.from(elMcqOptions.children).forEach((btn) => {
    btn.disabled = true;
    if (q.kind === "choice-award") {
      if (btn.dataset.value === selected) btn.classList.add("selected");
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
    const bubbleText = getAnswerBubbleText(q);
    elAnswerExact.textContent = bubbleText;
    elAnswerExact.classList.toggle("bubble", Boolean(bubbleText));
    renderNextBlock(q.nextBlock);
  } else {
    elAnswerIcon.textContent = result.timeout ? "⏰" : "❌";
    elAnswerIcon.className = "answer-icon wrong";
    elAnswerTitle.textContent = result.timeout ? "Temps écoulé !" : "Mauvaise réponse…";
    elAnswerPoints.textContent = "+0 point";
    elAnswerPoints.className = "points-badge";
    elAnswerExact.classList.remove("bubble");
    elAnswerExact.textContent = shouldSkipRetryOnWrong(q)
      ? "Pas de point pour cette question. On passe à la suivante."
      : "Ce n’est pas la bonne réponse, réessayez.";
    elCoordinatesBlock.style.display = "none";
  }

  if (!result.correct) {
    const isLast = currentIndex >= QUESTIONS.length - 1;
    if (shouldSkipRetryOnWrong(q)) {
      elNextBtn.textContent = isLast ? "Voir mon score 🏆" : "Question suivante →";
    } else {
      elNextBtn.textContent = "Réessayer ↺";
    }
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
  const q = QUESTIONS[currentIndex];
  if (!currentAnswerCorrect) {
    if (shouldSkipRetryOnWrong(q)) {
      currentIndex += 1;
      if (currentIndex >= QUESTIONS.length) {
        showResultScreen();
      } else {
        showScreen("question");
        loadQuestion(currentIndex);
      }
    } else {
      showScreen("question");
      loadQuestion(currentIndex);
    }
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

function shouldSkipRetryOnWrong(q) {
  return q.section === "Vrai/Faux" || q.noRetryOnWrong === true;
}

function getQuestionOptions(q) {
  if (!Array.isArray(q.options)) return [];
  const shuffled = shuffleArray(q.options);
  return shuffled.map((value) => ({ value, label: formatOptionLabel(value) }));
}

function formatOptionLabel(value) {
  return String(value).replace(/\s*\([^)]*\)\s*$/u, "").trim();
}

function getAnswerBubbleText(q) {
  if (q.answerBubble) return `💡 ${q.answerBubble}`;
  const fromAnswer = extractParenthetical(getAnswerDisplay(q));
  if (fromAnswer) return `💡 ${fromAnswer}`;
  return "";
}

function extractParenthetical(value) {
  const match = String(value || "").match(/\(([^)]+)\)/u);
  return match ? match[1] : "";
}

function shuffleArray(values) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function cssEscape(value) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}
