(() => {
  "use strict";

  let TOTAL = 20;
  const HISTORY_KEY = "capy-count-history-v1";
  const SETTINGS_KEY = "capy-count-settings-v1";
  const PROFILE_KEY = "capy-count-profile-v1";
  const INSTALL_DISMISS_KEY = "capy-count-install-dismissed-v1";
  const INSTALLED_KEY = "capy-count-installed-v1";
  let language = "de";
  const APP_URL = "https://schitaem-s-kapi.lsdglider.chatgpt.site";
  const INVITE_URL = `${APP_URL}/?install=1`;
  const UNIVERSAL_FAST_TIME = 4;
  const PERSONAL_RECORD_MIN_RATIO = .10;
  const rewards = new window.KapiRewardSystem();
  const tasks = new window.KapiTaskSystem();
  const curriculumMap = new window.KapiCurriculumMap();
  const weekly = window.KapiWeeklyProgress;
  const skills = window.KapiSkills;
  const mastery = window.KapiMasterySystem;
  const subskills = window.KapiSubskills;
  const sessionPlanner = window.KapiSessionPlanner;
  const OPERATION_ORDER = ["add", "subtract", "multiply", "divide", "negative", "decimal", "fraction", "power", "root"];
  const OPERATION_MIN_STAGE = { add: 2, subtract: 6, multiply: 19, divide: 21, power: 30, fraction: 31, decimal: 34, negative: 36, root: 39 };
  const CURRICULUM_VERSION = 2;
  const CURRICULUM_STAGE_COUNT = 41;
  const MULTIPLICATION_PHASES = [
    { type: "zero" }, { type: "row", factor: 1 }, { type: "row", factor: 2 },
    { type: "row", factor: 10 }, { type: "row", factor: 5 }, { type: "squares" },
    { type: "row", factor: 4 }, { type: "row", factor: 3 }, { type: "row", factor: 9 },
    { type: "row", factor: 6 }, { type: "row", factor: 8 }, { type: "row", factor: 7 }
  ];
  const CORE_DIVISORS = [1, 2, 10, 5];
  const DERIVED_DIVISORS = [4, 3, 9, 6, 8, 7];
  const STAGE_EXAMPLES = ["● ● ●", "3 + 1", "2 + 3", "6 + 4", "4 + 5", "5 − 1", "9 − 3", "6 + 3 / 8 − 4", "10 + 7", "12 + 3", "18 − 4", "8 + 5", "13 − 5", "16 − 7 / 7 + 8", "42 + 10", "34 + 23", "37 + 25", "63 − 27", "3 + 3 + 3", "5 × 2", "12 : 3", "20 : 5", "7 × 8", "42 : 6 / 6 × 7", "340 + 220", "478 − 195", "3 400 + 2 100", "6 302 − 2 748", "48 000 ÷ 600", "7²", "1/4 + 2/4", "2/3 + 1/6", "3/4 × 2/5", "2,4 + 1,7", "3,6 ÷ 0,6", "4 − 9", "−6 × 3", "2⁵", "√144", "∛125", "3³ / √81"];
  const appSettings = { language: "de", problemCount: 20, automatic: true, range: "above100", operations: [...OPERATION_ORDER], manualStage: 1, sound: true, curriculumVersion: CURRICULUM_VERSION };
  const translations = {
    ru: {
      locale: "ru-RU", appName: "Считаем с Капи", description: "Адаптивный тренажёр арифметики для детей — от сложения до корней.",
      startEyebrow: "Уровень 1", startTitle: "Готовы считать?", startDescription: "20 коротких примеров. Капи постепенно повышает сложность.",
      homeSubtitle: "Шаг за шагом с Капи.", homeHistory: "История", homeXp: "XP", homeStage: (stage) => `Ступень ${stage}`,
      dayStreak: "дней подряд", totalXp: "всего XP", start: "Начать тренировку", history: "История занятий", speech: "Hey!",
      homeGreetings: ["Привет! Начнём?", "Поехали!", "Продолжим!", "Рад тебя видеть!"],
      weeklyGoal: "Цель на неделю", thisWeek: "На этой неделе", weeklyZero: "Первое занятие ждёт",
      weeklyCount: (count, goal) => `${count} из ${goal} тренировок`,
      weeklyDone: "Цель недели выполнена!", weeklyExtra: (count) => `${count} тренировок на этой неделе`,
      weeklyOption: (count) => `${count} ${count === 5 ? "тренировок" : "тренировки"}`,
      lastFourWeeks: "за последние 4 недели", learningProgress: "Прогресс в математике", weeklyAndReward: "Большой прогресс!",
      home: "Вернуться в начало", soundOn: "Выключить звук", soundOff: "Включить звук", gameProgress: "Игровой прогресс",
      problem: "Пример", answerStreak: "Серия правильных ответов", xpEarned: "Набранные очки опыта", careful: "Считай внимательно", next: "Следующий пример",
      answer: "Ответ", numberPad: "Цифровая клавиатура", clear: "Очистить", backspace: "Удалить последнюю цифру", check: "Проверить",
      rightInRow: (value) => `${value} верных подряд`, finalAnswer: (value) => `Ответ: ${value}. Запомним!`,
      subtractionHint: (a, b) => `Было ${a}. Зачеркни ${b}. Сколько осталось?`,
      additionHint: (a, b) => `Соедини ${a} и ${b}. Посчитай все кружки.`,
      countHint: "Посчитай кружки.",
      countQuestion: "Сколько кружков?",
      sharingQuestion: (total, groups) => `${total} предметов разделили поровну на ${groups} группы. Сколько в каждой группе?`,
      additionAria: (a, b) => `Первая группа: ${a}. Вторая группа: ${b}.`,
      largeAdditionHint: (a, b) => `Сложи по частям: ${a} + ${b}. Сначала крупные разряды, затем единицы.`,
      largeSubtractionHint: (a, b) => `Вычитай по частям: ${a} − ${b}. Сначала крупные разряды, затем единицы.`,
      resultEyebrow: "Тренировка завершена", correctOf20: "верно из 20", average: "в среднем", experience: "опыта",
      levelUpTitle: "Новый уровень открыт!", completeTitle: "Тренировка завершена!", levelUpNote: (level, name) => `Теперь уровень ${level}: ${name}.`, curriculumComplete: "Весь путь обучения пройден! Капи гордится тобой.",
      curriculumHomeComplete: "Весь путь пройден!",
      stayNote: "Продолжаем этот уровень, пока он не станет уверенным.", maxLevelNote: "Максимальный уровень освоен — продолжаем закреплять счёт до 10 000.", reviewsLeft: (count) => `Примеров для повторения: ${count}.`, again: "Дальше", viewHistory: "Посмотреть историю",
      forParents: "Для родителей", close: "Закрыть", clearHistory: "Удалить историю", emptyHistory: "Здесь появятся результаты после первой тренировки.",
      sessions: "тренировок", currentLevel: "текущий уровень", correctShort: "средний результат", correctHistory: (correct, total, seconds) => `${correct}/${total} верно · ${seconds} с`,
      repeat: "Стоит повторить:", noErrors: "Ни одной ошибки!", deleteConfirm: "Удалить всю историю занятий на этом устройстве?", leaveConfirm: "Закончить текущую тренировку?",
      seconds: "с", trainingTool: "Начать тренировку", historyTool: "Прочитать историю занятий", levelShort: (level) => `Ур. ${level}`,
      levelLabel: (level, name) => `Уровень ${level} · ${name}`,
      adaptiveLevel: (name, operator, operand) => `${name} · ${operator}${operand}`,
      adaptiveStep: (operator, operand) => `Новый шаг: ${operator}${operand}`,
      adaptiveStage: (name) => `Новый уровень: ${name}`,
      easierStep: (name) => `Сделаем чуть легче: ${name}`,
      adaptiveAdjusted: "Капи подстроил сложность под твой темп",
      fastTrack: (name) => `Быстрый переход: ${name}`,
      rewardFlag: "Капи машет флажком!", rewardParty: "Праздник продолжается!", rewardDance: "Время танцевать!", rewardHandshake: "Капи поздравляет тебя!",
      subtractionUnlocked: "Сложение освоено — начинаем вычитание!",
      operationUnlocked: (name) => `Новое действие: ${name}`,
      installKicker: "Приложение Капи", installTitle: "Установить на телефон?", installText: "Капи появится на главном экране и будет открываться без панели браузера.", installNow: "Установить", installHome: "Установить приложение", continueBrowser: "Продолжить в браузере", iosInstallText: "На iPhone нажмите «Поделиться», затем «На экран Домой».",
      settings: "Настройки", settingsHint: "Параметры тренировки сохраняются на этом устройстве.", language: "Язык", examples: "Количество примеров", mode: "Режим", automatic: "Автоматически повышать ступень", automaticHint: "Ступень может повышаться или временно понижаться по результатам. Новые действия добавляются по учебной последовательности.", range: "Максимальный диапазон чисел", operations: "Действия", operationsAutomatic: "Действия открываются автоматически. Отмечены уже доступные на текущей ступени.", startStage: "Стартовая ступень", sound: "Звук", soundEnabled: "Включён", soundDisabled: "Выключен", update: "Обновить приложение", updateReady: "Доступно обновление", share: "Поделиться результатом", shareText: "Попробуйте тренажёр «Считаем с Капи»", shareDone: "Готово", closeSettings: "Закрыть настройки", genericHint: "Разбери пример по шагам и попробуй ещё раз.", startDescriptionFor: () => "Капи постепенно повышает сложность.", correctOfTotal: (count) => `верно из ${count}`, rangeNames: { auto: "Без ограничений", 10: "До 10", 20: "До 20", 100: "До 100", above100: "Выше 100" }, operationNames: { add: "Сложение +", subtract: "Вычитание −", multiply: "Умножение ×", divide: "Деление ÷", negative: "Отрицательные числа", decimal: "Десятичные дроби", fraction: "Обыкновенные дроби", power: "Степени", root: "Корни" },
      settingsCounting: "Настройки счёта", settingsGeneral: "Общие", settingsAbout: "О программе", backToSettings: "Назад к меню", settingsCountingMenu: "Количество примеров, режим, ступень и действия", settingsGeneralMenu: "Язык и звук", settingsAboutMenu: "Описание, автор и обратная связь", chooseStage: "Учебная ступень", stageInfo: "Подробно о ступени", stageBrief: (name, example) => `${name}. Пример: ${example}.`, stageDetail: (stage, name, example) => `Ступень ${stage}: ${name}. Ребёнок выполняет задания только этого типа. Типичный пример: ${example}. При автоматической сложности переход возможен только после освоения предыдущей ступени.`, aboutText: "«Считаем с Капи» — детский тренажёр арифметики от первых чисел до тем 10-го класса. В приложении принята смешанная последовательность, основанная на общих темах немецких учебных программ, но не привязанная к конкретному типу школы или федеральной земле.", feedbackTitle: "Замечания и предложения", feedbackName: "Имя (необязательно)", feedbackMessage: "Сообщение", feedbackPlaceholder: "Что нужно исправить или добавить?", sendWhatsApp: "Открыть WhatsApp", author: "Автор программы", feedbackIntro: "После нажатия откроется WhatsApp с готовым сообщением. Проверьте его и нажмите «Отправить».",
      legacyStageInfo: "Это занятие было записано до перехода на новую шкалу. Подробное описание старой ступени недоступно.",
      multiplicationZero: "Умножение на ноль", multiplicationRow: (factor) => `Таблица на ${factor}`, multiplicationSquares: "Квадраты чисел", multiplicationMixed: "Теперь примеры вперемешку", divisionRow: (divisor) => `Деление на ${divisor}`, divisionMixed: "Теперь деление вперемешку",
      stageNames: ["количества от 0 до 5", "+0 и +1 до 5", "сложение до 5", "состав числа до 10", "сложение до 10", "−1 и −2 до 5", "вычитание до 10", "+ и − до 10", "числа от 11 до 20", "сложение до 20 без перехода", "вычитание до 20 без перехода", "сложение через 10", "вычитание через 10", "+ и − до 20", "шаги 1, 2 и 10 до 100", "счёт до 100 без перехода", "счёт до 100 с переходом", "+ и − до 100", "одинаковые группы", "умножение на 1, 2, 5 и 10", "деление на равные группы", "точное деление", "таблица умножения", "умножение и деление", "счёт до 1 000 без перехода", "счёт до 1 000 с переходом", "счёт до 10 000 без перехода", "счёт до 10 000 с переходом", "четыре действия с большими числами", "квадраты и кубы", "понятие обыкновенной дроби", "сложение и вычитание дробей", "умножение и деление дробей", "сложение и вычитание десятичных дробей", "умножение и деление десятичных дробей", "отрицательные числа", "четыре действия с рациональными числами", "степени с натуральными показателями", "квадратные корни", "кубические корни", "степени и корни"],
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
      homeSubtitle: "Schritt für Schritt mit Kapi.", homeHistory: "Verlauf", homeXp: "XP", homeStage: (stage) => `Stufe ${stage}`,
      dayStreak: "Tage in Folge", totalXp: "XP insgesamt", start: "Training starten", history: "Trainingsverlauf", speech: "Hey!",
      homeGreetings: ["Hallo! Bereit?", "Los geht’s!", "Weiter geht’s!", "Schön, dass du da bist!"],
      weeklyGoal: "Wochenziel", thisWeek: "Diese Woche", weeklyZero: "Erstes Training wartet",
      weeklyCount: (count, goal) => `${count} von ${goal} Trainings`,
      weeklyDone: "Wochenziel geschafft!", weeklyExtra: (count) => `${count} Trainings diese Woche`,
      weeklyOption: (count) => `${count} Trainings`,
      lastFourWeeks: "in den letzten 4 Wochen", learningProgress: "Lernfortschritt", weeklyAndReward: "Großer Fortschritt!",
      home: "Zur Startseite", soundOn: "Ton ausschalten", soundOff: "Ton einschalten", gameProgress: "Spielfortschritt",
      problem: "Aufgabe", answerStreak: "Richtige Antworten in Folge", xpEarned: "Gesammelte Erfahrungspunkte", careful: "Rechne in Ruhe", next: "Nächste Aufgabe",
      answer: "Antwort", numberPad: "Zahlentastatur", clear: "Löschen", backspace: "Letzte Ziffer löschen", check: "Prüfen",
      rightInRow: (value) => `${value} richtige in Folge`, finalAnswer: (value) => `Die Antwort ist ${value}. Das merken wir uns!`,
      subtractionHint: (a, b) => `Es waren ${a}. Streiche ${b} weg. Wie viele bleiben übrig?`,
      additionHint: (a, b) => `Verbinde ${a} und ${b}. Zähle alle Kreise.`,
      countHint: "Zähle die Kreise.",
      countQuestion: "Wie viele Kreise?",
      sharingQuestion: (total, groups) => `${total} Dinge werden gleichmäßig auf ${groups} Gruppen verteilt. Wie viele sind in jeder Gruppe?`,
      additionAria: (a, b) => `Erste Gruppe: ${a}. Zweite Gruppe: ${b}.`,
      largeAdditionHint: (a, b) => `Addiere in Schritten: ${a} + ${b}. Zuerst die großen Stellen, dann die Einer.`,
      largeSubtractionHint: (a, b) => `Subtrahiere in Schritten: ${a} − ${b}. Zuerst die großen Stellen, dann die Einer.`,
      resultEyebrow: "Training beendet", correctOf20: "richtig von 20", average: "im Durchschnitt", experience: "Erfahrung",
      levelUpTitle: "Neue Stufe freigeschaltet!", completeTitle: "Training beendet!", levelUpNote: (level, name) => `Jetzt Stufe ${level}: ${name}.`, curriculumComplete: "Der ganze Lernweg ist geschafft! Kapi ist stolz auf dich.",
      curriculumHomeComplete: "Lernweg geschafft!",
      stayNote: "Wir üben diese Stufe weiter, bis sie sicher sitzt.", maxLevelNote: "Die höchste Stufe ist geschafft – jetzt festigen wir das Rechnen bis 10.000.", reviewsLeft: (count) => `Aufgaben zum Wiederholen: ${count}.`, again: "Weiter", viewHistory: "Verlauf ansehen",
      forParents: "Für Eltern", close: "Schließen", clearHistory: "Verlauf löschen", emptyHistory: "Nach dem ersten Training erscheinen hier die Ergebnisse.",
      sessions: "Trainings", currentLevel: "aktuelle Stufe", correctShort: "Durchschnitt", correctHistory: (correct, total, seconds) => `${correct}/${total} richtig · ${seconds} s`,
      repeat: "Noch einmal üben:", noErrors: "Kein einziger Fehler!", deleteConfirm: "Den gesamten Trainingsverlauf auf diesem Gerät löschen?", leaveConfirm: "Das aktuelle Training beenden?",
      seconds: "s", trainingTool: "Training starten", historyTool: "Trainingsverlauf lesen", levelShort: (level) => `St. ${level}`,
      levelLabel: (level, name) => `Stufe ${level} · ${name}`,
      adaptiveLevel: (name, operator, operand) => `${name} · ${operator}${operand}`,
      adaptiveStep: (operator, operand) => `Neuer Schritt: ${operator}${operand}`,
      adaptiveStage: (name) => `Neue Stufe: ${name}`,
      easierStep: (name) => `Etwas leichter: ${name}`,
      adaptiveAdjusted: "Kapi hat die Schwierigkeit an dein Tempo angepasst",
      fastTrack: (name) => `Schneller Sprung: ${name}`,
      rewardFlag: "Kapi schwenkt die Fahne!", rewardParty: "Die Feier geht weiter!", rewardDance: "Zeit zum Tanzen!", rewardHandshake: "Kapi gratuliert dir!",
      subtractionUnlocked: "Addition geschafft – jetzt beginnt die Subtraktion!",
      operationUnlocked: (name) => `Neu freigeschaltet: ${name}`,
      installKicker: "Kapi-App", installTitle: "Auf dem Handy installieren?", installText: "Kapi erscheint auf dem Startbildschirm und öffnet sich ohne Browserleiste.", installNow: "Installieren", installHome: "App installieren", continueBrowser: "Im Browser fortfahren", iosInstallText: "Tippe auf dem iPhone auf „Teilen“ und dann auf „Zum Home-Bildschirm“.",
      settings: "Einstellungen", settingsHint: "Die Trainingsoptionen werden auf diesem Gerät gespeichert.", language: "Sprache", examples: "Anzahl der Aufgaben", mode: "Modus", automatic: "Lernstufe automatisch erhöhen", automaticHint: "Die Lernstufe kann je nach Ergebnis steigen oder vorübergehend sinken. Neue Rechenarten werden nach der Lernfolge freigeschaltet.", range: "Maximaler Zahlenbereich", operations: "Rechenarten", operationsAutomatic: "Rechenarten werden automatisch freigeschaltet. Markiert sind die auf dieser Lernstufe verfügbaren Arten.", startStage: "Startstufe", sound: "Ton", soundEnabled: "Ein", soundDisabled: "Aus", update: "App aktualisieren", updateReady: "Update verfügbar", share: "Ergebnis teilen", shareText: "Probiere „Rechnen mit Kapi“ aus", shareDone: "Fertig", closeSettings: "Einstellungen schließen", genericHint: "Löse die Aufgabe Schritt für Schritt und versuche es noch einmal.", startDescriptionFor: () => "Kapi erhöht die Schwierigkeit Schritt für Schritt.", correctOfTotal: (count) => `richtig von ${count}`, rangeNames: { auto: "Ohne Begrenzung", 10: "Bis 10", 20: "Bis 20", 100: "Bis 100", above100: "Über 100" }, operationNames: { add: "Addition +", subtract: "Subtraktion −", multiply: "Multiplikation ×", divide: "Division ÷", negative: "Negative Zahlen", decimal: "Dezimalzahlen", fraction: "Brüche", power: "Potenzen", root: "Wurzeln" },
      settingsCounting: "Recheneinstellungen", settingsGeneral: "Allgemein", settingsAbout: "Über die App", backToSettings: "Zurück zum Menü", settingsCountingMenu: "Aufgabenanzahl, Modus, Lernstufe und Rechenarten", settingsGeneralMenu: "Sprache und Ton", settingsAboutMenu: "Beschreibung, Entwickler und Feedback", chooseStage: "Lernstufe", stageInfo: "Details zur Lernstufe", stageBrief: (name, example) => `${name}. Beispiel: ${example}.`, stageDetail: (stage, name, example) => `Stufe ${stage}: ${name}. Das Kind übt ausschließlich Aufgaben dieses Typs. Typisches Beispiel: ${example}. Im automatischen Modus wird diese Stufe erst nach der vorherigen Stufe freigeschaltet.`, aboutText: "„Rechnen mit Kapi“ ist ein Rechentrainer von den ersten Zahlen bis zu Themen der 10. Klasse. Die App verwendet eine gemischte Reihenfolge auf Grundlage gemeinsamer Themen deutscher Lehrpläne, ist aber nicht an eine bestimmte Schulform oder ein Bundesland gebunden.", feedbackTitle: "Hinweise und Vorschläge", feedbackName: "Name (optional)", feedbackMessage: "Nachricht", feedbackPlaceholder: "Was sollen wir verbessern oder ergänzen?", sendWhatsApp: "WhatsApp öffnen", author: "Über den Entwickler", feedbackIntro: "Nach dem Tippen öffnet sich WhatsApp mit einer vorbereiteten Nachricht. Prüfe sie und tippe dort auf „Senden“.",
      legacyStageInfo: "Dieses Training wurde vor der neuen Lernskala gespeichert. Eine genaue Beschreibung der früheren Stufe ist nicht verfügbar.",
      multiplicationZero: "Malnehmen mit null", multiplicationRow: (factor) => `${factor}er-Reihe`, multiplicationSquares: "Quadrataufgaben", multiplicationMixed: "Jetzt kommen gemischte Malaufgaben", divisionRow: (divisor) => `Teilen durch ${divisor}`, divisionMixed: "Jetzt kommen gemischte Geteiltaufgaben",
      stageNames: ["Mengen von 0 bis 5", "+0 und +1 bis 5", "Addition bis 5", "Zahlzerlegung bis 10", "Addition bis 10", "−1 und −2 bis 5", "Subtraktion bis 10", "+ und − bis 10", "Zahlen von 11 bis 20", "Addition bis 20 ohne Übergang", "Subtraktion bis 20 ohne Übergang", "Addition über den Zehner", "Subtraktion über den Zehner", "+ und − bis 20", "Schritte 1, 2 und 10 bis 100", "Rechnen bis 100 ohne Übergang", "Rechnen bis 100 mit Übergang", "+ und − bis 100", "Gleiche Gruppen", "Malnehmen mit 1, 2, 5 und 10", "Teilen in gleiche Gruppen", "Division ohne Rest", "Einmaleins", "Multiplikation und Division", "Rechnen bis 1.000 ohne Übergang", "Rechnen bis 1.000 mit Übergang", "Rechnen bis 10.000 ohne Übergang", "Rechnen bis 10.000 mit Übergang", "Vier Grundrechenarten mit großen Zahlen", "Quadrate und Kubikzahlen", "Gewöhnliche Brüche verstehen", "Brüche addieren und subtrahieren", "Brüche multiplizieren und dividieren", "Dezimalzahlen addieren und subtrahieren", "Dezimalzahlen multiplizieren und dividieren", "Negative Zahlen", "Vier Grundrechenarten mit rationalen Zahlen", "Potenzen mit natürlichen Exponenten", "Quadratwurzeln", "Kubikwurzeln", "Potenzen und Wurzeln"],
      messages: {
        correct: ["Richtig!", "Klasse!", "Weiter so!", "Super!", "Genau!"],
        streak: ["Starke Serie!", "Drei hintereinander!", "Kapi freut sich!", "Du bist im Rechenfluss!"],
        tryAgain: ["Fast! Schau auf den Tipp", "Versuch es noch einmal", "Lass dir Zeit – du schaffst das"],
        complete: ["Klasse gemacht!", "Kapi ist stolz auf dich!", "Training geschafft!"]
      }
    }
  };
  translations.ru.stageNames[8] = "состав чисел 11–20: 10 + n";
  translations.de.stageNames[8] = "Zahlen 11–20 als 10 + n";
  translations.ru.homeMascotAction = "Запустить реакцию Капи";
  translations.de.homeMascotAction = "Kapis Reaktion starten";
  translations.ru.settingsGeneralMenu = "Язык, звук и цель на неделю";
  translations.de.settingsGeneralMenu = "Sprache, Ton und Wochenziel";
  Object.assign(translations.ru, {
    recoveredTitle: "Получилось!", recoveredNote: "Этот пример уже получается.",
    masteredTitle: "Закрепили!", masteredNote: "Два верных повтора — уверенно!",
    perfectTitle: "Ни одной ошибки!", perfectNote: "Всё получилось с первой попытки!",
    completedCount: (count) => `${count} примеров позади!`, demoTitle: "Проверка реакций Капи"
  });
  Object.assign(translations.de, {
    recoveredTitle: "Geschafft!", recoveredNote: "Diese Aufgabe klappt schon.",
    masteredTitle: "Sicher gelöst!", masteredNote: "Zweimal richtig wiederholt!",
    perfectTitle: "Kein einziger Fehler!", perfectNote: "Alles beim ersten Versuch!",
    completedCount: (count) => `${count} Aufgaben geschafft!`, demoTitle: "Kapis Reaktionen testen"
  });
  Object.assign(translations.ru, {
    hintLookAgain: "Посмотри ещё раз внимательно.", hintRemaining: "Что останется?",
    speedImprovedTitle: "Ты считаешь быстрее!", personalRecordTitle: "Новый рекорд!"
  });
  Object.assign(translations.de, {
    hintLookAgain: "Schau noch einmal genau hin.", hintRemaining: "Was bleibt übrig?",
    speedImprovedTitle: "Du wirst schneller!", personalRecordTitle: "Neuer Rekord!"
  });
  Object.assign(translations.de, {
    meinKapi: "Mein Kapi", wardrobeIntro: "Für deinen Fortschritt bekommt Kapi neue Sachen.",
    wardrobeSlots: { hat: "Kopfbedeckung", glasses: "Brille", neck: "Hals", back: "Rücken", badge: "Abzeichen" },
    noItem: "Ohne", selected: "Ausgewählt", unlocked: "Freigeschaltet", locked: (xp) => `🔒 ${xp} XP`,
    xpGoal: (xp, target) => `${xp} / ${target} XP`, nextGoal: (remaining, name) => `Noch ${remaining} XP bis ${name}`,
    firstReward: "Erstes Abzeichen wartet!", allRewards: "Alle Kapi-Sachen freigeschaltet!",
    newThings: (count) => count === 1 ? "Neu für Kapi!" : `${count} neue Sachen für Kapi!`,
    rewardUnlocked: "freigeschaltet", nextTarget: "Nächstes Ziel"
  });
  Object.assign(translations.ru, {
    meinKapi: "Мой Капи", wardrobeIntro: "За твои успехи Капи получает новые вещи.",
    wardrobeSlots: { hat: "Головной убор", glasses: "Очки", neck: "Шея", back: "Спина", badge: "Значок" },
    noItem: "Без предмета", selected: "Выбрано", unlocked: "Открыто", locked: (xp) => `🔒 ${xp} XP`,
    xpGoal: (xp, target) => `${xp} / ${target} XP`, nextGoal: (remaining, name) => `Ещё ${remaining} XP до ${name}`,
    firstReward: "Первый значок уже ждёт!", allRewards: "Все предметы Капи открыты!",
    newThings: (count) => count === 1 ? "Новинка для Капи!" : `${count} новых предмета для Капи!`,
    rewardUnlocked: "открыт", nextTarget: "Следующая цель"
  });
  Object.assign(translations.de, {
    learningPath: "Lernweg", mapIntro: "So wächst dein Können Schritt für Schritt.",
    mapCurrent: "Jetzt", mapCompleted: "Geschafft", mapLocked: "Kommt noch", mapSteps: (step, total) => `${step} von ${total} Schritten`, mapAllComplete: "Alle Kapitel geschafft! Du kannst jederzeit weiter üben.",
    chapterFinished: "Kapitel geschafft!", newChapter: (name) => `Nächstes Kapitel: ${name}`
  });
  Object.assign(translations.ru, {
    learningPath: "Путь обучения", mapIntro: "Шаг за шагом ты узнаёшь больше.",
    mapCurrent: "Сейчас", mapCompleted: "Пройдено", mapLocked: "Впереди", mapSteps: (step, total) => `${step} из ${total} шагов`, mapAllComplete: "Все главы пройдены! Можно продолжать тренироваться.",
    chapterFinished: "Глава пройдена!", newChapter: (name) => `Следующая глава: ${name}`
  });
  translations.ru.homeReactions = {
    flag: ["Ура!", "Вперёд!"],
    party: ["Вот это да!", "Праздник!"],
    dance: ["Танцуем!", "Отлично!"],
    handshake: ["Договорились!", "Мы команда!"]
  };
  translations.de.homeReactions = {
    flag: ["Juhu!", "Los geht's!"],
    party: ["Wow!", "Party!"],
    dance: ["Tanzen!", "Klasse!"],
    handshake: ["Abgemacht!", "Wir sind ein Team!"]
  };
  translations.de.dueAreas = (count) => `Zum Wiederholen: ${count} ${count === 1 ? "Bereich" : "Bereiche"}`;
  translations.ru.dueAreas = (count) => `Скоро повторим: ${count} тем`;
  translations.de.stableAreas = (count) => `Gefestigt: ${count} ${count === 1 ? "Bereich" : "Bereiche"}`;
  translations.ru.stableAreas = (count) => `Закреплено: ${count} тем`;
  translations.de.practiceAreas = (count) => `In Übung: ${count}`;
  translations.ru.practiceAreas = (count) => `Тренируем: ${count}`;
  translations.de.moreAreas = (count) => `+ ${count} weitere`;
  translations.ru.moreAreas = (count) => `+ ещё ${count}`;
  translations.de.mapReinforced = "Gefestigt";
  translations.ru.mapReinforced = "Закреплено";
  Object.assign(translations.de, { targetedPractice: "Gezielt üben", subskillsToPractice: "Noch üben",
    targetedIntro: (name) => `Kapi übt mit dir die ${name}.` });
  Object.assign(translations.ru, { targetedPractice: "Потренировать", subskillsToPractice: "Повторим вместе",
    targetedIntro: (name) => `Капи потренирует с тобой: ${name}.` });
  let copy = translations[language];
  let messages = copy.messages;
  let deferredInstallPrompt = null;
  let installPlatform = "android";
  let settingsSection = "menu";

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
  let kapi = null;
  let motivation = null;
  let soundManager = null;
  let advanceTimer = 0;
  let rewardRevealTimer = 0;
  let rewardGoalTimer = 0;
  let sessionSequence = 0;

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
    $("startDescription").textContent = copy.homeSubtitle;
    $("weeklyLabel").textContent = copy.thisWeek;
    $("totalXpLabel").textContent = copy.homeXp;
    $("startButton").innerHTML = `<span class="home-start-icon" aria-hidden="true">▶</span> ${copy.start}`;
    $("statsButton").textContent = copy.homeHistory;
    $("wardrobeButton").textContent = copy.meinKapi;
    $("mapButton").textContent = copy.learningPath;
    $("mapTitle").textContent = copy.learningPath;
    $("mapIntro").textContent = copy.mapIntro;
    $("closeMapButton").setAttribute("aria-label", copy.close);
    $("wardrobeTitle").textContent = copy.meinKapi;
    $("wardrobeIntro").textContent = copy.wardrobeIntro;
    $("closeWardrobeButton").setAttribute("aria-label", copy.close);
    currentHomeGreeting = copy.homeGreetings[0];
    $("speechBubble").textContent = currentHomeGreeting;
    $("homeMascot").setAttribute("aria-label", copy.homeMascotAction);
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
    $("installKicker").textContent = copy.installKicker;
    $("installTitle").textContent = copy.installTitle;
    $("installText").textContent = installPlatform === "ios" ? copy.iosInstallText : copy.installText;
    $("installButton").textContent = copy.installNow;
    $("installHomeButton").textContent = copy.installHome;
    $("installContinue").textContent = copy.continueBrowser;
    renderSettingsContent();
    if (typeof updateHomeStats === "function") updateHomeStats();
    updateSoundButton();
    scheduleFitCheck();
  }

  function loadSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      appSettings.language = value.language === "ru" ? "ru" : "de";
      appSettings.problemCount = [10, 20, 30].includes(Number(value.problemCount)) ? Number(value.problemCount) : 20;
      const currentCurriculum = value.curriculumVersion === CURRICULUM_VERSION;
      appSettings.automatic = currentCurriculum ? value.automatic !== false : true;
      appSettings.range = currentCurriculum && ["10", "20", "100", "above100"].includes(String(value.range)) ? String(value.range) : "above100";
      appSettings.operations = currentCurriculum && Array.isArray(value.operations)
        ? OPERATION_ORDER.filter((operation) => value.operations.includes(operation))
        : [...OPERATION_ORDER];
      appSettings.manualStage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, Number(value.manualStage) || 1));
      if (!appSettings.operations.length) appSettings.operations = ["add"];
      appSettings.sound = value.sound !== false;
      appSettings.curriculumVersion = CURRICULUM_VERSION;
      if (!appSettings.automatic) syncStageToOperations();
      if (!currentCurriculum) localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
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
    $("settingsHint").hidden = settingsSection !== "menu";
    const items = [
      ["counting", "±", copy.settingsCounting, copy.settingsCountingMenu],
      ["general", "A", copy.settingsGeneral, copy.settingsGeneralMenu],
      ["about", "i", copy.settingsAbout, copy.settingsAboutMenu]
    ];
    if (settingsSection === "menu") {
      content.innerHTML = `<nav class="settings-menu" aria-label="${copy.settings}">
        ${items.map(([key, icon, label, description]) => `<button type="button" data-settings-section="${key}"><span class="settings-menu-icon" aria-hidden="true">${icon}</span><span class="settings-menu-copy"><strong>${label}</strong><small>${description}</small></span><span class="settings-menu-arrow" aria-hidden="true">›</span></button>`).join("")}
      </nav>`;
      return;
    }
    const sectionLabel = items.find(([key]) => key === settingsSection)?.[2] || copy.settings;
    const navigation = `<div class="settings-section-head"><button type="button" data-settings-back><span aria-hidden="true">←</span> ${copy.backToSettings}</button><h3>${sectionLabel}</h3></div>`;
    if (settingsSection === "general") {
      const selectedWeeklyGoal = getProfile().weeklyGoal;
      content.innerHTML = `${navigation}
        <section class="settings-panel">
          <fieldset><legend>${copy.language}</legend>
            <label><input type="radio" name="language" value="de" ${language === "de" ? "checked" : ""}> Deutsch</label>
            <label><input type="radio" name="language" value="ru" ${language === "ru" ? "checked" : ""}> Русский</label>
          </fieldset>
          <fieldset><legend>${copy.sound}</legend>
            <button class="setting-toggle" id="soundButton" type="button" aria-pressed="${state.sound}">${state.sound ? `🔊 ${copy.soundEnabled}` : `🔇 ${copy.soundDisabled}`}</button>
          </fieldset>
          <fieldset><legend>${copy.weeklyGoal}</legend>
            ${weekly.GOALS.map((goal) => `<label><input type="radio" name="weeklyGoal" value="${goal}" ${selectedWeeklyGoal === goal ? "checked" : ""}> ${copy.weeklyOption(goal)}</label>`).join("")}
          </fieldset>
        </section>`;
      return;
    }
    if (settingsSection === "about") {
      content.innerHTML = `${navigation}
        <section class="settings-panel about-panel">
          <p class="about-copy">${copy.aboutText}</p>
          <a class="author-link" href="https://erstellen-websiten.de/ueber-mich" target="_blank" rel="noopener noreferrer">${copy.author} ↗</a>
          <form class="feedback-form" id="feedbackForm">
            <h3>${copy.feedbackTitle}</h3>
            <p>${copy.feedbackIntro}</p>
            <label class="form-field"><span>${copy.feedbackName}</span><input type="text" name="feedbackName" autocomplete="name" maxlength="80"></label>
            <label class="form-field"><span>${copy.feedbackMessage}</span><textarea name="feedbackMessage" rows="5" maxlength="1000" required placeholder="${copy.feedbackPlaceholder}"></textarea></label>
            <button class="feedback-submit" type="submit">${copy.sendWhatsApp}</button>
          </form>
        </section>`;
      return;
    }
    const profile = getProfile();
    const maxStage = maximumAllowedStage();
    const selectableStageCount = appSettings.automatic ? maxStage : CURRICULUM_STAGE_COUNT;
    const selectedStage = Math.min(selectableStageCount, appSettings.automatic ? profile.currentStage : appSettings.manualStage);
    if (appSettings.automatic && profile.currentStage !== selectedStage) {
      profile.currentStage = selectedStage;
      saveProfile(profile);
    }
    appSettings.manualStage = selectedStage;
    const stageIndex = selectedStage - 1;
    content.innerHTML = `${navigation}
      <section class="settings-panel">
        <fieldset><legend>${copy.examples}</legend>
          ${[10, 20, 30].map((count) => `<label><input type="radio" name="problemCount" value="${count}" ${TOTAL === count ? "checked" : ""}> ${count}</label>`).join("")}
        </fieldset>
        <fieldset><legend>${copy.mode}</legend>
          <label class="setting-wide"><input type="checkbox" name="automatic" ${appSettings.automatic ? "checked" : ""}> ${copy.automatic}</label>
          ${appSettings.automatic ? `<p class="settings-note">${copy.automaticHint}</p>` : ""}
        </fieldset>
        <fieldset><legend>${copy.range}</legend>
          ${[["10", copy.rangeNames[10]], ["20", copy.rangeNames[20]], ["100", copy.rangeNames[100]], ["above100", copy.rangeNames.above100]].map(([value, label]) => `<label><input type="radio" name="range" value="${value}" ${appSettings.range === value ? "checked" : ""}> ${label}</label>`).join("")}
        </fieldset>
        <fieldset class="stage-settings"><legend>${appSettings.automatic ? copy.startStage : copy.chooseStage}</legend>
            <select name="manualStage" aria-label="${appSettings.automatic ? copy.startStage : copy.chooseStage}">${Array.from({ length: selectableStageCount }, (_, index) => `<option value="${index + 1}" ${selectedStage === index + 1 ? "selected" : ""}>${index + 1}. ${copy.stageNames[index]}</option>`).join("")}</select>
            <div class="stage-summary"><span>${copy.stageBrief(copy.stageNames[stageIndex], STAGE_EXAMPLES[stageIndex])}</span><details><summary aria-label="${copy.stageInfo}" title="${copy.stageInfo}">i</summary><p>${copy.stageDetail(appSettings.manualStage, copy.stageNames[stageIndex], STAGE_EXAMPLES[stageIndex])}</p></details></div>
        </fieldset>
        <fieldset class="operation-settings"><legend>${copy.operations}</legend>
            ${appSettings.automatic ? `<p class="settings-note">${copy.operationsAutomatic}</p>` : ""}
            ${OPERATION_ORDER.map((operation) => {
              const available = operationAvailableAtStage(operation, selectedStage);
              const checked = appSettings.automatic ? available : appSettings.operations.includes(operation);
              return `<label class="${available ? "" : "operation-locked"}"><input type="checkbox" name="operation" value="${operation}" ${checked ? "checked" : ""} ${(appSettings.automatic || !available) ? "disabled" : ""}> ${copy.operationNames[operation]}</label>`;
            }).join("")}
        </fieldset>
      </section>`;
  }

  function getProfile() {
    const defaults = {
      totalXp: 0, dayStreak: 0, lastDay: null, currentStage: 1, curriculumCompleted: false, errorQueue: [],
      weeklyGoal: 3, weeklySessions: null, weeklyHistory: [], skillMastery: {}, subskillMastery: {},
      adaptiveOperand: 1, adaptiveFastStreak: 0, adaptiveCorrectStreak: 0, adaptiveRecentResults: [],
      personalFastTime: null, bestPersonalFastTime: null, recordMilestoneTime: null,
      paceCalibration: [], fasterPaceSamples: [], accelerationWindow: [], operationStats: {},
      curriculumVersion: CURRICULUM_VERSION, curriculumStats: {},
      multiplicationSequence: { phase: 0, item: 1, mixed: false },
      divisionCoreSequence: { phase: 0, item: 0, mixed: false },
      divisionDerivedSequence: { phase: 0, item: 0, mixed: false }
    };
    try {
      const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      const profile = { ...defaults, ...stored };
      if (stored.curriculumVersion !== CURRICULUM_VERSION) {
        profile.currentStage = 1;
        profile.errorQueue = [];
        profile.adaptiveOperand = 1;
        profile.adaptiveFastStreak = 0;
        profile.adaptiveCorrectStreak = 0;
        profile.adaptiveRecentResults = [];
        profile.accelerationWindow = [];
        profile.operationStats = {};
        profile.curriculumStats = {};
        profile.curriculumVersion = CURRICULUM_VERSION;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      }
      profile.currentStage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, Number(profile.currentStage) || 1));
      profile.curriculumCompleted = profile.curriculumCompleted === true;
      profile.errorQueue = Array.isArray(profile.errorQueue) ? profile.errorQueue : [];
      profile.adaptiveOperand = Math.min(9, Math.max(1, Number(profile.adaptiveOperand) || 1));
      profile.adaptiveFastStreak = Math.min(2, Math.max(0, Number(profile.adaptiveFastStreak) || 0));
      profile.adaptiveCorrectStreak = Math.min(4, Math.max(0, Number(profile.adaptiveCorrectStreak) || 0));
      profile.adaptiveRecentResults = Array.isArray(profile.adaptiveRecentResults)
        ? profile.adaptiveRecentResults.filter((value) => value === 0 || value === 1).slice(-5)
        : [];
      profile.personalFastTime = Number.isFinite(Number(profile.personalFastTime)) && Number(profile.personalFastTime) > 0
        ? Math.min(60, Math.max(UNIVERSAL_FAST_TIME, Number(profile.personalFastTime)))
        : null;
      profile.bestPersonalFastTime = Number.isFinite(Number(profile.bestPersonalFastTime)) && Number(profile.bestPersonalFastTime) > 0
        ? Math.min(60, Math.max(UNIVERSAL_FAST_TIME, Number(profile.bestPersonalFastTime)))
        : profile.personalFastTime;
      if (profile.personalFastTime !== null && profile.bestPersonalFastTime !== null) {
        profile.bestPersonalFastTime = Math.min(profile.bestPersonalFastTime, profile.personalFastTime);
      }
      profile.recordMilestoneTime = Number.isFinite(Number(profile.recordMilestoneTime)) && Number(profile.recordMilestoneTime) > 0
        ? Math.min(60, Math.max(UNIVERSAL_FAST_TIME, Number(profile.recordMilestoneTime)))
        : profile.bestPersonalFastTime;
      if (profile.bestPersonalFastTime !== null && profile.recordMilestoneTime !== null) {
        profile.recordMilestoneTime = Math.max(profile.recordMilestoneTime, profile.bestPersonalFastTime);
      }
      profile.paceCalibration = validPaceSamples(profile.paceCalibration);
      profile.fasterPaceSamples = validPaceSamples(profile.fasterPaceSamples);
      profile.accelerationWindow = Array.isArray(profile.accelerationWindow)
        ? profile.accelerationWindow.filter((item) => item && (item.correct === true || item.correct === false) && Number.isFinite(Number(item.seconds))).slice(-10).map((item) => ({ correct: item.correct, seconds: Math.max(.2, Number(item.seconds)) }))
        : [];
      profile.operationStats = profile.operationStats && typeof profile.operationStats === "object" ? profile.operationStats : {};
      profile.curriculumStats = profile.curriculumStats && typeof profile.curriculumStats === "object" ? profile.curriculumStats : {};
      profile.multiplicationSequence = normalizeLearningSequence(profile.multiplicationSequence, MULTIPLICATION_PHASES.length, 1, 10);
      profile.divisionCoreSequence = normalizeLearningSequence(profile.divisionCoreSequence, CORE_DIVISORS.length, 0, 10);
      profile.divisionDerivedSequence = normalizeLearningSequence(profile.divisionDerivedSequence, DERIVED_DIVISORS.length, 0, 10);
      Object.keys(profile.curriculumStats).forEach((stage) => {
        profile.curriculumStats[stage] = Array.isArray(profile.curriculumStats[stage])
          ? profile.curriculumStats[stage].filter((value) => value === 0 || value === 1).slice(-20)
          : [];
      });
      OPERATION_ORDER.forEach((operation) => {
        const values = Array.isArray(profile.operationStats[operation]) ? profile.operationStats[operation] : [];
        profile.operationStats[operation] = values.filter((value) => value === 0 || value === 1).slice(-10);
      });
      const rewardMigration = rewards.migrate(profile);
      const weeklyMigration = weekly.migrate(profile, getHistory());
      const masteryMigration = mastery.migrate(profile) || !Object.hasOwn(stored, "skillMastery");
      const subskillMigration = subskills.migrate(profile);
      if (rewardMigration || weeklyMigration || masteryMigration || subskillMigration) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return profile;
    } catch { rewards.migrate(defaults); weekly.migrate(defaults); mastery.migrate(defaults); subskills.migrate(defaults); return defaults; }
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function normalizeLearningSequence(value, phaseCount, minimumItem, maximumItem) {
    const sequence = value && typeof value === "object" ? value : {};
    return {
      phase: Math.min(phaseCount - 1, Math.max(0, Number(sequence.phase) || 0)),
      item: Math.min(maximumItem, Math.max(minimumItem, Number.isFinite(Number(sequence.item)) ? Number(sequence.item) : minimumItem)),
      mixed: sequence.mixed === true
    };
  }

  function validPaceSamples(values) {
    return Array.isArray(values)
      ? values.map(Number).filter((value) => Number.isFinite(value) && value >= .2 && value <= 60).slice(-3)
      : [];
  }

  function updateHomeStats() {
    const profile = getProfile();
    updateMascotOutfit(profile);
    const progress = weekly.getWeeklyProgress(profile);
    $("weeklyValue").innerHTML = Array.from({ length: progress.goal }, (_, index) =>
      `<span class="week-star ${index < progress.count ? "filled" : "empty"}" aria-hidden="true"></span>`).join("");
    $("weeklyValue").setAttribute("aria-label", copy.weeklyCount(progress.count, progress.goal));
    $("weeklyDetail").textContent = progress.count === 0 ? copy.weeklyZero : progress.count === progress.goal
      ? copy.weeklyDone : progress.count > progress.goal ? copy.weeklyExtra(progress.count) : copy.weeklyCount(progress.count, progress.goal);
    $("totalXpValue").textContent = String(profile.totalXp);
    renderRewardGoal("home", profile.totalXp);
    const displayStage = appSettings.automatic ? profile.currentStage : Math.min(appSettings.manualStage, maximumAllowedStage());
    const stageName = copy.stageNames[displayStage - 1];
    const completed = profile.curriculumCompleted && profile.currentStage === CURRICULUM_STAGE_COUNT && appSettings.automatic;
    $("startEyebrow").textContent = completed ? copy.curriculumHomeComplete : copy.homeStage(displayStage);
    $("startTitle").textContent = stageName;
    scheduleFitCheck();
  }

  function rewardName(reward) { return reward[language]; }
  function renderRewardGoal(surface, totalXp) {
    const next = rewards.getNextReward(totalXp);
    const prefix = surface === "home" ? "homeReward" : "resultReward";
    $(prefix + "Text").textContent = next.allUnlocked ? copy.allRewards : copy.xpGoal(next.currentXp, next.targetXp);
    $(prefix + "Fill").style.width = `${next.progress * 100}%`;
    $(prefix + "Next").textContent = next.allUnlocked ? "" : next.currentXp === 0 && surface === "home"
      ? copy.firstReward : `${surface === "result" ? `${copy.nextTarget}: ` : ""}${copy.nextGoal(next.remainingXp, rewardName(next.reward))}`;
    if (surface === "home") {
      $("homeRewardPreview").classList.toggle("hidden", next.allUnlocked);
      if (next.reward) $("homeRewardPreview").src = `assets/cosmetics/${next.reward.asset}.svg`;
    }
  }

  function updateMascotOutfit(profile = getProfile()) {
    kapi?.animator?.setOutfit(profile.equippedOutfit, motivation?.getOutfit() || {});
  }

  function renderWardrobe() {
    const profile = getProfile();
    const slots = ["hat", "glasses", "neck", "back", "badge"];
    const visible = new Set(rewards.getRewards().filter((reward) => profile.unlockedRewards.includes(reward.id)).map((reward) => reward.id));
    rewards.getRewards().filter((reward) => !visible.has(reward.id)).slice(0, 3).forEach((reward) => visible.add(reward.id));
    $("wardrobeItems").innerHTML = slots.map((slot) => `<section class="wardrobe-slot"><strong>${copy.wardrobeSlots[slot]}</strong><div class="wardrobe-options">
      <button class="wardrobe-item" type="button" data-unequip="${slot}" aria-pressed="${profile.equippedOutfit[slot] === null}">${copy.noItem}${profile.equippedOutfit[slot] === null ? ` · ${copy.selected}` : ""}</button>
      ${rewards.getRewards().filter((reward) => reward.slot === slot && visible.has(reward.id)).map((reward) => {
        const unlocked = profile.unlockedRewards.includes(reward.id);
        const selected = profile.equippedOutfit[slot] === reward.id;
        return `<button class="wardrobe-item" type="button" data-equip="${reward.id}" aria-label="${rewardName(reward)} · ${unlocked ? selected ? copy.selected : copy.unlocked : copy.locked(reward.xp)}" aria-pressed="${selected}" ${unlocked ? "" : "disabled"}><img src="assets/cosmetics/${reward.asset}.svg" alt=""><span>${rewardName(reward)}</span><small>${unlocked ? selected ? copy.selected : copy.unlocked : copy.locked(reward.xp)}</small></button>`;
      }).join("")}</div></section>`).join("");
  }

  function showWardrobe() {
    renderWardrobe();
    $("wardrobeDialog").showModal();
    kapi?.animator?.play("idle", { surface: "wardrobe" });
  }

  function closeWardrobe() {
    $("wardrobeDialog").close();
    kapi?.animator?.pause("wardrobe");
  }

  function renderCurriculumMap() {
    const profile = getProfile();
    const stage = profile.currentStage;
    const allComplete = profile.curriculumCompleted && stage === CURRICULUM_STAGE_COUNT;
    $("mapIntro").textContent = allComplete ? copy.mapAllComplete : copy.mapIntro;
    $("mapIntro").classList.toggle("map-complete", allComplete);
    $("mapChapters").innerHTML = curriculumMap.chaptersAt(stage, profile.curriculumCompleted).map((chapter) => {
      const status = { completed: copy.mapCompleted, current: copy.mapCurrent, locked: copy.mapLocked }[chapter.status];
      const currentStep = chapter.status === "current" ? `<small>${copy.mapSteps(chapter.step, chapter.total)} · ${copy.stageNames[stage - 1]}</small>` : "";
      const reinforced = chapter.status === "completed" && Array.from({ length: chapter.last - chapter.first + 1 }, (_, index) => chapter.first + index)
        .every((step) => ["secure", "stable"].includes(mastery.getMasteryStatus(profile.skillMastery[mastery.skillIdForProblem({ curriculumStage: step })])))
        ? `<small class="map-mastery">✓ ${copy.mapReinforced}</small>` : "";
      return `<article class="map-chapter ${chapter.status}" aria-label="${chapter[language]}: ${status}">
        <div class="map-marker">${chapter.status === "current" ? '<img src="assets/kapi-rig-v2/head.png" alt="">' : chapter.status === "completed" ? "✓" : "🔒"}</div>
        <div><strong>${chapter[language]}</strong><p>${chapter[language === "de" ? "detailDe" : "detailRu"]}</p>${currentStep}${reinforced}</div>
        <span class="map-status">${status}</span></article>`;
    }).join("");
  }

  function showCurriculumMap() {
    renderCurriculumMap();
    $("mapDialog").showModal();
  }

  function updateSoundButton() {
    const button = $("soundButton");
    if (!button) return;
    button.textContent = state.sound ? `🔊 ${copy.soundEnabled}` : `🔇 ${copy.soundDisabled}`;
    button.setAttribute("aria-pressed", String(state.sound));
    button.setAttribute("aria-label", state.sound ? copy.soundOn : copy.soundOff);
  }

  function showScreen(target) {
    if (target !== $("gameScreen")) window.clearTimeout(advanceTimer);
    if (target !== $("resultScreen")) {
      window.clearTimeout(rewardRevealTimer);
      window.clearTimeout(rewardGoalTimer);
    }
    dismissMotivation();
    soundManager?.stopAll();
    screens.forEach((screen) => screen.classList.toggle("active", screen === target));
    $("homeButton").classList.toggle("hidden", target === $("startScreen"));
    document.body.classList.toggle("game-active", target === $("gameScreen"));
    document.body.classList.toggle("start-active", target === $("startScreen"));
    if (target === $("startScreen")) restartHomeGreeting();
    else if (target === $("gameScreen")) kapi?.setSurface("game", "idle");
    else if (target === $("resultScreen")) {
      kapi?.setSurface("result", "idle");
    }
    scheduleFitCheck();
  }

  let homeReactionLockedUntil = 0;
  let lastHomeReaction = "";
  let homeGreetingIndex = 0;
  let currentHomeGreeting = "";
  const HOME_REACTION_COOLDOWN = 5000;
  const homeReactionScenes = ["flag", "horn", "dance", "levelUp"];

  function clearHomeReaction(restoreSpeech = true) {
    $("speechBubble").classList.remove("is-reacting");
    if (restoreSpeech) $("speechBubble").textContent = currentHomeGreeting;
    if (kapi?.surface === "home") kapi.trigger("idle", { surface: "home" });
  }

  function restartHomeGreeting() {
    if (!kapi) return;
    currentHomeGreeting = copy.homeGreetings[homeGreetingIndex++ % copy.homeGreetings.length];
    $("speechBubble").textContent = currentHomeGreeting;
    $("speechBubble").classList.remove("is-reacting");
    kapi.setSurface("home", "idle");
    kapi.trigger("hey", { surface: "home" });
  }

  function playHomeReaction() {
    soundManager?.unlock();
    if (!$("startScreen").classList.contains("active") || Date.now() < homeReactionLockedUntil) return;
    const candidates = homeReactionScenes.filter((scene) => scene !== lastHomeReaction);
    const scene = pick(candidates);
    lastHomeReaction = scene;
    homeReactionLockedUntil = Date.now() + HOME_REACTION_COOLDOWN;
    const phraseKey = scene === "horn" ? "party" : scene === "levelUp" ? "handshake" : scene;
    const phrases = copy.homeReactions[phraseKey];
    $("speechBubble").textContent = pick(phrases);
    $("speechBubble").classList.add("is-reacting");
    kapi.trigger(scene, { surface: "home", onComplete: () => clearHomeReaction() });
  }

  function speakHomeGreeting() {
    soundManager?.speak(currentHomeGreeting, language === "ru" ? "ru-RU" : "de-DE");
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) { return list[randomInt(0, list.length - 1)]; }

  const stageLimits = [5, 5, 5, 10, 10, 5, 10, 10, 20, 20, 20, 20, 20, 20, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1000, 1000, 10000, 10000, 1000000, 1000, 100, 100, 100, 100, 100, 100, 100, 10000, 400, 1000, 10000];

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

  function curriculumOperationsForStage(stage) {
    if (stage === 1) return ["count"];
    if (stage <= 5 || stage === 9 || stage === 10 || stage === 12) return ["add"];
    if (stage === 6 || stage === 7 || stage === 11 || stage === 13) return ["subtract"];
    if ([8, 14, 15, 16, 17, 18, 25, 26, 27, 28].includes(stage)) return ["add", "subtract"];
    if (stage === 19 || stage === 20 || stage === 23) return ["multiply"];
    if (stage === 21 || stage === 22) return ["divide"];
    if (stage === 24) return ["multiply", "divide"];
    if (stage <= 28) return ["add", "subtract"];
    if (stage === 29) return ["add", "subtract", "multiply", "divide"];
    if (stage === 30 || stage === 38) return ["power"];
    if (stage >= 31 && stage <= 33) return ["fraction"];
    if (stage === 34 || stage === 35) return ["decimal"];
    if (stage === 36 || stage === 37) return ["negative"];
    if (stage === 41) return ["power", "root"];
    return ["root"];
  }

  function activeOperations(profile, requestedStage) {
    const stage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1,
      Number(requestedStage ?? (appSettings.automatic ? profile.currentStage : appSettings.manualStage)) || 1
    ));
    const stageOperations = curriculumOperationsForStage(stage);
    if (appSettings.automatic || stage === 1) return stageOperations;
    const selected = stageOperations.filter((operation) => appSettings.operations.includes(operation));
    return selected.length ? selected : stageOperations.slice(0, 1);
  }

  function effectiveMax(stage) {
    const adaptiveMax = stageLimits[Math.min(stageLimits.length, Math.max(1, stage)) - 1];
    if (appSettings.automatic) return adaptiveMax;
    const limits = { "10": 10, "20": 20, "100": 100, above100: 10000 };
    return Math.min(adaptiveMax, limits[appSettings.range] || 10000);
  }

  function maximumAllowedStage() {
    return ({ "10": 8, "20": 14, "100": 24, above100: CURRICULUM_STAGE_COUNT })[appSettings.range] || CURRICULUM_STAGE_COUNT;
  }

  function operationAvailableAtStage(operation, stage) {
    return stage >= (OPERATION_MIN_STAGE[operation] || 1);
  }

  function nativeOperationForStage(stage) {
    return curriculumOperationsForStage(stage)[0];
  }

  function ensureRangeSupportsStage(stage) {
    const requiredRange = rangeForStage(stage);
    const rank = { "10": 1, "20": 2, "100": 3, above100: 4 };
    if ((rank[appSettings.range] || 0) < rank[requiredRange]) appSettings.range = requiredRange;
  }

  function rangeForStage(stage) {
    return stage <= 8 ? "10" : stage <= 14 ? "20" : stage <= 24 ? "100" : "above100";
  }

  function reconcileOperationsForStage(stage) {
    const stageOperations = new Set(curriculumOperationsForStage(stage));
    appSettings.operations = OPERATION_ORDER.filter((operation) =>
      appSettings.operations.includes(operation) &&
      operationAvailableAtStage(operation, stage) &&
      stageOperations.has(operation)
    );
    if (stage > 1 && !appSettings.operations.length) appSettings.operations = [nativeOperationForStage(stage)];
  }

  function syncStageToOperations() {
    const requiredStage = appSettings.operations.reduce((highest, operation) =>
      Math.max(highest, OPERATION_MIN_STAGE[operation] || 1), 1
    );
    if (appSettings.manualStage < requiredStage) {
      appSettings.manualStage = requiredStage;
      ensureRangeSupportsStage(requiredStage);
    }
    reconcileOperationsForStage(appSettings.manualStage);
  }

  function availableOperationsThroughStage(stage) {
    return OPERATION_ORDER.filter((operation) => operationAvailableAtStage(operation, stage));
  }

  function setAdaptiveStage(profile, stage) {
    const nextStage = Math.min(maximumAllowedStage(), Math.max(1, Number(stage) || 1));
    profile.currentStage = nextStage;
    profile.adaptiveRecentResults = [];
    profile.accelerationWindow = [];
    profile.curriculumStats[String(nextStage)] = [];
    appSettings.manualStage = nextStage;
    if (nextStage === 22) profile.divisionCoreSequence = { phase: 0, item: 0, mixed: false };
    if (nextStage === 23) profile.multiplicationSequence = { phase: 0, item: 1, mixed: false };
    if (nextStage === 24) profile.divisionDerivedSequence = { phase: 0, item: 0, mixed: false };
    saveProfile(profile);
  }

  function promoteToNextRange(profile) {
    if (profile.currentStage >= maximumAllowedStage()) return "";
    profile.currentStage += 1;
    profile.accelerationWindow = [];
    state.stage = profile.currentStage;
    state.stageAdvancedDuringSession = true;
    return copy.adaptiveStage(copy.stageNames[profile.currentStage - 1]);
  }

  function makeGeneratedProblem(stage, index, profile) {
    return makeCurriculumProblem(stage, index, profile);
  }

  function finishProblem(problem, operation, index, curriculumStage = state.stage) {
    problem.operation = operation;
    problem.taskType = "equation";
    problem.mode = index % 2 === 0 ? "choice" : "input";
    problem.isReview = false;
    problem.curriculumStage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, curriculumStage || 1));
    problem.key = `${operation}:${problem.a}:${problem.b}:${problem.answer}:${problem.text}`.replace(/\s+/g, "");
    return problem;
  }

  function makeCurriculumProblem(stage, index, profile) {
    const current = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, stage));
    let a;
    let b;
    let problem;
    let operation = pick(activeOperations(profile, current));
    if (current === 1) {
      const answer = randomInt(0, 5);
      return finishProblem({ a: answer, b: 0, answer, operator: "", text: copy.countQuestion, visualCount: answer }, "count", index, current);
    }
    if (current === 2) {
      operation = "add";
      b = Math.random() < .35 ? 0 : 1;
      a = randomInt(0, 5 - b);
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 3) {
      operation = "add";
      do { a = randomInt(1, 4); b = randomInt(1, 4); } while (a + b > 5);
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 4) {
      operation = "add";
      if (Math.random() < .5) { a = randomInt(1, 5); b = a; }
      else { const total = pick([5, 10]); a = randomInt(1, total - 1); b = total - a; }
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 5) {
      operation = "add";
      do { a = randomInt(2, 8); b = randomInt(2, 8); } while (a + b > 10);
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 6) {
      operation = "subtract";
      b = randomInt(1, 2); a = randomInt(b, 5);
      problem = { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
    } else if (current === 7) {
      operation = "subtract";
      a = randomInt(4, 10); b = randomInt(2, a);
      problem = { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
    } else if (current === 8) {
      if (operation === "add") {
        do { a = randomInt(2, 8); b = randomInt(2, 8); } while (a + b > 10);
        problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
      } else {
        a = randomInt(4, 10); b = randomInt(2, a);
        problem = { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
      }
    } else if (current === 9) {
      operation = "add";
      b = randomInt(1, 9); a = 10;
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 10) {
      operation = "add";
      do { a = randomInt(11, 18); b = randomInt(1, 9); } while (a + b > 20 || hasCarry(a, b));
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 11) {
      operation = "subtract";
      do { a = randomInt(11, 20); b = randomInt(1, 9); } while (b >= a || hasBorrow(a, b));
      problem = { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
    } else if (current === 12) {
      operation = "add";
      do { a = randomInt(3, 9); b = randomInt(2, 9); } while (a + b <= 10 || a + b > 20);
      problem = { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
    } else if (current === 13) {
      operation = "subtract";
      do { a = randomInt(11, 19); b = randomInt(2, 9); } while (!hasBorrow(a, b));
      problem = { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
    } else if (current === 14) {
      const sourceStage = operation === "add" ? pick([10, 12]) : pick([11, 13]);
      return makeCurriculumProblemForStage(sourceStage, index, profile, current);
    } else if (current === 15) {
      const step = pick([1, 2, 10]);
      if (operation === "add") { a = randomInt(20, 100 - step); b = step; }
      else { a = randomInt(20, 100); b = Math.min(step, a); }
      problem = { a, b, answer: operation === "add" ? a + b : a - b, operator: operation === "add" ? "+" : "−", text: `${a} ${operation === "add" ? "+" : "−"} ${b} = ?` };
    } else if (current >= 16 && current <= 18) {
      const transition = current === 17 ? true : current === 16 ? false : Math.random() < .55;
      problem = makePlaceValueProblem(operation, 100, transition);
    } else if (current === 19) {
      const groups = randomInt(2, 5); const size = randomInt(1, 5);
      const text = Array.from({ length: groups }, () => String(size)).join(" + ") + " = ?";
      problem = { a: groups, b: size, answer: groups * size, operator: "+", text, groupCount: groups, groupSize: size, conceptVisual: true };
      operation = "multiply";
    } else if (current === 20) {
      a = pick([1, 2, 5, 10]); b = randomInt(1, 10);
      problem = { a, b, answer: a * b, operator: "×", text: `${a} × ${b} = ?` };
      operation = "multiply";
    } else if (current === 21) {
      const groups = pick([2, 5, 10]); const each = randomInt(1, 10); const total = groups * each;
      problem = { a: total, b: groups, answer: each, operator: ":", text: copy.sharingQuestion(total, groups), groupCount: groups, groupSize: each, conceptVisual: true };
      operation = "divide";
    } else if (current === 22) {
      const sequence = profile.divisionCoreSequence;
      const divisor = sequence.mixed ? pick(CORE_DIVISORS) : CORE_DIVISORS[sequence.phase];
      const answer = sequence.mixed ? randomInt(0, 10) : sequence.item; a = divisor * answer;
      problem = { a, b: divisor, answer, operator: ":", text: `${a} : ${divisor} = ?` };
      operation = "divide";
    } else if (current === 23) {
      const sequence = profile.multiplicationSequence;
      if (sequence.mixed) {
        a = randomInt(0, 10); b = randomInt(0, 10);
      } else {
        const phase = MULTIPLICATION_PHASES[sequence.phase];
        if (phase.type === "zero") { a = sequence.item; b = 0; }
        else if (phase.type === "squares") { a = sequence.item; b = sequence.item; }
        else { a = phase.factor; b = sequence.item; }
      }
      problem = { a, b, answer: a * b, operator: "×", text: `${a} × ${b} = ?` };
      operation = "multiply";
    } else if (current === 24) {
      const sequence = profile.divisionDerivedSequence;
      if (!sequence.mixed) {
        const divisor = DERIVED_DIVISORS[sequence.phase];
        const answer = sequence.item;
        a = divisor * answer;
        b = divisor;
        problem = { a, b, answer, operator: ":", text: `${a} : ${b} = ?` };
        operation = "divide";
      } else if (Math.random() < .5) {
        a = randomInt(2, 10); b = randomInt(2, 10);
        problem = { a, b, answer: a * b, operator: "×", text: `${a} × ${b} = ?` };
        operation = "multiply";
      } else {
        b = randomInt(2, 10); const answer = randomInt(2, 10); a = b * answer;
        problem = { a, b, answer, operator: ":", text: `${a} : ${b} = ?` };
        operation = "divide";
      }
    } else if (current === 29) {
      if (operation === "add" || operation === "subtract") problem = makeAddSubtractProblem(operation, 1000000);
      else if (operation === "multiply") problem = makeMultiplicationProblem(1000000);
      else problem = makeDivisionProblem(1000000);
    } else if (current === 30 || current === 38) {
      operation = "power";
      problem = makePowerProblem(current === 30 ? 1000 : 10000, current === 38);
    } else if (current >= 31 && current <= 33) {
      operation = "fraction";
      // Later fraction operations belong to stage 33, regardless of the
      // accumulated operation score from earlier or later practice.
      problem = makeFractionProblem(current === 33 && operationMastered(profile, "fraction"), current);
    } else if (current >= 34 && current <= 35) {
      operation = "decimal";
      problem = makeDecimalProblem(100, operationMastered(profile, "decimal"), current === 35);
    } else if (current >= 36 && current <= 37) {
      operation = "negative";
      problem = makeNegativeProblem(100, current === 37);
    } else if (current === 39) {
      operation = "root";
      problem = makeRootProblem(400, false, 2);
    } else if (current === 40) {
      operation = "root";
      problem = makeRootProblem(1000, true, 3);
    } else if (current === 41) {
      operation = pick(["power", "root"]);
      problem = operation === "power" ? makePowerProblem(10000, true) : makeRootProblem(10000, true);
    } else {
      const max = current <= 26 ? 1000 : 10000;
      const transition = current === 26 || current === 28;
      problem = makePlaceValueProblem(operation, max, transition);
    }
    return finishProblem(problem, operation, index, current);
  }

  function makeCurriculumProblemForStage(stage, index, profile, curriculumStage = stage) {
    const result = makeCurriculumProblem(stage, index, profile);
    result.curriculumStage = curriculumStage;
    return result;
  }

  function makePlaceValueProblem(operation, max, transition) {
    let a;
    let b;
    const addition = operation === "add";
    for (let tries = 0; tries < 500; tries += 1) {
      if (addition) {
        a = randomInt(Math.max(11, Math.floor(max * .15)), Math.floor(max * .8));
        b = randomInt(2, Math.max(2, max - a));
        if (hasCarry(a, b) === transition) return { a, b, answer: a + b, operator: "+", text: `${a} + ${b} = ?` };
      } else {
        a = randomInt(Math.max(12, Math.floor(max * .25)), max);
        b = randomInt(2, a - 1);
        if (hasBorrow(a, b) === transition) return { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
      }
    }
    return addition
      ? { a: 20, b: 10, answer: 30, operator: "+", text: "20 + 10 = ?" }
      : { a: 30, b: 10, answer: 20, operator: "−", text: "30 − 10 = ?" };
  }

  function makeAddSubtractProblem(operation, max) {
    let a;
    let b;
    const addition = operation === "add";
    if (addition) {
      a = randomInt(Math.max(2, Math.floor(max * .18)), Math.max(3, Math.floor(max * .78)));
      b = randomInt(1, Math.max(1, max - a));
    } else {
      a = randomInt(Math.max(3, Math.floor(max * .35)), max);
      b = randomInt(1, a - 1);
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

  function makeNegativeProblem(max, advanced = false) {
    const limit = Math.min(max, 100);
    if (advanced && Math.random() < .45) {
      const divisor = randomInt(2, 10);
      const answer = randomInt(-10, 10);
      const dividend = divisor * answer;
      return { a: dividend, b: divisor, answer, operator: ":", text: `${dividend} : ${divisor} = ?` };
    }
    if (advanced && Math.random() < .45) {
      const a = randomInt(-10, 10);
      const b = randomInt(-10, 10);
      return { a, b, answer: a * b, operator: "×", text: `${a} × (${b}) = ?` };
    }
    const a = randomInt(0, Math.max(1, Math.floor(limit * .7)));
    const b = randomInt(a + 1, limit);
    return { a, b, answer: a - b, operator: "−", text: `${a} − ${b} = ?` };
  }

  function makeDecimalProblem(max, mastered, advanced = false) {
    const places = mastered && Math.random() < .4 ? 100 : 10;
    if (advanced && Math.random() < .5) {
      const divisor = randomInt(2, 9);
      const answer = randomInt(1, Math.max(2, Math.min(20, Math.floor(max / 10))));
      const dividend = divisor * answer;
      return { a: dividend / 10, b: divisor / 10, answer, operator: "÷", answerType: "decimal", text: `${formatProblemNumber(dividend / 10)} ÷ ${formatProblemNumber(divisor / 10)} = ?` };
    }
    if (advanced) {
      const a = randomInt(1, 20) / 10;
      const b = randomInt(1, 20) / 10;
      const answer = Number((a * b).toFixed(2));
      return { a, b, answer, operator: "×", answerType: "decimal", text: `${formatProblemNumber(a)} × ${formatProblemNumber(b)} = ?` };
    }
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

function makeFractionProblem(mastered, stage = 31) {
  const denominator = randomInt(3, 10);
  let left = randomInt(1, denominator - 2);
  let right = randomInt(1, denominator - left - 1);
  let operator = "+";
  let numerator;
  let resultDenominator;
  if (stage >= 33 || (mastered && Math.random() < .45)) {
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
  } else if (stage >= 32) {
    const rightDenominator = denominator;
    right = randomInt(1, denominator - 1);
    operator = Math.random() < .5 ? "+" : "−";
    if (operator === "−" && right > left) [left, right] = [right, left];
    numerator = left * rightDenominator + (operator === "+" ? right * denominator : -right * denominator);
    resultDenominator = denominator * rightDenominator;
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
    const exponent = mastered ? randomInt(2, 5) : 2;
    const largestBase = Math.max(2, Math.floor(Math.pow(max, 1 / exponent)));
    const base = randomInt(2, Math.min(largestBase, exponent === 2 ? 20 : 10));
    return { a: base, b: exponent, answer: base ** exponent, operator: "^", text: `${base}${exponent === 2 ? "²" : "³"} = ?` };
  }

  function makeRootProblem(max, mastered, degreeOverride = null) {
    const cube = degreeOverride === 3 || (degreeOverride !== 2 && mastered && Math.random() < .3);
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

  function reviewOperation(item) {
    if (item.operation) return item.operation;
    return ({ "+": "add", "−": "subtract", "×": "multiply", "÷": "divide", ":": "divide", "^": "power", "√": "root", "∛": "root" })[item.operator] || null;
  }

  function selectProblem(stage, index) {
    const profile = getProfile();
    if (state.targeted) {
      const focused = subskills.makeProblemForSubskill(state.targeted.skillId, state.targeted.subskillId,
        makeCurriculumProblem, index, profile, state.recentFacts);
      if (!focused) throw new Error(`Cannot generate targeted problem for ${state.targeted.subskillId}`);
      return { ...focused, isTargetedPractice: true };
    }
    const slot = state.sessionPlan?.slots[index] || { type: "current" };
    if (slot.type === "errorReview") {
      const review = profile.errorQueue.find((item) => item.key === slot.key);
      if (!review) return makeGeneratedProblem(stage, index, profile);
      review.lastShown = Date.now();
      saveProfile(profile);
      return {
        ...review,
        text: review.text || `${review.a} ${review.operator} ${review.b} = ?`,
        operation: reviewOperation(review),
        taskType: review.taskType || "equation",
        mode: review.taskType === "chooseExpression" || review.placeValue?.variant === "decompose" ? "choice" : index % 2 === 0 ? "choice" : "input",
        isReview: true, isSpacedReview: false, reviewSkillId: review.reviewSkillId || null
      };
    }
    const skillId = slot.type === "spacedReview" ? slot.skillId : null;
    if (skillId) {
      const reviewStage = skills.stageForSkill(skillId);
      if (reviewStage < stage) {
        const chosen = subskills.selectSubskill(profile, skillId);
        const fresh = chosen && subskills.makeProblemForSubskill(skillId, chosen,
          makeCurriculumProblem, index, profile, state.recentFacts)
          || skills.makeProblemForSkill(skillId, makeCurriculumProblem, index, profile);
        const type = tasks.allowedTypes(reviewStage).includes("missingOperand") && Math.random() < .2 ? "missingOperand" : "equation";
        return { ...tasks.decorate(fresh, null, type), isSpacedReview: true, reviewSkillId: skillId };
      }
    }
    return makeGeneratedProblem(stage, index, profile);
  }

  function planTraining(profile, stage, count, targeted) {
    const allowed = new Set(activeOperations(profile, stage));
    return sessionPlanner.planSession({ profile, settings: appSettings, total: count, currentStage: stage,
      now: new Date(), mode: targeted ? "targeted" : "normal", targeted,
      eligibleError: (item) => {
        const sameStage = item.curriculumStage == null || item.curriculumStage === stage ||
          (item.fromSpacedReview && item.curriculumStage < stage);
        const operation = reviewOperation(item);
        return sameStage && (allowed.has(operation) ||
          (item.fromSpacedReview && (appSettings.automatic || operation === "count")));
      }, eligibleSkill: (id) => {
      const reviewStage = skills.stageForSkill(id);
      return reviewStage < stage && reviewStage <= maximumAllowedStage() &&
        (appSettings.automatic || reviewStage === 1 || curriculumOperationsForStage(reviewStage).some((operation) => allowed.has(operation)));
      } });
  }

  function startTraining(options = {}) {
    window.clearTimeout(advanceTimer);
    window.clearTimeout(rewardRevealTimer);
    window.clearTimeout(rewardGoalTimer);
    soundManager?.unlock();
    motivation?.resetSession();
    dismissMotivation();
    const profile = getProfile();
    const candidate = options?.targetSkillId && skills.getSkill(options.targetSkillId);
    const targetLimit = Math.min(maximumAllowedStage(), appSettings.automatic ? profile.currentStage : Math.max(profile.currentStage, appSettings.manualStage));
    const targeted = candidate && candidate.stage <= targetLimit &&
      (appSettings.automatic || appSettings.operations.includes(skills.getSubskill(options.targetSubskillId)?.operation)) &&
      subskills.availableSubskills(candidate.id, profile).includes(options.targetSubskillId)
      ? { skillId: candidate.id, subskillId: options.targetSubskillId } : null;
    TOTAL = targeted ? 10 : appSettings.problemCount;
    $("problemTotal").textContent = String(TOTAL);
    $("correctLabel").textContent = copy.correctOfTotal(TOTAL);
    const trainingStage = targeted?.skillId ? skills.stageForSkill(targeted.skillId)
      : appSettings.automatic ? profile.currentStage : Math.min(appSettings.manualStage, maximumAllowedStage());
    const sessionPlan = planTraining(profile, trainingStage, TOTAL, targeted);
    Object.assign(state, {
      index: 0, score: 0, correct: 0, streak: 0, stage: trainingStage,
      attempt: 1, problem: null, results: [], locked: false, enteredAnswer: "", stageAdvancedDuringSession: false,
      sessionId: `${Date.now()}-${++sessionSequence}-${Math.random().toString(36).slice(2)}`, finished: false,
      previousTaskType: null, trainingStartStage: trainingStage, trainingStartedCompleted: profile.curriculumCompleted,
      finalMotivationEvents: [], sessionMode: targeted ? "targeted" : "normal", sessionPlan,
      spacedPlan: new Map(sessionPlan.slots.flatMap((slot, index) => slot.type === "spacedReview" ? [[index, slot.skillId]] : [])),
      spacedReviewRecorded: false, targeted, recentFacts: []
    });
    showScreen($("gameScreen"));
    $("feedback").textContent = copy.careful;
    nextProblem();
    sound("start");
  }

  function nextProblem() {
    if (state.index >= TOTAL) return finishTraining();
    state.attempt = 1;
    state.hintLevel = 0;
    state.locked = false;
    state.enteredAnswer = "";
    state.spacedReviewRecorded = false;
    const base = selectProblem(state.stage, state.index);
    state.problem = base.isReview || base.isSpacedReview ? base : tasks.decorate(base, state.previousTaskType);
    state.recentFacts ||= [];
    state.recentFacts.push(state.problem.key);
    state.recentFacts = state.recentFacts.slice(-4);
    state.previousTaskType = state.problem.taskType;
    state.startedAt = performance.now();
    $("problemNumber").textContent = String(state.index + 1);
    $("scoreValue").textContent = String(state.score);
    $("streakValue").textContent = String(state.streak);
    $("streakPill").classList.toggle("hidden", state.streak < 2);
    $("progressFill").style.width = `${(state.index / TOTAL) * 100}%`;
    renderProblem(state.problem);
    $("hint").classList.add("hidden");
    $("hint").innerHTML = "";
    $("feedback").textContent = state.index === 0 && state.targeted
      ? copy.targetedIntro(skills.subskillLabel(state.targeted.subskillId, language))
      : state.index === 0 ? copy.careful : copy.next;
    renderAnswer();
    if ((state.problem.operation === "count" && state.problem.taskType !== "visualCount") || state.problem.conceptVisual) showHint(2);
  }

  function renderProblem(problem) {
    const display = tasks.display(problem, language);
    $("problemText").textContent = display.text;
    $("problemText").classList.toggle("problem-wide", display.text.length > 12 || problem.taskType === "microStory");
    $("problemText").classList.toggle("problem-story", problem.taskType === "microStory");
    $("taskVisual").innerHTML = display.html;
    $("taskVisual").classList.toggle("hidden", !display.html);
    document.querySelector(".play-card").classList.toggle("has-task-visual", !!display.html);
  }

  function renderAnswer() {
    const area = $("answerArea");
    area.innerHTML = "";
    if (state.problem.mode === "choice") {
      const wrap = document.createElement("div");
      wrap.className = state.problem.expressionChoices || state.problem.placeValue?.options ? "choices task-choice-labels" : "choices";
      const labels = tasks.choiceLabels(state.problem, language);
      const values = labels ? labels.map((_, index) => index) : makeChoices({ ...state.problem, answer: tasks.response(state.problem) });
      values.forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button";
        button.textContent = labels ? labels[value] : displayAnswer(value, state.problem.answerType);
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
        ${keypadSpecialKeys(state.problem).length ? `<div class="keypad-specials">
          ${keypadSpecialKeys(state.problem).map(([key, label]) => `<button class="number-key number-key-special" type="button" data-key="${key}">${label}</button>`).join("")}
        </div>` : ""}
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
      if (canAppendKey(state.enteredAnswer, key, state.problem.answerType, state.problem) && state.enteredAnswer.length < 12) state.enteredAnswer += key;
      updateKeypadDisplay();
      sound("tap");
      if (state.enteredAnswer !== "" && answersEqual(state.enteredAnswer, tasks.response(state.problem), state.problem.answerType)) {
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

  function displayProblemResponse(problem) {
    const labels = tasks.choiceLabels(problem, language);
    const response = tasks.response(problem);
    return labels ? labels[response] : displayAnswer(response, problem.answerType);
  }

  function keypadSpecialKeys(problem) {
    const keys = [];
    if (problem?.operation === "negative" || Number(problem?.answer) < 0) keys.push(["-", "−"]);
    if (problem?.answerType === "decimal") keys.push([",", ","]);
    if (problem?.answerType === "fraction") keys.push(["/", "⁄"]);
    return keys;
  }

  function canAppendKey(current, key, answerType, problem = state.problem) {
    const allowed = keypadSpecialKeys(problem).map(([value]) => value);
    if (key === "-") return allowed.includes(key) && current === "";
    if (key === ",") return allowed.includes(key) && answerType === "decimal" && !current.includes(",") && !current.includes(".");
    if (key === "/") return allowed.includes(key) && answerType === "fraction" && current !== "" && current !== "-" && !current.includes("/");
    return /^[0-9]$/.test(key);
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
    if (problem.operation === "count") {
      const values = new Set([answer]);
      [answer - 1, answer + 1, answer - 2, answer + 2, 0, 5].filter((value) => value >= 0 && value <= 5).forEach((value) => values.add(value));
      while (values.size < 4) values.add(randomInt(0, 5));
      return [...values].slice(0, 4).sort(() => Math.random() - .5);
    }
    if (problem.answerType === "fraction") return makeFractionChoices(answer);
    const values = new Set([answer]);
    const absolute = Math.abs(answer);
    const scale = problem.answerType === "decimal" ? .1 : absolute < 20 ? 1 : absolute < 100 ? 5 : absolute < 1000 ? 10 : 100;
    const stage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, Number(problem.curriculumStage || state.stage) || 1));
    const limit = appSettings.automatic ? stageLimits[stage - 1] : effectiveMax(stage);
    const allowNegative = problem.operation === "negative" || Number(answer) < 0;
    const minimum = allowNegative ? -Math.max(10, limit) : 0;
    const maximum = Math.max(Number(answer), limit);
    const nearby = [answer - scale, answer + scale, answer - 2 * scale, answer + 2 * scale, answer - 1, answer + 1]
      .map((value) => problem.answerType === "decimal" ? Number(value.toFixed(2)) : value)
      .filter((value) => value >= minimum && value <= maximum);
    while (values.size < 4 && nearby.length) {
      const i = randomInt(0, nearby.length - 1);
      values.add(nearby.splice(i, 1)[0]);
    }
    let attempts = 0;
    while (values.size < 4 && attempts < 50) {
      const candidate = problem.answerType === "decimal"
        ? Number((minimum + Math.random() * (maximum - minimum)).toFixed(1))
        : randomInt(Math.ceil(minimum), Math.floor(maximum));
      values.add(candidate);
      attempts += 1;
    }
    while (values.size < 4) values.add(Number((answer + values.size * scale).toFixed(2)));
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
    state.paceUpdate = null;
    const elapsed = Math.max(.2, (performance.now() - state.startedAt) / 1000);
    const isCorrect = answersEqual(value, tasks.response(state.problem), state.problem.answerType);
    const operationMessage = state.attempt === 1 && !state.problem.isReview && !state.problem.isSpacedReview && !state.targeted
      ? recordOperationAttempt(state.problem.operation, isCorrect)
      : "";
    if (state.attempt === 1 || isCorrect) {
      const profile = getProfile();
      if (subskills.recordEvidence(profile, state.problem, {
        firstAttempt: state.attempt === 1, correct: isCorrect,
        source: state.targeted ? "targeted" : state.problem.isSpacedReview ? "spaced"
          : state.problem.isReview ? "errorRecovery" : "curriculum"
      })) saveProfile(profile);
    }

    if (isCorrect) {
      if (state.problem.isSpacedReview && !state.spacedReviewRecorded) recordSpacedReview(state.attempt === 1);
      state.locked = true;
      const pace = getProfile().personalFastTime;
      const fastBonus = tasks.isPaceComparableTask(state.problem)
        ? pace && elapsed <= pace ? 3 : pace && elapsed <= pace * 1.8 ? 2 : 1
        : 2;
      const earned = state.attempt === 1 ? fastBonus : 1;
      state.score += earned;
      state.correct += state.attempt === 1 ? 1 : 0;
      state.streak = state.attempt === 1 ? state.streak + 1 : 0;
      const recovery = state.attempt === 1 ? registerCorrectAnswer(state.problem) : "";
      recordResult(true, elapsed, state.attempt);
      const stageBeforeAnswer = state.stage;
      const adaptiveMessage = updateAdaptiveProgress(state.problem, state.attempt === 1, true, elapsed);
      const reachedNewStage = state.stage > stageBeforeAnswer;
      const text = recovery === "errorMastered" ? copy.masteredTitle : recovery === "errorRecovered" ? copy.recoveredTitle : pick(messages.correct);
      $("feedback").textContent = `${text} +${earned} ★`;
      const events = [{ type: "correct" }];
      if (recovery) events.push({ type: recovery });
      if ([3, 6, 10].includes(state.streak)) events.push({ type: "streakMilestone", count: state.streak });
      if (state.paceUpdate?.improved) {
        const subtitle = `${formatNumber(state.paceUpdate.previousThreshold)} s → ${formatNumber(state.paceUpdate.newThreshold)} s`;
        events.push({ type: state.paceUpdate.record ? "personalRecord" : "speedImproved", subtitle });
      }
      if (reachedNewStage) events.push({ type: "levelUp" });
      if (state.index === TOTAL - 1) {
        // Final-answer rewards and completion are selected in one batch.
        state.finalMotivationEvents = events;
      } else {
        motivation.handle(events, { batchId: `answer:${state.index}:${state.attempt}`, notice: operationMessage || adaptiveMessage });
      }
      scheduleAdvance(350);
      return;
    }

    if (state.problem.isSpacedReview && !state.spacedReviewRecorded) recordSpacedReview(false);
    const adaptiveMessage = updateAdaptiveProgress(state.problem, state.attempt === 1, false, elapsed);
    state.streak = 0;
    $("streakPill").classList.add("hidden");
    motivation.handle([{ type: "wrong" }], { batchId: `answer:${state.index}:${state.attempt}` });
    if (state.attempt === 1) {
      registerProblemError(state.problem);
      state.attempt = 2;
      state.hintLevel = 1;
      state.enteredAnswer = "";
      $("feedback").textContent = pick(messages.tryAgain);
      if (adaptiveMessage) showMotivation(adaptiveMessage, copy.adaptiveAdjusted, null, "wrong");
      showHint(1);
      renderAnswer();
      return;
    }

    state.locked = true;
    state.hintLevel = 2;
    recordResult(false, elapsed, 2);
    showHint(2);
    $("feedback").textContent = copy.finalAnswer(displayProblemResponse(state.problem));
    scheduleAdvance(2300);
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
      taskType: state.problem.taskType || "equation",
      success,
      firstTry: success && attempt === 1,
      seconds: Number(elapsed.toFixed(1)),
      stage: state.problem.curriculumStage || state.stage,
      isSpacedReview: state.problem.isSpacedReview === true,
      isTargetedPractice: !!state.targeted
    };
    state.results.push(item);
  }

  function recordSpacedReview(firstTry) {
    const profile = getProfile();
    mastery.recordReviewResult(profile, state.problem.reviewSkillId, firstTry, new Date());
    state.spacedReviewRecorded = true;
    saveProfile(profile);
  }

  function recordOperationAttempt(operation, isCorrect) {
    if (!operation || operation === "count") return "";
    const profile = getProfile();
    const wasMastered = operationMastered(profile, operation);
    profile.operationStats[operation] ||= [];
    profile.operationStats[operation].push(isCorrect ? 1 : 0);
    profile.operationStats[operation] = profile.operationStats[operation].slice(-10);
    saveProfile(profile);
    return "";
  }

  function registerProblemError(problem) {
    const profile = getProfile();
    let item = profile.errorQueue.find((entry) => entry.key === problem.key);
    if (!item) {
      item = { ...problem, isSpacedReview: false, reviewSkillId: problem.isSpacedReview ? problem.reviewSkillId : null,
        curriculumStage: problem.curriculumStage || state.stage, fromSpacedReview: problem.isSpacedReview === true,
        correctStreak: 0, lastShown: Date.now() };
      profile.errorQueue.push(item);
    } else {
      item.correctStreak = 0;
      item.lastShown = Date.now();
      if (problem.isSpacedReview) {
        item.fromSpacedReview = true;
        item.reviewSkillId = problem.reviewSkillId;
      }
    }
    saveProfile(profile);
  }

  function updateAdaptiveProgress(problem, isFirstAttempt, isCorrect, elapsed) {
    if (problem.isSpacedReview || problem.isReview || state.targeted) return "";
    const profile = getProfile();
    const structured = updateStructuredOperationProgress(profile, problem, isFirstAttempt, isCorrect);
    if (structured.handled) {
      if (isCorrect && isFirstAttempt && !problem.isReview && tasks.isPaceComparableTask(problem)) state.paceUpdate = updatePersonalPace(profile, elapsed);
      saveProfile(profile);
      return structured.message;
    }
    if (!isFirstAttempt) return "";
    if (!appSettings.automatic) {
      if (isCorrect && tasks.isPaceComparableTask(problem)) state.paceUpdate = updatePersonalPace(profile, elapsed);
      saveProfile(profile);
      return "";
    }
    // Reading a story is not evidence for lowering arithmetic difficulty.
    if (problem.taskType === "microStory") return "";
    const stageKey = String(profile.currentStage);
    profile.curriculumStats[stageKey] ||= [];
    profile.curriculumStats[stageKey].push(isCorrect ? 1 : 0);
    profile.curriculumStats[stageKey] = profile.curriculumStats[stageKey].slice(-20);
    profile.adaptiveRecentResults.push(isCorrect ? 1 : 0);
    profile.adaptiveRecentResults = profile.adaptiveRecentResults.slice(-5);
    if (isCorrect && tasks.isPaceComparableTask(problem)) state.paceUpdate = updatePersonalPace(profile, elapsed);

    const recentFive = profile.adaptiveRecentResults;
    const errorCount = recentFive.filter((value) => value === 0).length;
    if (recentFive.length === 5 && errorCount / recentFive.length > .2 && profile.currentStage > 1) {
      profile.currentStage -= 1;
      profile.adaptiveRecentResults = [];
      profile.accelerationWindow = [];
      profile.curriculumStats[String(profile.currentStage)] = [];
      state.stage = profile.currentStage;
      saveProfile(profile);
      return copy.easierStep(copy.stageNames[profile.currentStage - 1]);
    }

    const lastTen = profile.curriculumStats[stageKey].slice(-10);
    const accuracy = lastTen.length ? lastTen.reduce((sum, value) => sum + value, 0) / lastTen.length : 0;
    const pendingCurrentErrors = profile.errorQueue.some((item) => item.curriculumStage === profile.currentStage);
    if (lastTen.length < 10 || accuracy < .9 || pendingCurrentErrors) {
      saveProfile(profile);
      return "";
    }
    mastery.markStageMastered(profile, profile.currentStage, new Date());
    if (profile.currentStage === CURRICULUM_STAGE_COUNT && !profile.curriculumCompleted) {
      profile.curriculumCompleted = true;
      saveProfile(profile);
      return copy.curriculumComplete;
    }
    if (profile.currentStage >= maximumAllowedStage()) {
      saveProfile(profile);
      return "";
    }

    profile.currentStage += 1;
    profile.adaptiveRecentResults = [];
    profile.accelerationWindow = [];
    state.stage = profile.currentStage;
    state.stageAdvancedDuringSession = true;
    saveProfile(profile);
    return copy.adaptiveStage(copy.stageNames[profile.currentStage - 1]);
  }

  function updateStructuredOperationProgress(profile, problem, isFirstAttempt, isCorrect) {
    if (state.stage === 23 && !profile.multiplicationSequence.mixed) {
      if (!isFirstAttempt || !isCorrect || !matchesMultiplicationSequence(problem, profile.multiplicationSequence)) return { handled: true, message: "" };
      return { handled: true, message: advanceMultiplicationSequence(profile.multiplicationSequence) };
    }
    if (state.stage === 22 && !profile.divisionCoreSequence.mixed) {
      if (!isFirstAttempt || !isCorrect || !matchesDivisionSequence(problem, profile.divisionCoreSequence, CORE_DIVISORS)) return { handled: true, message: "" };
      return { handled: true, message: advanceDivisionSequence(profile.divisionCoreSequence, CORE_DIVISORS) };
    }
    if (state.stage === 24 && !profile.divisionDerivedSequence.mixed) {
      if (!isFirstAttempt || !isCorrect || !matchesDivisionSequence(problem, profile.divisionDerivedSequence, DERIVED_DIVISORS)) return { handled: true, message: "" };
      return { handled: true, message: advanceDivisionSequence(profile.divisionDerivedSequence, DERIVED_DIVISORS) };
    }
    return { handled: false, message: "" };
  }

  function matchesMultiplicationSequence(problem, sequence) {
    const phase = MULTIPLICATION_PHASES[sequence.phase];
    if (!phase || problem.operation !== "multiply") return false;
    if (phase.type === "zero") return problem.a === sequence.item && problem.b === 0;
    if (phase.type === "squares") return problem.a === sequence.item && problem.b === sequence.item;
    return problem.a === phase.factor && problem.b === sequence.item;
  }

  function advanceMultiplicationSequence(sequence) {
    const phase = MULTIPLICATION_PHASES[sequence.phase];
    const maximum = 10;
    sequence.item += 1;
    if (sequence.item <= maximum) return "";
    sequence.phase += 1;
    if (sequence.phase >= MULTIPLICATION_PHASES.length) {
      sequence.phase = MULTIPLICATION_PHASES.length - 1;
      sequence.item = maximum;
      sequence.mixed = true;
      return copy.multiplicationMixed;
    }
    const next = MULTIPLICATION_PHASES[sequence.phase];
    sequence.item = next.type === "squares" ? 2 : 1;
    if (next.type === "zero") return copy.multiplicationZero;
    if (next.type === "squares") return copy.multiplicationSquares;
    return copy.multiplicationRow(next.factor);
  }

  function matchesDivisionSequence(problem, sequence, divisors) {
    const divisor = divisors[sequence.phase];
    return problem.operation === "divide" && problem.b === divisor && problem.answer === sequence.item && problem.a === divisor * sequence.item;
  }

  function advanceDivisionSequence(sequence, divisors) {
    sequence.item += 1;
    if (sequence.item <= 10) return "";
    sequence.phase += 1;
    if (sequence.phase >= divisors.length) {
      sequence.phase = divisors.length - 1;
      sequence.item = 10;
      sequence.mixed = true;
      return copy.divisionMixed;
    }
    sequence.item = 0;
    return copy.divisionRow(divisors[sequence.phase]);
  }

  function updatePersonalPace(profile, elapsed) {
    if (profile.personalFastTime === null) {
      profile.paceCalibration.push(elapsed);
      profile.paceCalibration = profile.paceCalibration.slice(-3);
      if (profile.paceCalibration.length < 3) return { fast: false, improved: false, record: false };
      profile.personalFastTime = Math.max(UNIVERSAL_FAST_TIME, median(profile.paceCalibration));
      profile.bestPersonalFastTime = Math.min(profile.bestPersonalFastTime ?? Infinity, profile.personalFastTime);
      profile.recordMilestoneTime ??= profile.bestPersonalFastTime;
      profile.paceCalibration = [];
      profile.fasterPaceSamples = [];
      return { fast: isPersonallyFast(elapsed, profile.personalFastTime), improved: false, record: false };
    }

    const currentThreshold = profile.personalFastTime;
    let improved = false;
    let record = false;
    if (elapsed < currentThreshold) {
      profile.fasterPaceSamples.push(elapsed);
      profile.fasterPaceSamples = profile.fasterPaceSamples.slice(-3);
      if (profile.fasterPaceSamples.length === 3) {
        const newThreshold = Math.max(UNIVERSAL_FAST_TIME, median(profile.fasterPaceSamples));
        if (newThreshold < currentThreshold) {
          profile.personalFastTime = newThreshold;
          improved = true;
          profile.bestPersonalFastTime = Math.min(profile.bestPersonalFastTime ?? Infinity, newThreshold);
          // Celebrate a meaningful cumulative gain, not every new hundredth of a second.
          const previousMilestone = profile.recordMilestoneTime ?? currentThreshold;
          if (newThreshold <= previousMilestone * (1 - PERSONAL_RECORD_MIN_RATIO)) {
            profile.recordMilestoneTime = newThreshold;
            record = true;
          }
        }
        profile.fasterPaceSamples = [];
      }
    }
    return { fast: isPersonallyFast(elapsed, currentThreshold), improved, record,
      previousThreshold: currentThreshold, newThreshold: profile.personalFastTime };
  }

  function isPersonallyFast(elapsed, personalThreshold) {
    return personalThreshold <= UNIVERSAL_FAST_TIME
      ? elapsed < UNIVERSAL_FAST_TIME
      : elapsed <= personalThreshold;
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
    if (!item) return "";
    item.correctStreak = (item.correctStreak || 0) + 1;
    item.lastShown = Date.now();
    if (item.correctStreak >= 2) profile.errorQueue = profile.errorQueue.filter((entry) => entry.key !== problem.key);
    saveProfile(profile);
    return item.correctStreak >= 2 ? "errorMastered" : "errorRecovered";
  }

  function scheduleAdvance(delay) {
    window.clearTimeout(advanceTimer);
    const problem = state.problem;
    advanceTimer = window.setTimeout(() => {
      if (state.problem === problem && state.locked && $("gameScreen").classList.contains("active")) advance();
    }, delay);
  }

  function advance() {
    state.index += 1;
    nextProblem();
  }

  function showHint(level = state.hintLevel) {
    const { a, b, operator, operation } = state.problem;
    const hint = $("hint");
    if (level === 0) { hint.classList.add("hidden"); hint.innerHTML = ""; return; }
    const taskHint = tasks.hint(state.problem, level, language);
    if (taskHint) {
      if (level === 1) hint.textContent = taskHint.text;
      else hint.innerHTML = `<span>${taskHint.text}</span>${taskHint.html}`;
      hint.classList.remove("hidden");
      scheduleFitCheck();
      return;
    }
    if (level === 1) {
      hint.textContent = operation === "subtract" ? copy.hintRemaining : copy.hintLookAgain;
      hint.classList.remove("hidden");
      scheduleFitCheck();
      return;
    }
    let dots = "";
    if (operation === "count") {
      for (let i = 0; i < state.problem.visualCount; i += 1) dots += `<span class="counter"></span>`;
      hint.innerHTML = `<span>${copy.countHint}</span><div class="counter-line" aria-hidden="true">${dots}</div>`;
    } else if (state.problem.conceptVisual && state.problem.groupCount && state.problem.groupSize) {
      const groups = Array.from({ length: state.problem.groupCount }, () => `<div class="addend-card"><div class="addend-dots">${Array.from({ length: state.problem.groupSize }, () => `<span class="counter"></span>`).join("")}</div></div>`).join("");
      hint.innerHTML = `<span>${operation === "divide" ? copy.sharingQuestion(a, b) : copy.genericHint}</span><div class="addition-groups concept-groups" aria-hidden="true">${groups}</div>`;
    } else if ((operation === "subtract" || operation === "negative") && Number.isInteger(a) && a >= 0 && a <= 20 && b <= a) {
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
    const offsetTop = Math.round(window.visualViewport?.offsetTop || 0);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    document.documentElement.style.setProperty("--visual-top", `${offsetTop}px`);
    scheduleFitCheck();
  }

  function keepSettingsFieldVisible(target) {
    if (!(target instanceof HTMLElement) || !target.closest("#feedbackForm")) return;
    const reveal = () => target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    window.requestAnimationFrame(reveal);
    window.setTimeout(reveal, 260);
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
      const items = [...screen.querySelectorAll(".start-copy, .mascot-stage, #mapButton")];
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

  function finishTraining() {
    if (state.finished) return;
    state.finished = true;
    const perfect = state.results.length === TOTAL && state.results.every((item) => item.firstTry);
    const average = state.results.length
      ? state.results.reduce((sum, item) => sum + item.seconds, 0) / state.results.length
      : 0;
    const profile = getProfile();
    const advanced = state.stageAdvancedDuringSession;
    const session = {
      id: state.sessionId || `${Date.now()}-${++sessionSequence}`,
      date: new Date().toISOString(),
      completed: state.results.length === TOTAL,
      correct: state.correct,
      total: TOTAL,
      average: Number(average.toFixed(1)),
      score: state.score,
      taskTypeStats: state.results.reduce((counts, result) => {
        const type = result.taskType || "equation";
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      }, {}),
      stage: state.stage,
      stageStart: state.trainingStartStage || state.stage,
      stageEnd: getProfile().currentStage,
      curriculumVersion: CURRICULUM_VERSION,
      advanced,
      perfect,
      trouble: state.results.filter((item) => !item.firstTry).map((item) => item.key).slice(0, 5)
    };
    const { unlocked, weeklyGoalComplete } = saveSession(session);
    $("correctValue").textContent = String(state.correct);
    $("averageValue").textContent = `${formatSeconds(average)} ${copy.seconds}`;
    $("starsValue").textContent = `${state.score} XP`;
    $("resultTitle").textContent = perfect ? copy.perfectTitle : copy.completeTitle;
    const freshProfile = getProfile();
    const chapterBefore = curriculumMap.chapterForStage(state.trainingStartStage);
    const chapterAfter = curriculumMap.chapterForStage(freshProfile.currentStage);
    $("resultNote").textContent = freshProfile.curriculumCompleted && !state.trainingStartedCompleted ? copy.curriculumComplete : advanced
      ? copy.levelUpNote(freshProfile.currentStage, copy.stageNames[freshProfile.currentStage - 1])
      : `${freshProfile.curriculumCompleted && freshProfile.currentStage === CURRICULUM_STAGE_COUNT ? copy.maxLevelNote : copy.stayNote}${freshProfile.errorQueue.length ? ` ${copy.reviewsLeft(freshProfile.errorQueue.length)}` : ""}`;
    if (advanced && chapterBefore?.id !== chapterAfter?.id && chapterAfter) {
      $("resultNote").textContent += ` ${copy.chapterFinished} ${copy.newChapter(chapterAfter[language])}`;
    }
    renderRewardGoal("result", freshProfile.totalXp);
    $("resultRewardProgress").classList.toggle("hidden", unlocked.length > 0);
    $("weeklyResult").classList.add("hidden");
    $("weeklyResult").textContent = "";
    $("rewardReveal").classList.add("hidden");
    $("rewardReveal").innerHTML = "";
    $("progressFill").style.width = "100%";
    showScreen($("resultScreen"));
    const events = [...(state.finalMotivationEvents || []), { type: "trainingComplete", total: TOTAL }];
    if (perfect) events.push({ type: "perfectTraining", total: TOTAL });
    motivation.handle(events, { batchId: "completion", surface: "result" });
    if (unlocked.length || weeklyGoalComplete) {
      rewardRevealTimer = window.setTimeout(() => {
        if (!$("resultScreen").classList.contains("active")) return;
        dismissMotivation();
        const earned = unlocked.map((event) => rewards.getRewards().find((reward) => reward.id === event.rewardId));
        const profile = getProfile();
        for (const reward of earned) {
          if (profile.equippedOutfit[reward.slot] === null) rewards.equip(profile, reward.id);
        }
        saveProfile(profile);
        updateMascotOutfit(profile);
        $("rewardReveal").innerHTML = `<strong>${weeklyGoalComplete && earned.length ? copy.weeklyAndReward : earned.length ? copy.newThings(earned.length) : copy.weeklyDone}</strong>${earned.length ? `<div>${earned.map((reward) =>
          `<img src="assets/cosmetics/${reward.asset}.svg" alt="">${rewardName(reward)} ${copy.rewardUnlocked}`).join(" · ")}</div>` : ""}${weeklyGoalComplete && earned.length ? `<div>${copy.weeklyDone}</div>` : ""}`;
        $("rewardReveal").classList.remove("hidden");
        kapi.trigger("rewardReveal", { surface: "result", rewardAsset: earned[0]?.asset });
        rewardGoalTimer = window.setTimeout(() => {
          $("resultRewardProgress").classList.remove("hidden");
          if (weeklyGoalComplete) {
            $("weeklyResult").textContent = copy.weeklyDone;
            $("weeklyResult").classList.remove("hidden");
          }
        }, 1600);
      }, perfect ? 2500 : TOTAL === 30 ? 2400 : 2000);
    }
    state.finalMotivationEvents = [];
    makeConfetti(perfect ? 36 : TOTAL === 10 ? 16 : 28);
  }

  function saveSession(session) {
    if (!session.id) throw new Error("Session ID required");
    const profile = getProfile();
    const history = getHistory();
    if (history.some((item) => item.id === session.id) || profile.weeklySessions.sessionIds.includes(session.id) ||
      profile.weeklyHistory.some((week) => week.sessionIds?.includes(session.id))) return { unlocked: [], weeklyGoalComplete: false };
    history.unshift(session);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    const today = localDay(new Date());
    const previousDay = new Date();
    previousDay.setDate(previousDay.getDate() - 1);
    const yesterday = localDay(previousDay);
    if (profile.lastDay !== today) {
      profile.dayStreak = profile.lastDay === yesterday ? profile.dayStreak + 1 : 1;
      profile.lastDay = today;
    }
    const oldXp = profile.totalXp;
    profile.totalXp += session.score;
    const unlocked = rewards.unlock(profile, oldXp, profile.totalXp);
    const weeklyResult = session.completed ? weekly.recordCompletedSession(profile, session.id, new Date(session.date)) : null;
    saveProfile(profile);
    updateHomeStats();
    return { unlocked, weeklyGoalComplete: weeklyResult?.weeklyGoalComplete === true };
  }

  function localDay(date) {
    return weekly.getLocalDateKey(date);
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
      const summary = weekly.getHistorySummary(profile, history);
      const dueSkills = mastery.getDueSkills(profile, new Date());
      const targetLimit = Math.min(maximumAllowedStage(), appSettings.automatic ? profile.currentStage : Math.max(profile.currentStage, appSettings.manualStage));
      const focusTargets = skills.KAPI_SKILLS.filter((skill) => skill.stage <= targetLimit)
        .flatMap((skill) => subskills.availableSubskills(skill.id, profile)
          .filter((id) => profile.subskillMastery[id]?.attempts > 0 && subskills.status(profile.subskillMastery[id]) !== "secure" &&
            (appSettings.automatic || appSettings.operations.includes(skills.getSubskill(id)?.operation)))
          .map((id) => ({ skillId: skill.id, subskillId: id })))
        .filter((item, index, all) => all.findIndex((other) => other.subskillId === item.subskillId) === index)
        .sort((a, b) => {
          const left = profile.subskillMastery[a.subskillId];
          const right = profile.subskillMastery[b.subskillId];
          return (left.firstTryCorrect / left.attempts) - (right.firstTryCorrect / right.attempts) ||
            b.skillId.localeCompare(a.skillId);
        }).slice(0, 3);
      const stableSkills = Object.values(profile.skillMastery).filter((skill) => mastery.getMasteryStatus(skill) === "stable").length;
      const practicingSkills = Object.values(profile.skillMastery).filter((skill) => mastery.getMasteryStatus(skill) === "inPractice").length;
      const commonTrouble = mostCommon(history.flatMap((item) => item.trouble || []));
      content.innerHTML = `
        <div class="summary-stats">
          <div><strong>${summary.thisWeek}</strong><span>${copy.thisWeek}</span></div>
          <div><strong>${summary.lastFourWeeks}</strong><span>${copy.lastFourWeeks}</span></div>
          <div><strong>${profile.currentStage}</strong><span>${copy.currentLevel}</span></div>
        </div>
        ${summary.stageStart && summary.stageEnd && summary.stageEnd > summary.stageStart ? `<p class="learning-summary"><strong>${copy.learningProgress}:</strong> ${copy.stageNames[summary.stageStart - 1]} → ${copy.stageNames[summary.stageEnd - 1]}</p>` : ""}
        ${dueSkills.length || stableSkills || practicingSkills ? `<div class="learning-summary skill-summary"><p>${[
          dueSkills.length ? copy.dueAreas(dueSkills.length) : "",
          stableSkills ? copy.stableAreas(stableSkills) : "",
          practicingSkills ? copy.practiceAreas(practicingSkills) : ""
        ].filter(Boolean).join(" · ")}</p>${dueSkills.length ? `<ul class="due-skill-list">${dueSkills.slice(0, 3).map(({ skillId }) =>
          `<li>${skills.label(skillId, language, copy.stageNames[skills.stageForSkill(skillId) - 1] || "")}</li>`).join("")}${dueSkills.length > 3 ? `<li>${copy.moreAreas(dueSkills.length - 3)}</li>` : ""}</ul>` : ""}</div>` : ""}
        ${focusTargets.length ? `<div class="subskill-summary"><strong>${copy.subskillsToPractice}</strong><div class="subskill-actions">${focusTargets.map(({ skillId, subskillId }) =>
          `<button class="target-skill-button" type="button" data-target-skill="${skillId}" data-target-subskill="${subskillId}" aria-label="${skills.subskillLabel(subskillId, language)}: ${copy.targetedPractice}"><span>${skills.subskillLabel(subskillId, language)}</span><small>${copy.targetedPractice} →</small></button>`).join("")}</div></div>` : ""}
        <div class="history-list">${history.slice(0, 10).map((item) => {
          const stage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, Number(item.stage) || 1));
          const currentScale = item.curriculumVersion === CURRICULUM_VERSION || new Date(item.date).getTime() >= Date.parse("2026-09-27T18:11:52Z");
          const help = currentScale
            ? copy.stageDetail(stage, copy.stageNames[stage - 1], STAGE_EXAMPLES[stage - 1])
            : copy.legacyStageInfo;
          return `<div class="history-row">
            <strong>${formatDate(item.date)}</strong>
            <span>${copy.correctHistory(item.correct, item.total || 20, formatSeconds(item.average))}</span>
            <details class="history-level-details">
              <summary class="history-level" aria-label="${copy.stageInfo}" title="${copy.stageInfo}">${copy.levelShort(stage)}</summary>
              <p class="history-stage-help">${help}</p>
            </details>
          </div>`;
        }).join("")}</div>
        ${commonTrouble.length
          ? `<p class="trouble-note"><strong>${copy.repeat}</strong> ${commonTrouble.map(prettyKey).join(", ")}</p>`
          : `<p class="trouble-note no-errors"><strong>${copy.noErrors}</strong></p>`}`;
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

  function makeConfetti(count = 28) {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      $("confetti").innerHTML = "";
      return;
    }
    const colors = ["#0f766e", "#f8c438", "#e76555", "#46b8aa", "#ffffff"];
    $("confetti").innerHTML = Array.from({ length: count }, (_, i) =>
      `<i class="confetti-piece" style="left:${randomInt(2, 98)}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 1.8).toFixed(2)}s;animation-duration:${(2.1 + Math.random() * 1.7).toFixed(2)}s"></i>`
    ).join("");
  }

  let motivationTimer = 0;
  function onMotivationReaction(reaction, context) {
    const titles = {
      errorRecovered: copy.recoveredTitle, errorMastered: copy.masteredTitle,
      streak3: copy.rewardFlag, streak6: copy.rewardParty, streak10: copy.rewardDance,
      speedImproved: copy.speedImprovedTitle, personalRecord: copy.personalRecordTitle,
      levelUp: copy.levelUpTitle, trainingComplete: copy.completeTitle, perfectTraining: copy.perfectTitle
    };
    const subtitles = {
      errorRecovered: copy.recoveredNote, errorMastered: copy.masteredNote,
      streak3: copy.rightInRow(3), streak6: copy.rightInRow(6), streak10: copy.rightInRow(10),
      speedImproved: reaction.subtitle, personalRecord: reaction.subtitle,
      levelUp: context.notice || copy.rewardHandshake,
      trainingComplete: copy.completedCount(reaction.total), perfectTraining: copy.perfectNote
    };
    if (reaction.banner) showMotivation(titles[reaction.type], subtitles[reaction.type], null, reaction.scene, reaction);
    else if (context.notice) showMotivation(context.notice, copy.adaptiveAdjusted, null, reaction.scene, reaction);
  }

  function showMotivation(title, subtitle, action = null, scene = "flag", options = {}) {
    dismissMotivation(false);
    const pop = $("motivationPop");
    const card = pop.querySelector(".motivation-card");
    kapi.renderBanner(scene, options);
    $("motivationText").textContent = title;
    $("motivationSubtext").textContent = subtitle;
    pop.classList.remove("hidden");
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
    motivationTimer = window.setTimeout(() => dismissMotivation(false), 5000);
    if (action) window.setTimeout(action, 0);
  }

  function dismissMotivation() {
    if (motivationTimer) window.clearTimeout(motivationTimer);
    motivationTimer = 0;
    $("motivationPop").classList.add("hidden");
    kapi?.clearBanner();
  }

  function sound(type) {
    return soundManager?.play(type);
  }

  function createKapiController() {
    let greetingTimer = 0;
    const animator = new window.CanvasKapiAnimator({
      homeHost: $("homeMascot"),
      gameHost: $("gameMascot"),
      resultHost: $("resultMascot"),
      wardrobeHost: $("wardrobeMascot"),
      bannerCard: $("motivationPop").querySelector(".motivation-card"),
      bannerImage: $("motivationMascot"),
      bannerBurst: $("motivationBurst")
    });
    return new window.KapiStateMachine(animator, {
      soundPlayer(type, animationState) {
        if (animationState === "hey") {
          window.clearTimeout(greetingTimer);
          greetingTimer = window.setTimeout(() => {
            if (kapi?.surface === "home" && kapi.state === "hey") speakHomeGreeting();
          }, 520);
          return;
        }
        sound(type);
      }
    });
  }

  async function shareResult() {
    const button = $("shareButton");
    button.disabled = true;
    try {
      const blob = await makeShareCard();
      const filename = "kapi-result.png";
      const file = new File([blob], filename, { type: "image/png" });
      const data = { title: copy.appName, text: `${copy.shareText}: ${state.correct}/${TOTAL}`, url: INVITE_URL };
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ ...data, files: [file] });
      else if (navigator.share) await navigator.share(data);
      else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        await navigator.clipboard?.writeText(INVITE_URL);
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

  function runsStandalone() {
    return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
  }

  function updateInstallHomeButton() {
    const isIosBrowser = /iphone|ipad|ipod/i.test(navigator.userAgent) && !runsStandalone();
    const installed = runsStandalone() || (localStorage.getItem(INSTALLED_KEY) === "1" && !deferredInstallPrompt);
    $("installHomeButton").classList.toggle("hidden", installed || (!deferredInstallPrompt && !isIosBrowser));
  }

  function shouldOfferInstall() {
    if (runsStandalone()) return false;
    const forced = new URLSearchParams(window.location.search).get("install") === "1";
    if (forced) return true;
    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
    return !dismissedAt || Date.now() - dismissedAt > 7 * 86400000;
  }

  function showInstallPrompt(platform = "android") {
    if (!shouldOfferInstall()) return;
    installPlatform = platform;
    $("installText").textContent = platform === "ios" ? copy.iosInstallText : copy.installText;
    $("installButton").classList.toggle("hidden", platform === "ios");
    $("installPrompt").classList.remove("hidden");
  }

  function dismissInstallPrompt(remember = true) {
    $("installPrompt").classList.add("hidden");
    if (remember) localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
  }

  async function installApp(sourceButton = $("installButton")) {
    if (!deferredInstallPrompt) return;
    sourceButton.disabled = true;
    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "1");
        dismissInstallPrompt(false);
      }
      else dismissInstallPrompt(true);
    } finally {
      deferredInstallPrompt = null;
      sourceButton.disabled = false;
      updateInstallHomeButton();
    }
  }

  function installFromHome() {
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) showInstallPrompt("ios");
    else installApp($("installHomeButton"));
  }

  function handleSettingsChange(event) {
    const input = event.target;
    if (!input?.name) return;
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
    if (input.name === "weeklyGoal") {
      const profile = getProfile();
      profile.weeklyGoal = weekly.GOALS.includes(Number(input.value)) ? Number(input.value) : 3;
      profile.weeklySessions.goal = profile.weeklyGoal;
      saveProfile(profile);
      renderSettingsContent();
      updateHomeStats();
      return;
    }
    if (input.name === "automatic") {
      appSettings.automatic = input.checked;
      const profile = getProfile();
      if (appSettings.automatic) {
        setAdaptiveStage(profile, appSettings.manualStage);
      } else {
        appSettings.manualStage = Math.min(profile.currentStage, maximumAllowedStage());
        reconcileOperationsForStage(appSettings.manualStage);
      }
      saveSettings();
      renderSettingsContent();
      updateHomeStats();
      return;
    }
    if (input.name === "range") {
      appSettings.range = input.value;
      const profile = getProfile();
      if (appSettings.automatic) setAdaptiveStage(profile, Math.min(profile.currentStage, maximumAllowedStage()));
      else {
        appSettings.manualStage = Math.min(appSettings.manualStage, maximumAllowedStage());
        reconcileOperationsForStage(appSettings.manualStage);
      }
      saveSettings();
      renderSettingsContent();
      updateHomeStats();
      return;
    }
    if (input.name === "manualStage") {
      const previousStage = appSettings.manualStage;
      appSettings.manualStage = Math.min(CURRICULUM_STAGE_COUNT, Math.max(1, Number(input.value) || 1));
      if (!appSettings.automatic) {
        appSettings.range = rangeForStage(appSettings.manualStage);
        appSettings.operations = availableOperationsThroughStage(appSettings.manualStage);
      }
      if (appSettings.manualStage !== previousStage || appSettings.automatic) {
        const profile = getProfile();
        if (appSettings.automatic) setAdaptiveStage(profile, appSettings.manualStage);
        else {
          if (appSettings.manualStage === 22) profile.divisionCoreSequence = { phase: 0, item: 0, mixed: false };
          if (appSettings.manualStage === 23) profile.multiplicationSequence = { phase: 0, item: 1, mixed: false };
          if (appSettings.manualStage === 24) profile.divisionDerivedSequence = { phase: 0, item: 0, mixed: false };
          saveProfile(profile);
        }
      }
      if (!appSettings.automatic) reconcileOperationsForStage(appSettings.manualStage);
      saveSettings();
      renderSettingsContent();
      updateHomeStats();
      return;
    }
    if (input.name === "operation") {
      const selected = [...$("settingsContent").querySelectorAll('input[name="operation"]:checked')].map((item) => item.value);
      if (!selected.length) {
        input.checked = true;
        return;
      }
      appSettings.operations = OPERATION_ORDER.filter((operation) => selected.includes(operation));
      const requiredStage = appSettings.operations.reduce((highest, operation) =>
        Math.max(highest, OPERATION_MIN_STAGE[operation] || 1), 1
      );
      if (appSettings.manualStage < requiredStage) {
        appSettings.manualStage = requiredStage;
        ensureRangeSupportsStage(requiredStage);
      }
      reconcileOperationsForStage(appSettings.manualStage);
      saveSettings();
      renderSettingsContent();
      updateHomeStats();
      return;
    }
    saveSettings();
  }

  function openFeedbackInWhatsApp(event) {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "feedbackForm" || !form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("feedbackName") || "").trim();
    const message = String(data.get("feedbackMessage") || "").trim();
    if (!message) return;
    const lines = [language === "de" ? "Feedback zur App Rechnen mit Kapi" : "Отзыв о приложении «Считаем с Капи»"];
    if (name) lines.push(`${language === "de" ? "Name" : "Имя"}: ${name}`);
    lines.push("", message);
    window.location.href = `https://wa.me/4915110974353?text=${encodeURIComponent(lines.join("\n"))}`;
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
        const registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
        const watchWorker = (worker) => worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker);
        });
        if (registration.waiting) offerUpdate(registration.waiting);
        watchWorker(registration.installing);
        registration.addEventListener("updatefound", () => {
          watchWorker(registration.installing);
        });
        await registration.update();
        if (registration.waiting) offerUpdate(registration.waiting);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update().then(() => {
            if (registration.waiting) offerUpdate(registration.waiting);
          }).catch(() => {});
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

  function installMotivationDemo() {
    const ru = language === "ru";
    const scenarios = [
      ["nod", ru ? "Кивок" : "Nicken", [{ type: "correct", variant: "nod" }]],
      ["hop", ru ? "Подскок" : "Hüpfen", [{ type: "correct", variant: "hop" }]],
      ["cheer", ru ? "Обе лапы вверх" : "Beide Pfoten hoch", [{ type: "correct", variant: "cheer" }]],
      ["wrong", ru ? "Ошибка" : "Fehler", ["wrong"]],
      ["recovered", ru ? "Первое исправление" : "Erste Verbesserung", ["correct", "errorRecovered"]],
      ["mastered", ru ? "Два верных повтора" : "Fehler gemeistert", ["correct", "errorMastered"]],
      ["streak3", ru ? "3 подряд" : "3 in Folge", ["correct", "streak3"]],
      ["streak6", ru ? "6 подряд" : "6 in Folge", ["correct", "streak6"]],
      ["streak10", ru ? "10 подряд" : "10 in Folge", ["correct", "streak10"]],
      ["levelUp", ru ? "Новый уровень" : "Neues Level", ["correct", "levelUp"]],
      ...[10, 20, 30].map((total) => [`complete${total}`, ru ? `Финиш: ${total} примеров` : `Ziel: ${total} Aufgaben`, [{ type: "trainingComplete", total }]]),
      ["perfect", ru ? "Без ошибок" : "Fehlerfreie Runde", ["correct", "streak10", { type: "trainingComplete", total: 10 }, "perfectTraining"]],
      ["combined", ru ? "Серия + новый уровень" : "Serie + neues Level", ["correct", "streak10", "levelUp"]]
    ];
    const panel = document.createElement("section");
    panel.className = "kapi-demo";
    panel.setAttribute("aria-label", copy.demoTitle);
    panel.innerHTML = `<div class="kapi-demo-preview">
      <span class="eyebrow">${copy.demoTitle}</span>
      <div class="kapi-demo-stage kapi-host"><canvas class="kapi-rive-canvas" aria-hidden="true"></canvas></div>
      <strong class="kapi-demo-status" role="status" aria-live="polite">${ru ? "Выбери реакцию" : "Wähle eine Reaktion"}</strong>
      <p>${ru ? "Прогресс и история занятий не меняются." : "Lernfortschritt und Verlauf bleiben unverändert."}</p>
      <a class="text-button" href="./">${ru ? "Вернуться к тренировке" : "Zurück zum Training"}</a>
    </div><div class="kapi-demo-controls">
      <div class="kapi-demo-actions"><button type="button" data-demo-idle>${ru ? "Спокойное ожидание" : "Ruhiges Warten"}</button><button type="button" data-demo-sound></button></div>
      <div class="kapi-demo-scenarios">${scenarios.map(([id, title]) => `<button type="button" data-demo-scene="${id}">${title}</button>`).join("")}</div>
      <p>${ru ? "Три первые кнопки позволяют отдельно сравнить обычные реакции. Последняя кнопка проверяет одну общую реакцию на два достижения." : "Mit den ersten drei Tasten lassen sich die normalen Reaktionen einzeln vergleichen. Die letzte Taste zeigt eine gemeinsame Reaktion auf zwei Erfolge."}</p>
    </div>`;
    document.body.append(panel);
    document.body.classList.add("kapi-demo-active");
    kapi.clearTimers();
    kapi.animator.pause("home");
    const animator = new window.CanvasKapiAnimator({ homeHost: panel.querySelector(".kapi-demo-stage") });
    const demoMachine = new window.KapiStateMachine(animator, { soundPlayer: (type) => soundManager.play(type) });
    const demoMotivation = new window.KapiMotivationController(demoMachine);
    const status = panel.querySelector(".kapi-demo-status");
    const soundButton = panel.querySelector("[data-demo-sound]");
    const updateDemoSound = () => {
      soundButton.textContent = state.sound ? (ru ? "Звук включён" : "Ton an") : (ru ? "Звук выключен" : "Ton aus");
      soundButton.setAttribute("aria-pressed", String(state.sound));
    };
    const reset = () => {
      soundManager.stopAll();
      demoMachine.reset("home", "idle");
      panel.querySelectorAll("[data-demo-scene]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    };
    const play = (id) => {
      const scenario = scenarios.find(([name]) => name === id);
      if (!scenario) return;
      reset();
      soundManager.unlock();
      const reaction = demoMotivation.handle(scenario[2], { surface: "home" });
      const variantLabels = ru ? { nod: "кивок", hop: "подскок", cheer: "радостный жест" } : { nod: "Nicken", hop: "Hüpfen", cheer: "Jubelgeste" };
      status.textContent = scenario[1] + (reaction?.variant ? ` · ${variantLabels[reaction.variant]}` : "");
      panel.querySelector(`[data-demo-scene="${id}"]`).setAttribute("aria-pressed", "true");
      return reaction;
    };
    panel.addEventListener("click", (event) => {
      const scene = event.target.closest("[data-demo-scene]")?.dataset.demoScene;
      if (scene) play(scene);
      if (event.target.closest("[data-demo-idle]")) {
        reset();
        status.textContent = ru ? "Капи спокойно ждёт" : "Kapi wartet ruhig";
      }
      if (event.target.closest("[data-demo-sound]")) {
        state.sound = !state.sound;
        soundManager.setEnabled(state.sound);
        updateDemoSound();
      }
    });
    updateDemoSound();
    window.__kapiTest = demoMachine;
    window.__kapiDemo = { play, reset, getOutfit: () => demoMotivation.getOutfit() };
  }

  $("startButton").addEventListener("click", startTraining);
  $("homeMascot").addEventListener("click", playHomeReaction);
  document.querySelector(".app-shell").addEventListener("pointerdown", (event) => {
    if (!$("motivationPop").classList.contains("hidden")) dismissMotivation();
    if (kapi?.surface === "home" && !kapi.state.startsWith("idle") && !event.target.closest("#homeMascot")) clearHomeReaction();
  });
  $("againButton").addEventListener("click", startTraining);
  $("shareButton").addEventListener("click", shareResult);
  $("statsButton").addEventListener("click", showStats);
  $("wardrobeButton").addEventListener("click", showWardrobe);
  $("mapButton").addEventListener("click", showCurriculumMap);
  $("closeMapButton").addEventListener("click", () => $("mapDialog").close());
  $("closeWardrobeButton").addEventListener("click", closeWardrobe);
  $("wardrobeDialog").addEventListener("close", () => kapi?.animator?.pause("wardrobe"));
  $("wardrobeItems").addEventListener("click", (event) => {
    const equip = event.target.closest("[data-equip]");
    const unequip = event.target.closest("[data-unequip]");
    if (!equip && !unequip) return;
    const profile = getProfile();
    if (equip ? !rewards.equip(profile, equip.dataset.equip) : !rewards.unequip(profile, unequip.dataset.unequip)) return;
    saveProfile(profile);
    updateMascotOutfit(profile);
    renderWardrobe();
  });
  $("resultStatsButton").addEventListener("click", showStats);
  $("statsContent").addEventListener("click", (event) => {
    const button = event.target.closest("[data-target-subskill]");
    if (!button) return;
    const profile = getProfile();
    const skill = skills.getSkill(button.dataset.targetSkill);
    const targetLimit = Math.min(maximumAllowedStage(), appSettings.automatic ? profile.currentStage : Math.max(profile.currentStage, appSettings.manualStage));
    if (!skill || skill.stage > targetLimit ||
      (!appSettings.automatic && !appSettings.operations.includes(skills.getSubskill(button.dataset.targetSubskill)?.operation)) ||
      !subskills.availableSubskills(skill.id, profile).includes(button.dataset.targetSubskill)) return;
    $("statsDialog").close();
    startTraining({ targetSkillId: skill.id, targetSubskillId: button.dataset.targetSubskill });
  });
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
    settingsSection = "menu";
    renderSettingsContent();
    $("settingsDialog").showModal();
  });
  $("closeSettingsButton").addEventListener("click", () => $("settingsDialog").close());
  $("settingsContent").addEventListener("change", handleSettingsChange);
  $("settingsContent").addEventListener("click", (event) => {
    const sectionButton = event.target.closest("[data-settings-section]");
    if (sectionButton) {
      settingsSection = sectionButton.dataset.settingsSection;
      renderSettingsContent();
      return;
    }
    if (event.target.closest("[data-settings-back]")) {
      settingsSection = "menu";
      renderSettingsContent();
      return;
    }
    if (event.target.closest("#soundButton")) {
      state.sound = !state.sound;
      soundManager?.setEnabled(state.sound);
      saveSettings();
      updateSoundButton();
      if (state.sound) sound("correct");
    }
  });
  $("settingsContent").addEventListener("submit", openFeedbackInWhatsApp);
  $("settingsContent").addEventListener("focusin", (event) => keepSettingsFieldVisible(event.target));
  $("installButton").addEventListener("click", () => installApp($("installButton")));
  $("installHomeButton").addEventListener("click", installFromHome);
  $("installContinue").addEventListener("click", () => dismissInstallPrompt(true));
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallHomeButton();
    if (new URLSearchParams(window.location.search).get("install") === "1") showInstallPrompt("android");
  });
  window.addEventListener("appinstalled", () => {
    localStorage.setItem(INSTALLED_KEY, "1");
    dismissInstallPrompt(false);
    updateInstallHomeButton();
  });

  loadSettings();
  applyLanguage();
  soundManager = new window.KapiSoundManager({ isEnabled: () => state.sound });
  kapi = createKapiController();
  motivation = new window.KapiMotivationController(kapi, { onReaction: onMotivationReaction,
    onOutfitChange(sessionOutfit) { kapi?.animator?.setOutfit(getProfile().equippedOutfit, sessionOutfit); } });
  if (new URLSearchParams(window.location.search).get("kapiTest") === "1") {
    window.__kapiTest = kapi;
    installMotivationDemo();
  }
  updateHomeStats();
  if (runsStandalone()) localStorage.setItem(INSTALLED_KEY, "1");
  updateInstallHomeButton();
  document.body.classList.add("start-active");
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !runsStandalone()) showInstallPrompt("ios");
  registerWebMcp();
  syncViewportSize();
  if (!window.__kapiDemo) window.setTimeout(() => {
    if ($("startScreen").classList.contains("active")) restartHomeGreeting();
  }, 360);
  window.addEventListener("resize", syncViewportSize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) soundManager.stopAll();
  });
  window.visualViewport?.addEventListener("resize", syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportSize, { passive: true });
  registerServiceWorker();
})();
