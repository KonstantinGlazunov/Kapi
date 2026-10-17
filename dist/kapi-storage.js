(() => {
  "use strict";
  const KEYS = { profile: "capy-count-profile-v1", settings: "capy-count-settings-v1", history: "capy-count-history-v1" };
  const BUNDLE = "capy-count-data-v1";
  const MAX_BYTES = 2 * 1024 * 1024;
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  function safeTree(value, depth = 0) {
    if (depth > 14) throw new Error("Backup too deep");
    if (value === null || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e14) return;
    if (typeof value === "string" && value.length <= 4000 && !/[<>\u0000]/.test(value)) return;
    if (Array.isArray(value) && value.length <= 10000) { value.forEach((item) => safeTree(item, depth + 1)); return; }
    if (object(value) && Object.keys(value).length <= 2000) {
      for (const [key, item] of Object.entries(value)) {
        if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Unsafe key");
        safeTree(item, depth + 1);
      }
      return;
    }
    throw new Error("Invalid backup value");
  }
  function validateBackup(text, template) {
    if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_BYTES) throw new Error("Backup too large");
    const backup = JSON.parse(text);
    safeTree(backup);
    if (backup.format !== "kapi-backup" || backup.version !== 1 || !object(backup.data)) throw new Error("Unsupported backup");
    const { profile, settings, history } = backup.data;
    if (!object(profile) || !object(settings) || !Array.isArray(history) || history.length > 30) throw new Error("Invalid sections");
    // Validate every known top-level field before any data can replace local progress.
    for (const [key, expected] of Object.entries(template)) {
      if (!(key in profile)) continue; // Older profiles are migrated additively by the app.
      const value = profile[key];
      if (Array.isArray(expected) ? !Array.isArray(value) : object(expected) ? !object(value)
        : expected !== null && typeof value !== typeof expected) throw new Error(`Invalid profile: ${key}`);
    }
    for (const key of ["personalFastTime", "bestPersonalFastTime", "recordMilestoneTime"]) {
      if (profile[key] !== undefined && profile[key] !== null && (!Number.isFinite(profile[key]) || profile[key] <= 0)) throw new Error("Invalid pace");
    }
    if (profile.lastDay !== undefined && profile.lastDay !== null &&
      (typeof profile.lastDay !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(profile.lastDay))) throw new Error("Invalid day");
    if (!Number.isInteger(profile.currentStage) || profile.currentStage < 1 || profile.currentStage > 41 ||
      !Number.isFinite(profile.totalXp) || profile.totalXp < 0 || !Array.isArray(profile.errorQueue) ||
      !Number.isInteger(profile.curriculumVersion) || profile.curriculumVersion > 2) throw new Error("Invalid progress");
    for (const queue of profile.errorQueue) {
      const operand = (value) => Number.isFinite(value) || (typeof value === "string" && /^-?\d+\/[1-9]\d*$/.test(value));
      if (!object(queue) || typeof queue.key !== "string" || !operand(queue.a) || !operand(queue.b)) throw new Error("Invalid review queue");
    }
    for (const field of ["skillMastery", "subskillMastery", "operationStats", "curriculumStats", "equippedOutfit"]) {
      if (profile[field] !== undefined && !object(profile[field])) throw new Error("Invalid profile map");
    }
    for (const field of ["skillMastery", "subskillMastery"]) {
      for (const record of Object.values(profile[field] || {})) if (!object(record)) throw new Error("Invalid skill record");
    }
    for (const field of ["operationStats", "curriculumStats"]) {
      for (const results of Object.values(profile[field] || {})) {
        if (!Array.isArray(results) || results.some((value) => value !== 0 && value !== 1)) throw new Error("Invalid learning results");
      }
    }
    for (const field of ["weeklyHistory", "weeklySessions"]) {
      const entries = field === "weeklyHistory" ? profile[field] || [] : profile[field] ? [profile[field]] : [];
      for (const week of entries) {
        if (!object(week) || typeof week.weekKey !== "string" || !/^\d{4}-W\d{2}$/.test(week.weekKey) ||
          !Array.isArray(week.sessionIds) || week.sessionIds.some((id) => typeof id !== "string")) throw new Error("Invalid week");
        if (field === "weeklySessions" && (!Array.isArray(week.days) || week.days.some((day) => typeof day !== "string") ||
          !Number.isInteger(week.count) || week.count < 0)) throw new Error("Invalid current week");
      }
    }
    if (!["de", "ru"].includes(settings.language) || ![10, 20, 30].includes(settings.problemCount) ||
      typeof settings.automatic !== "boolean" || typeof settings.sound !== "boolean" ||
      !["10", "20", "100", "above100"].includes(String(settings.range)) ||
      !Number.isInteger(settings.manualStage) || settings.manualStage < 1 || settings.manualStage > 41 ||
      !Array.isArray(settings.operations) || !settings.operations.length ||
      settings.operations.some((op) => !["add", "subtract", "multiply", "divide", "negative", "decimal", "fraction", "power", "root"].includes(op))) throw new Error("Invalid settings");
    for (const item of history) {
      if (!object(item) || typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date)) ||
        !Number.isInteger(item.correct) || ![10, 20, 30].includes(item.total || 20) || item.correct < 0 || item.correct > (item.total || 20) ||
        !Number.isFinite(item.average) || item.average < 0 || !Number.isFinite(item.score) || item.score < 0 ||
        (item.trouble !== undefined && (!Array.isArray(item.trouble) || item.trouble.some((key) => typeof key !== "string")))) throw new Error("Invalid history");
    }
    return backup.data;
  }
  function create(access, onFailure = () => {}) {
    const memory = new Map(), blocked = new Set();
    let unavailable = false;
    function fail(key) { unavailable = true; onFailure(key); }
    function bundle() {
      const raw = access().getItem(BUNDLE);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!object(value) || Object.values(value).some((item) => item !== null && typeof item !== "string")) throw new Error("Invalid storage bundle");
      return value;
    }
    function getItem(key) {
      if (unavailable && memory.has(key)) return memory.get(key);
      try {
        const data = bundle();
        const value = data && Object.hasOwn(data, key) ? data[key] : access().getItem(key);
        memory.set(key, value);
        return value;
      } catch { fail(key); return memory.get(key) ?? null; }
    }
    function write(key, value) {
      memory.set(key, value);
      if (blocked.has(key)) return false; // Preserve corrupt originals for recovery.
      try {
        const data = bundle();
        if (data) { data[key] = value; access().setItem(BUNDLE, JSON.stringify(data)); }
        else if (value === null) access().removeItem(key);
        else access().setItem(key, value);
        return true;
      } catch { fail(key); return false; }
    }
    function readJSON(key, fallback) {
      try {
        const raw = getItem(key);
        if (raw === null) return fallback;
        const value = JSON.parse(raw);
        if (Array.isArray(fallback) ? !Array.isArray(value) : object(fallback) ? !object(value) : false) throw new Error("Invalid stored section");
        return value;
      } catch { blocked.add(key); fail(key); return fallback; }
    }
    return {
      markCorrupt: (key) => { blocked.add(key); fail(key); },
      getItem, setItem: (key, value) => write(key, String(value)), removeItem: (key) => write(key, null), readJSON,
      get failed() { return unavailable; },
      exportBackup(data) { return JSON.stringify({ format: "kapi-backup", version: 1, exportedAt: new Date().toISOString(), data }, null, 2); },
      validateBackup,
      importBackup(data) {
        // A single durable write is the commit point. No partial three-key import.
        const next = Object.fromEntries(Object.entries(KEYS).map(([name, key]) => [key, JSON.stringify(data[name])]));
        try { access().setItem(BUNDLE, JSON.stringify(next)); }
        catch { fail(BUNDLE); return false; }
        memory.clear(); blocked.clear(); unavailable = false;
        return true;
      }
    };
  }
  window.KapiStorage = { create, validateBackup, MAX_BYTES, KEYS };
})();
