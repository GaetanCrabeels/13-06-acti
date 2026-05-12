/**
 * Quiz – logique principale
 * Gère : navigation entre questions, timer, score, affichage des coordonnées.
 */

/* ─────────────────────────── État global ─────────────────────────── */
let currentIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 0;
let answered = false;

/* ─────────────────────────── Sélecteurs ─────────────────────────── */
const screens = {
  start: document.getElementById("screen-start"),
  question: document.getElementById("screen-question"),
  answer: document.getElementById("screen-answer"),
  result: document.getElementById("screen-result"),
};

const elQuestionNumber = document.getElementById("question-number");
const elQuestionTotal = document.getElementById("question-total");
const elScore = document.getElementById("score");
const elTimerValue = document.getElementById("timer-value");
const elTimerBar = document.getElementById("timer-bar");
const elQuestionText = document.getElementById("question-text");
const elQuestionImage = document.getElementById("question-image");
const elMcqOptions = document.getElementById("mcq-options");
const elFreeForm = document.getElementById("free-form");
const elFreeInput = document.getElementById("free-input");
const elFreeSubmit = document.getElementById("free-submit");

const elAnswerIcon = document.getElementById("answer-icon");
const elAnswerTitle = document.getElementById("answer-title");
const elAnswerExact = document.getElementById("answer-exact");
const elAnswerPoints = document.getElementById("answer-points");
const elCoordinatesBlock = document.getElementById("coordinates-block");
const elCoordinatesValue = document.getElementById("coordinates-value");
const elCoordinatesLabel = document.getElementById("coordinates-label");
const elNextBtn = document.getElementById("btn-next");

const elFinalScore = document.getElementById("final-score");
const elFinalMax = document.getElementById("final-max");
const elFinalMessage = document.getElementById("final-message");
const elRestartBtn = document.getElementById("btn-restart");

/* ─────────────────────────── Démarrage ─────────────────────────── */
document.getElementById("btn-start").addEventListener("click", startQuiz);

function startQuiz() {
  currentIndex = 0;
  score = 0;
  showScreen("question");
  loadQuestion(currentIndex);
}

/* ─────────────────────────── Navigation entre écrans ─────────────────────────── */
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ─────────────────────────── Chargement d'une question ─────────────────────────── */
function loadQuestion(index) {
  answered = false;
  const q = QUESTIONS[index];

  // En-tête
  elQuestionNumber.textContent = index + 1;
  elQuestionTotal.textContent = QUESTIONS.length;
  elScore.textContent = score;

  // Texte
  elQuestionText.textContent = q.question;

  // Image
  if (q.image) {
    elQuestionImage.src = q.image;
    elQuestionImage.alt = "Illustration";
    elQuestionImage.style.display = "block";
  } else {
    elQuestionImage.style.display = "none";
  }

  // Options
  if (q.type === "mcq") {
    elMcqOptions.style.display = "grid";
    elFreeForm.style.display = "none";
    renderMcqOptions(q);
  } else {
    elMcqOptions.style.display = "none";
    elFreeForm.style.display = "flex";
    elFreeInput.value = "";
    elFreeInput.focus();
  }

  // Timer
  startTimer(q.timer ?? 15);
}

function renderMcqOptions(q) {
  elMcqOptions.innerHTML = "";
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleMcqAnswer(opt, q));
    elMcqOptions.appendChild(btn);
  });
}

