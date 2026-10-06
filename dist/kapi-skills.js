(() => {
  "use strict";

  // Each skill names one curriculum contract. The stage generator remains the
  // source of the arithmetic rules; this catalog describes its meaning.
  const MULTIPLY_TABLES = Object.freeze(Array.from({ length: 11 }, (_, n) => `multiply:table:${n}`));
  const DIVIDE_TABLES = Object.freeze(Array.from({ length: 10 }, (_, n) => `divide:table:${n + 1}`));
  const SUBSKILLS = Object.freeze([
    ...MULTIPLY_TABLES.map((id, n) => Object.freeze({ id, operation: "multiply", factor: n,
      de: `${n}er-Reihe`, ru: `Таблица на ${n}` })),
    ...DIVIDE_TABLES.map((id, index) => Object.freeze({ id, operation: "divide", factor: index + 1,
      de: `Division durch ${index + 1}`, ru: `Деление на ${index + 1}` }))
  ]);
  const subskillById = new Map(SUBSKILLS.map((item) => [item.id, item]));
  const SUBSKILLS_BY_STAGE = Object.freeze({
    20: [1, 2, 5, 10].map((n) => `multiply:table:${n}`),
    21: [2, 5, 10].map((n) => `divide:table:${n}`),
    22: [1, 2, 10, 5].map((n) => `divide:table:${n}`),
    23: MULTIPLY_TABLES,
    24: [...MULTIPLY_TABLES.slice(2), ...DIVIDE_TABLES.slice(1)]
  });
  const KAPI_SKILLS = Object.freeze([
    { id: "count:to5", stage: 1, operations: ["count"], de: "Mengen bis 5", ru: "Количество до 5" },
    { id: "add:plus-one", stage: 2, operations: ["add"], de: "+0 und +1 bis 5", ru: "+0 и +1 до 5" },
    { id: "add:to5", stage: 3, operations: ["add"], de: "Plus bis 5", ru: "Сложение до 5" },
    { id: "number:compose-to10", stage: 4, operations: ["add"], de: "Zahlen bis 10 zerlegen", ru: "Состав чисел до 10" },
    { id: "add:to10", stage: 5, operations: ["add"], de: "Plus bis 10", ru: "Сложение до 10" },
    { id: "subtract:small", stage: 6, operations: ["subtract"], de: "−1 und −2 bis 5", ru: "Вычитание 1 и 2 до 5" },
    { id: "subtract:to10", stage: 7, operations: ["subtract"], de: "Minus bis 10", ru: "Вычитание до 10" },
    { id: "mixed:add-sub-to10", stage: 8, operations: ["add", "subtract"], de: "Plus und Minus bis 10", ru: "Сложение и вычитание до 10" },
    { id: "place-value:11-20", stage: 9, operations: ["add"], de: "Zehner und Einer bis 20", ru: "Десятки и единицы до 20" },
    { id: "add:to20:no-carry", stage: 10, operations: ["add"], de: "Plus bis 20 ohne Übergang", ru: "Сложение до 20 без перехода" },
    { id: "subtract:to20:no-borrow", stage: 11, operations: ["subtract"], de: "Minus bis 20 ohne Übergang", ru: "Вычитание до 20 без перехода" },
    { id: "add:cross-ten", stage: 12, operations: ["add"], de: "Plus über den Zehner", ru: "Сложение через десяток" },
    { id: "subtract:cross-ten", stage: 13, operations: ["subtract"], de: "Minus über den Zehner", ru: "Вычитание через десяток" },
    { id: "mixed:add-sub-to20", stage: 14, operations: ["add", "subtract"], de: "Plus und Minus bis 20", ru: "Сложение и вычитание до 20" },
    { id: "number:steps-to100", stage: 15, operations: ["add", "subtract"], de: "Schritte bis 100", ru: "Шаги до 100" },
    { id: "mixed:to100:no-transition", stage: 16, operations: ["add", "subtract"], de: "Rechnen bis 100 ohne Übergang", ru: "Счёт до 100 без перехода" },
    { id: "mixed:to100:transition", stage: 17, operations: ["add", "subtract"], de: "Rechnen bis 100 mit Übergang", ru: "Счёт до 100 с переходом" },
    { id: "mixed:to100", stage: 18, operations: ["add", "subtract"], de: "Plus und Minus bis 100", ru: "Сложение и вычитание до 100" },
    { id: "multiply:equal-groups", stage: 19, operations: ["multiply"], de: "Gleiche Gruppen", ru: "Одинаковые группы" },
    { id: "multiply:first-tables", stage: 20, operations: ["multiply"], de: "Einmaleins mit 1, 2, 5 und 10", ru: "Умножение на 1, 2, 5 и 10" },
    { id: "divide:equal-groups", stage: 21, operations: ["divide"], de: "In gleiche Gruppen teilen", ru: "Деление на равные группы" },
    { id: "divide:core-tables", stage: 22, operations: ["divide"], de: "Division durch 1, 2, 5 und 10", ru: "Деление на 1, 2, 5 и 10" },
    { id: "multiply:einmaleins-sequence", stage: 23, operations: ["multiply"], de: "Einmaleins-Reihen", ru: "Таблица умножения по рядам" },
    { id: "mixed:derived-division", stage: 24, operations: ["multiply", "divide"], de: "Weitere Division und Einmaleins", ru: "Деление и таблица умножения" },
    { id: "mixed:to1000:no-transition", stage: 25, operations: ["add", "subtract"], de: "Rechnen bis 1.000 ohne Übergang", ru: "Счёт до 1000 без перехода" },
    { id: "mixed:to1000:transition", stage: 26, operations: ["add", "subtract"], de: "Rechnen bis 1.000 mit Übergang", ru: "Счёт до 1000 с переходом" },
    { id: "mixed:to10000:no-transition", stage: 27, operations: ["add", "subtract"], de: "Rechnen bis 10.000 ohne Übergang", ru: "Счёт до 10 000 без перехода" },
    { id: "mixed:to10000:transition", stage: 28, operations: ["add", "subtract"], de: "Rechnen bis 10.000 mit Übergang", ru: "Счёт до 10 000 с переходом" },
    { id: "mixed:large-four-operations", stage: 29, operations: ["add", "subtract", "multiply", "divide"], de: "Vier Grundrechenarten mit großen Zahlen", ru: "Четыре действия с большими числами" },
    { id: "power:squares-to1000", stage: 30, operations: ["power"], de: "Quadratzahlen", ru: "Квадраты чисел" },
    { id: "fraction:same-denominator", stage: 31, operations: ["fraction"], de: "Brüche mit gleichem Nenner", ru: "Дроби с одинаковым знаменателем" },
    { id: "fraction:add-subtract", stage: 32, operations: ["fraction"], de: "Brüche addieren und subtrahieren", ru: "Сложение и вычитание дробей" },
    { id: "fraction:multiply-divide", stage: 33, operations: ["fraction"], de: "Brüche multiplizieren und dividieren", ru: "Умножение и деление дробей" },
    { id: "decimal:add-subtract", stage: 34, operations: ["decimal"], de: "Dezimalzahlen addieren und subtrahieren", ru: "Сложение и вычитание десятичных чисел" },
    { id: "decimal:multiply-divide", stage: 35, operations: ["decimal"], de: "Dezimalzahlen multiplizieren und dividieren", ru: "Умножение и деление десятичных чисел" },
    { id: "negative:subtract", stage: 36, operations: ["negative"], de: "Unter null rechnen", ru: "Вычитание с отрицательным ответом" },
    { id: "negative:four-operations", stage: 37, operations: ["negative"], de: "Mit negativen Zahlen rechnen", ru: "Действия с отрицательными числами" },
    { id: "power:natural-exponents", stage: 38, operations: ["power"], de: "Potenzen mit natürlichen Exponenten", ru: "Степени с натуральным показателем" },
    { id: "root:square", stage: 39, operations: ["root"], de: "Quadratwurzeln", ru: "Квадратный корень" },
    { id: "root:cube", stage: 40, operations: ["root"], de: "Kubikwurzeln", ru: "Кубический корень" },
    { id: "mixed:powers-roots", stage: 41, operations: ["power", "root"], de: "Potenzen und Wurzeln", ru: "Степени и корни" }
  ].map((skill) => Object.freeze({ ...skill, operations: Object.freeze(skill.operations),
    subskills: Object.freeze(SUBSKILLS_BY_STAGE[skill.stage] || []) })));
  const byId = new Map(KAPI_SKILLS.map((skill) => [skill.id, skill]));
  const byStage = new Map(KAPI_SKILLS.map((skill) => [skill.stage, skill]));
  const STAGE_SKILLS = Object.freeze(Object.fromEntries(KAPI_SKILLS.map((skill) =>
    [skill.stage, Object.freeze({ primarySkillId: skill.id, secondarySkillIds: Object.freeze([]) })])));

  function skillForStage(stage) { return byStage.get(Number(stage)) || null; }
  function canonicalId(id) {
    const stage = /^stage:(?:[1-9]|[1-3]\d|4[01])$/.test(String(id)) ? Number(id.slice(6)) : null;
    return stage === null ? String(id) : skillForStage(stage)?.id || `stage:${stage}`;
  }
  function stageForSkill(id) {
    const canonical = canonicalId(id);
    return byId.get(canonical)?.stage || null;
  }
  function getSkill(id) { return byId.get(canonicalId(id)) || null; }
  function chapterIdForSkill(id) {
    const stage = stageForSkill(id);
    return window.KAPI_CURRICULUM_CHAPTERS?.find((chapter) => stage >= chapter.first && stage <= chapter.last)?.id || null;
  }
  function label(id, language = "de", fallback = "") {
    const skill = getSkill(id);
    return skill ? skill[language === "ru" ? "ru" : "de"] : fallback;
  }
  function getSubskill(id) { return subskillById.get(id) || null; }
  function subskillLabel(id, language = "de") { return getSubskill(id)?.[language === "ru" ? "ru" : "de"] || ""; }
  // The first factor is the studied Reihe in the structured curriculum.
  // Division uses its divisor. The two directions stay related but independent.
  function classifyProblem(problem) {
    const skill = skillForStage(problem?.curriculumStage);
    if (!skill) return { skillId: null, subskillId: null };
    const factor = problem.operation === "multiply" ? (skill.stage === 23 && Number(problem.b) === 0 ? 0 : Number(problem.a))
      : problem.operation === "divide" ? Number(problem.b) : null;
    const id = factor !== null && Number.isInteger(factor)
      ? `${problem.operation}:table:${factor}` : null;
    return { skillId: skill.id, subskillId: id && skill.subskills.includes(id) ? id : null };
  }
  function makeProblemForSkill(id, generateStage, index, profile) {
    const stage = stageForSkill(id);
    if (!stage) throw new Error(`Unknown skill: ${id}`);
    const problem = generateStage(stage, index, profile);
    const descriptor = getSkill(id);
    if (problem.curriculumStage !== stage || (descriptor && !descriptor.operations.includes(problem.operation))) {
      throw new Error(`Problem violates skill contract: ${id}`);
    }
    return problem;
  }

  window.KapiSkills = Object.freeze({ KAPI_SKILLS, SUBSKILLS, STAGE_SKILLS, skillForStage, canonicalId, stageForSkill,
    getSkill, getSubskill, subskillLabel, classifyProblem, chapterIdForSkill, label, makeProblemForSkill });
})();
