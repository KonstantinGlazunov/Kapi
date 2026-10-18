(function () {
  "use strict";
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const clean = value => Number(Number(value).toFixed(8));
  const number = value => String(typeof value === 'number' ? clean(value) : value).replace('.', ',');
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const chips = items => `<div class="guidance-chips">${items.map(item => `<span>${escape(item)}</span>`).join('')}</div>`;
  const TEXT = {
    ru: { count: 'Считай по одному. Отмечай каждый предмет.', add: 'Соедини группы и посчитай всё вместе.', sub: 'Убери указанное количество. Посчитай, сколько осталось.', split: 'Разложим число, которое вычитаем:', splitAdd: 'Разложим число, которое прибавляем:', parts: 'Считай по частям, начиная с крупных разрядов.', multiply: 'Сложи одинаковые группы. В каждой одно и то же количество.', divide: 'Раздели поровну. В каждой группе должно быть одинаковое количество.', inverse: 'Найди число, которое при умножении на делитель даст исходное число.', missing: 'Найди неизвестное число с помощью обратного действия.', expression: 'Вычисли каждое выражение и сравни с нужным числом.', place: 'Длинный брусок — это 10 единиц. Отдельные кубики — единицы.', line: 'Начни с указанного числа. Считай шаги по стрелке.', fraction: 'Приведи дроби к одинаковым долям. Затем выполни действие с числителями.', fractionMultiply: 'Умножь числители друг на друга, затем знаменатели.', fractionDivide: 'Переверни вторую дробь и замени деление умножением.', decimal: 'Выровняй запятые. Допиши нули, чтобы разряды совпали.', decimalMultiply: 'Умножь без запятых. Затем верни общее число знаков после запятой.', decimalDivide: 'Умножь оба числа на одну и ту же степень 10, чтобы делитель стал целым.', negative: 'Пара +1 и −1 даёт 0. Убирай такие пары.', negativeSub: 'Вычитание числа заменяем прибавлением противоположного.', signs: 'Для умножения и деления: одинаковые знаки дают плюс, разные — минус.', power: 'Показатель — это количество одинаковых множителей.', root: 'Найди число, которое при умножении само на себя даёт число под корнем.', cube: 'Найди число, которое трижды умноженное само на себя даёт число под корнем.', left: 'Осталось', groups: 'групп', each: 'в каждой', tens: 'десятков', ones: 'единиц', equal: 'Всего', pairs: 'Убираем нулевые пары', zero: 'Ни одного предмета: это 0.' },
    de: { count: 'Zähle einzeln. Markiere jeden Gegenstand.', add: 'Verbinde die Gruppen und zähle alles zusammen.', sub: 'Nimm die angegebene Anzahl weg. Zähle, was übrig bleibt.', split: 'Wir zerlegen die Zahl, die wir abziehen:', splitAdd: 'Wir zerlegen die Zahl, die wir addieren:', parts: 'Rechne in Teilen, beginnend mit den großen Stellen.', multiply: 'Addiere gleiche Gruppen. Jede enthält gleich viele Gegenstände.', divide: 'Verteile gleichmäßig. Jede Gruppe bekommt gleich viele Gegenstände.', inverse: 'Welche Zahl ergibt mit dem Teiler multipliziert die Ausgangszahl?', missing: 'Finde die fehlende Zahl mit der Umkehraufgabe.', expression: 'Berechne jeden Ausdruck und vergleiche das Ergebnis mit der gesuchten Zahl.', place: 'Ein langer Stab sind 10 Einer. Einzelne Würfel sind Einer.', line: 'Starte bei der markierten Zahl. Zähle die Schritte entlang des Pfeils.', fraction: 'Erweitere auf gleich große Teile. Rechne dann mit den Zählern.', fractionMultiply: 'Multipliziere die Zähler und dann die Nenner.', fractionDivide: 'Drehe den zweiten Bruch um und multipliziere.', decimal: 'Schreibe die Kommas untereinander. Ergänze fehlende Nullen.', decimalMultiply: 'Multipliziere ohne Komma. Setze danach die gesamte Anzahl der Nachkommastellen.', decimalDivide: 'Multipliziere beide Zahlen mit derselben Zehnerpotenz, bis der Teiler ganzzahlig ist.', negative: 'Ein Paar aus +1 und −1 ergibt 0. Entferne solche Paare.', negativeSub: 'Subtrahieren heißt die Gegenzahl addieren.', signs: 'Beim Multiplizieren und Dividieren: gleiche Vorzeichen ergeben Plus, verschiedene Minus.', power: 'Der Exponent gibt die Anzahl gleicher Faktoren an.', root: 'Welche Zahl ergibt mit sich selbst multipliziert die Zahl unter der Wurzel?', cube: 'Welche Zahl ergibt dreimal mit sich selbst multipliziert die Zahl unter der Wurzel?', left: 'Übrig', groups: 'Gruppen', each: 'je Gruppe', tens: 'Zehner', ones: 'Einer', equal: 'Zusammen', pairs: 'Nullpaare entfernen', zero: 'Kein Gegenstand: das ist 0.' }
  };
  class KapiGuidance {
    constructor(tasks) { this.tasks = tasks; }
    objects(n, p, removed = 0, numbered = false) {
      if (!Number.isInteger(n) || n < 0 || n > 30) return chips([number(n)]);
      if (!n) return '<div class="guidance-zero">0</div>';
      const counted = typeof numbered === 'number' ? numbered : numbered ? n : 0;
      return `<div class="guidance-objects${counted ? ' counting' : ''}">${Array.from({ length: n }, (_, i) => `<span class="guidance-object${i < counted ? ' counted' : ''}${i >= n - removed ? ' taken' : ''}">${this.tasks.renderProduce(1, p)}${i < counted && i < n - removed ? `<small>${i + 1}</small>` : ''}</span>`).join('')}</div>`;
    }
    groups(ns, p) { return `<div class="guidance-groups">${ns.map(n => `<div>${this.objects(n, p)}</div>`).join('')}</div>`; }
    frame(n, removed = 0) { return this.tasks.renderFrame(this.tasks.makeTenFrame(n, removed)); }
    fractionBar(n, d, removed = 0) {
      if (d > 20 || n > d || n < 0) return chips([`${n}/${d}`]);
      return `<div class="guidance-fraction" aria-label="${n}/${d}">${Array.from({ length: d }, (_, i) => `<span class="${i < n ? 'filled' : ''}${i < n && i >= n - removed ? ' taken' : ''}"></span>`).join('')}</div>`;
    }
    signs(negative, positive, remove = false) {
      if (negative + positive > 30) return chips([`−1 × ${negative}`, `+1 × ${positive}`]);
      const pairs = Math.min(negative, positive);
      return `<div class="guidance-signs">${[[-1, negative], [1, positive]].map(([sign, n]) => Array.from({ length: n }, (_, i) => `<span class="${sign < 0 ? 'minus' : 'plus'}${remove && i < pairs ? ' taken' : ''}">${sign > 0 ? '+1' : '−1'}</span>`).join('')).join('')}</div>`;
    }
    build(p, language = 'de') {
      const t = TEXT[language] || TEXT.de, ru = language === 'ru';
      const { a, b, answer, operation } = p;
      const op = operation === 'multiply' ? '×' : operation === 'divide' ? ':' : p.operator === '-' ? '−' : p.operator;
      const type = p.taskType || 'equation';
      const result = { hint: '', hintVisual: '', steps: [], answer: this.tasks.response(p) };
      const add = (text, visual = '') => result.steps.push({ text: String(text), visual });
      const eq = (x, sign, y, value) => `${number(x)} ${sign} ${number(y)} = ${number(value)}`;
      let final = eq(a, op, b, answer);
      if (operation === 'count') {
        result.hint = a ? this.tasks.countCopy(p, language).hint : t.zero;
        result.hintVisual = this.objects(answer, p);
        if (answer) for (let count = 1; count <= answer; count++) add(`${t.equal}: ${count}`, this.objects(answer, p, 0, count));
        else add(t.zero, this.objects(0, p));
        final = `${t.equal}: ${number(answer)}`;
      } else if (operation === 'fraction') {
        const [an, ad] = a.split('/').map(Number), [bn, bd] = b.split('/').map(Number);
        let numerator, denominator;
        if (op === '+' || op === '−') {
          const common = ad / gcd(ad, bd) * bd;
          const left = an * (common / ad), right = bn * (common / bd);
          result.hint = t.fraction;
          result.hintVisual = chips([`${a} = ${left}/${common}`, `${b} = ${right}/${common}`]);
          add(`${a} = ${left}/${common}; ${b} = ${right}/${common}`, this.fractionBar(left, common) + this.fractionBar(right, common));
          numerator = op === '+' ? left + right : left - right; denominator = common;
          add(`${left}/${common} ${op} ${right}/${common} = ${numerator}/${common}`, this.fractionBar(op === '+' ? numerator : left, common, op === '−' ? right : 0));
        } else {
          result.hint = op === '×' ? t.fractionMultiply : t.fractionDivide;
          result.hintVisual = op === '×' ? chips([`${an} × ${bn}`, `${ad} × ${bd}`]) : chips([`${a} × ${bd}/${bn}`]);
          numerator = an * (op === '×' ? bn : bd); denominator = ad * (op === '×' ? bd : bn);
          if (op !== '×') add(`${a} : ${b} = ${a} × ${bd}/${bn}`, this.fractionBar(an, ad));
          add(`(${an} × ${op === '×' ? bn : bd}) / (${ad} × ${op === '×' ? bd : bn}) = ${numerator}/${denominator}`, this.fractionBar(numerator, denominator));
        }
        add(`${numerator}/${denominator} = ${answer}`, this.fractionBar(...answer.split('/').map(Number)));
      } else if (operation === 'decimal') {
        const places = n => (String(n).split('.')[1] || '').length;
        if (op === '+' || op === '−') {
          const digits = Math.max(places(a), places(b));
          result.hint = t.decimal;
          result.hintVisual = `<div class="guidance-column">${a.toFixed(digits).replace('.', ',')}<br>${op} ${b.toFixed(digits).replace('.', ',')}<hr>?</div>`;
          const scale = 10 ** digits, ai = Math.round(a * scale), bi = Math.round(b * scale);
          add(eq(ai, op, bi, Math.round(answer * scale)));
          add(`${Math.round(answer * scale)} : ${scale} = ${number(answer)}`);
        } else if (op === '×') {
          const sa = 10 ** places(a), sb = 10 ** places(b), ai = Math.round(a * sa), bi = Math.round(b * sb);
          result.hint = t.decimalMultiply; result.hintVisual = chips([`${number(a)} → ${ai}`, `${number(b)} → ${bi}`]);
          add(eq(ai, '×', bi, ai * bi)); add(`${ai * bi} : ${sa * sb} = ${number(answer)}`);
        } else {
          const scale = 10 ** Math.max(places(a), places(b)), ai = Math.round(a * scale), bi = Math.round(b * scale);
          result.hint = t.decimalDivide; result.hintVisual = chips([`${number(a)} × ${scale}`, `${number(b)} × ${scale}`]);
          add(`${number(a)} : ${number(b)} = ${ai} : ${bi}`); add(eq(ai, ':', bi, answer));
        }
      } else if (operation === 'negative') {
        if (op === '+' || op === '−') {
          const second = op === '−' ? -b : b;
          const neg = Math.max(0, -a) + Math.max(0, -second), pos = Math.max(0, a) + Math.max(0, second);
          result.hint = op === '−' ? `${t.negativeSub} ${t.negative}` : t.negative;
          result.hintVisual = this.signs(neg, pos);
          add(eq(a, '+', `(${second})`, answer), this.signs(neg, pos));
          add(`${t.pairs}: ${Math.min(neg, pos)}`, this.signs(neg, pos, true));
        } else {
          const sign = (a < 0) === (b < 0) || answer === 0 ? '+' : '−';
          result.hint = t.signs; result.hintVisual = chips([`${a < 0 ? '−' : '+'} ${op} ${b < 0 ? '−' : '+'} → ${sign}`]);
          add(eq(Math.abs(a), op, Math.abs(b), Math.abs(answer))); add(`${sign}(${number(Math.abs(answer))}) = ${number(answer)}`);
        }
      } else if (operation === 'power') {
        const factors = Array.from({ length: b }, () => number(a));
        result.hint = t.power; result.hintVisual = chips([`${factors.join(' × ')} = ?`]);
        let value = a;
        for (let i = 1; i < b; i++) { add(eq(value, '×', a, value * a)); value *= a; }
        final = `${a}${b === 2 ? '²' : '³'} = ${answer}`;
      } else if (operation === 'root') {
        result.hint = b === 3 ? t.cube : t.root;
        const side = answer, cells = side * side;
        const square = () => `<div class="guidance-root-grid" style="--side:${side}">${Array.from({ length: cells }, () => '<i></i>').join('')}</div>`;
        const canDraw = b === 2 ? side <= 10 : side <= 4;
        const grid = canDraw ? b === 2 ? square() : `<div class="guidance-layers">${Array.from({ length: side }, square).join('')}</div>` : '';
        result.hint = canDraw
          ? ru ? (b === 2 ? `Квадрат состоит из ${a} клеток. Посчитай клетки вдоль одной стороны.` : `Куб состоит из ${a} кубиков. Посчитай кубики вдоль одного ребра.`)
            : `${b === 2 ? 'Das Quadrat' : 'Der Würfel'} besteht aus ${a} ${b === 2 ? 'Kästchen' : 'Würfeln'}. Zähle entlang einer Kante.`
          : result.hint;
        const low = Math.max(1, side - 2), high = side + 2;
        result.hintVisual = grid || chips([`${low}${b === 2 ? '²' : '³'} = ${low ** b}`, `${high}${b === 2 ? '²' : '³'} = ${high ** b}`, `${op}${a} = ?`]);
        add(`${Array.from({ length: b }, () => side).join(' × ')} = ${a}`, grid || chips([`${side} × ${side} = ${cells}`, ...(b === 3 ? [`${cells} × ${side} = ${a}`] : [])]));
        final = `${op}${a} = ${answer}`;
      } else if (operation === 'multiply' || operation === 'divide') {
        const multiply = operation === 'multiply';
        const groupCount = multiply ? a : b, size = multiply ? b : answer;
        const visual = groupCount > 0 && size > 0 && groupCount <= 10 && groupCount * size <= 30
          ? this.groups(Array.from({ length: groupCount }, () => size), p) : '';
        result.hint = multiply ? t.multiply : t.inverse;
        result.hintVisual = multiply ? visual || chips([`${a} × ${b} = ?`]) : chips([`${b} × ? = ${a}`]);
        if (multiply) {
          if (a === 0 || b === 0) add(final, '<div class="guidance-zero">0</div>');
          else if (a <= 10 && b <= 10) {
            const factors = Array.from({ length: a }, () => b);
            result.hintVisual = visual || chips([`${factors.join(' + ')} = ?`]);
            add(`${factors.join(' + ')} = ${answer}`, visual);
            let subtotal = b;
            for (let i = 1; i < a; i++) { add(eq(subtotal, '+', b, subtotal + b), visual); subtotal += b; }
          } else {
            const bigger = Math.max(a, b), other = Math.min(a, b);
            const place = 10 ** Math.max(0, String(bigger).length - 1), high = Math.floor(bigger / place) * place, low = bigger - high;
            result.hint = ru ? 'Разложи больший множитель на части. Умножь каждую часть.' : 'Zerlege den größeren Faktor. Multipliziere jeden Teil.';
            result.hintVisual = chips([`${bigger} = ${high} + ${low}`, `${high} × ${other} + ${low} × ${other} = ?`]);
            if (low && high) { add(`${bigger} = ${high} + ${low}`); add(eq(high, '×', other, high * other)); add(eq(low, '×', other, low * other)); add(eq(high * other, '+', low * other, answer)); }
            else {
              let aa = a, bb = b, scale = 1;
              while (aa && aa % 10 === 0) { aa /= 10; scale *= 10; }
              while (bb && bb % 10 === 0) { bb /= 10; scale *= 10; }
              result.hintVisual = chips([`${aa} × ${bb} × ${scale} = ?`]);
              add(eq(aa, '×', bb, aa * bb)); add(eq(aa * bb, '×', scale, answer));
            }
          }
        } else {
          const high = Math.floor(answer / 10) * 10, low = answer - high;
          if (high && low) { add(`${a} = ${high * b} + ${low * b}`); add(eq(high * b, ':', b, high)); add(eq(low * b, ':', b, low)); add(eq(high, '+', low, answer)); }
          else { add(eq(b, '×', answer, a), visual); add(`${groupCount} ${t.groups} · ${size} ${t.each}`, visual); }
        }
      } else if (operation === 'add' || operation === 'subtract') {
        const subtract = operation === 'subtract';
        result.hint = subtract ? t.sub : t.add;
        result.hintVisual = a <= 20 && b <= 20 && answer <= 20
          ? subtract ? this.objects(a, p) : this.groups([a, b], p) : chips([`${number(a)} ${op} ${number(b)} = ?`]);
        if (subtract && a <= 20 && b > (a % 10 || 10) && a > 10) {
          const first = a % 10 || 10, rest = b - first;
          result.hint = `${t.split} ${b} = ${first} + ${rest}.`;
          result.context = `${b} = ${first} + ${rest}`;
          result.hintVisual = `<div class="guidance-subtraction">${chips([`${a} − (${first} + ${rest}) = ?`])}${this.frame(a)}</div>`;
          add(`${b} = ${first} + ${rest}`, this.frame(a));
          add(eq(a, '−', first, a - first), this.frame(a, first));
          add(eq(a - first, '−', rest, answer), this.frame(a, b));
        } else if (!subtract && a < 20 && answer <= 20 && answer > 10 && b > 10 - a % 10 && a % 10) {
          const first = 10 - a % 10, rest = b - first;
          result.hint = `${t.splitAdd} ${b} = ${first} + ${rest}.`;
          result.hintVisual = chips([`${a} + (${first} + ${rest}) = ?`]);
          add(`${b} = ${first} + ${rest}`, this.frame(a));
          add(eq(a, '+', first, a + first), this.frame(a + first));
          add(eq(a + first, '+', rest, answer), this.frame(answer));
        } else if (a <= 20 && b <= 20 && answer <= 20) {
          if (subtract) {
            for (let taken = 1; taken <= b; taken++) add(eq(a, '−', taken, a - taken), type === 'tenFrame' ? this.frame(a, taken) : this.objects(a, p, taken, true));
          } else {
            add(`${a}`, type === 'tenFrame' ? this.frame(a) : this.objects(answer, p, 0, a));
            for (let count = a + 1; count <= answer; count++) add(eq(count - 1, '+', 1, count), type === 'tenFrame' ? this.frame(count) : this.objects(answer, p, 0, count));
          }
        } else {
          result.hint = t.parts;
          const chunks = String(b).split('').map((d, i, ds) => Number(d) * 10 ** (ds.length - i - 1)).filter(Boolean);
          result.hintVisual = chips([`${b} = ${chunks.length ? chunks.join(' + ') : '0'}`]);
          let current = a;
          for (const chunk of chunks) { const next = subtract ? current - chunk : current + chunk; add(eq(current, op, chunk, next)); current = next; }
        }
      }
      // Presentation-specific answers must never expose an internal choice index.
      if (type === 'missingOperand') {
        const response = this.tasks.response(p);
        result.hint = t.missing;
        let x, sign, y;
        if (operation === 'add') [x, sign, y] = [answer, '−', p[p.missing === 'a' ? 'b' : 'a']];
        else [x, sign, y] = p.missing === 'a' ? [answer, '+', b] : [a, '−', answer];
        result.hintVisual = chips([`${number(x)} ${sign} ${number(y)} = ?`]);
        result.steps = [{ text: eq(x, sign, y, response), visual: chips([`${number(response)}`]) }];
        final = eq(a, op, b, answer);
      } else if (type === 'chooseExpression') {
        result.hint = t.expression; result.hintVisual = chips(p.expressionChoices.map(c => `${c.label} = ?`));
        result.steps = p.expressionChoices.map(c => ({ text: `${c.label} = ${c.value}`, visual: chips([`${c.label} = ${c.value}${c.value === answer ? ' ✓' : ''}`]) }));
        final = `${p.expressionChoices[p.correctExpressionIndex].label} = ${number(answer)}`;
      } else if (type === 'placeValue') {
        const v = p.placeValue;
        result.hint = t.place; result.hintVisual = this.tasks.renderPlaceValue(v);
        result.steps = [ {text: `${v.tens} × 10 = ${v.tens * 10}`, visual: this.tasks.renderPlaceValue(v)}, {text: `${v.tens * 10} + ${v.ones} = ${v.number}`, visual: this.tasks.renderPlaceValue(v)} ];
        if (v.variant === 'decompose') final = `${v.number} = ${v.tens} × 10 + ${v.ones}`;
      } else if (type === 'numberLine') {
        result.hint = `${ru ? `Начни с ${a}. Считай ${Math.abs(p.visualData.delta)} шагов по стрелке.` : `Starte bei ${a}. Zähle ${Math.abs(p.visualData.delta)} Schritte entlang des Pfeils.`}`;
        result.hintVisual = this.tasks.renderLine(p.visualData);
        const { start, delta, end } = p.visualData, direction = Math.sign(delta);
        result.steps = Array.from({ length: Math.abs(delta) }, (_, i) => ({ text: `${start + i * direction} → ${start + (i + 1) * direction}`, visual: this.tasks.renderLine({ start, delta, end }, { revealed: true, position: start + (i + 1) * direction, hops: i + 1 }) }));
        if (!delta) add(`${start} → ${end}`, this.tasks.renderLine(p.visualData, { revealed: true, position: end, hops: 0 }));
      } else if (type === 'tenFrame' && !result.hintVisual.includes('guidance-chips')) {
        result.hintVisual = this.frame(operation === 'subtract' ? a : answer);
      }
      result.final = final;
      add(final, result.steps.at(-1)?.visual || chips([final]));
      result.steps.forEach(step => { if (!step.visual) step.visual = chips([step.text]); });
      return result;
    }
  }
  window.KapiGuidance = KapiGuidance;
})();