/* ─────────────────────────── Timer ─────────────────────────── */
function startTimer(seconds) {
  clearInterval(timerInterval);
  timeLeft = seconds;
  updateTimerUI(seconds, seconds);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI(timeLeft, seconds);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerUI(remaining, total) {
  elTimerValue.textContent = remaining;
  const pct = (remaining / total) * 100;
  elTimerBar.style.width = pct + "%";

  // Couleur dynamique
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

/* ─────────────────────────── Gestion des réponses ─────────────────────────── */
function handleMcqAnswer(selected, q) {
  if (answered) return;
  answered = true;
  stopTimer();

  const isCorrect = normalise(selected) === normalise(q.answer);
  highlightMcqOptions(selected, q.answer, isCorrect);

  setTimeout(() => showAnswerScreen(isCorrect, q), 800);
}

function highlightMcqOptions(selected, correct, isCorrect) {
  Array.from(elMcqOptions.children).forEach((btn) => {
    btn.disabled = true;
    if (normalise(btn.textContent) === normalise(correct)) {
      btn.classList.add("correct");
    } else if (normalise(btn.textContent) === normalise(selected) && !isCorrect) {
      btn.classList.add("wrong");
    }
  });
}

elFreeSubmit.addEventListener("click", () => submitFreeAnswer());
elFreeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitFreeAnswer();
});

function submitFreeAnswer() {
  if (answered) return;
  const q = QUESTIONS[currentIndex];
  const val = elFreeInput.value.trim();
  if (!val) return;

  answered = true;
  stopTimer();

  const isCorrect = normalise(val) === normalise(q.answer);
  showAnswerScreen(isCorrect, q);
}

function handleTimeout() {
  if (answered) return;
  answered = true;
  const q = QUESTIONS[currentIndex];

  // Désactiver les options MCQ
  if (q.type === "mcq") {
    highlightMcqOptions("__none__", q.answer, false);
  }
  showAnswerScreen(false, q, true);
}

/* ─────────────────────────── Écran de réponse ─────────────────────────── */
function showAnswerScreen(isCorrect, q, isTimeout = false) {
  showScreen("answer");

  if (isCorrect) {
    score += q.points ?? 10;
    elAnswerIcon.textContent = "✅";
    elAnswerIcon.className = "answer-icon correct";
    elAnswerTitle.textContent = "Bonne réponse !";
    elAnswerPoints.textContent = `+${q.points ?? 10} points`;
    elAnswerPoints.className = "points-badge gain";
  } else {
    elAnswerIcon.textContent = isTimeout ? "⏰" : "❌";
    elAnswerIcon.className = "answer-icon wrong";
    elAnswerTitle.textContent = isTimeout ? "Temps écoulé !" : "Mauvaise réponse…";
    elAnswerPoints.textContent = "+0 points";
    elAnswerPoints.className = "points-badge";
  }

  elAnswerExact.textContent = `Bonne réponse : ${q.answer}`;
  elCoordinatesValue.textContent = q.coordinates;
  elCoordinatesLabel.textContent = q.coordinatesLabel;
  elCoordinatesBlock.style.display = "block";

  // Label du bouton selon s'il reste des questions
  const isLast = currentIndex >= QUESTIONS.length - 1;
  elNextBtn.textContent = isLast ? "Voir mon score 🏆" : "Question suivante →";
}

elNextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex >= QUESTIONS.length) {
    showResultScreen();
  } else {
    showScreen("question");
    loadQuestion(currentIndex);
  }
});

/* ─────────────────────────── Écran de résultats ─────────────────────────── */
function showResultScreen() {
  showScreen("result");

  const maxScore = QUESTIONS.reduce((acc, q) => acc + (q.points ?? 10), 0);
  elFinalScore.textContent = score;
  elFinalMax.textContent = maxScore;

  const pct = maxScore > 0 ? score / maxScore : 0;
  let message;
  if (pct >= 0.9) {
    message = "🌟 Excellent ! Tu es un vrai expert de la nature !";
  } else if (pct >= 0.6) {
    message = "👍 Bien joué ! Tu connais bien ton environnement.";
  } else if (pct >= 0.3) {
    message = "🌱 Pas mal ! Continue d'explorer pour en apprendre davantage.";
  } else {
    message = "🍂 La balade t'en a appris des choses ! Reviens t'entraîner.";
  }
  elFinalMessage.textContent = message;
}

elRestartBtn.addEventListener("click", () => {
  showScreen("start");
});

/* ─────────────────────────── Utilitaires ─────────────────────────── */
function normalise(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
