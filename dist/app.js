(() => {
  "use strict";

  const TOTAL = 20;
  const HISTORY_KEY = "capy-count-history-v1";
  const SETTINGS_KEY = "capy-count-settings-v1";
  const PROFILE_KEY = "capy-count-profile-v1";
  const language = ((navigator.languages?.[0] || navigator.language || "de").toLowerCase().startsWith("ru")) ? "ru" : "de";
  const translations = {
    ru: {
      locale: "ru-RU", appName: "Считаем с Капи", description: "Адаптивный тренажёр сложения и вычитания до 10 000 для детей.",
      startEyebrow: "Уровень 1", startTitle: "Готовы считать?", startDescription: "20 коротких примеров. Капи постепенно повышает сложность.",
      dayStreak: "дней подряд", totalXp: "всего XP", start: "Начать тренировку", history: "История занятий", speech: "У тебя получится!",
      home: "Вернуться в начало", soundOn: "Выключить звук", soundOff: "Включить звук", gameProgress: "Игровой прогресс",
      problem: "Пример", answerStreak: "Серия правильных ответов", xpEarned: "Набранные очки опыта", careful: "Считай внимательно", next: "Следующий пример",
      answer: "Ответ", numberPad: "Цифровая клавиатура", clear: "Очистить", backspace: "Удалить последнюю цифру", check: "Проверить",
      rightInRow: (value) => `${value} верных подряд`, finalAnswer: (value) => `Ответ: ${value}. Запомним!`,
      subtractionHint: (a, b) => `Было ${a}. Зачеркни ${b}. Сколько осталось?`,
      additionHint: (a, b) => `Соедини ${a} и ${b}. Посчитай все кружки.`,
      additionAria: (a, b) => `Первая группа: ${a}. Вторая группа: ${b}.`,
      largeAdditionHint: (a, b) => `Сложи по частям: ${a} + ${b}. Сначала крупные разряды, затем единицы.`,
      largeSubtractionHint: (a, b) => `Вычитай по частям: ${a} − ${b}. Сначала крупные разряды, затем единицы.`,
      resultEyebrow: "Тренировка завершена", correctOf20: "верно из 20", average: "в среднем", experience: "опыта",
      levelUpTitle: "Новый уровень открыт!", completeTitle: "Тренировка завершена!", levelUpNote: (level, name) => `Теперь уровень ${level}: ${name}.`,
      stayNote: "Продолжаем этот уровень, пока он не станет уверенным.", maxLevelNote: "Максимальный уровень освоен — продолжаем закреплять счёт до 10 000.", reviewsLeft: (count) => `Примеров для повторения: ${count}.`, again: "Дальше", viewHistory: "Посмотреть историю",
      forParents: "Для родителей", close: "Закрыть", clearHistory: "Удалить историю", emptyHistory: "Здесь появятся результаты после первой тренировки.",
      sessions: "тренировок", currentLevel: "текущий уровень", correctShort: "верно из 20", correctHistory: (correct, seconds) => `${correct}/20 верно · ${seconds} с`,
      repeat: "Стоит повторить:", deleteConfirm: "Удалить всю историю занятий на этом устройстве?", leaveConfirm: "Закончить текущую тренировку?",
      seconds: "с", trainingTool: "Начать тренировку", historyTool: "Прочитать историю занятий", levelShort: (level) => `Ур. ${level}`,
      levelLabel: (level, name) => `Уровень ${level} · ${name}`,
      adaptiveLevel: (name, operator, operand) => `${name} · ${operator}${operand}`,
      adaptiveStep: (operator, operand) => `Новый шаг: ${operator}${operand}`,
      adaptiveStage: (name) => `Новый уровень: ${name}`,
      easierStep: (name) => `Сделаем чуть легче: ${name}`,
      adaptiveAdjusted: "Капи подстроил сложность под твой темп",
      subtractionUnlocked: "Сложение освоено — начинаем вычитание!",
      stageNames: ["сложение до 10", "вычитание до 10", "сложение до 20", "вычитание до 20", "вычитание через 10", "счёт до 50", "счёт до 50 с переходом", "счёт до 100", "счёт до 100 с переходом", "счёт до 200", "счёт до 500", "счёт до 1 000", "счёт до 2 000", "счёт до 5 000", "счёт до 10 000"],
      messages: {
        correct: ["Точно!", "Умница!", "Так держать!", "Супер!", "Верно!"],
        streak: ["Вот это серия!", "Три подряд!", "Капи в восторге!", "Ты разогналась!"],
        tryAgain: ["Почти! Смотри подсказку", "Давай ещё раз", "Не спеши — получится"],
        complete: ["Отличная работа!", "Капи гордится тобой!", "Тренировка пройдена!"]
      }
    },
    de: {
      locale: "de-DE", appName: "Rechnen mit Kapi", description: "Adaptives Rechentraining mit Plus und Minus bis 10.000 für Kinder.",
      startEyebrow: "Stufe 1", startTitle: "Bereit zum Rechnen?", startDescription: "20 kurze Aufgaben. Kapi erhöht die Schwierigkeit Schritt für Schritt.",
      dayStreak: "Tage in Folge", totalXp: "XP insgesamt", start: "Training starten", history: "Trainingsverlauf", speech: "Du schaffst das!",
      home: "Zur Startseite", soundOn: "Ton ausschalten", soundOff: "Ton einschalten", gameProgress: "Spielfortschritt",
      problem: "Aufgabe", answerStreak: "Richtige Antworten in Folge", xpEarned: "Gesammelte Erfahrungspunkte", careful: "Rechne in Ruhe", next: "Nächste Aufgabe",
      answer: "Antwort", numberPad: "Zahlentastatur", clear: "Löschen", backspace: "Letzte Ziffer löschen", check: "Prüfen",
      rightInRow: (value) => `${value} richtige in Folge`, finalAnswer: (value) => `Die Antwort ist ${value}. Das merken wir uns!`,
      subtractionHint: (a, b) => `Es waren ${a}. Streiche ${b} weg. Wie viele bleiben übrig?`,
      additionHint: (a, b) => `Verbinde ${a} und ${b}. Zähle alle Kreise.`,
      additionAria: (a, b) => `Erste Gruppe: ${a}. Zweite Gruppe: ${b}.`,
      largeAdditionHint: (a, b) => `Addiere in Schritten: ${a} + ${b}. Zuerst die großen Stellen, dann die Einer.`,
      largeSubtractionHint: (a, b) => `Subtrahiere in Schritten: ${a} − ${b}. Zuerst die großen Stellen, dann die Einer.`,
      resultEyebrow: "Training beendet", correctOf20: "richtig von 20", average: "im Durchschnitt", experience: "Erfahrung",
      levelUpTitle: "Neue Stufe freigeschaltet!", completeTitle: "Training beendet!", levelUpNote: (level, name) => `Jetzt Stufe ${level}: ${name}.`,
      stayNote: "Wir üben diese Stufe weiter, bis sie sicher sitzt.", maxLevelNote: "Die höchste Stufe ist geschafft – jetzt festigen wir das Rechnen bis 10.000.", reviewsLeft: (count) => `Aufgaben zum Wiederholen: ${count}.`, again: "Weiter", viewHistory: "Verlauf ansehen",
      forParents: "Für Eltern", close: "Schließen", clearHistory: "Verlauf löschen", emptyHistory: "Nach dem ersten Training erscheinen hier die Ergebnisse.",
      sessions: "Trainings", currentLevel: "aktuelle Stufe", correctShort: "richtig von 20", correctHistory: (correct, seconds) => `${correct}/20 richtig · ${seconds} s`,
      repeat: "Noch einmal üben:", deleteConfirm: "Den gesamten Trainingsverlauf auf diesem Gerät löschen?", leaveConfirm: "Das aktuelle Training beenden?",
      seconds: "s", trainingTool: "Training starten", historyTool: "Trainingsverlauf lesen", levelShort: (level) => `St. ${level}`,
      levelLabel: (level, name) => `Stufe ${level} · ${name}`,
      adaptiveLevel: (name, operator, operand) => `${name} · ${operator}${operand}`,
      adaptiveStep: (operator, operand) => `Neuer Schritt: ${operator}${operand}`,
      adaptiveStage: (name) => `Neue Stufe: ${name}`,
      easierStep: (name) => `Etwas leichter: ${name}`,
      adaptiveAdjusted: "Kapi hat die Schwierigkeit an dein Tempo angepasst",
      subtractionUnlocked: "Addition geschafft – jetzt beginnt die Subtraktion!",
      stageNames: ["Addition bis 10", "Subtraktion bis 10", "einfache Addition bis 20", "Subtraktion bis 20", "Subtraktion über den Zehner", "Rechnen bis 50", "Rechnen bis 50 mit Übergang", "Rechnen bis 100", "Rechnen bis 100 mit Übergang", "Rechnen bis 200", "Rechnen bis 500", "Rechnen bis 1.000", "Rechnen bis 2.000", "Rechnen bis 5.000", "Rechnen bis 10.000"],
      messages: {
        correct: ["Richtig!", "Klasse!", "Weiter so!", "Super!", "Genau!"],
        streak: ["Starke Serie!", "Drei hintereinander!", "Kapi freut sich!", "Du bist im Rechenfluss!"],
        tryAgain: ["Fast! Schau auf den Tipp", "Versuch es noch einmal", "Lass dir Zeit – du schaffst das"],
        complete: ["Klasse gemacht!", "Kapi ist stolz auf dich!", "Training geschafft!"]
      }
    }
  };
  const copy = translations[language];
  const messages = copy.messages;

  const state = {
    index: 0,
    score: 0,
    correct: 0,
    streak: 0,
    stage: 1,
    attempt: 1,
    problem: null,
    startedAt: 0,
    results: [],
    locked: false,
    sound: true,
    enteredAnswer: "",
    stageAdvancedDuringSession: false
  };

  const $ = (id) => document.getElementById(id);
  const screens = [$("startScreen"), $("gameScreen"), $("resultScreen")];

  function applyLanguage() {
    document.documentElement.lang = language;
    document.title = copy.appName;
    document.querySelector('meta[name="description"]').setAttribute("content", copy.description);
    $("manifestLink").setAttribute("href", `manifest-${language}.webmanifest`);
    $("brandName").textContent = copy.appName;
    $("startEyebrow").textContent = copy.startEyebrow;
    $("startTitle").textContent = copy.startTitle;
    $("startDescription").textContent = copy.startDescription;
    $("dayStreakLabel").textContent = copy.dayStreak;
    $("totalXpLabel").textContent = copy.totalXp;
    $("startButton").innerHTML = `${copy.start} <span aria-hidden="true">→</span>`;
    $("statsButton").textContent = copy.history;
    $("speechBubble").textContent = copy.speech;
    $("homeStats").setAttribute("aria-label", copy.gameProgress);
    $("homeButton").setAttribute("aria-label", copy.home);
    $("problemLabel").textContent = copy.problem;
    $("streakPill").setAttribute("aria-label", copy.answerStreak);
    $("scorePill").setAttribute("aria-label", copy.xpEarned);
    $("feedback").textContent = copy.careful;
    $("resultEyebrow").textContent = copy.resultEyebrow;
    $("correctLabel").textContent = copy.correctOf20;
    $("averageLabel").textContent = copy.average;
    $("xpLabel").textContent = copy.experience;
    $("againButton").textContent = copy.again;
    $("resultStatsButton").textContent = copy.viewHistory;
    $("parentEyebrow").textContent = copy.forParents;
    $("historyTitle").textContent = copy.history;
    $("closeStatsButton").setAttribute("aria-label", copy.close);
    $("clearStatsButton").textContent = copy.clearHistory;
  }

  function loadSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      state.sound = value.sound !== false;
    } catch { state.sound = true; }
    updateSoundButton();
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: state.sound }));
  }

  function getProfile() {
    const defaults = { totalXp: 0, dayStreak: 0, lastDay: null, currentStage: 1, errorQueue: [], adaptiveOperand: 1, adaptiveFastStreak: 0, adaptiveRecentResults: [] };
    try {
      const profile = { ...defaults, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
      profile.currentStage = Math.min(15, Math.max(1, Number(profile.currentStage) || 1));
      profile.errorQueue = Array.isArray(profile.errorQueue) ? profile.errorQueue : [];
      profile.adaptiveOperand = Math.min(9, Math.max(1, Number(profile.adaptiveOperand) || 1));
      profile.adaptiveFastStreak = Math.min(2, Math.max(0, Number(profile.adaptiveFastStreak) || 0));
      profile.adaptiveRecentResults = Array.isArray(profile.adaptiveRecentResults)
        ? profile.adaptiveRecentResults.filter((value) => value === 0 || value === 1).slice(-5)
        : [];
      return profile;
    } catch { return defaults; }
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function updateHomeStats() {
    const profile = getProfile();
    $("dayStreakValue").textContent = String(profile.dayStreak);
    $("totalXpValue").textContent = String(profile.totalXp);
    const stageName = profile.currentStage <= 2
      ? copy.adaptiveLevel(copy.stageNames[profile.currentStage - 1], profile.currentStage === 1 ? "+" : "−", profile.adaptiveOperand)
      : copy.stageNames[profile.currentStage - 1];
    $("startEyebrow").textContent = copy.levelLabel(profile.currentStage, stageName);
  }

  function updateSoundButton() {
    const button = $("soundButton");
    button.textContent = state.sound ? "♪" : "×";
    button.setAttribute("aria-pressed", String(state.sound));
    button.setAttribute("aria-label", state.sound ? copy.soundOn : copy.soundOff);
  }

  function showScreen(target) {
    screens.forEach((screen) => screen.classList.toggle("active", screen === target));
    $("homeButton").classList.toggle("hidden", target === $("startScreen"));
    document.body.classList.toggle("game-active", target === $("gameScreen"));
    scheduleFitCheck();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) { return list[randomInt(0, list.length - 1)]; }

  const stageLimits = [10, 10, 20, 20, 20, 50, 50, 100, 100, 200, 500, 1000, 2000, 5000, 10000];

  function hasCarry(a, b) {
    while (a > 0 || b > 0) {
      if ((a % 10) + (b % 10) >= 10) return true;
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return false;
  }

  function hasBorrow(a, b) {
    while (a > 0 || b > 0) {
      if ((a % 10) < (b % 10)) return true;
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return false;
  }

  function makeGeneratedProblem(stage, index, profile) {
    const max = stageLimits[stage - 1];
    let operator = "+";
    let a = 1;
    let b = 1;

    if (stage === 1) {
      b = profile.adaptiveOperand;
      a = randomInt(1, 10 - b);
    } else if (stage === 2) {
      operator = "−";
      b = profile.adaptiveOperand;
      a = randomInt(b + 1, 10);
    } else if (stage === 3) {
      do { a = randomInt(10, 19); b = randomInt(1, 20 - a); } while (hasCarry(a, b));
    } else if (stage === 4) {
      operator = "−";
      do { a = randomInt(11, 20); b = randomInt(1, a - 1); } while (hasBorrow(a, b));
    } else if (stage === 5) {
      operator = "−";
      do { a = randomInt(11, 20); b = randomInt(2, Math.min(9, a - 1)); } while (!hasBorrow(a, b));
    } else {
      operator = index % 2 === 0 ? "+" : "−";
      const requireTransition = stage === 7 || stage === 9;
      const avoidTransition = stage === 6 || stage === 8;
      for (let tries = 0; tries < 200; tries += 1) {
        if (operator === "+") {
          a = randomInt(Math.max(2, Math.floor(max * .18)), Math.max(3, Math.floor(max * .78)));
          b = randomInt(1, Math.max(1, max - a));
          if ((!requireTransition || hasCarry(a, b)) && (!avoidTransition || !hasCarry(a, b))) break;
        } else {
          a = randomInt(Math.max(3, Math.floor(max * .35)), max);
          b = randomInt(1, a - 1);
          if ((!requireTransition || hasBorrow(a, b)) && (!avoidTransition || !hasBorrow(a, b))) break;
        }
      }
    }

    const answer = operator === "+" ? a + b : a - b;
    return { a, b, answer, operator, mode: index % 2 === 0 ? "choice" : "input", isReview: false, key: `${a}${operator}${b}` };
  }

  function selectProblem(stage, index) {
    const profile = getProfile();
    const queue = profile.errorQueue;
    const remaining = TOTAL - index;
    const shouldReview = queue.length > 0 && (index % 3 === 2 || remaining <= queue.length * 2);
    if (shouldReview) {
      const sorted = [...queue].sort((left, right) => (left.lastShown || 0) - (right.lastShown || 0));
      const review = sorted.find((item) => item.key !== state.problem?.key) || sorted[0];
      const stored = queue.find((item) => item.key === review.key);
      stored.lastShown = Date.now();
      saveProfile(profile);
      return { ...review, mode: index % 2 === 0 ? "choice" : "input", isReview: true };
    }
    return makeGeneratedProblem(stage, index, profile);
  }

  function startTraining() {
    const profile = getProfile();
    Object.assign(state, {
      index: 0, score: 0, correct: 0, streak: 0, stage: profile.currentStage,
      attempt: 1, problem: null, results: [], locked: false, enteredAnswer: "", stageAdvancedDuringSession: false
    });
    showScreen($("gameScreen"));
    $("feedback").textContent = copy.careful;
    nextProblem();
    sound("start");
  }

  function nextProblem() {
    if (state.index >= TOTAL) return finishTraining();
    state.attempt = 1;
    state.locked = false;
    state.enteredAnswer = "";
    state.problem = selectProblem(state.stage, state.index);
    state.startedAt = performance.now();
    $("problemNumber").textContent = String(state.index + 1);
    $("scoreValue").textContent = String(state.score);
    $("streakValue").textContent = String(state.streak);
    $("streakPill").classList.toggle("hidden", state.streak < 2);
    $("progressFill").style.width = `${(state.index / TOTAL) * 100}%`;
    const problemText = `${state.problem.a} ${state.problem.operator} ${state.problem.b} = ?`;
    $("problemText").textContent = problemText;
    $("problemText").classList.toggle("problem-wide", problemText.length > 12);
    $("hint").classList.add("hidden");
    $("hint").innerHTML = "";
    $("feedback").textContent = state.index === 0 ? copy.careful : copy.next;
    setMascot("idle");
    renderAnswer();
  }

  function renderAnswer() {
    const area = $("answerArea");
    area.innerHTML = "";
    if (state.problem.mode === "choice") {
      const wrap = document.createElement("div");
      wrap.className = "choices";
      makeChoices(state.problem.answer).forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button";
        button.textContent = String(value);
        button.addEventListener("click", () => submitAnswer(value));
        wrap.appendChild(button);
      });
      area.appendChild(wrap);
    } else {
      const keypad = document.createElement("div");
      keypad.className = "number-entry";
      keypad.innerHTML = `
        <div class="keypad-answer empty" id="numberAnswer" role="status" aria-live="polite" aria-label="${copy.answer}">${copy.answer}</div>
        <div class="number-pad" aria-label="${copy.numberPad}">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button class="number-key" type="button" data-digit="${digit}">${digit}</button>`).join("")}
          <button class="number-key number-key-action" type="button" data-action="clear" aria-label="${copy.clear}">C</button>
          <button class="number-key" type="button" data-digit="0">0</button>
          <button class="number-key number-key-action" type="button" data-action="backspace" aria-label="${copy.backspace}">⌫</button>
        </div>
        <button class="submit-button" type="button" data-action="submit">${copy.check}</button>`;
      keypad.addEventListener("click", handleKeypadClick);
      area.appendChild(keypad);
      updateKeypadDisplay();
    }
    scheduleFitCheck();
  }

  function handleKeypadClick(event) {
    const button = event.target.closest("button");
    if (!button || state.locked) return;
    if (button.dataset.digit !== undefined) {
      if (state.enteredAnswer.length < 5) state.enteredAnswer += button.dataset.digit;
      updateKeypadDisplay();
      sound("tap");
      if (state.enteredAnswer !== "" && Number(state.enteredAnswer) === state.problem.answer) {
        submitAnswer(Number(state.enteredAnswer));
      }
      return;
    }
    if (button.dataset.action === "clear") state.enteredAnswer = "";
    if (button.dataset.action === "backspace") state.enteredAnswer = state.enteredAnswer.slice(0, -1);
    if (button.dataset.action === "submit" && state.enteredAnswer !== "") {
      submitAnswer(Number(state.enteredAnswer));
      return;
    }
    updateKeypadDisplay();
  }

  function updateKeypadDisplay() {
    const display = $("numberAnswer");
    if (!display) return;
    display.textContent = state.enteredAnswer || copy.answer;
    display.classList.toggle("empty", state.enteredAnswer === "");
  }

  function makeChoices(answer) {
    const values = new Set([answer]);
    const scale = answer < 20 ? 1 : answer < 100 ? 5 : answer < 1000 ? 10 : 100;
    const nearby = [answer - scale, answer + scale, answer - 2 * scale, answer + 2 * scale, answer - 1, answer + 1]
      .filter((value) => value >= 0 && value <= 10000);
    while (values.size < 4 && nearby.length) {
      const i = randomInt(0, nearby.length - 1);
      values.add(nearby.splice(i, 1)[0]);
    }
    while (values.size < 4) values.add(Math.min(10000, Math.max(0, answer + randomInt(-3, 3) * scale)));
    return [...values].sort(() => Math.random() - .5);
  }

  function submitAnswer(value) {
    if (state.locked) return;
    const elapsed = Math.max(.2, (performance.now() - state.startedAt) / 1000);
    const isCorrect = value === state.problem.answer;

    if (isCorrect) {
      state.locked = true;
      const fastBonus = elapsed <= 5 ? 3 : elapsed <= 10 ? 2 : 1;
      const earned = state.attempt === 1 ? fastBonus : 1;
      state.score += earned;
      state.correct += state.attempt === 1 ? 1 : 0;
      state.streak = state.attempt === 1 ? state.streak + 1 : 0;
      if (state.attempt === 1) registerCorrectAnswer(state.problem);
      recordResult(true, elapsed, state.attempt);
      const adaptiveMessage = updateAdaptiveProgress(state.problem, state.attempt === 1, true, elapsed);
      const text = state.streak > 0 && state.streak % 3 === 0 ? pick(messages.streak) : pick(messages.correct);
      $("feedback").textContent = `${text} +${earned} ★`;
      setMascot("happy");
      sound(state.streak > 0 && state.streak % 3 === 0 ? "streak" : "correct");
      if (adaptiveMessage) showMotivation(adaptiveMessage, copy.adaptiveAdjusted);
      else if (state.streak > 0 && state.streak % 3 === 0) showMotivation(text, copy.rightInRow(state.streak));
      window.setTimeout(advance, 850);
      return;
    }

    const adaptiveMessage = updateAdaptiveProgress(state.problem, state.attempt === 1, false, elapsed);
    state.streak = 0;
    $("streakPill").classList.add("hidden");
    setMascot("try");
    sound("wrong");
    if (state.attempt === 1) {
      registerProblemError(state.problem);
      state.attempt = 2;
      state.enteredAnswer = "";
      $("feedback").textContent = pick(messages.tryAgain);
      if (adaptiveMessage) showMotivation(adaptiveMessage, copy.adaptiveAdjusted);
      showHint();
      renderAnswer();
      return;
    }

    state.locked = true;
    recordResult(false, elapsed, 2);
    $("feedback").textContent = copy.finalAnswer(state.problem.answer);
    window.setTimeout(advance, 1300);
  }

  function recordResult(success, elapsed, attempt) {
    const item = {
      key: `${state.problem.a}${state.problem.operator}${state.problem.b}`,
      a: state.problem.a,
      b: state.problem.b,
      operator: state.problem.operator,
      answer: state.problem.answer,
      success,
      firstTry: success && attempt === 1,
      seconds: Number(elapsed.toFixed(1)),
      stage: state.stage
    };
    state.results.push(item);
  }

  function registerProblemError(problem) {
    const profile = getProfile();
    let item = profile.errorQueue.find((entry) => entry.key === problem.key);
    if (!item) {
      item = { key: problem.key, a: problem.a, b: problem.b, operator: problem.operator, answer: problem.answer, correctStreak: 0, lastShown: Date.now() };
      profile.errorQueue.push(item);
    } else {
      item.correctStreak = 0;
      item.lastShown = Date.now();
    }
    saveProfile(profile);
  }

  function updateAdaptiveProgress(problem, isFirstAttempt, isCorrect, elapsed) {
    if (problem.isReview || !isFirstAttempt) return "";
    const profile = getProfile();
    if (profile.currentStage <= 2) {
      const expectedOperator = profile.currentStage === 1 ? "+" : "−";
      if (problem.operator !== expectedOperator || problem.b !== profile.adaptiveOperand) return "";
    }

    profile.adaptiveRecentResults.push(isCorrect ? 1 : 0);
    profile.adaptiveRecentResults = profile.adaptiveRecentResults.slice(-5);
    const errorCount = profile.adaptiveRecentResults.filter((value) => value === 0).length;
    if (profile.adaptiveRecentResults.length === 5 && errorCount / 5 > .2) {
      const label = lowerAdaptiveDifficulty(profile);
      profile.adaptiveFastStreak = 0;
      profile.adaptiveRecentResults = [];
      saveProfile(profile);
      return label ? copy.easierStep(label) : "";
    }

    profile.adaptiveFastStreak = isCorrect && elapsed < 3
      ? profile.adaptiveFastStreak + 1
      : 0;
    if (profile.adaptiveFastStreak < 3) {
      saveProfile(profile);
      return "";
    }

    profile.adaptiveFastStreak = 0;
    profile.adaptiveRecentResults = [];
    if (profile.currentStage <= 2 && profile.adaptiveOperand < 9) {
      const operator = profile.currentStage === 1 ? "+" : "−";
      profile.adaptiveOperand += 1;
      saveProfile(profile);
      return copy.adaptiveStep(operator, profile.adaptiveOperand);
    }

    if (profile.currentStage >= 15) {
      saveProfile(profile);
      return "";
    }

    if (profile.currentStage <= 2) profile.adaptiveOperand = 1;
    profile.currentStage += 1;
    state.stage = profile.currentStage;
    state.stageAdvancedDuringSession = true;
    saveProfile(profile);
    return profile.currentStage === 2
      ? copy.subtractionUnlocked
      : copy.adaptiveStage(copy.stageNames[profile.currentStage - 1]);
  }

  function lowerAdaptiveDifficulty(profile) {
    if (profile.currentStage === 1) {
      if (profile.adaptiveOperand === 1) return "";
      profile.adaptiveOperand -= 1;
      return `+${profile.adaptiveOperand}`;
    }

    if (profile.currentStage === 2 && profile.adaptiveOperand > 1) {
      profile.adaptiveOperand -= 1;
      return `−${profile.adaptiveOperand}`;
    }

    if (profile.currentStage === 2) {
      profile.currentStage = 1;
      profile.adaptiveOperand = 9;
      state.stage = 1;
      state.stageAdvancedDuringSession = true;
      return "+9";
    }

    profile.currentStage -= 1;
    if (profile.currentStage === 2) profile.adaptiveOperand = 9;
    state.stage = profile.currentStage;
    state.stageAdvancedDuringSession = true;
    return copy.stageNames[profile.currentStage - 1];
  }

  function registerCorrectAnswer(problem) {
    const profile = getProfile();
    const item = profile.errorQueue.find((entry) => entry.key === problem.key);
    if (!item) return;
    item.correctStreak = (item.correctStreak || 0) + 1;
    item.lastShown = Date.now();
    if (item.correctStreak >= 2) profile.errorQueue = profile.errorQueue.filter((entry) => entry.key !== problem.key);
    saveProfile(profile);
  }

  function advance() {
    state.index += 1;
    nextProblem();
  }

  function showHint() {
    const { a, b, operator } = state.problem;
    const hint = $("hint");
    let dots = "";
    if (operator === "−" && a <= 20) {
      for (let i = 0; i < a; i += 1) dots += `<span class="counter${i >= a - b ? " removed" : ""}"></span>`;
      hint.innerHTML = `<span>${copy.subtractionHint(a, b)}</span><div class="counter-line" aria-hidden="true">${dots}</div>`;
    } else if (operator === "+" && a + b <= 20) {
      const firstGroup = Array.from({ length: a }, () => `<span class="counter"></span>`).join("");
      const secondGroup = Array.from({ length: b }, () => `<span class="counter addend-two"></span>`).join("");
      hint.innerHTML = `
        <span>${copy.additionHint(a, b)}</span>
        <div class="addition-groups" aria-label="${copy.additionAria(a, b)}">
          <div class="addend-card"><strong>${a}</strong><div class="addend-dots">${firstGroup}</div></div>
          <span class="hint-plus" aria-hidden="true">+</span>
          <div class="addend-card addend-card-two"><strong>${b}</strong><div class="addend-dots">${secondGroup}</div></div>
        </div>`;
    } else {
      hint.innerHTML = `<span>${operator === "+" ? copy.largeAdditionHint(a, b) : copy.largeSubtractionHint(a, b)}</span>`;
    }
    hint.classList.remove("hidden");
    scheduleFitCheck();
  }

  let fitFrame = 0;
  function visibleHeight() {
    return Math.round(window.visualViewport?.height || window.innerHeight);
  }

  function syncViewportSize() {
    const height = visibleHeight();
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    scheduleFitCheck();
  }

  function scheduleFitCheck() {
    window.cancelAnimationFrame(fitFrame);
    fitFrame = window.requestAnimationFrame(ensureGameFits);
  }

  function ensureGameFits() {
    if (!$("gameScreen").classList.contains("active")) return;
    document.body.classList.remove("force-compact", "force-ultra");
    const viewportBottom = visibleHeight() - 6;
    const target = $("answerArea").querySelector(".submit-button") || $("answerArea");
    if (target.getBoundingClientRect().bottom > viewportBottom) {
      document.body.classList.add("force-compact");
    }
    window.requestAnimationFrame(() => {
      if (target.getBoundingClientRect().bottom > viewportBottom) {
        document.body.classList.add("force-ultra");
      }
    });
  }

  function setMascot(mode) {
    const mascot = $("gameMascot");
    mascot.className = `mini-mascot mascot-${mode}`;
    if (mode !== "idle") {
      window.setTimeout(() => { mascot.className = "mini-mascot mascot-idle"; }, 700);
    }
  }

  function finishTraining() {
    const average = state.results.length
      ? state.results.reduce((sum, item) => sum + item.seconds, 0) / state.results.length
      : 0;
    const profile = getProfile();
    const canAdvance = state.stage >= 3 && !state.stageAdvancedDuringSession && state.correct >= 18 && average <= 10 && profile.errorQueue.length === 0;
    const advanced = canAdvance && profile.currentStage < 15;
    if (advanced) {
      profile.currentStage += 1;
      saveProfile(profile);
    }
    const session = {
      date: new Date().toISOString(),
      correct: state.correct,
      average: Number(average.toFixed(1)),
      score: state.score,
      stage: state.stage,
      advanced,
      trouble: state.results.filter((item) => !item.firstTry).map((item) => item.key).slice(0, 5)
    };
    saveSession(session);
    $("correctValue").textContent = String(state.correct);
    $("averageValue").textContent = `${formatSeconds(average)} ${copy.seconds}`;
    $("starsValue").textContent = `${state.score} XP`;
    $("resultTitle").textContent = advanced ? copy.levelUpTitle : copy.completeTitle;
    const freshProfile = getProfile();
    $("resultNote").textContent = advanced
      ? copy.levelUpNote(freshProfile.currentStage, copy.stageNames[freshProfile.currentStage - 1])
      : `${canAdvance && state.stage === 15 ? copy.maxLevelNote : copy.stayNote}${freshProfile.errorQueue.length ? ` ${copy.reviewsLeft(freshProfile.errorQueue.length)}` : ""}`;
    $("progressFill").style.width = "100%";
    makeConfetti();
    showMotivation(pick(messages.complete), `+${state.score} XP`);
    showScreen($("resultScreen"));
    sound("complete");
  }

  function saveSession(session) {
    const history = getHistory();
    history.unshift(session);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    const profile = getProfile();
    const today = localDay(new Date());
    const yesterday = localDay(new Date(Date.now() - 86400000));
    if (profile.lastDay !== today) {
      profile.dayStreak = profile.lastDay === yesterday ? profile.dayStreak + 1 : 1;
      profile.lastDay = today;
    }
    profile.totalXp += session.score;
    saveProfile(profile);
    updateHomeStats();
  }

  function localDay(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  }

  function showStats() {
    const history = getHistory();
    const content = $("statsContent");
    $("clearStatsButton").classList.toggle("hidden", history.length === 0);
    if (!history.length) {
      content.innerHTML = `<div class="empty-state">${copy.emptyHistory}</div>`;
    } else {
      const profile = getProfile();
      const avgCorrect = history.reduce((sum, item) => sum + item.correct, 0) / history.length;
      const commonTrouble = mostCommon(history.flatMap((item) => item.trouble || []));
      content.innerHTML = `
        <div class="summary-stats">
          <div><strong>${history.length}</strong><span>${copy.sessions}</span></div>
          <div><strong>${profile.currentStage}</strong><span>${copy.currentLevel}</span></div>
          <div><strong>${formatNumber(avgCorrect)}</strong><span>${copy.correctShort}</span></div>
        </div>
        <div class="history-list">${history.slice(0, 10).map((item) => `
          <div class="history-row">
            <strong>${formatDate(item.date)}</strong>
            <span>${copy.correctHistory(item.correct, formatSeconds(item.average))}</span>
            <span class="history-level">${copy.levelShort(item.stage || 1)}</span>
          </div>`).join("")}</div>
        ${commonTrouble ? `<p class="trouble-note"><strong>${copy.repeat}</strong> ${commonTrouble.map(prettyKey).join(", ")}</p>` : ""}`;
    }
    $("statsDialog").showModal();
  }

  function mostCommon(items) {
    const counts = items.reduce((map, key) => map.set(key, (map.get(key) || 0) + 1), new Map());
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([key]) => key);
  }

  function prettyKey(key) { return key.replace("−", " − ").replace("+", " + "); }
  function formatNumber(value) { return new Intl.NumberFormat(copy.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value || 0)); }
  function formatSeconds(value) { return formatNumber(value); }
  function formatDate(value) {
    return new Intl.DateTimeFormat(copy.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  function makeConfetti() {
    const colors = ["#0f766e", "#f8c438", "#e76555", "#46b8aa", "#ffffff"];
    $("confetti").innerHTML = Array.from({ length: 28 }, (_, i) =>
      `<i class="confetti-piece" style="left:${randomInt(2, 98)}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 1.8).toFixed(2)}s;animation-duration:${(2.1 + Math.random() * 1.7).toFixed(2)}s"></i>`
    ).join("");
  }

  function showMotivation(title, subtitle) {
    const pop = $("motivationPop");
    $("motivationText").textContent = title;
    $("motivationSubtext").textContent = subtitle;
    pop.classList.remove("hidden");
    pop.style.animation = "none";
    void pop.offsetWidth;
    pop.style.animation = "";
    window.setTimeout(() => pop.classList.add("hidden"), 850);
  }

  let audioContext;
  function sound(type) {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const patterns = {
        start: [[440, 0, .09], [660, .1, .12]],
        correct: [[520, 0, .08], [700, .09, .1]],
        wrong: [[220, 0, .11], [185, .1, .12]],
        streak: [[520, 0, .07], [660, .08, .07], [880, .16, .14]],
        complete: [[440, 0, .1], [554, .11, .1], [660, .22, .1], [880, .34, .2]]
        ,tap: [[360, 0, .035]]
      };
      (patterns[type] || patterns.correct).forEach(([frequency, delay, duration]) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(.12, now + delay + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, now + delay + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + duration + .02);
      });
    } catch { /* Sound remains optional. */ }
  }

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    try {
      context.registerTool({
        name: "start_arithmetic_training",
        title: copy.trainingTool,
        description: "Starts a new visible 20-problem arithmetic training session.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute() { startTraining(); return { status: "started", problemCount: TOTAL }; }
      });
      context.registerTool({
        name: "read_training_history",
        title: copy.historyTool,
        description: "Returns locally stored arithmetic training summary data.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() { const history = getHistory(); return { sessionCount: history.length, latest: history[0] || null }; }
      });
    } catch { /* Unsupported experimental API. */ }
  }

  $("startButton").addEventListener("click", startTraining);
  $("againButton").addEventListener("click", startTraining);
  $("statsButton").addEventListener("click", showStats);
  $("resultStatsButton").addEventListener("click", showStats);
  $("closeStatsButton").addEventListener("click", () => $("statsDialog").close());
  $("clearStatsButton").addEventListener("click", () => {
    if (!window.confirm(copy.deleteConfirm)) return;
    localStorage.removeItem(HISTORY_KEY);
    showStats();
  });
  $("homeButton").addEventListener("click", () => {
    if (state.index > 0 && state.index < TOTAL && !window.confirm(copy.leaveConfirm)) return;
    showScreen($("startScreen"));
  });
  $("soundButton").addEventListener("click", () => {
    state.sound = !state.sound;
    saveSettings();
    updateSoundButton();
    if (state.sound) sound("correct");
  });

  applyLanguage();
  loadSettings();
  updateHomeStats();
  registerWebMcp();
  syncViewportSize();
  window.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportSize, { passive: true });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
})();
