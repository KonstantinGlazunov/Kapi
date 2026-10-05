(function () {
  "use strict";

  // Only the presentation changes. a, b, answer, operation and curriculumStage
  // always describe the original curriculum problem.
  const TYPES = {
    1: { equation: .5, visualCount: .5 },
    2: { equation: .8, missingOperand: .09, visualCount: .05, tenFrame: .06 },
    3: { equation: .8, missingOperand: .09, visualCount: .05, tenFrame: .06 },
    4: { equation: .8, missingOperand: .08, tenFrame: .08, chooseExpression: .04 },
    5: { equation: .8, missingOperand: .08, tenFrame: .08, chooseExpression: .04 },
    6: { equation: .8, missingOperand: .07, tenFrame: .04, numberLine: .05, chooseExpression: .04 },
    7: { equation: .8, missingOperand: .07, tenFrame: .04, numberLine: .05, chooseExpression: .04 },
    8: { equation: .8, missingOperand: .07, tenFrame: .04, numberLine: .05, chooseExpression: .04 },
    9: { equation: .6, placeValue: .25, tenFrame: .1, chooseExpression: .05 },
    10: { equation: .82, missingOperand: .07, numberLine: .05, chooseExpression: .04, microStory: .02 },
    11: { equation: .82, missingOperand: .07, numberLine: .05, chooseExpression: .04, microStory: .02 },
    12: { equation: .82, missingOperand: .07, numberLine: .05, chooseExpression: .04, microStory: .02 },
    13: { equation: .82, missingOperand: .07, numberLine: .05, chooseExpression: .04, microStory: .02 },
    14: { equation: .82, missingOperand: .07, numberLine: .05, chooseExpression: .04, microStory: .02 }
  };
  const russianApples = (n) => n % 100 >= 11 && n % 100 <= 14 || n % 10 >= 5 || n % 10 === 0
    ? "яблок" : n % 10 === 1 ? "яблоко" : "яблока";
  const TEXT = {
    de: { choose: (n) => `Welche Rechnung ergibt ${n}?`, place: (t, o) => `${t} Zehner + ${o} Einer = ?`,
      placeChoose: (n) => `Wie setzt sich ${n} zusammen?`, placeBlocks: "Wie viele sind es?",
      placeOption: (t, o) => `${t} Zehner · ${o} Einer`,
      line: "Wohin kommst du?", missing: "Welche Zahl fehlt?", count: "Wie viele Punkte?",
      storyAdd: (a, b) => `Kapi hat ${a} Äpfel und bekommt ${b} dazu. Wie viele jetzt?`,
      storySubtract: (a, b) => `Kapi hat ${a} Äpfel und gibt ${b} ab. Wie viele bleiben?`,
      hintExpression: "Rechne die Ausdrücke nacheinander.", hintLine: (n) => `Starte bei ${n}.`,
      hintTens: "Wie viele Zehner?", hintStory: "Achte auf die beiden Zahlen.", hintMissing: "Welche Zahl fehlt?",
      hintFrame: "Zähle die gefüllten Felder.", hintCount: "Zähle die Punkte." },
    ru: { choose: (n) => `Какое выражение равно ${n}?`, place: (t, o) => `${t} десяток + ${o} единиц = ?`,
      placeChoose: (n) => `Из чего состоит ${n}?`, placeBlocks: "Сколько всего?",
      placeOption: (t, o) => `${t} десяток · ${o} единиц`,
      line: "Куда попадёшь?", missing: "Какого числа не хватает?", count: "Сколько точек?",
      storyAdd: (a, b) => `У Капи ${a} ${russianApples(a)}, он получил ещё ${b}. Сколько теперь?`,
      storySubtract: (a, b) => `У Капи ${a} ${russianApples(a)}, он отдал ${b}. Сколько осталось?`,
      hintExpression: "Посчитай выражения по очереди.", hintLine: (n) => `Начни с ${n}.`,
      hintTens: "Сколько десятков?", hintStory: "Найди оба числа.", hintMissing: "Какого числа не хватает?",
      hintFrame: "Посчитай заполненные клетки.", hintCount: "Посчитай точки." }
  };

  function frame(quantity, removed = 0, first = quantity) {
    const count = Math.min(20, Math.max(0, quantity));
    const cells = Array.from({ length: count > 10 ? 20 : 10 }, (_, i) => ({
      filled: i < count, removed: i >= count - removed && i < count, second: i >= first && i < count
    }));
    return { quantity: count, cells, frames: cells.length / 10 };
  }

  function expressionChoices(problem, random = Math.random) {
    const target = problem.answer;
    const max = problem.curriculumStage <= 3 ? 5 : problem.curriculumStage <= 8 ? 10 : 20;
    const evaluated = problem.operation === "subtract" ? (a, b) => a - b : (a, b) => a + b;
    const candidates = [];
    const usedValues = new Set([target]);
    for (const offset of [-3, -2, -1, 1, 2, 3, 4, -4]) {
      for (const [a, b] of [[problem.a + offset, problem.b], [problem.a, problem.b + offset]]) {
        const value = evaluated(a, b);
        if (a < 0 || b < 0 || value < 0 || value > max || usedValues.has(value)) continue;
        usedValues.add(value);
        candidates.push({ a, b, value, label: `${a} ${problem.operator} ${b}` });
      }
    }
    if (candidates.length < 3) return null;
    const options = [{ a: problem.a, b: problem.b, value: target, label: `${problem.a} ${problem.operator} ${problem.b}` }, ...candidates.slice(0, 3)];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }

  class KapiTaskSystem {
    constructor(random = Math.random) { this.random = random; }
    makeTenFrame(quantity, removed = 0, first = quantity) { return frame(quantity, removed, first); }
    weights(stage) { return TYPES[stage] || { equation: 1 }; }
    allowedTypes(stage) { return Object.keys(this.weights(stage)); }
    chooseType(stage, previousType = null) {
      let roll = this.random();
      let selected = "equation";
      for (const [type, weight] of Object.entries(this.weights(stage))) {
        roll -= weight;
        if (roll < 0) { selected = type; break; }
      }
      return selected !== "equation" && selected === previousType ? "equation" : selected;
    }
    decorate(base, previousType = null, forcedType = null) {
      const stage = base.curriculumStage;
      let type = forcedType || this.chooseType(stage, previousType);
      if (!this.allowedTypes(stage).includes(type)) type = "equation";
      const problem = { ...base, taskType: type };
      if (type === "missingOperand") {
        const missing = base.operation === "subtract" ? "b" : this.random() < .5 ? "a" : "b";
        problem.missing = missing;
        problem.responseAnswer = base[missing];
        problem.displayText = `${missing === "a" ? "?" : base.a} ${base.operator} ${missing === "b" ? "?" : base.b} = ${base.answer}`;
      } else if (type === "chooseExpression") {
        const choices = expressionChoices(base, this.random);
        if (!choices) return { ...base, taskType: "equation" };
        problem.expressionChoices = choices;
        problem.correctExpressionIndex = choices.findIndex((choice) => choice.value === base.answer);
        problem.responseAnswer = problem.correctExpressionIndex;
        problem.mode = "choice";
      } else if (type === "visualCount") {
        problem.visualData = { quantity: base.operation === "count" ? base.answer : base.answer };
      } else if (type === "tenFrame") {
        problem.visualData = base.operation === "subtract"
          ? this.makeTenFrame(base.a, base.b) : this.makeTenFrame(base.answer, 0, base.a);
      } else if (type === "numberLine") {
        problem.visualData = { start: base.a, delta: base.operation === "subtract" ? -base.b : base.b, end: base.answer };
      } else if (type === "placeValue") {
        const variant = ["compose", "decompose", "blocks"][Math.floor(this.random() * 3)];
        problem.placeValue = { number: base.answer, tens: Math.floor(base.answer / 10), ones: base.answer % 10, variant };
        if (variant === "decompose") {
          const correct = problem.placeValue.ones;
          const options = [correct, ...[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== correct).slice(0, 3)];
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
          problem.placeValue.options = options;
          problem.placeValue.correctIndex = options.indexOf(correct);
          problem.responseAnswer = problem.placeValue.correctIndex;
          problem.mode = "choice";
        }
      } else if (type === "microStory") {
        problem.story = { a: base.a, b: base.b, answer: base.answer, operation: base.operation };
      }
      return problem;
    }
    isPaceComparableTask(problem) { return ["equation", "missingOperand"].includes(problem.taskType || "equation"); }
    response(problem) { return problem.responseAnswer ?? problem.answer; }
    choiceLabels(problem, language = "de") {
      if (problem.expressionChoices) return problem.expressionChoices.map((item) => item.label);
      if (problem.placeValue?.options) return problem.placeValue.options.map((ones) => TEXT[language].placeOption(problem.placeValue.tens, ones));
      return null;
    }
    display(problem, language = "de") {
      const t = TEXT[language] || TEXT.de;
      const type = problem.taskType || "equation";
      if (type === "missingOperand") return { text: problem.displayText, html: "" };
      if (type === "chooseExpression") return { text: t.choose(problem.answer), html: "" };
      if (type === "microStory") return { text: t[problem.operation === "subtract" ? "storySubtract" : "storyAdd"](problem.a, problem.b), html: "" };
      if (type === "numberLine") return { text: t.line, html: this.renderLine(problem.visualData) };
      if (type === "placeValue") {
        const { tens, ones, number, variant } = problem.placeValue;
        return variant === "decompose" ? { text: t.placeChoose(number), html: "" }
          : { text: variant === "compose" ? t.place(tens, ones) : t.placeBlocks, html: this.renderPlaceValue(problem.placeValue) };
      }
      if (type === "tenFrame") return { text: problem.text, html: this.renderFrame(problem.visualData) };
      if (type === "visualCount") return { text: problem.operation === "count" ? t.count : problem.text, html: this.renderDots(problem.visualData.quantity) };
      return { text: problem.text, html: "" };
    }
    renderDots(n) { return `<div class="task-dots${n === 0 ? " empty" : ""}" role="group">${Array.from({ length: n }, () => '<span aria-label="●">●</span>').join("")}</div>`; }
    renderFrame(data) {
      return `<div class="task-frames" role="group">${Array.from({ length: data.frames }, (_, frameIndex) =>
        `<div class="task-frame">${data.cells.slice(frameIndex * 10, frameIndex * 10 + 10).map((cell) =>
          `<span class="task-cell${cell.filled ? " filled" : ""}${cell.removed ? " removed" : ""}${cell.second ? " second" : ""}" aria-label="${cell.removed ? "−" : cell.filled ? "●" : "○"}">${cell.filled ? "●" : ""}</span>`).join("")}</div>`).join("")}</div>`;
    }
    renderLine({ start, delta, end }) {
      const upper = Math.max(10, Math.ceil(Math.max(start, end) / 5) * 5);
      const ticks = [...new Set([0, 5, 10, 15, 20, start, end].filter((n) => n <= upper))].sort((a, b) => a - b);
      return `<div class="task-line" role="img" aria-label="${start} ${delta >= 0 ? "+" : "−"} ${Math.abs(delta)} = ?"><div class="task-line-rail"></div>${ticks.map((n) =>
        `<span class="task-tick${n === start ? " start" : ""}${n === end ? " end" : ""}" style="left:${n / upper * 100}%">${n === end && n !== start ? "?" : n === start || n % 5 === 0 ? n : ""}</span>`).join("")}<span class="task-jump" style="left:${Math.min(start, end) / upper * 100}%;width:${Math.abs(delta) / upper * 100}%">${delta >= 0 ? "→" : "←"} ${Math.abs(delta)}</span></div>`;
    }
    renderPlaceValue({ tens, ones }) {
      return `<div class="task-place" aria-label="${tens} × 10 + ${ones}"><span class="task-ten">10</span>${this.renderDots(ones)}</div>`;
    }
    hint(problem, level, language = "de") {
      const t = TEXT[language] || TEXT.de;
      const type = problem.taskType || "equation";
      if (type === "equation") return null;
      if (level === 1) {
        const key = { missingOperand: "hintMissing", chooseExpression: "hintExpression", numberLine: "hintLine", placeValue: "hintTens", microStory: "hintStory", visualCount: "hintCount", tenFrame: "hintFrame" }[type];
        return { text: key === "hintLine" ? t[key](problem.a) : t[key], html: "" };
      }
      if (type === "numberLine") return { text: t.hintLine(problem.a), html: this.renderLine(problem.visualData).replace('class="task-line"', 'class="task-line hint-highlight"') };
      if (type === "placeValue") return { text: t.hintTens, html: this.renderPlaceValue(problem.placeValue) };
      if (type === "missingOperand") {
        const known = problem[problem.missing === "a" ? "b" : "a"];
        return { text: t.hintMissing, html: `<div class="task-relation">${this.renderDots(known)}<span>${problem.operator} ? =</span>${this.renderDots(problem.answer)}</div>` };
      }
      if (type === "chooseExpression") return { text: t.choose(problem.answer), html: this.renderDots(problem.answer) };
      if (type === "microStory") return { text: problem.text, html: this.renderFrame(problem.operation === "subtract" ? frame(problem.a, problem.b) : frame(problem.answer, 0, problem.a)) };
      if (type === "tenFrame") return { text: t.hintFrame, html: this.renderFrame(problem.visualData) };
      return { text: t.hintCount, html: this.renderDots(problem.visualData.quantity) };
    }
  }
  window.KapiTaskSystem = KapiTaskSystem;
  window.KAPI_TASK_WEIGHTS = TYPES;
})();
