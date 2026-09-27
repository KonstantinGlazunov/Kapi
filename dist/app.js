(() => {
  "use strict";

  const TOTAL = 20;
  const HISTORY_KEY = "capy-count-history-v1";
  const SETTINGS_KEY = "capy-count-settings-v1";
  const PROFILE_KEY = "capy-count-profile-v1";
  const messages = {
    correct: ["Точно!", "Умница!", "Так держать!", "Супер!", "Верно!"],
    streak: ["Вот это серия!", "Три подряд!", "Капи в восторге!", "Ты разогналась!"],
    tryAgain: ["Почти! Смотри подсказку", "Давай ещё раз", "Не спеши — получится"],
    complete: ["Отличная работа!", "Капи гордится тобой!", "Тренировка пройдена!"]
  };

  const state = {
    index: 0,
    score: 0,
    correct: 0,
    streak: 0,
    level: 1,
    attempt: 1,
    problem: null,
    startedAt: 0,
    results: [],
    recent: [],
    locked: false,
    sound: true,
    enteredAnswer: ""
  };

  const $ = (id) => document.getElementById(id);
  const screens = [$("startScreen"), $("gameScreen"), $("resultScreen")];

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
    try { return { totalXp: 0, dayStreak: 0, lastDay: null, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") }; }
    catch { return { totalXp: 0, dayStreak: 0, lastDay: null }; }
  }

  function updateHomeStats() {
    const profile = getProfile();
    $("dayStreakValue").textContent = String(profile.dayStreak);
    $("totalXpValue").textContent = String(profile.totalXp);
  }

  function updateSoundButton() {
    const button = $("soundButton");
    button.textContent = state.sound ? "♪" : "×";
    button.setAttribute("aria-pressed", String(state.sound));
    button.setAttribute("aria-label", state.sound ? "Выключить звук" : "Включить звук");
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

  function makeProblem(level, index) {
    const useAddition = index % 10 === 3 || index % 10 === 7 || Math.random() < 0.12;
    let a;
    let b;
    let answer;

    if (useAddition) {
      if (level === 1) {
        a = randomInt(1, 8); b = randomInt(1, 10 - a);
      } else if (level === 2) {
        a = randomInt(5, 14); b = randomInt(1, Math.min(6, 20 - a));
      } else {
        do { a = randomInt(4, 15); b = randomInt(3, 20 - a); } while (a % 10 + b < 10);
      }
      answer = a + b;
      return { a, b, answer, operator: "+", mode: index % 2 === 0 ? "choice" : "input" };
    }

    if (level === 1) {
      a = randomInt(5, 10); b = randomInt(1, a - 1);
    } else if (level === 2) {
      a = randomInt(11, 20); b = randomInt(1, Math.min(8, a));
      if (a % 10 < b) b = Math.max(1, a % 10);
    } else if (level === 3) {
      do { a = randomInt(11, 18); b = randomInt(3, 9); } while (a % 10 >= b || b >= a);
    } else {
      do { a = randomInt(12, 20); b = randomInt(5, 12); } while (a % 10 >= b || b >= a);
    }
    answer = a - b;
    return { a, b, answer, operator: "−", mode: index % 2 === 0 ? "choice" : "input" };
  }

  function startTraining() {
    Object.assign(state, {
      index: 0, score: 0, correct: 0, streak: 0, level: 1,
      attempt: 1, problem: null, results: [], recent: [], locked: false, enteredAnswer: ""
    });
    showScreen($("gameScreen"));
    $("feedback").textContent = "Считай внимательно";
    nextProblem();
    sound("start");
  }

  function nextProblem() {
    if (state.index >= TOTAL) return finishTraining();
    state.attempt = 1;
    state.locked = false;
    state.enteredAnswer = "";
    state.problem = makeProblem(state.level, state.index);
    state.startedAt = performance.now();
    $("problemNumber").textContent = String(state.index + 1);
    $("scoreValue").textContent = String(state.score);
    $("streakValue").textContent = String(state.streak);
    $("streakPill").classList.toggle("hidden", state.streak < 2);
    $("progressFill").style.width = `${(state.index / TOTAL) * 100}%`;
    $("problemText").textContent = `${state.problem.a} ${state.problem.operator} ${state.problem.b} = ?`;
    $("hint").classList.add("hidden");
    $("hint").innerHTML = "";
    $("feedback").textContent = state.index === 0 ? "Считай внимательно" : "Следующий пример";
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
        <div class="keypad-answer empty" id="numberAnswer" role="status" aria-live="polite" aria-label="Введённый ответ">Ответ</div>
        <div class="number-pad" aria-label="Цифровая клавиатура">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button class="number-key" type="button" data-digit="${digit}">${digit}</button>`).join("")}
          <button class="number-key number-key-action" type="button" data-action="clear" aria-label="Очистить">C</button>
          <button class="number-key" type="button" data-digit="0">0</button>
          <button class="number-key number-key-action" type="button" data-action="backspace" aria-label="Удалить последнюю цифру">⌫</button>
        </div>
        <button class="submit-button" type="button" data-action="submit">Проверить</button>`;
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
      if (state.enteredAnswer.length < 2) state.enteredAnswer += button.dataset.digit;
      updateKeypadDisplay();
      sound("tap");
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
    display.textContent = state.enteredAnswer || "Ответ";
    display.classList.toggle("empty", state.enteredAnswer === "");
  }

  function makeChoices(answer) {
    const values = new Set([answer]);
    const nearby = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 3, answer + 3]
      .filter((value) => value >= 0 && value <= 20);
    while (values.size < 4 && nearby.length) {
      const i = randomInt(0, nearby.length - 1);
      values.add(nearby.splice(i, 1)[0]);
    }
    while (values.size < 4) values.add(randomInt(0, 20));
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
      recordResult(true, elapsed, state.attempt);
      const text = state.streak > 0 && state.streak % 3 === 0 ? pick(messages.streak) : pick(messages.correct);
      $("feedback").textContent = `${text} +${earned} ★`;
      setMascot("happy");
      sound(state.streak > 0 && state.streak % 3 === 0 ? "streak" : "correct");
      if (state.streak > 0 && state.streak % 3 === 0) showMotivation(text, `${state.streak} верных подряд`);
      window.setTimeout(advance, 850);
      return;
    }

    state.streak = 0;
    $("streakPill").classList.add("hidden");
    setMascot("try");
    sound("wrong");
    if (state.attempt === 1) {
      state.attempt = 2;
      state.enteredAnswer = "";
      $("feedback").textContent = pick(messages.tryAgain);
      showHint();
      renderAnswer();
      return;
    }

    state.locked = true;
    recordResult(false, elapsed, 2);
    $("feedback").textContent = `Ответ: ${state.problem.answer}. Запомним!`;
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
      level: state.level
    };
    state.results.push(item);
    state.recent.push(item);
    if (state.recent.length > 4) state.recent.shift();
  }

  function adjustLevel() {
    if (state.recent.length < 3) return;
    const firstTryRate = state.recent.filter((item) => item.firstTry).length / state.recent.length;
    const average = state.recent.reduce((sum, item) => sum + item.seconds, 0) / state.recent.length;
    if (firstTryRate >= .75 && average < 9) state.level = Math.min(4, state.level + 1);
    if (firstTryRate < .5 || average > 15) state.level = Math.max(1, state.level - 1);
  }

  function advance() {
    adjustLevel();
    state.index += 1;
    nextProblem();
  }

  function showHint() {
    const { a, b, operator } = state.problem;
    const hint = $("hint");
    let dots = "";
    if (operator === "−") {
      for (let i = 0; i < a; i += 1) dots += `<span class="counter${i >= a - b ? " removed" : ""}"></span>`;
      hint.innerHTML = `<span>Было ${a}. Зачеркни ${b}. Сколько осталось?</span><div class="counter-line" aria-hidden="true">${dots}</div>`;
    } else {
      for (let i = 0; i < a + b; i += 1) dots += `<span class="counter"></span>`;
      hint.innerHTML = `<span>Соедини ${a} и ${b}. Посчитай все кружки.</span><div class="counter-line" aria-hidden="true">${dots}</div>`;
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
    document.body.classList.toggle("viewport-compact", height < 780);
    document.body.classList.toggle("viewport-ultra", height < 620);
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

  function calculateGrade(accuracy, average) {
    if (accuracy >= .9 && average <= 10) return 5;
    if (accuracy >= .75) return 4;
    if (accuracy >= .55) return 3;
    return 2;
  }

  function finishTraining() {
    const average = state.results.length
      ? state.results.reduce((sum, item) => sum + item.seconds, 0) / state.results.length
      : 0;
    const accuracy = state.correct / TOTAL;
    const grade = calculateGrade(accuracy, average);
    const session = {
      date: new Date().toISOString(),
      correct: state.correct,
      average: Number(average.toFixed(1)),
      score: state.score,
      grade,
      trouble: state.results.filter((item) => !item.firstTry).map((item) => item.key).slice(0, 5)
    };
    saveSession(session);
    $("gradeValue").textContent = String(grade);
    $("correctValue").textContent = String(state.correct);
    $("averageValue").textContent = `${formatSeconds(average)} c`;
    $("starsValue").textContent = `${state.score} XP`;
    $("resultTitle").textContent = grade === 5 ? "Отличная работа!" : grade === 4 ? "Очень хорошо!" : grade === 3 ? "Хорошая тренировка!" : "Сегодня стало понятнее!";
    $("resultNote").textContent = grade >= 4 ? "Продолжай в том же темпе." : "Капи повторит трудные примеры в следующий раз.";
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
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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
      content.innerHTML = `<div class="empty-state">Здесь появятся результаты после первой тренировки.</div>`;
    } else {
      const avgGrade = history.reduce((sum, item) => sum + item.grade, 0) / history.length;
      const avgCorrect = history.reduce((sum, item) => sum + item.correct, 0) / history.length;
      const commonTrouble = mostCommon(history.flatMap((item) => item.trouble || []));
      content.innerHTML = `
        <div class="summary-stats">
          <div><strong>${history.length}</strong><span>тренировок</span></div>
          <div><strong>${avgGrade.toFixed(1).replace(".", ",")}</strong><span>средняя оценка</span></div>
          <div><strong>${avgCorrect.toFixed(1).replace(".", ",")}</strong><span>верно из 20</span></div>
        </div>
        <div class="history-list">${history.slice(0, 10).map((item) => `
          <div class="history-row">
            <strong>${formatDate(item.date)}</strong>
            <span>${item.correct}/20 верно · ${formatSeconds(item.average)} c</span>
            <span class="history-grade">${item.grade}</span>
          </div>`).join("")}</div>
        ${commonTrouble ? `<p class="trouble-note"><strong>Стоит повторить:</strong> ${commonTrouble.map(prettyKey).join(", ")}</p>` : ""}`;
    }
    $("statsDialog").showModal();
  }

  function mostCommon(items) {
    const counts = items.reduce((map, key) => map.set(key, (map.get(key) || 0) + 1), new Map());
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([key]) => key);
  }

  function prettyKey(key) { return key.replace("−", " − ").replace("+", " + "); }
  function formatSeconds(value) { return Number(value || 0).toFixed(1).replace(".", ","); }
  function formatDate(value) {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
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
        title: "Начать тренировку",
        description: "Starts a new visible 20-problem arithmetic training session.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute() { startTraining(); return { status: "started", problemCount: TOTAL }; }
      });
      context.registerTool({
        name: "read_training_history",
        title: "Прочитать историю занятий",
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
    if (!window.confirm("Удалить всю историю занятий на этом устройстве?")) return;
    localStorage.removeItem(HISTORY_KEY);
    showStats();
  });
  $("homeButton").addEventListener("click", () => {
    if (state.index > 0 && state.index < TOTAL && !window.confirm("Закончить текущую тренировку?")) return;
    showScreen($("startScreen"));
  });
  $("soundButton").addEventListener("click", () => {
    state.sound = !state.sound;
    saveSettings();
    updateSoundButton();
    if (state.sound) sound("correct");
  });

  loadSettings();
  updateHomeStats();
  registerWebMcp();
  syncViewportSize();
  window.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportSize, { passive: true });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
})();
