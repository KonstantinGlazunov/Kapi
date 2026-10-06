(() => {
  "use strict";

  // Each skill names one curriculum contract. The stage generator remains the
  // source of the arithmetic rules; this catalog describes its meaning.
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
    { id: "mixed:add-sub-to20", stage: 14, operations: ["add", "subtract"], de: "Plus und Minus bis 20", ru: "Сложение и вычитание до 20" }
  ].map((skill) => Object.freeze({ ...skill, operations: Object.freeze(skill.operations) })));
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
    return byId.get(canonical)?.stage || (/^stage:(?:1[5-9]|[2-3]\d|4[01])$/.test(canonical) ? Number(canonical.slice(6)) : null);
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

  window.KapiSkills = Object.freeze({ KAPI_SKILLS, STAGE_SKILLS, skillForStage, canonicalId, stageForSkill,
    getSkill, chapterIdForSkill, label, makeProblemForSkill });
})();
