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
      line: "Wo landet Kapi?", missing: "Welche Zahl fehlt?", count: "Wie viele Punkte?",
      storyAdd: (a, b) => `Kapi hat ${a} Äpfel und bekommt ${b} dazu. Wie viele jetzt?`,
      storySubtract: (a, b) => `Kapi hat ${a} Äpfel und gibt ${b} ab. Wie viele bleiben?`,
      hintExpression: "Rechne die Ausdrücke nacheinander.", hintLine: (n) => `Starte bei ${n}.`,
      hintTens: "Wie viele Zehner?", hintStory: "Achte auf die beiden Zahlen.", hintMissing: "Welche Zahl fehlt?",
      hintFrame: "Zähle die gefüllten Felder.", hintCount: "Zähle die Punkte." },
    ru: { choose: (n) => `Какое выражение равно ${n}?`, place: (t, o) => `${t} десяток + ${o} единиц = ?`,
      placeChoose: (n) => `Из чего состоит ${n}?`, placeBlocks: "Сколько всего?",
      placeOption: (t, o) => `${t} десяток · ${o} единиц`,
      line: "Куда попадёт Капи?", missing: "Какого числа не хватает?", count: "Сколько точек?",
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
    return { quantity: count, removed, first, cells, frames: cells.length / 10 };
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

  const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const numeric = (value) => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1000000;
  const integer = (value) => numeric(value) && Number.isInteger(value);
  const same = (value, expected) => Array.isArray(expected)
    ? Array.isArray(value) && value.length === expected.length && expected.every((item, i) => same(value[i], item))
    : record(expected) ? record(value) && Object.entries(expected).every(([key, item]) => same(value[key], item)) : value === expected;
  function fraction(value) {
    if (typeof value !== "string" || !/^-?\d+\/[1-9]\d*$/.test(value)) return null;
    const parts = value.split("/").map(Number);
    return parts.every(integer) && parts[1] > 0 ? parts : null;
  }
  function reduced(n, d) {
    let a = Math.abs(n), b = Math.abs(d);
    while (b) [a, b] = [b, a % b];
    return `${n / (a || 1)}/${d / (a || 1)}`;
  }
  function arithmetic(a, b, operator) {
    if (operator === "+") return a + b;
    if (["−", "-"].includes(operator)) return a - b;
    if (operator === "×") return a * b;
    if ([":", "÷"].includes(operator) && b !== 0) return a / b;
    if (operator === "^") return a ** b;
    return NaN;
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
        problem.visualData = { quantity: base.answer, operands: base.operation === "add" ? [base.a, base.b] : null };
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
    // The persisted review queue is executable task data, not just JSON. Validate
    // both the original maths and every field consumed by display/response/hints.
    isValidReviewProblem(p) {
      if (!record(p) || typeof p.key !== "string" || !p.key.trim() || typeof p.text !== "string" || !p.text.trim() ||
        !Number.isInteger(p.curriculumStage) || p.curriculumStage < 1 || p.curriculumStage > 41 ||
        !["choice", "input"].includes(p.mode) || !Number.isInteger(p.correctStreak) || p.correctStreak < 0 || p.correctStreak > 2 ||
        !Number.isFinite(p.lastShown) || p.lastShown < 0) return false;
      const type = p.taskType === undefined ? "equation" : p.taskType;
      if (!this.allowedTypes(p.curriculumStage).includes(type)) return false;
      const operators = { count: [""], add: ["+"], subtract: ["−", "-"], multiply: ["×", "+"], divide: [":", "÷"],
        negative: ["−", "-", "×", ":", "÷"], decimal: ["+", "−", "-", "×", "÷"], fraction: ["+", "−", "-", "×", "÷"], power: ["^"], root: ["√", "∛"] };
      if (typeof p.operation !== "string" || !Object.hasOwn(operators, p.operation) || !operators[p.operation].includes(p.operator)) return false;
      const skill = window.KapiSkills?.KAPI_SKILLS.find((item) => item.stage === p.curriculumStage);
      if (!skill?.operations.includes(p.operation)) return false;
      if (type !== "equation" && ![p.a, p.b, p.answer].every((value) => integer(value) && value >= 0 && value <= 20)) return false;
      if (p.conceptVisual !== undefined && typeof p.conceptVisual !== "boolean") return false;
      if (p.operation === "fraction") {
        const a = fraction(p.a), b = fraction(p.b), answer = fraction(p.answer);
        if (p.answerType !== "fraction" || !a || !b || !answer || a[0] < 0 || b[0] < 0 || answer[0] < 0) return false;
        let n, d;
        if (p.operator === "+" || p.operator === "−" || p.operator === "-") {
          n = a[0] * b[1] + (p.operator === "+" ? 1 : -1) * b[0] * a[1]; d = a[1] * b[1];
        } else if (p.operator === "×") { n = a[0] * b[0]; d = a[1] * b[1]; }
        else { n = a[0] * b[1]; d = a[1] * b[0]; }
        if (d <= 0 || p.answer !== reduced(n, d)) return false;
      } else {
        if (![p.a, p.b, p.answer].every(numeric)) return false;
        if (p.operation !== "negative" && [p.a, p.b, p.answer].some((value) => value < 0)) return false;
        if (p.operation === "decimal" ? p.answerType !== "decimal"
          : p.answerType !== undefined || ![p.a, p.b, p.answer].every(integer)) return false;
        let expected;
        if (p.operation === "count") {
          if (p.a < 0 || p.a > 5 || p.b !== 0 || p.visualCount !== p.a) return false;
          expected = p.a;
        } else if (p.operation === "root") {
          if (p.b !== (p.operator === "√" ? 2 : 3) || p.answer < 0 || p.answer ** p.b !== p.a) return false;
          expected = p.answer;
        } else {
          if (p.operation === "power" && (p.b < 2 || p.b > 5)) return false;
          if (p.operation === "multiply" && p.operator === "+") {
            if (p.conceptVisual !== true) return false;
            expected = p.a * p.b;
          } else expected = arithmetic(p.a, p.b, p.operator);
        }
        if (!Number.isFinite(expected) || Math.abs(p.answer - expected) > .000001) return false;
      }
      if (p.conceptVisual === true) {
        if (![p.groupCount, p.groupSize].every(integer) || p.groupCount < 1 || p.groupCount > 10 || p.groupSize < 0 || p.groupSize > 10) return false;
        if (p.operation === "multiply" ? p.groupCount !== p.a || p.groupSize !== p.b
          : p.operation !== "divide" || p.groupCount !== p.b || p.groupSize !== p.answer) return false;
      } else if (p.groupCount !== undefined || p.groupSize !== undefined) return false;
      if (p.visualCount !== undefined && p.operation !== "count") return false;
      // Extra presentation fields would still be used by choiceLabels/renderAnswer,
      // even if taskType claimed to be equation. Reject those inconsistencies too.
      for (const [field, owner] of Object.entries({ expressionChoices: "chooseExpression", correctExpressionIndex: "chooseExpression",
        missing: "missingOperand", displayText: "missingOperand", placeValue: "placeValue", story: "microStory" })) {
        if (p[field] !== undefined && type !== owner) return false;
      }
      if (p.visualData !== undefined && !["visualCount", "tenFrame", "numberLine"].includes(type)) return false;
      let response = p.answer;
      if (type === "missingOperand") {
        if (!["a", "b"].includes(p.missing) || !["add", "subtract"].includes(p.operation)) return false;
        response = p[p.missing];
        if (p.displayText !== `${p.missing === "a" ? "?" : p.a} ${p.operator} ${p.missing === "b" ? "?" : p.b} = ${p.answer}`) return false;
      } else if (type === "chooseExpression") {
        if (!["add", "subtract"].includes(p.operation) || p.mode !== "choice" || !Array.isArray(p.expressionChoices) || p.expressionChoices.length !== 4) return false;
        const choices = p.expressionChoices;
        if (!choices.every((choice) => record(choice) && [choice.a, choice.b, choice.value].every((value) => integer(value) && value >= 0 && value <= 20) &&
          choice.value === arithmetic(choice.a, choice.b, p.operator) && choice.label === `${choice.a} ${p.operator} ${choice.b}`) ||
          new Set(choices.map((choice) => choice.value)).size !== 4) return false;
        response = p.correctExpressionIndex;
        if (!Number.isInteger(response) || response < 0 || response > 3 || choices[response].value !== p.answer) return false;
      } else if (type === "visualCount") {
        if (!["count", "add"].includes(p.operation) || p.answer < 0 || p.answer > 20 ||
          !same(p.visualData, { quantity: p.answer, operands: p.operation === "add" ? [p.a, p.b] : null })) return false;
      } else if (type === "tenFrame") {
        if (!["add", "subtract"].includes(p.operation) || p.a < 0 || p.b < 0 || p.answer < 0 || Math.max(p.a, p.b, p.answer) > 20) return false;
        if (!same(p.visualData, p.operation === "subtract" ? this.makeTenFrame(p.a, p.b) : this.makeTenFrame(p.answer, 0, p.a))) return false;
      } else if (type === "numberLine") {
        if (!["add", "subtract"].includes(p.operation) || !same(p.visualData, { start: p.a, delta: p.operation === "subtract" ? -p.b : p.b, end: p.answer })) return false;
      } else if (type === "placeValue") {
        const v = p.placeValue;
        if (!record(v) || !["compose", "decompose", "blocks"].includes(v.variant) || p.operation !== "add" ||
          !same(v, { number: p.answer, tens: Math.floor(p.answer / 10), ones: p.answer % 10 })) return false;
        if (v.variant === "decompose") {
          if (p.mode !== "choice" || !Array.isArray(v.options) || v.options.length !== 4 || new Set(v.options).size !== 4 ||
            !v.options.every((n) => Number.isInteger(n) && n >= 0 && n <= 9) || !Number.isInteger(v.correctIndex) || v.correctIndex < 0 || v.correctIndex > 3 || v.options[v.correctIndex] !== v.ones) return false;
          response = v.correctIndex;
        } else if (v.options !== undefined || v.correctIndex !== undefined) return false;
      } else if (type === "microStory") {
        if (!["add", "subtract"].includes(p.operation) || !same(p.story, { a: p.a, b: p.b, answer: p.answer, operation: p.operation })) return false;
      }
      return type === "missingOperand" || type === "chooseExpression" || (type === "placeValue" && p.placeValue.variant === "decompose")
        ? p.responseAnswer === response : p.responseAnswer === undefined;
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
      if (problem.operation === "count") return { text: this.countCopy(problem, language).question,
        html: type === "visualCount" ? this.renderProduce(problem.answer, problem) : "" };
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
      if (type === "visualCount") return { text: problem.operation === "count" ? t.count : problem.text, html: problem.visualData.operands
        ? this.renderOperandGroups(problem.visualData.operands, (n) => this.renderProduce(n, problem)) : this.renderProduce(problem.visualData.quantity, problem) };
      return { text: problem.text, html: "" };
    }
    countCopy(problem, language = "de") {
      const carrot = problem.a % 2 === 0;
      return language === "ru"
        ? { question: carrot ? "Сколько морковок?" : "Сколько яблок?", hint: carrot ? "Посчитай морковки." : "Посчитай яблоки." }
        : { question: carrot ? "Wie viele Karotten?" : "Wie viele Äpfel?", hint: carrot ? "Zähle die Karotten." : "Zähle die Äpfel." };
    }
    renderProduce(n, problem) {
      const carrot = problem.a % 2 === 0;
      const shape = carrot
        ? '<path d="M14 10 7 29Q5 31 6 26L9 12Z" fill="#ed8936"/><path d="m12 11 1-7m0 6 6-5m-7 5-4-5" stroke="#39834c" stroke-width="3" stroke-linecap="round"/>'
        : '<path d="M16 10C3 3 1 18 9 28Q12 31 16 28Q20 31 24 26C31 13 25 4 16 10Z" fill="#df534a"/><path d="M16 10V4" stroke="#775339" stroke-width="2.5"/><path d="M17 7Q18 0 26 3Q24 9 17 7" fill="#39834c"/>';
      return `<div class="task-dots task-produce${n === 0 ? " empty" : ""}" role="group">${Array.from({ length: n }, () => `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">${shape}</svg>`).join("")}</div>`;
    }
    renderDots(n) { return `<div class="task-dots${n === 0 ? " empty" : ""}" role="group">${Array.from({ length: n }, () => '<span aria-label="●">●</span>').join("")}</div>`; }
    renderOperandGroups(operands, render) {
      return `<div class="task-operands">${operands.map((n, index) => `${index ? '<span class="task-operator" aria-hidden="true">+</span>' : ""}<div class="task-operand task-operand-${index + 1}" role="group" aria-label="${n}">${render(n)}</div>`).join("")}</div>`;
    }
    renderFrame(data) {
      if (data.first < data.quantity && !data.removed) {
        return this.renderOperandGroups([data.first, data.quantity - data.first], (n) => this.renderFrame(frame(n)));
      }
      return `<div class="task-frames" role="group">${Array.from({ length: data.frames }, (_, frameIndex) =>
        `<div class="task-frame">${data.cells.slice(frameIndex * 10, frameIndex * 10 + 10).map((cell) =>
          `<span class="task-cell${cell.filled ? " filled" : ""}${cell.removed ? " removed" : ""}${cell.second ? " second" : ""}" aria-label="${cell.removed ? "−" : cell.filled ? "●" : "○"}">${cell.filled ? "●" : ""}</span>`).join("")}</div>`).join("")}</div>`;
    }
    renderLine({ start, delta, end }, { revealed = false, position = start, hops = null } = {}) {
      const upper = Math.max(10, Math.ceil(Math.max(start, end) / 5) * 5);
      const x = (n) => 24 + n / upper * 392;
      const from = x(start), to = x(end), direction = delta < 0 ? -1 : 1;
      const ticks = Array.from({ length: upper + 1 }, (_, n) =>
        `<g class="task-tick${n === start ? " start" : ""}${n === end && end !== start ? " end" : ""}" transform="translate(${x(n)} 105)"><path d="M0 -5V5"/><text y="${upper > 10 && n % 2 ? 42 : 26}">${!revealed && n === end && end !== start ? "?" : n}</text></g>`).join("");
      // Arrow geometry follows the mathematical direction, independently of labels.
      const arrow = hops !== null ? Array.from({ length: hops }, (_, i) => {
        const fromStep = x(start + i * direction), toStep = x(start + (i + 1) * direction);
        return `<path class="task-jump" d="M${fromStep} 77 Q${(fromStep + toStep) / 2} 38 ${toStep} 89"/><path class="task-arrowhead" d="M${toStep - direction * 7} 79 L${toStep} 89 L${toStep + direction * 2} 77"/>`;
      }).join("") : delta === 0 ? "" : `<path class="task-jump" d="M${from} 62 Q${(from + to) / 2} 5 ${to} 89"/><path class="task-arrowhead" d="M${to - direction * 11} 78 L${to} 89 L${to + direction * 3} 73"/>`;
      return `<div class="task-line" role="img" aria-label="${start} ${delta >= 0 ? "+" : "−"} ${Math.abs(delta)} = ${revealed ? end : "?"}"><svg viewBox="0 0 440 ${upper > 10 ? 158 : 140}" aria-hidden="true"><path class="task-line-rail" d="M24 105H416"/>${ticks}${arrow}<text class="task-step-count" x="${(from + to) / 2}" y="25">${Math.abs(delta)}</text><image class="task-line-kapi" href="assets/capybara.webp" x="${x(position) - 23}" y="43" width="46" height="60"/></svg></div>`;
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
        return { text: type === "visualCount" ? this.countCopy(problem, language).hint : key === "hintLine" ? t[key](problem.a) : t[key], html: "" };
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
      return { text: this.countCopy(problem, language).hint, html: this.renderProduce(problem.visualData.quantity, problem) };
    }
  }
  window.KapiTaskSystem = KapiTaskSystem;
  window.KAPI_TASK_WEIGHTS = TYPES;
})();
