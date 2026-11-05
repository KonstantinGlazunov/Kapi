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
  function validateBackup(text, template = {}) {
    if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_BYTES) throw new Error("Backup too large");
    const backup = JSON.parse(text);
    safeTree(backup);
    if (backup.format !== "kapi-backup" || ![1, 2].includes(backup.version) || !object(backup.data)) throw new Error("Unsupported backup");
    const { profile, settings, history } = backup.data;
    if (!object(profile) || !object(settings) || !Array.isArray(history) || history.length > 30) throw new Error("Invalid sections");
    if (profile.journey !== undefined && (!object(profile.journey) || !Number.isInteger(profile.journey.step) || profile.journey.step < 0 || profile.journey.step > 23 || !Array.isArray(profile.journey.sessions) || profile.journey.sessions.length > 23 || profile.journey.sessions.some(id => typeof id !== "string"))) throw new Error("Invalid journey");
    if (profile.cosmeticVariants !== undefined && (!object(profile.cosmeticVariants) || Object.entries(profile.cosmeticVariants).some(([key,value]) => !({"neck-scarf":["berry","sky"],backpack:["stars","forest"]}[key] || []).includes(value)))) throw new Error("Invalid outfit variants");
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
    const taskSystem = new window.KapiTaskSystem();
    for (const queue of profile.errorQueue) {
      if (!taskSystem.isValidReviewProblem(queue)) throw new Error("Invalid review task");
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
    if (settings.rangeLocked !== undefined && typeof settings.rangeLocked !== "boolean") throw new Error("Invalid range lock");
    for (const item of history) {
      if (!object(item) || typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date)) ||
        !Number.isInteger(item.correct) || ![10, 20, 30].includes(item.total || 20) || item.correct < 0 || item.correct > (item.total || 20) ||
        !Number.isFinite(item.average) || item.average < 0 || !Number.isFinite(item.score) || item.score < 0 ||
        (item.trouble !== undefined && (!Array.isArray(item.trouble) || item.trouble.some((key) => typeof key !== "string")))) throw new Error("Invalid history");
      if (item.mistakes !== undefined && (!Array.isArray(item.mistakes) || item.mistakes.length > 30 || item.mistakes.some(entry =>
        !object(entry) || !taskSystem.isValidReviewProblem({ ...entry.problem, correctStreak: 0, lastShown: 0 }) || !Array.isArray(entry.responses) || entry.responses.length > 2 ||
        entry.responses.some(value => typeof value !== 'string' || value.length > 100)))) throw new Error("Invalid history mistakes");
    }
    if (backup.version === 2) {
      if (!window.KapiParentReport) throw new Error("Parent report unavailable");
      window.KapiParentReport.validateSnapshot(backup.data.report);
    } else if (backup.data.report !== undefined) throw new Error("Unexpected report");
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
      checkpoint() {
        try { return { ok:true, value:access().getItem(BUNDLE) }; }
        catch { fail(BUNDLE); return { ok:false }; }
      },
      restoreCheckpoint(checkpoint) {
        try {
          if (!checkpoint?.ok) return false;
          if (checkpoint.value === null) access().removeItem(BUNDLE); else access().setItem(BUNDLE,checkpoint.value);
          memory.clear(); blocked.clear(); unavailable=false;
          return true;
        } catch { fail(BUNDLE); return false; }
      },
      exportBackup(data) { return JSON.stringify({ format: "kapi-backup", version: data.report ? 2 : 1, exportedAt: new Date().toISOString(), data }, null, 2); },
      validateBackup,
      importBackup(data) {
        // Validate again at the persistence boundary, even for non-UI callers.
        try { data = validateBackup(JSON.stringify({ format: "kapi-backup", version: data.report ? 2 : 1, data })); }
        catch { return false; }
        // A single durable write is the commit point. No partial three-key import.
        const next = Object.fromEntries(Object.entries(KEYS).map(([name, key]) => [key, JSON.stringify(data[name])]));
        try { access().setItem(BUNDLE, JSON.stringify(next)); }
        catch { fail(BUNDLE); return false; }
        memory.clear(); blocked.clear(); unavailable = false;
        return true;
      }
    };
  }

  // Report events have their own transactional store: two tabs cannot overwrite
  // one another's result, while profile/settings retain their existing format.
  function createReportStore(onFailure = () => {}) {
    const model = window.KapiParentReport, pending = new Map();
    const scope = new URL(".", window.location.href).pathname;
    const name = "kapi-parent-report-v1:" + scope;
    const ping = "kapi-parent-report-changed:" + scope;
    let opened;
    let channel = null;
    try { if (typeof window.BroadcastChannel === "function") channel = new window.BroadcastChannel(ping); }
    catch { /* A storage event is sufficient when channels are unavailable. */ }
    if (channel) channel.onmessage=()=>window.dispatchEvent(new Event("kapi-parent-report-change"));
    const notify = () => {
      try { channel?.postMessage("changed"); } catch { /* Storage event remains the fallback. */ }
      try { window.localStorage.setItem(ping, String(Date.now()) + ":" + Math.random()); } catch { /* IDB remains authoritative. */ }
      window.dispatchEvent(new Event("kapi-parent-report-change"));
    };
    function open() {
      if (opened) return opened;
      opened = new Promise((resolve,reject) => {
        if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
        const request = window.indexedDB.open(name, 2);
        request.onupgradeneeded = () => {
          const db=request.result;
          if (!db.objectStoreNames.contains("records")) {
            const records=db.createObjectStore("records",{keyPath:"id"});
            records.createIndex("skill","skillId",{unique:false});
          }
          if (!db.objectStoreNames.contains("seen")) {
            const seen=db.createObjectStore("seen",{keyPath:"id"});
            seen.createIndex("date","date",{unique:false});
          }
          if (!db.objectStoreNames.contains("summaries")) db.createObjectStore("summaries",{keyPath:"id"});
          if (!db.objectStoreNames.contains("states")) db.createObjectStore("states",{keyPath:"id"});
          if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta",{keyPath:"id"});
        };
        request.onerror=()=>reject(request.error || new Error("Cannot open report"));
        request.onblocked=()=>reject(new Error("Report storage blocked"));
        request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result)};
      }).catch(error=>{opened=null;throw error});
      return opened;
    }
    function done(tx) {
      return new Promise((resolve,reject)=>{
        tx.oncomplete=()=>resolve();
        tx.onabort=()=>reject(tx.error || new Error("Report transaction aborted"));
        tx.onerror=()=>{}; // onabort carries the failure.
      });
    }
    const stores=["records","seen","summaries","states","meta"];
    async function append(row) {
      const initialSummaries = {[row.skillId]:model.addToSummary(null,row)};
      if (row.subskillId) {
        const part=model.partKey(row.skillId,row.subskillId);
        initialSummaries[part]=model.addToSummary(null,{...row,skillId:part});
      }
      model.validateSnapshot({version:1,records:[row],summaries:initialSummaries,states:{}});
      if (pending.has(row.id)) return false;
      pending.set(row.id,row); notify();
      try {
        const db=await open(), tx=db.transaction(stores,"readwrite"), finished=done(tx);
        const records=tx.objectStore("records"), seen=tx.objectStore("seen"), summaries=tx.objectStore("summaries"), states=tx.objectStore("states");
        let added=false;
        const existing=seen.get(row.id);
        existing.onsuccess=()=>{
          if (existing.result) return;
          added=true; seen.put({id:row.id,date:row.date}); records.put(row);
          const meta=tx.objectStore("meta"), revision=meta.get("revision");
          revision.onsuccess=()=>meta.put({id:"revision",value:(revision.result?.value || 0)+1});
          const oldSummary=summaries.get(row.skillId);
          oldSummary.onsuccess=()=>summaries.put(model.addToSummary(oldSummary.result,row));
          if (row.subskillId) {
            const part=model.partKey(row.skillId,row.subskillId), oldPart=summaries.get(part);
            oldPart.onsuccess=()=>summaries.put(model.addToSummary(oldPart.result,{...row,skillId:part}));
          }
          const current=records.index("skill").getAll(row.skillId);
          current.onsuccess=()=>{
            const rows=current.result.sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)||a.id.localeCompare(b.id));
            const buckets=new Map();
            for(const item of rows) {const bucket=item.subskillId||"";const list=buckets.get(bucket)||[];list.push(item);buckets.set(bucket,list);}
            for(const items of buckets.values())
              for(const old of items.slice(0,Math.max(0,items.length-model.THRESHOLDS.retainedPerSkill))) records.delete(old.id);
            const prior=states.get(row.skillId);
            prior.onsuccess=()=>states.put({id:row.skillId,...model.advanceState(rows,prior.result)});
            if(row.subskillId) {
              const part=model.partKey(row.skillId,row.subskillId), priorPart=states.get(part);
              priorPart.onsuccess=()=>states.put({id:part,...model.advanceState(rows.filter(item=>item.subskillId===row.subskillId),priorPart.result)});
            }
          };
          // IDs remain for at least ten thousand observations, even after
          // detailed records are compacted. The app never restores an open task.
          const count=seen.count();
          count.onsuccess=()=>{
            let excess=count.result-10000;
            if (excess<=0) return;
            const cursor=seen.index("date").openCursor();
            cursor.onsuccess=()=>{const item=cursor.result;if(item && excess>0){item.delete();excess--;item.continue()}};
          };
        };
        await finished; pending.delete(row.id); notify(); return added;
      } catch(error) { onFailure(error); notify(); return false; }
    }
    async function snapshot() {
      let data=model.emptySnapshot();
      try {
        const db=await open(), tx=db.transaction(["records","summaries","states","meta"],"readonly"), finished=done(tx);
        const requests=["records","summaries","states"].map(store=>tx.objectStore(store).getAll());
        const revision=tx.objectStore("meta").get("revision");
        await finished;
        data={version:1,records:requests[0].result,
          summaries:Object.fromEntries(requests[1].result.map(x=>[x.id,x])),
          states:Object.fromEntries(requests[2].result.map(({id,...rest})=>[id,rest])),revision:revision.result?.value || 0};
      } catch(error) { onFailure(error); data={...model.emptySnapshot(),partial:true}; }
      for (const row of pending.values()) if (!data.records.some(item=>item.id===row.id)) {
        data.records.push(row); data.summaries[row.skillId]=model.addToSummary(data.summaries[row.skillId],row);
        const same=data.records.filter(item=>item.skillId===row.skillId);
        data.states[row.skillId]=model.advanceState(same,data.states[row.skillId]);
        if (row.subskillId) {
          const part=model.partKey(row.skillId,row.subskillId);
          data.summaries[part]=model.addToSummary(data.summaries[part],{...row,skillId:part});
          data.states[part]=model.advanceState(same.filter(item=>item.subskillId===row.subskillId),data.states[part]);
        }
      }
      // Failed writes remain in memory for export. Keep the most recent
      // detail per skill while totals include every pending observation.
      const groups=new Map();
      for(const row of data.records) { const bucket=row.subskillId ? model.partKey(row.skillId,row.subskillId) : row.skillId; const list=groups.get(bucket)||[]; list.push(row); groups.set(bucket,list); }
      data.records=[...groups.values()].flatMap(rows=>rows.sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)||a.id.localeCompare(b.id)).slice(-model.THRESHOLDS.retainedPerSkill));
      return data;
    }
    async function replace(data, commitLocal = () => true, expectedRevision = null) {
      model.validateSnapshot(data);
      if (pending.size) throw new Error("Unsaved report observations");
      const db=await open();
      if (pending.size) throw new Error("Unsaved report observations");
      const tx=db.transaction(stores,"readwrite"), finished=done(tx), meta=tx.objectStore("meta");
      let conflict=false;
      const revision=meta.get("revision");
      revision.onsuccess=()=>{
        const current=revision.result?.value || 0;
        if (expectedRevision !== null && current !== expectedRevision) {
          conflict=true; tx.abort(); return;
        }
        for(const name of ["records","seen","summaries","states"]) tx.objectStore(name).clear();
        for(const row of data.records) {
          tx.objectStore("records").put(row); tx.objectStore("seen").put({id:row.id,date:row.date});
        }
        for(const value of Object.values(data.summaries)) tx.objectStore("summaries").put(value);
        for(const [id,value] of Object.entries(data.states)) tx.objectStore("states").put({id,...value});
        meta.put({id:"revision",value:current+1});
        // Local bundle and report are committed under the same exclusive
        // transaction. A concurrent completed task forces a visible retry.
        const barrier=tx.objectStore("states").get("__commit_barrier__");
        barrier.onsuccess=()=>{ try { if (!commitLocal()) tx.abort(); } catch { tx.abort(); } };
      };
      try { await finished; } catch (error) { if (conflict) throw new Error("REPORT_CHANGED"); throw error; }
      notify();
    }
    window.addEventListener("storage", event=>{if(event.key===ping)window.dispatchEvent(new Event("kapi-parent-report-change"))});
    return {append,snapshot,replace};
  }

  window.KapiStorage = { create, createReportStore, validateBackup, MAX_BYTES, KEYS };
})();
