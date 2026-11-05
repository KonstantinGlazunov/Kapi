(() => {
  "use strict";

  // Product parameters are deliberately separate from adaptive training.
  const THRESHOLDS = Object.freeze({ minimum: 5, window: 20, confidentMinimum: 10,
    growingShare: .70, independentShare: .85, declineWindow: 5, declineFailures: 3,
    retainedPerSkill: 60, weeklyMinimum: 5, improvement: .20 });
  const STATES = Object.freeze(["new", "support", "growing", "independent"]);
  const own = r => r.firstCorrect && r.errors === 0 && !r.hint && !r.solution && r.outcome === "independent";
  const rank = status => Math.max(0, STATES.indexOf(status));
  const partKey = (skillId, subskillId) => skillId + "|" + subskillId;
  function validAggregateKey(id, catalog) {
    if (id === "unclassified") return true;
    const [skillId,subskillId,...rest]=id.split("|"), skill=catalog.getSkill(skillId);
    return !!skill && rest.length===0 && (subskillId ? skill.subskills.includes(subskillId) : id === skillId);
  }
  const time = r => Date.parse(r.date) || 0;
  const sorted = records => [...records].sort((a,b) => time(a)-time(b) || a.id.localeCompare(b.id));

  function candidate(records) {
    const rows = sorted(records).slice(-THRESHOLDS.window);
    const successes = rows.filter(own);
    const share = rows.length ? successes.length / rows.length : 0;
    if (rows.length < THRESHOLDS.minimum) return "new";
    if (rows.length < THRESHOLDS.confidentMinimum || share < THRESHOLDS.growingShare) return "support";
    const days = new Map();
    for (const row of successes) {
      const sessions = days.get(row.day) || new Set(); sessions.add(row.sessionId); days.set(row.day, sessions);
    }
    const orderedDays = [...days.keys()].sort();
    const twoVisits = orderedDays.some((day,i) => orderedDays.slice(i+1).some(later =>
      [...days.get(day)].some(session => [...days.get(later)].some(next => next !== session))));
    if (share >= THRESHOLDS.independentShare && twoVisits && successes.some(r => r.format === "input")) return "independent";
    return "growing";
  }

  // Downgrades need three difficulties in the last five observations after
  // the last promotion, even if a single result crosses a threshold.
  function advanceState(records, previous) {
    const rows = sorted(records), next = candidate(rows), last = rows.at(-1);
    const prior = previous && STATES.includes(previous.status) ? previous : {status:"new", recent:[], refresh:false, anchor:null};
    if (!last) return prior;
    const anchor = {date:last.date,id:last.id};
    if (rank(next) > rank(prior.status)) return {status:next,recent:[],refresh:false,anchor};
    // Reconstruct the recent window in event order, including when a second
    // tab commits an earlier observation after a later one.
    const recent = prior.anchor
      ? rows.filter(row=>time(row)>Date.parse(prior.anchor.date) ||
          (time(row)===Date.parse(prior.anchor.date) && row.id>prior.anchor.id))
        .slice(-THRESHOLDS.declineWindow).map(row=>!own(row))
      : [...(Array.isArray(prior.recent) ? prior.recent : []), !own(last)].slice(-THRESHOLDS.declineWindow);
    const difficulties = recent.filter(Boolean).length >= THRESHOLDS.declineFailures;
    if (rank(next) < rank(prior.status) && difficulties)
      return {status:next,recent:[],refresh:true,anchor};
    return {status:prior.status,recent,refresh:(prior.refresh === true || (rank(prior.status)>=2 && difficulties)) && rank(next) <= rank(prior.status),anchor:prior.anchor || null};
  }

  function emptySummary(id) {
    return {id,total:0,independent:0,corrected:0,supported:0,solution:0,choice:0,input:0,independentChoice:0,independentInput:0,last:null};
  }
  function addToSummary(old, row) {
    const s = {...emptySummary(row.skillId), ...(old || {})};
    s.total++; s[row.outcome]++; s[row.format]++;
    if (own(row)) s[row.format === "choice" ? "independentChoice" : "independentInput"]++;
    if (!s.last || time(row) >= Date.parse(s.last)) s.last = row.date;
    return s;
  }

  function assess(records, summaries = {}, states = {}, catalog = window.KapiSkills) {
    const groups = new Map();
    for (const row of sorted(records)) {
      if (!catalog.getSkill(row.skillId)) continue;
      const group = groups.get(row.skillId) || []; group.push(row); groups.set(row.skillId,group);
    }
    return [...groups].map(([id, rows]) => {
      const recent = rows.slice(-THRESHOLDS.window), summary = summaries[id] || rows.reduce(addToSummary,null);
      const selected = states[id]?.status || candidate(rows);
      const parts=[...new Set(rows.map(row=>row.subskillId).filter(Boolean))].map(subskillId=>{
        const partRows=rows.filter(row=>row.subskillId===subskillId), partRecent=partRows.slice(-THRESHOLDS.window);
        const key=partKey(id,subskillId);
        return {id:key,subskillId,rows:partRows,recent:partRecent,
          summary:summaries[key] || partRows.reduce((acc,row)=>addToSummary(acc,{...row,skillId:key}),null),
          status:states[key]?.status || candidate(partRows), refresh:states[key]?.refresh===true,
          own:partRecent.filter(own).length,
          choiceOnly:partRecent.some(own) && !partRecent.some(row=>own(row) && row.format==="input")};
      }).sort((a,b)=>a.subskillId.localeCompare(b.subskillId,undefined,{numeric:true}));
      return {id, skill:catalog.getSkill(id), rows, recent, summary, status:selected, parts,
        refresh:states[id]?.refresh === true, own:recent.filter(own).length,
        choiceOnly:recent.some(own) && !recent.some(row => own(row) && row.format === "input")};
    }).sort((a,b) => a.skill.stage-b.skill.stage);
  }

  function weekly(records, now = new Date()) {
    const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const cutoff = (days) => {const d=new Date(today);d.setDate(d.getDate()-days);return d;};
    const day = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
    const current = records.filter(r => r.day >= day(cutoff(6)) && r.day <= day(today));
    if (current.length < THRESHOLDS.weeklyMinimum) return null;
    const previous = records.filter(r => r.day >= day(cutoff(13)) && r.day < day(cutoff(6)));
    const keys = [...new Set(current.filter(r=>r.skillId!=="unclassified").map(r => [r.skillId,r.subskillId || "",r.stage,r.operation,r.taskType,r.format].join("|")))].sort();
    for (const key of keys) {
      const matches = r => [r.skillId,r.subskillId || "",r.stage,r.operation,r.taskType,r.format].join("|") === key;
      const a=previous.filter(matches), b=current.filter(matches);
      if(a.length>=THRESHOLDS.weeklyMinimum && b.length>=THRESHOLDS.weeklyMinimum &&
        b.filter(own).length/b.length-a.filter(own).length/a.length >= THRESHOLDS.improvement)
        return {count:current.length, improvement:true, skillId:b[0].skillId, subskillId:b[0].subskillId, format:b[0].format};
    }
    return {count:current.length, improvement:false};
  }

  function overview(assessments, language) {
    const ru = language === "ru", all = assessments.flatMap(a=>a.rows), independent = all.filter(own);
    if (!all.length) return ru ? [
      "После первых завершённых примеров здесь появится обзор.",
      "Сейчас можно начать знакомство с заданиями.",
      "Каждый решённый пример поможет точнее понять, что уже получается."
    ] : [
      "Nach den ersten abgeschlossenen Aufgaben entsteht hier ein Überblick.",
      "Jetzt könnt ihr die Aufgaben erst einmal kennenlernen.",
      "Jede gelöste Aufgabe hilft zu zeigen, was schon gelingt."
    ];
    if (all.length < THRESHOLDS.minimum) return ru ? [
      independent.length ? "Уже есть первые самостоятельные решения" + (independent.every(r=>r.format==="choice") ? " в заданиях с выбором ответа." : ".") : "Уже есть первые завершённые примеры.",
      "Сейчас знакомимся с заданиями. Выводов пока недостаточно.",
      "После следующих примеров обзор станет подробнее."
    ] : [
      independent.length ? "Erste Aufgaben wurden bereits selbstständig gelöst" + (independent.every(r=>r.format==="choice") ? " (Auswahlaufgaben)." : ".") : "Die ersten Aufgaben sind abgeschlossen.",
      "Die Aufgaben werden gerade kennengelernt. Für eine Einschätzung fehlen noch Daten.",
      "Mit weiteren Aufgaben wird der Überblick genauer."
    ];
    const strong = assessments.filter(a => rank(a.status) >= 2).slice(0,2);
    const order = {support:0,new:1,growing:2,independent:3};
    const growth = assessments.filter(a => a.status !== "independent" || a.refresh).sort((a,b)=>Number(b.refresh)-Number(a.refresh)||order[a.status]-order[b.status]||a.skill.stage-b.skill.stage)[0];
    const strongText = strong.length
      ? strong.map(a=>(a.status==="independent" ? (ru ? "Самостоятельно получается: " : "Selbstständig gelingt: ") : (ru ? "Всё увереннее: " : "Immer sicherer: ")) +
          a.skill[language] + (a.choiceOnly ? (ru ? " (выбор ответа)" : " (Auswahlaufgaben)") : "") + ".").join(" ")
      : independent.length ? (ru ? "Есть самостоятельные решения" : "Es gibt selbstständig gelöste Aufgaben") + (independent.every(r=>r.format==="choice") ? (ru ? " в заданиях с выбором ответа." : " bei Auswahlaufgaben.") : ".")
        : (ru ? "Завершённые примеры помогают разобраться в теме." : "Die abgeschlossenen Aufgaben helfen beim Kennenlernen des Themas.");
    const growthText = growth
      ? (ru ? "Для следующей практики подойдёт: " : "Für die nächste Übung passt: ") + growth.skill[language] + ". " +
        (growth.refresh ? (ru ? "Полезно немного освежить эту тему." : "Eine kurze Wiederholung dieses Themas kann helfen.")
         : ru ? "Подойдут несколько коротких примеров по этой теме." : "Einige kurze Aufgaben zu diesem Thema passen gut.")
      : (ru ? "Можно продолжить практику и постепенно знакомиться со следующей темой." : "Übt weiter und lernt nach und nach das nächste Thema kennen.");
    let supportedThenOwn = false;
    for (const a of assessments) {
      const rows=sorted(a.rows);
      supportedThenOwn ||= rows.some((r,i) => (r.hint || r.solution) && rows.slice(i+1).some(n => own(n) &&
        n.stage === r.stage && n.subskillId === r.subskillId && n.operation === r.operation && n.taskType === r.taskType && n.fact !== r.fact));
    }
    const corrected=all.some(r=>r.outcome==="corrected" || (r.errors>0 && r.outcome==="supported"));
    const joy = supportedThenOwn
      ? (ru ? "После помощи удалось самостоятельно решить похожий пример." : "Nach Unterstützung wurde eine ähnliche Aufgabe selbstständig gelöst.")
      : corrected ? (ru ? "Встречались примеры, исправленные после ошибки." : "Es gab Aufgaben, die nach einem Fehler verbessert wurden.")
      : independent.length ? (ru ? "Есть примеры, решённые самостоятельно" : "Es gibt Aufgaben, die selbstständig gelöst wurden") + (independent.every(r=>r.format==="choice") ? (ru ? " с выбором ответа." : " (Auswahlaufgaben).") : ".")
      : (ru ? "Каждый завершённый пример добавляет наблюдение." : "Jede abgeschlossene Aufgabe ergänzt den Überblick.");
    return [strongText,growthText,joy];
  }


  function validateSnapshot(data, catalog = window.KapiSkills) {
    if (!data || data.version !== 1 || (data.partial !== undefined && typeof data.partial !== "boolean") ||
        (data.revision !== undefined && (!Number.isSafeInteger(data.revision) || data.revision < 0)) || !Array.isArray(data.records) || data.records.length > THRESHOLDS.retainedPerSkill * (1 + catalog.KAPI_SKILLS.reduce((n,skill)=>n+1+skill.subskills.length,0)) ||
        !data.summaries || typeof data.summaries !== "object" || Array.isArray(data.summaries) ||
        !data.states || typeof data.states !== "object" || Array.isArray(data.states)) throw new Error("Invalid parent report");
    const ids=new Set(), bySkill=new Map(), byBucket=new Map();
    for (const r of data.records) {
      const unknown = r?.skillId === "unclassified", skill = r && catalog.getSkill(r.skillId);
      if ((!skill && !unknown) || typeof r.id !== "string" || !r.id || r.id.length>180 || ids.has(r.id) ||
          typeof r.sessionId !== "string" || !r.sessionId || r.sessionId.length>140 || !r.id.startsWith(r.sessionId + ":") ||
          typeof r.date !== "string" || !Number.isFinite(Date.parse(r.date)) ||
          typeof r.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) ||
          !Number.isFinite(Date.parse(r.day+"T00:00:00Z")) || new Date(r.day+"T00:00:00Z").toISOString().slice(0,10)!==r.day ||
          (unknown ? r.stage !== null : r.stage !== skill.stage) ||
          typeof r.operation !== "string" || (!unknown && !skill.operations.includes(r.operation)) || !/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(r.operation) ||
          !Number.isInteger(r.fact) || r.fact<0 || r.fact>4294967295 || typeof r.taskType !== "string" || !/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(r.taskType) ||
          !["choice","input"].includes(r.format) || typeof r.firstCorrect !== "boolean" ||
          !Number.isInteger(r.errors) || r.errors < 0 || r.errors > 2 ||
          typeof r.hint !== "boolean" || typeof r.solution !== "boolean" ||
          !["independent","corrected","supported","solution"].includes(r.outcome) ||
          (r.subskillId !== null && (unknown || !catalog.getSubskill(r.subskillId) || !skill.subskills.includes(r.subskillId))) ||
          !(r.activeSeconds === null || (Number.isFinite(r.activeSeconds) && r.activeSeconds >= 0 && r.activeSeconds <= 86400)) ||
          (r.firstCorrect !== (r.errors === 0 && !r.solution)) ||
          (r.solution !== (r.outcome === "solution")) || (r.solution && r.errors < 1) ||
          (r.outcome === "independent" && (!r.firstCorrect || r.errors || r.hint || r.solution)) ||
          (r.outcome === "corrected" && (!r.errors || r.hint || r.solution)) ||
          (r.outcome === "supported" && (!r.hint || r.solution))) throw new Error("Invalid report observation");
      ids.add(r.id); bySkill.set(r.skillId,(bySkill.get(r.skillId)||0)+1);
      const bucket=r.subskillId ? partKey(r.skillId,r.subskillId) : r.skillId;
      byBucket.set(bucket,(byBucket.get(bucket)||0)+1);
      if (byBucket.get(bucket)>THRESHOLDS.retainedPerSkill) throw new Error("Too many skill records");
    }
    for (const [id,s] of Object.entries(data.summaries)) {
      if (!validAggregateKey(id,catalog) || !s || s.id !== id ||
          !["total","independent","corrected","supported","solution","choice","input","independentChoice","independentInput"].every(k=>Number.isSafeInteger(s[k]) && s[k]>=0 && s[k]<=100000000) ||
          s.independent+s.corrected+s.supported+s.solution !== s.total || s.choice+s.input !== s.total ||
          s.independentChoice+s.independentInput !== s.independent ||
          s.independentChoice > s.choice || s.independentInput > s.input ||
          s.total < (id.includes("|") ? byBucket.get(id)||0 : bySkill.get(id)||0) ||
          (s.total > 0 && !(id.includes("|") ? byBucket.get(id) : bySkill.get(id))) || (s.total > 0 && s.last === null) || (s.last !== null && (typeof s.last !== "string" || !Number.isFinite(Date.parse(s.last)))))
        throw new Error("Invalid report aggregate");
    }
    for (const id of bySkill.keys()) if (!data.summaries[id]) throw new Error("Missing report aggregate");
    for (const id of byBucket.keys()) if (id.includes("|") && !data.summaries[id]) throw new Error("Missing subskill aggregate");
    const partTotals={};
    for (const id of Object.keys(data.summaries).filter(key=>key.includes("|"))) {
      const parent=id.split("|")[0];
      partTotals[parent]=(partTotals[parent]||0)+data.summaries[id].total;
      if (!data.summaries[parent] || partTotals[parent] > data.summaries[parent].total) throw new Error("Invalid subskill total");
    }
    for (const [id,state] of Object.entries(data.states)) {
      if (!validAggregateKey(id,catalog) || !data.summaries[id] || !state || !STATES.includes(state.status) ||
          !Array.isArray(state.recent) || state.recent.length > THRESHOLDS.declineWindow ||
          state.recent.some(value=>typeof value!=="boolean") || typeof state.refresh!=="boolean" ||
          (state.anchor !== undefined && state.anchor !== null && (!state.anchor || typeof state.anchor.id!=="string" ||
            state.anchor.id.length>180 || typeof state.anchor.date!=="string" || !Number.isFinite(Date.parse(state.anchor.date)))) ||
          (rank(state.status)>=2 && (data.summaries[id].total<THRESHOLDS.confidentMinimum ||
            (id.includes("|") ? byBucket.get(id)||0 : bySkill.get(id)||0)<THRESHOLDS.confidentMinimum)) ||
          (state.status==="independent" && (data.summaries[id].independent<9 || data.summaries[id].independentInput<1)))
        throw new Error("Invalid report status");
    }
    return data;
  }

  function emptySnapshot() { return {version:1,records:[],summaries:{},states:{}}; }

  const api = {THRESHOLDS,STATES,own,candidate,advanceState,emptySummary,addToSummary,partKey,assess,weekly,overview,validateSnapshot,emptySnapshot};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.KapiParentReport = Object.freeze(api);
})();
