(() => {
  "use strict";

  let TOTAL = 20;
  const HISTORY_KEY = "capy-count-history-v1";
  const SETTINGS_KEY = "capy-count-settings-v1";
  const PROFILE_KEY = "capy-count-profile-v1";
  let language = "de";
  const APP_URL = "https://schitaem-s-kapi.lsdglider.chatgpt.site";
  const OPERATION_ORDER = ["add", "subtract", "multiply", "divide", "negative", "decimal", "fraction", "power", "root"];
  const appSettings = { language: "de", problemCount: 20, automatic: true, range: "above100", operations: ["add", "subtract"], sound: true };
  const translations = {
    ru: {
      locale: "ru-RU", appName: "Считаем с Капи", description: "Адаптивный тренажёр арифметики для детей — от сложения до корней.",
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
      sessions: "тренировок", currentLevel: "текущий уровень", correctShort: "средний результат", correctHistory: (correct, total, seconds) => `${correct}/${total} верно · ${seconds} с`,
      repeat: "Стоит повторить:", deleteConfirm: "Удалить всю историю занятий на этом устройстве?", leaveConfirm: "Закончить текущую тренировку?",
      seconds: "с", trainingTool: "Начать тренировку", historyTool: "Прочитать историю занятий", levelShort: (level) => `Ур. ${level}`,
      levelLabel: (level, name) => `Уровень ${level} · ${name}`,
      adaptiveLevel: (name, operator, operand) => `${name} · ${operator}${operand}`,
      adaptiveStep: (operator, operand) => `Новый шаг: ${operator}${operand}`,
      adaptiveStage: (name) => `Новый уровень: ${name}`,
      easierStep: (name) => `Сделаем чуть легче: ${name}`,
      adaptiveAdjusted: "Капи подстроил сложность под твой темп",
      subtractionUnlocked: "Сложение освоено — начинаем вычитание!",
      operationUnlocked: (name) => `Новое действие: ${name}`,
      settings: "Настройки", settingsHint: "Параметры тренировки сохраняются на этом устройстве.", language: "Язык", examples: "Количество примеров", mode: "Режим", automatic: "Автоматически: от простого к сложному", range: "Диапазон чисел", operations: "Действия", sound: "Звук", soundEnabled: "Включён", soundDisabled: "Выключен", update: "Обновить приложение", updateReady: "Доступно обновление", share: "Поделиться результатом", shareText: "Попробуйте тренажёр «Считаем с Капи»", shareDone: "Готово", closeSettings: "Закрыть настройки", genericHint: "Разбери пример по шагам и попробуй ещё раз.", startDescriptionFor: (count) => `${count} коротких примеров. Капи постепенно повышает сложность.`, correctOfTotal: (count) => `верно из ${count}`, rangeNames: { auto: "Без ограничений", 10: "До 10", 20: "До 20", 100: "До 100", above100: "Выше 100" }, operationNames: { add: "Сложение +", subtract: "Вычитание −", multiply: "Умножение ×", divide: "Деление ÷", negative: "Отрицательные числа", decimal: "Десятичные дроби", fraction: "Обыкновенные дроби", power: "Степени", root: "Корни" },
      stageNames: ["сложение до 10", "вычитание до 10", "сложение до 20", "вычитание до 20", "вычитание через 10", "счёт до 50", "счёт до 50 с переходом", "счёт до 100", "счёт до 100 с переходом", "счёт до 200", "счёт до 500", "счёт до 1 000", "счёт до 2 000", "счёт до 5 000", "счёт до 10 000"],
      messages: {
        correct: ["Точно!", "Умница!", "Так держать!", "Супер!", "Верно!"],
        streak: ["Вот это серия!", "Три подряд!", "Капи в восторге!", "Ты разогналась!"],
        tryAgain: ["Почти! Смотри подсказку", "Давай ещё раз", "Не спеши — получится"],
        complete: ["Отличная работа!", "Капи гордится тобой!", "Тренировка пройдена!"]
      }
    },
    de: {
      locale: "de-DE", appName: "Rechnen mit Kapi", description: "Adaptives Rechentraining für Kinder – von Addition bis zu Wurzeln.",
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
      sessions: "Trainings", currentLevel: "aktuelle Stufe", correctShort: "Durchschnitt", correctHistory: (correct, total, seconds) => `${correct}/${total} richtig · ${seconds} s`,
      repeat: "Noch einmal üben:", deleteConfirm: "Den gesamten Trainingsverlauf auf diesem Gerät löschen?", leaveConfirm: "Das aktuelle Training beenden?",
      seconds: "s", trainingTool: "Training starten", historyTool: "Trainingsverlauf lesen", levelShort: (level) => `St. ${level}`,
      levelLabel: (level, name) => `Stufe ${level} · ${name}`,
      adaptiveLevel: (name, operator, operand) => `${name} · ${operator}${operand}`,
      adaptiveStep: (operator, operand) => `Neuer Schritt: ${operator}${operand}`,
      adaptiveStage: (name) => `Neue Stufe: ${name}`,
      easierStep: (name) => `Etwas leichter: ${name}`,
      adaptiveAdjusted: "Kapi hat die Schwierigkeit an dein Tempo angepasst",
      subtractionUnlocked: "Addition geschafft – jetzt beginnt die Subtraktion!",
      operationUnlocked: (name) => `Neu freigeschaltet: ${name}`,
      settings: "Einstellungen", settingsHint: "Die Trainingsoptionen werden auf diesem Gerät gespeichert.", language: "Sprache", examples: "Anzahl der Aufgaben", mode: "Modus", automatic: "Automatisch: von leicht zu schwer", range: "Zahlenbereich", operations: "Rechenarten", sound: "Ton", soundEnabled: "Ein", soundDisabled: "Aus", update: "App aktualisieren", updateReady: "Update verfügbar", share: "Ergebnis teilen", shareText: "Probiere „Rechnen mit Kapi“ aus", shareDone: "Fertig", closeSettings: "Einstellungen schließen", genericHint: "Löse die Aufgabe Schritt für Schritt und versuche es noch einmal.", startDescriptionFor: (count) => `${count} kurze Aufgaben. Kapi erhöht die Schwierigkeit Schritt für Schritt.`, correctOfTotal: (count) => `richtig von ${count}`, rangeNames: { auto: "Ohne Begrenzung", 10: "Bis 10", 20: "Bis 20", 100: "Bis 100", above100: "Über 100" }, operationNames: { add: "Addition +", subtract: "Subtraktion −", multiply: "Multiplikation ×", divide: "Division ÷", negative: "Negative Zahlen", decimal: "Dezimalzahlen", fraction: "Brüche", power: "Potenzen", root: "Wurzeln" },
      stageNames: ["Addition bis 10", "Subtraktion bis 10", "einfache Addition bis 20", "Subtraktion bis 20", "Subtraktion über den Zehner", "Rechnen bis 50", "Rechnen bis 50 mit Übergang", "Rechnen bis 100", "Rechnen bis 100 mit Übergang", "Rechnen bis 200", "Rechnen bis 500", "Rechnen bis 1.000", "Rechnen bis 2.000", "Rechnen bis 5.000", "Rechnen bis 10.000"],
      messages: {
        correct: ["Richtig!", "Klasse!", "Weiter so!", "Super!", "Genau!"],
        streak: ["Starke Serie!", "Drei hintereinander!", "Kapi freut sich!", "Du bist im Rechenfluss!"],
        tryAgain: ["Fast! Schau auf den Tipp", "Versuch es noch einmal", "Lass dir Zeit – du schaffst das"],
        complete: ["Klasse gemacht!", "Kapi ist stolz auf dich!", "Training geschafft!"]
      }
    }
  };
  let copy = translations[language];
  let messages = copy.messages;

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
    copy = translations[language];
    messages = copy.messages;
    document.documentElement.lang = language;
    document.title = copy.appName;
    document.querySelector('meta[name="description"]').setAttribute("content", copy.description);
    $("manifestLink").setAttribute("href", `manifest-${language}.webmanifest`);
    $("brandName").textContent = copy.appName;
    $("startEyebrow").textContent = copy.startEyebrow;
    $("startTitle").textContent = copy.startTitle;
    $("startDescription").textContent = copy.startDescriptionFor(TOTAL);
    $("dayStreakLabel").textContent = copy.dayStreak;
    $("totalXpLabel").textContent = copy.totalXp;
    $("startButton").innerHTML = `${copy.start} <span aria-hidden="true">→</span>`;
    $("statsButton").textContent = copy.history;
    $("speechBubble").textContent = copy.speech;
    $("homeStats").setAttribute("aria-label", copy.gameProgress);
    $("homeButton").setAttribute("aria-label", copy.home);
    $("settingsButton").setAttribute("aria-label", copy.settings);
    $("problemLabel").textContent = copy.problem;
    $("streakPill").setAttribute("aria-label", copy.answerStreak);
    $("scorePill").setAttribute("aria-label", copy.xpEarned);
    $("feedback").textContent = copy.careful;
    $("resultEyebrow").textContent = copy.resultEyebrow;
    $("problemTotal").textContent = String(TOTAL);
    $("correctLabel").textContent = copy.correctOfTotal(TOTAL);
    $("averageLabel").textContent = copy.average;
    $("xpLabel").textContent = copy.experience;
    $("againButton").textContent = copy.again;
    $("shareButton").textContent = copy.share;
    $("resultStatsButton").textContent = copy.viewHistory;
    $("updateButton").textContent = copy.updateReady;
    $("parentEyebrow").textContent = copy.forParents;
    $("historyTitle").textContent = copy.history;
    $("closeStatsButton").setAttribute("aria-label", copy.close);
    $("clearStatsButton").textContent = copy.clearHistory;
    $("settingsTitle").textContent = copy.settings;
    $("settingsHint").textContent = copy.settingsHint;
    $("closeSettingsButton").setAttribute("aria-label", copy.closeSettings);
    renderSettingsContent();
    updateSoundButton();
    scheduleFitCheck();
  }

  function loadSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      appSettings.language = value.language === "ru" ? "ru" : "de";
      appSettings.problemCount = [10, 20, 30].includes(Number(value.problemCount)) ? Number(value.problemCount) : 20;
      appSettings.automatic = value.automatic !== false;
      appSettings.range = ["10", "20", "100", "above100"].includes(String(value.range)) ? String(value.range) : "above100";
      appSettings.operations = Array.isArray(value.operations)
        ? OPERATION_ORDER.filter((operation) => value.operations.includes(operation))
        : ["add", "subtract"];
      if (!appSettings.operations.length) appSettings.operations = ["add"];
      appSettings.sound = value.sound !== false;
    } catch { /* Keep defaults. */ }
    language = appSettings.language;
    TOTAL = appSettings.problemCount;
    state.sound = appSettings.sound;
  }

  function saveSettings() {
    appSettings.sound = state.sound;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
  }

  function renderSettingsContent() {
    const content = $("settingsContent");
    if (!content) return;
    content.innerHTML = `
      <fieldset><legend>${copy.language}</legend>
        <label><input type="radio" name="language" value="de" ${language === "de" ? "checked" : ""}> Deutsch</label>
        <label><input type="radio" name="language" value="ru" ${language === "ru" ? "checked" : ""}> Русский</label>
      </fieldset>
      <fieldset><legend>${copy.examples}</legend>
        ${[10, 20, 30].map((count) => `<label><input type="radio" name="problemCount" value="${count}" ${TOTAL === count ? "checked" : ""}> ${count}</label>`).join("")}
      </fieldset>
      <fieldset><legend>${copy.mode}</legend>
        <label class="setting-wide"><input type="checkbox" name="automatic" ${appSettings.automatic ? "checked" : ""}> ${copy.automatic}</label>
      </fieldset>
      <fieldset class="manual-settings${appSettings.automatic ? " settings-disabled" : ""}"><legend>${copy.range}</legend>
        ${[["10", copy.rangeNames[10]], ["20", copy.rangeNames[20]], ["100", copy.rangeNames[100]], ["above100", copy.rangeNames.above100]].map(([value, label]) => `<label><input type="radio" name="range" value="${value}" ${appSettings.range === value ? "checked" : ""} ${appSettings.automatic ? "disabled" : ""}> ${label}</label>`).join("")}
      </fieldset>
      <fieldset class="manual-settings operation-settings${appSettings.automatic ? " settings-disabled" : ""}"><legend>${copy.operations}</legend>
        ${OPERATION_ORDER.map((operation) => `<label><input type="checkbox" name="operation" value="${operation}" ${appSettings.operations.includes(operation) ? "checked" : ""} ${appSettings.automatic ? "disabled" : ""}> ${copy.operationNames[operation]}</label>`).join("")}
      </fieldset>
      <fieldset><legend>${copy.sound}</legend>
        <button class="setting-toggle" id="soundButton" type="button" aria-pressed="${state.sound}">${state.sound ? `🔊 ${copy.soundEnabled}` : `🔇 ${copy.soundDisabled}`}</button>
      </fieldset>`;
  }

  function getProfile() {
    const defaults = {
      totalXp: 0, dayStreak: 0, lastDay: null, currentStage: 1, errorQueue: [],
      adaptiveOperand: 1, adaptiveFastStreak: 0, adaptiveRecentResults: [],
      personalFastTime: null, paceCalibration: [], fasterPaceSamples: [], operationStats: {}
    };
    try {
      const profile = { ...defaults, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
      profile.currentStage = Math.min(15, Math.max(1, Number(profile.currentStage) || 1));
      profile.errorQueue = Array.isArray(profile.errorQueue) ? profile.errorQueue : [];
      profile.adaptiveOperand = Math.min(9, Math.max(1, Number(profile.adaptiveOperand) || 1));
      profile.adaptiveFastStreak = Math.min(2, Math.max(0, Number(profile.adaptiveFastStreak) || 0));
      profile.adaptiveRecentResults = Array.isArray(profile.adaptiveRecentResults)
        ? profile.adaptiveRecentResults.filter((value) => value === 0 || value === 1).slice(-5)
        : [];
      profile.personalFastTime = Number.isFinite(Number(profile.personalFastTime)) && Number(profile.personalFastTime) > 0
        ? Math.min(60, Math.max(.2, Number(profile.personalFastTime)))
        : null;
      profile.paceCalibration = validPaceSamples(profile.paceCalibration);
      profile.fasterPaceSamples = validPaceSamples(profile.fasterPaceSamples);
      profile.operationStats = profile.operationStats && typeof profile.operationStats === "object" ? profile.operationStats : {};
      OPERATION_ORDER.forEach((operation) => {
        const values = Array.isArray(profile.operationStats[operation]) ? profile.operationStats[operation] : [];
        profile.operationStats[operation] = values.filter((value) => value === 0 || value === 1).slice(-10);
      });
      return profile;
    } catch { return defaults; }
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function validPaceSamples(values) {
    return Array.isArray(values)
      ? values.map(Number).filter((value) => Number.isFinite(value) && value >= .2 && value <= 60).slice(-3)
      : [];
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
    if (!button) return;
    button.textContent = state.sound ? `🔊 ${copy.soundEnabled}` : `🔇 ${copy.soundDisabled}`;
    button.setAttribute("aria-pressed", String(state.sound));
    button.setAttribute("aria-label", state.sound ? copy.soundOn : copy.soundOff);
  }

  function showScreen(target) {
    screens.forEach((screen) => screen.classList.toggle("active", screen === target));
    $("homeButton").classList.toggle("hidden", target === $("startScreen"));
    document.body.classList.toggle("game-active", target === $("gameScreen"));
    document.body.classList.toggle("start-active", target === $("startScreen"));
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

  function operationAccuracy(profile, operation) {
    const values = profile.operationStats[operation] || [];
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function operationMastered(profile, operation) {
    const values = profile.operationStats[operation] || [];
    return values.length >= 10 && operationAccuracy(profile, operation) >= .8;
  }

  function activeOperations(profile) {
    const selected = appSettings.automatic ? OPERATION_ORDER : OPERATION_ORDER.filter((operation) => appSettings.operations.includes(operation));
    if (!appSettings.automatic) return selected.length ? selected : ["add"];
    const active = [];
    for (const operation of selected.length ? selected : ["add"]) {
      active.push(operation);
      if (!operationMastered(profile, operation)) break;
    }
    return active;
  }

  function chooseOperation(profile) {
    const operations = activeOperations(profile);
    const weighted = operations.map((operation) => {
      const values = profile.operationStats[operation] || [];
      const errorRate = values.length ? 1 - operationAccuracy(profile, operation) : .65;
      return { operation, weight: 1 + errorRate * 5 };
    });
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * totalWeight;
    for (const item of weighted) {
      cursor -= item.weight;
      if (cursor <= 0) return item.operation;
    }
    return weighted[weighted.length - 1].operation;
  }

  function effectiveMax(stage) {
    const adaptiveMax = stageLimits[Math.min(stageLimits.length, Math.max(1, stage)) - 1];
    if (appSettings.automatic) return adaptiveMax;
    const limits = { "10": 10, "20": 20, "100": 100, above100: 10000 };
    return Math.min(adaptiveMax, limits[appSettings.range] || 10000);
  }

  function makeGeneratedProblem(stage, index, profile) {
    const operation = chooseOperation(profile);
    const max = Math.max(10, effectiveMax(stage));
    const mode = index % 2 === 0 ? "choice" : "input";
    let problem;

    if (operation === "add" || operation === "subtract") problem = makeAddSubtractProblem(operation, stage, max, profile);
    else if (operation === "multiply") problem = makeMultiplicationProblem(max);
    else if (operation === "divide") problem = makeDivisionProblem(max);
    else if (operation === "negative") problem = makeNegativeProblem(max);
    else if (operation === "decimal") problem = makeDecimalProblem(max, operationMastered(profile, "decimal"));
    else if (operation === "fraction") problem = makeFractionProblem(operationMastered(profile, "fraction"));
    else if (operation === "power") problem = makePowerProblem(max, operationMastered(profile, "power"));
    else problem = makeRootProblem(max, operationMastered(profile, "root"));

    problem.operation = operation;
    problem.mode = mode;
    problem.isReview = false;
    problem.key = problem.text.replace(/\s+/g, "");
    return problem;
  }

  function makeAddSubtractProblem(operation, stage, max, profile) {
    let a;
    let b;
    const addition = operation === "add";
    if (stage <= 2) {
      b = Math.min(profile.adaptiveOperand, 9);
      a = addition ? randomInt(1, Math.max(1, 10 - b)) : randomInt(b + 1, 10);
    } else if (stage === 3) {
      if (addition) {
        do { a = randomInt(10, 19); b = randomInt(1, 20 - a); } while (hasCarry(a, b));
      } else {
        if (Math.random() < .35) { a = 10; b = randomInt(1, 9); }
        else do { a = randomInt(11, 20); b = randomInt(1, a - 1); } while (hasBorrow(a, b));
      }
    } else if (stage === 4 || stage === 5) {
      if (addition) do { a = randomInt(3, 9); b = randomInt(2, 9); } while (a + b <= 10 || a + b > 20);
      else do { a = randomInt(11, 20); b = randomInt(2, Math.min(9, a - 1)); } while (stage === 4 ? hasBorrow(a, b) : !hasBorrow(a, b));
    } else {
      const requireTransition = stage === 7 || stage === 9 || stage >= 13;
      const avoidTransition = stage === 6 || stage === 8;
      for (let tries = 0; tries < 200; tries += 1) {
        if (addition) {
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
    const operator = addition ? "+" : "−";
    const answer = addition ? a + b : a - b;
    return { a, b, answer, operator, text: `${a} ${operator} ${b} = ?` };
  }

  function makeMultiplicationProblem(max) {
    const factorLimit = max <= 20 ? 10 : max <= 100 ? 12 : 30;
    let a;
    let b;
    do { a = randomInt(1, factorLimit); b = randomInt(1, factorLimit); } while (a * b > max);
    return { a, b, answer: a * b, operator: "×", text: `${a} × ${b} = ?` };
  }

  function makeDivisionProblem(max) {
    const factorLimit = max <= 20 ? 10 : max <= 100 ? 12 : 30;
    let divisor;
    let answer;
    do { divisor = randomInt(1, factorLimit); answer = randomInt(1, factorLimit); } while (divisor * answer > max);
    const a = divisor * answer;
    return { a, b: divisor, answer, operator: "÷", text: `${a} ÷ ${divisor} = ?` };
  }

  function makeNegativeProblem(max) {
    const limit = Math.min(max, 100);
    const a = randomInt(0, Math.max(1, Math.floor(limit * .7)));
    const b = randomInt(a + 1, limit);
    return { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
  }

  function makeDecimalProblem(max, mastered) {
    const places = mastered && Math.random() < .4 ? 100 : 10;
    const limit = Math.max(10, Math.min(max * places, 10000));
    let left = randomInt(1, Math.max(2, Math.floor(limit * .7)));
    let right = randomInt(1, Math.max(1, limit - left));
    const useSubtract = Math.random() < .45;
    if (useSubtract && right > left) [left, right] = [right, left];
    const answer = Number(((useSubtract ? left - right : left + right) / places).toFixed(2));
    const a = left / places;
    const b = right / places;
    const operator = useSubtract ? "−" : "+";
    return { a, b, answer, operator, answerType: "decimal", text: `${formatProblemNumber(a)} ${operator} ${formatProblemNumber(b)} = ?` };
  }

  function makeFractionProblem(mastered) {
    const denominator = randomInt(3, 10);
    let left = randomInt(1, denominator - 2);
    let right = randomInt(1, denominator - left - 1);
    let operator = "+";
    let numerator;
    let resultDenominator;
    if (mastered && Math.random() < .45) {
      operator = Math.random() < .5 ? "×" : "÷";
      if (operator === "×") {
        numerator = left * right;
        resultDenominator = denominator * denominator;
      } else {
        const rightDenominator = denominator;
        if (left * rightDenominator >= right * denominator) [left, right] = [right, left];
        numerator = left * rightDenominator;
        resultDenominator = denominator * right;
      }
    } else {
      const useSubtract = Math.random() < .4;
      if (useSubtract) {
        operator = "−";
        if (right > left) [left, right] = [right, left];
        numerator = left - right;
      } else numerator = left + right;
      resultDenominator = denominator;
    }
    const answer = normalizeFraction(numerator, resultDenominator);
    return { a: `${left}/${denominator}`, b: `${right}/${denominator}`, answer, operator, answerType: "fraction", text: `${left}/${denominator} ${operator} ${right}/${denominator} = ?` };
  }

  function makePowerProblem(max, mastered) {
    const exponent = mastered && Math.random() < .35 ? 3 : 2;
    const largestBase = Math.max(2, Math.floor(Math.pow(max, 1 / exponent)));
    const base = randomInt(2, Math.min(largestBase, exponent === 2 ? 20 : 10));
    return { a: base, b: exponent, answer: base ** exponent, operator: "^", text: `${base}${exponent === 2 ? "²" : "³"} = ?` };
  }

  function makeRootProblem(max, mastered) {
    const cube = mastered && Math.random() < .3;
    const degree = cube ? 3 : 2;
    const largestRoot = Math.max(2, Math.floor(Math.pow(max, 1 / degree)));
    const answer = randomInt(2, Math.min(largestRoot, cube ? 10 : 20));
    const radicand = answer ** degree;
    return { a: radicand, b: degree, answer, operator: cube ? "∛" : "√", text: `${cube ? "∛" : "√"}${radicand} = ?` };
  }

  function normalizeFraction(numerator, denominator) {
    const divisor = greatestCommonDivisor(Math.abs(numerator), Math.abs(denominator));
    return `${numerator / divisor}/${denominator / divisor}`;
  }

  function greatestCommonDivisor(a, b) {
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function formatProblemNumber(value) {
    return String(Number(value.toFixed(2))).replace(".", language === "de" || language === "ru" ? "," : ".");
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
      return {
        ...review,
        text: review.text || `${review.a} ${review.operator} ${review.b} = ?`,
        operation: review.operation || (review.operator === "+" ? "add" : "subtract"),
        mode: index % 2 === 0 ? "choice" : "input",
        isReview: true
      };
    }
    return makeGeneratedProblem(stage, index, profile);
  }

  function startTraining() {
    TOTAL = appSettings.problemCount;
    $("problemTotal").textContent = String(TOTAL);
    $("correctLabel").textContent = copy.correctOfTotal(TOTAL);
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
    const problemText = state.problem.text;
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
      makeChoices(state.problem).forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button";
        button.textContent = displayAnswer(value, state.problem.answerType);
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
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button class="number-key" type="button" data-key="${digit}">${digit}</button>`).join("")}
          <button class="number-key number-key-action" type="button" data-action="clear" aria-label="${copy.clear}">C</button>
          <button class="number-key" type="button" data-key="0">0</button>
          <button class="number-key number-key-action" type="button" data-action="backspace" aria-label="${copy.backspace}">⌫</button>
        </div>
        <div class="keypad-specials">
          <button class="number-key number-key-special" type="button" data-key="-">−</button>
          <button class="number-key number-key-special" type="button" data-key=",">,</button>
          <button class="number-key number-key-special" type="button" data-key="/">⁄</button>
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
    if (button.dataset.key !== undefined) {
      const key = button.dataset.key;
      if (canAppendKey(state.enteredAnswer, key, state.problem.answerType) && state.enteredAnswer.length < 12) state.enteredAnswer += key;
      updateKeypadDisplay();
      sound("tap");
      if (state.enteredAnswer !== "" && answersEqual(state.enteredAnswer, state.problem.answer, state.problem.answerType)) {
        submitAnswer(state.enteredAnswer);
      }
      return;
    }
    if (button.dataset.action === "clear") state.enteredAnswer = "";
    if (button.dataset.action === "backspace") state.enteredAnswer = state.enteredAnswer.slice(0, -1);
    if (button.dataset.action === "submit" && state.enteredAnswer !== "") {
      submitAnswer(state.enteredAnswer);
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

  function displayAnswer(value, answerType) {
    if (answerType === "decimal") return String(value).replace(".", ",");
    return String(value);
  }

  function canAppendKey(current, key, answerType) {
    if (key === "-") return current === "";
    if (key === ",") return answerType === "decimal" && !current.includes(",") && !current.includes(".");
    if (key === "/") return answerType === "fraction" && current !== "" && current !== "-" && !current.includes("/");
    return true;
  }

  function answersEqual(value, answer, answerType) {
    const raw = String(value).trim().replace(",", ".");
    if (answerType === "fraction") {
      const match = raw.match(/^(-?\d+)\/(\d+)$/);
      if (!match || Number(match[2]) === 0) return false;
      return normalizeFraction(Number(match[1]), Number(match[2])) === String(answer);
    }
    const numeric = Number(raw);
    return Number.isFinite(numeric) && Math.abs(numeric - Number(answer)) < .000001;
  }

  function makeChoices(problem) {
    const answer = problem.answer;
    if (problem.answerType === "fraction") return makeFractionChoices(answer);
    const values = new Set([answer]);
    const absolute = Math.abs(answer);
    const scale = problem.answerType === "decimal" ? .1 : absolute < 20 ? 1 : absolute < 100 ? 5 : absolute < 1000 ? 10 : 100;
    const nearby = [answer - scale, answer + scale, answer - 2 * scale, answer + 2 * scale, answer - 1, answer + 1]
      .map((value) => problem.answerType === "decimal" ? Number(value.toFixed(2)) : value)
      .filter((value) => value >= -10000 && value <= 10000);
    while (values.size < 4 && nearby.length) {
      const i = randomInt(0, nearby.length - 1);
      values.add(nearby.splice(i, 1)[0]);
    }
    while (values.size < 4) values.add(Number((answer + randomInt(1, 6) * scale).toFixed(2)));
    return [...values].sort(() => Math.random() - .5);
  }

  function makeFractionChoices(answer) {
    const [numerator, denominator] = String(answer).split("/").map(Number);
    const values = new Set([answer]);
    [numerator + 1, Math.max(0, numerator - 1), numerator + 2, Math.max(0, numerator - 2)].forEach((value) => values.add(normalizeFraction(value, denominator)));
    let offset = 1;
    while (values.size < 4) {
      values.add(normalizeFraction(numerator, denominator + offset));
      offset += 1;
    }
    return [...values].slice(0, 4).sort(() => Math.random() - .5);
  }

  function submitAnswer(value) {
    if (state.locked) return;
    const elapsed = Math.max(.2, (performance.now() - state.startedAt) / 1000);
    const isCorrect = answersEqual(value, state.problem.answer, state.problem.answerType);
    const operationMessage = state.attempt === 1 && !state.problem.isReview
      ? recordOperationAttempt(state.problem.operation, isCorrect)
      : "";

    if (isCorrect) {
      state.locked = true;
      const pace = getProfile().personalFastTime;
      const fastBonus = pace && elapsed <= pace ? 3 : pace && elapsed <= pace * 1.8 ? 2 : 1;
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
      if (operationMessage || adaptiveMessage) showMotivation(operationMessage || adaptiveMessage, copy.adaptiveAdjusted, advance);
      else if (state.streak > 0 && state.streak % 3 === 0) showMotivation(text, copy.rightInRow(state.streak), advance);
      else window.setTimeout(advance, 850);
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
    $("feedback").textContent = copy.finalAnswer(displayAnswer(state.problem.answer, state.problem.answerType));
    window.setTimeout(advance, 1300);
  }

  function recordResult(success, elapsed, attempt) {
    const item = {
      key: state.problem.key,
      text: state.problem.text,
      a: state.problem.a,
      b: state.problem.b,
      operator: state.problem.operator,
      operation: state.problem.operation,
      answerType: state.problem.answerType,
      answer: state.problem.answer,
      success,
      firstTry: success && attempt === 1,
      seconds: Number(elapsed.toFixed(1)),
      stage: state.stage
    };
    state.results.push(item);
  }

  function recordOperationAttempt(operation, isCorrect) {
    if (!operation) return "";
    const profile = getProfile();
    const wasMastered = operationMastered(profile, operation);
    profile.operationStats[operation] ||= [];
    profile.operationStats[operation].push(isCorrect ? 1 : 0);
    profile.operationStats[operation] = profile.operationStats[operation].slice(-10);
    saveProfile(profile);
    const index = OPERATION_ORDER.indexOf(operation);
    return appSettings.automatic && !wasMastered && operationMastered(profile, operation) && index >= 0 && index < OPERATION_ORDER.length - 1
      ? copy.operationUnlocked(copy.operationNames[OPERATION_ORDER[index + 1]])
      : "";
  }

  function registerProblemError(problem) {
    const profile = getProfile();
    let item = profile.errorQueue.find((entry) => entry.key === problem.key);
    if (!item) {
      item = { key: problem.key, text: problem.text, a: problem.a, b: problem.b, operator: problem.operator, operation: problem.operation, answerType: problem.answerType, answer: problem.answer, correctStreak: 0, lastShown: Date.now() };
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
    if (profile.currentStage <= 2 && (problem.operation === "add" || problem.operation === "subtract")) {
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

    const isFast = isCorrect ? updatePersonalPace(profile, elapsed) : false;
    profile.adaptiveFastStreak = isFast ? profile.adaptiveFastStreak + 1 : 0;
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

    if (profile.currentStage === 1 && !operationMastered(profile, "add")) {
      saveProfile(profile);
      return "";
    }
    if (profile.currentStage === 2 && !operationMastered(profile, "subtract")) {
      saveProfile(profile);
      return "";
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

  function updatePersonalPace(profile, elapsed) {
    if (profile.personalFastTime === null) {
      profile.paceCalibration.push(elapsed);
      profile.paceCalibration = profile.paceCalibration.slice(-3);
      if (profile.paceCalibration.length < 3) return false;
      profile.personalFastTime = median(profile.paceCalibration);
      profile.paceCalibration = [];
      profile.fasterPaceSamples = [];
      return elapsed <= profile.personalFastTime;
    }

    const currentThreshold = profile.personalFastTime;
    if (elapsed < currentThreshold) {
      profile.fasterPaceSamples.push(elapsed);
      profile.fasterPaceSamples = profile.fasterPaceSamples.slice(-3);
      if (profile.fasterPaceSamples.length === 3) {
        const newThreshold = median(profile.fasterPaceSamples);
        if (newThreshold < currentThreshold) profile.personalFastTime = newThreshold;
        profile.fasterPaceSamples = [];
      }
    }
    return elapsed <= currentThreshold;
  }

  function median(values) {
    const sorted = [...values].sort((left, right) => left - right);
    return Number(sorted[Math.floor(sorted.length / 2)].toFixed(2));
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
    const { a, b, operator, operation } = state.problem;
    const hint = $("hint");
    let dots = "";
    if ((operation === "subtract" || operation === "negative") && Number.isInteger(a) && a >= 0 && a <= 20 && b <= a) {
      for (let i = 0; i < a; i += 1) dots += `<span class="counter${i >= a - b ? " removed" : ""}"></span>`;
      hint.innerHTML = `<span>${copy.subtractionHint(a, b)}</span><div class="counter-line" aria-hidden="true">${dots}</div>`;
    } else if (operation === "add" && Number.isInteger(a) && Number.isInteger(b) && a + b <= 20) {
      const firstGroup = Array.from({ length: a }, () => `<span class="counter"></span>`).join("");
      const secondGroup = Array.from({ length: b }, () => `<span class="counter addend-two"></span>`).join("");
      hint.innerHTML = `
        <span>${copy.additionHint(a, b)}</span>
        <div class="addition-groups" aria-label="${copy.additionAria(a, b)}">
          <div class="addend-card"><strong>${a}</strong><div class="addend-dots">${firstGroup}</div></div>
          <span class="hint-plus" aria-hidden="true">+</span>
          <div class="addend-card addend-card-two"><strong>${b}</strong><div class="addend-dots">${secondGroup}</div></div>
        </div>`;
    } else if (operation === "add" || operation === "subtract") {
      hint.innerHTML = `<span>${operator === "+" ? copy.largeAdditionHint(a, b) : copy.largeSubtractionHint(a, b)}</span>`;
    } else {
      hint.innerHTML = `<span>${copy.genericHint}</span>`;
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
    fitFrame = window.requestAnimationFrame(ensureScreenFits);
  }

  function ensureScreenFits() {
    document.body.classList.remove("force-compact", "force-ultra", "start-compact", "start-ultra");
    if ($("startScreen").classList.contains("active")) {
      fitStartScreen();
      return;
    }
    if (!$("gameScreen").classList.contains("active")) return;
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

  function fitStartScreen() {
    const viewportBottom = visibleHeight() - 6;
    const screen = $("startScreen");
    screen.style.removeProperty("--start-fit-scale");
    const isOverflowing = () => {
      const shell = document.querySelector(".app-shell");
      const items = [...screen.querySelectorAll(".start-copy, .mascot-stage, #statsButton")];
      const contentBottom = Math.max(...items.map((item) => item.getBoundingClientRect().bottom));
      return contentBottom > viewportBottom || shell.scrollHeight > visibleHeight() + 1 || screen.scrollHeight > screen.clientHeight + 1;
    };
    if (isOverflowing()) document.body.classList.add("start-compact");
    window.requestAnimationFrame(() => {
      if (!isOverflowing()) return;
      document.body.classList.add("start-ultra");
      window.requestAnimationFrame(() => {
        if (!isOverflowing()) return;
        const children = [...screen.querySelectorAll(":scope > *")];
        const top = Math.min(...children.map((item) => item.getBoundingClientRect().top));
        const bottom = Math.max(...children.map((item) => item.getBoundingClientRect().bottom));
        const available = Math.max(1, viewportBottom - screen.getBoundingClientRect().top);
        const scale = Math.min(1, available / Math.max(1, bottom - top));
        screen.style.setProperty("--start-fit-scale", String(scale));
      });
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
    const canAdvance = state.stage >= 3 && !state.stageAdvancedDuringSession && state.correct / TOTAL >= .9 && profile.errorQueue.length === 0;
    const advanced = canAdvance && profile.currentStage < 15;
    if (advanced) {
      profile.currentStage += 1;
      saveProfile(profile);
    }
    const session = {
      date: new Date().toISOString(),
      correct: state.correct,
      total: TOTAL,
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
      const avgCorrect = history.reduce((sum, item) => sum + (item.correct / (item.total || 20)) * 100, 0) / history.length;
      const commonTrouble = mostCommon(history.flatMap((item) => item.trouble || []));
      content.innerHTML = `
        <div class="summary-stats">
          <div><strong>${history.length}</strong><span>${copy.sessions}</span></div>
          <div><strong>${profile.currentStage}</strong><span>${copy.currentLevel}</span></div>
          <div><strong>${formatNumber(avgCorrect)}%</strong><span>${copy.correctShort}</span></div>
        </div>
        <div class="history-list">${history.slice(0, 10).map((item) => `
          <div class="history-row">
            <strong>${formatDate(item.date)}</strong>
            <span>${copy.correctHistory(item.correct, item.total || 20, formatSeconds(item.average))}</span>
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

  function prettyKey(key) { return key.replace("= ?", "").replace("−", " − ").replace("+", " + ").replace("×", " × ").replace("÷", " ÷ "); }
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

  let motivationTimer = 0;
  let motivationAction = null;

  function showMotivation(title, subtitle, action = null) {
    dismissMotivation(false);
    const pop = $("motivationPop");
    $("motivationText").textContent = title;
    $("motivationSubtext").textContent = subtitle;
    pop.classList.remove("hidden");
    const card = pop.querySelector(".motivation-card");
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
    motivationAction = action;
    motivationTimer = window.setTimeout(() => dismissMotivation(true), 2500);
  }

  function dismissMotivation(continueTraining) {
    if (motivationTimer) window.clearTimeout(motivationTimer);
    motivationTimer = 0;
    $("motivationPop").classList.add("hidden");
    const action = motivationAction;
    motivationAction = null;
    if (continueTraining && action) action();
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

  async function shareResult() {
    const button = $("shareButton");
    button.disabled = true;
    try {
      const blob = await makeShareCard();
      const filename = "kapi-result.png";
      const file = new File([blob], filename, { type: "image/png" });
      const data = { title: copy.appName, text: `${copy.shareText}: ${state.correct}/${TOTAL}`, url: APP_URL };
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ ...data, files: [file] });
      else if (navigator.share) await navigator.share(data);
      else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        await navigator.clipboard?.writeText(APP_URL);
        $("feedback").textContent = copy.shareDone;
      }
    } catch (error) {
      if (error?.name !== "AbortError") window.open(APP_URL, "_blank", "noopener");
    } finally {
      button.disabled = false;
    }
  }

  async function makeShareCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#eafffa");
    gradient.addColorStop(.68, "#cceee8");
    gradient.addColorStop(1, "#fff0a9");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 630);
    context.fillStyle = "rgba(255,255,255,.82)";
    context.beginPath();
    context.roundRect(54, 48, 1092, 534, 42);
    context.fill();
    const mascot = await loadImage("assets/capybara.webp");
    context.drawImage(mascot, 710, 72, 400, 400);
    context.fillStyle = "#0f766e";
    context.font = "900 38px system-ui, sans-serif";
    context.fillText(`★ ${copy.appName}`, 105, 130);
    context.fillStyle = "#17312f";
    context.font = "1000 104px system-ui, sans-serif";
    context.fillText(`${state.correct}/${TOTAL}`, 100, 280);
    context.font = "800 35px system-ui, sans-serif";
    context.fillText(copy.correctOfTotal(TOTAL), 105, 335);
    const average = state.results.length ? state.results.reduce((sum, item) => sum + item.seconds, 0) / state.results.length : 0;
    context.fillStyle = "#627774";
    context.font = "700 30px system-ui, sans-serif";
    context.fillText(`${copy.average}: ${formatSeconds(average)} ${copy.seconds}  •  ${state.score} XP`, 105, 405);
    context.fillStyle = "#0a514d";
    context.font = "800 26px system-ui, sans-serif";
    context.fillText(copy.shareText, 105, 495);
    context.font = "700 22px system-ui, sans-serif";
    context.fillText(APP_URL.replace("https://", ""), 105, 535);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")), "image/png"));
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  function handleSettingsChange(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.name === "language") {
      language = input.value === "ru" ? "ru" : "de";
      appSettings.language = language;
      saveSettings();
      applyLanguage();
      updateHomeStats();
      return;
    }
    if (input.name === "problemCount") {
      TOTAL = Number(input.value);
      appSettings.problemCount = TOTAL;
      saveSettings();
      applyLanguage();
      return;
    }
    if (input.name === "automatic") {
      appSettings.automatic = input.checked;
      saveSettings();
      renderSettingsContent();
      return;
    }
    if (input.name === "range") appSettings.range = input.value;
    if (input.name === "operation") {
      const selected = [...$("settingsContent").querySelectorAll('input[name="operation"]:checked')].map((item) => item.value);
      if (!selected.length) {
        input.checked = true;
        return;
      }
      appSettings.operations = OPERATION_ORDER.filter((operation) => selected.includes(operation));
    }
    saveSettings();
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    let waitingWorker = null;
    let reloading = false;
    const offerUpdate = (worker) => {
      waitingWorker = worker;
      $("updateButton").classList.remove("hidden");
    };
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("sw.js");
        if (registration.waiting) offerUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker);
          });
        });
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update();
        });
      } catch { /* The online app still works without installation. */ }
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
    $("updateButton").addEventListener("click", () => waitingWorker?.postMessage({ type: "SKIP_WAITING" }));
  }

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    try {
      context.registerTool({
        name: "start_arithmetic_training",
        title: copy.trainingTool,
        description: "Starts a new visible adaptive arithmetic training session.",
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
  $("shareButton").addEventListener("click", shareResult);
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
  $("settingsButton").addEventListener("click", () => {
    renderSettingsContent();
    $("settingsDialog").showModal();
  });
  $("closeSettingsButton").addEventListener("click", () => $("settingsDialog").close());
  $("settingsContent").addEventListener("change", handleSettingsChange);
  $("settingsContent").addEventListener("click", (event) => {
    if (event.target.closest("#soundButton")) {
      state.sound = !state.sound;
      saveSettings();
      updateSoundButton();
      if (state.sound) sound("correct");
    }
  });
  $("motivationPop").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dismissMotivation(true);
  });

  loadSettings();
  applyLanguage();
  updateHomeStats();
  document.body.classList.add("start-active");
  registerWebMcp();
  syncViewportSize();
  window.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportSize, { passive: true });
  registerServiceWorker();
})();
