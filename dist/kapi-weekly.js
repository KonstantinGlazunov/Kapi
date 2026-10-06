(function () {
  "use strict";

  const GOALS = Object.freeze([2, 3, 4, 5]);
  const HISTORY_LIMIT = 12;
  const pad = (n) => String(n).padStart(2, "0");
  const asDate = (value) => value instanceof Date ? value : new Date(value);

  function getLocalDateKey(value = new Date()) {
    const date = asDate(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function getWeekStart(value = new Date()) {
    const date = asDate(value);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  }

  function getWeekKey(value = new Date()) {
    const monday = getWeekStart(value);
    // ISO week year belongs to the Thursday of that week. UTC is used only
    // for the ordinal calculation, after extracting the user's local date.
    const thursday = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3));
    const year = thursday.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(year, 0, 4));
    firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
    return `${year}-W${pad(1 + Math.round((thursday - firstThursday) / 604800000))}`;
  }

  const validGoal = (value) => GOALS.includes(Number(value)) ? Number(value) : 3;
  const validSession = (session) => session && session.completed !== false && [10, 20, 30].includes(Number(session.total)) &&
    Number.isFinite(Date.parse(session.date));
  const emptyWeek = (date) => ({ weekKey: getWeekKey(date), count: 0, days: [], sessionIds: [] });

  function closePreviousWeek(profile, date = new Date()) {
    const current = getWeekKey(date);
    if (!profile.weeklySessions || profile.weeklySessions.weekKey === current) return false;
    const previous = profile.weeklySessions;
    if (previous.weekKey && /^\d{4}-W\d{2}$/.test(previous.weekKey)) {
      profile.weeklyHistory ||= [];
      profile.weeklyHistory = [
        { weekKey: previous.weekKey, sessions: previous.count, goal: validGoal(previous.goal || profile.weeklyGoal), completed: previous.count >= validGoal(previous.goal || profile.weeklyGoal), sessionIds: [...previous.sessionIds] },
        ...profile.weeklyHistory.filter((item) => item.weekKey !== previous.weekKey)
      ].sort((a, b) => b.weekKey.localeCompare(a.weekKey)).slice(0, HISTORY_LIMIT);
    }
    profile.weeklySessions = emptyWeek(date);
    return true;
  }

  function migrate(profile, history = [], date = new Date()) {
    let changed = false;
    if (!GOALS.includes(profile.weeklyGoal)) { profile.weeklyGoal = 3; changed = true; }
    if (!Array.isArray(profile.weeklyHistory)) { profile.weeklyHistory = []; changed = true; }
    if (!profile.weeklySessions || !Array.isArray(profile.weeklySessions.sessionIds)) {
      const week = emptyWeek(date);
      history.forEach((session, index) => {
        if (!validSession(session) || getWeekKey(session.date) !== week.weekKey) return;
        const id = String(session.id || `legacy:${session.date}:${index}`);
        if (week.sessionIds.includes(id)) return;
        week.sessionIds.push(id);
        week.count++;
        const day = getLocalDateKey(session.date);
        if (!week.days.includes(day)) week.days.push(day);
      });
      profile.weeklySessions = week;
      changed = true;
    }
    if (closePreviousWeek(profile, date)) changed = true;
    return changed;
  }

  function getWeeklyProgress(profile, date = new Date()) {
    const goal = validGoal(profile.weeklyGoal);
    const week = profile.weeklySessions?.weekKey === getWeekKey(date) ? profile.weeklySessions : emptyWeek(date);
    return { weekKey: week.weekKey, count: week.count, goal, remaining: Math.max(0, goal - week.count), completed: week.count >= goal, days: [...week.days] };
  }

  function recordCompletedSession(profile, sessionId, date = new Date()) {
    if (!sessionId) throw new Error("Completed session needs an ID");
    migrate(profile, [], date);
    closePreviousWeek(profile, date);
    const week = profile.weeklySessions;
    if (week.sessionIds.includes(String(sessionId))) return { recorded: false, weeklyGoalComplete: false, event: null, progress: getWeeklyProgress(profile, date) };
    const before = week.count;
    week.sessionIds.push(String(sessionId));
    week.count++;
    const day = getLocalDateKey(date);
    if (!week.days.includes(day)) week.days.push(day);
    // Capture the goal for the completed week; settings changes affect only
    // the current target and never fire an achievement by themselves.
    week.goal = validGoal(profile.weeklyGoal);
    const goal = week.goal;
    const reached = before < goal && week.count >= goal;
    return { recorded: true, weeklyGoalComplete: reached, event: reached ? { type: "weeklyGoalComplete", weekKey: week.weekKey } : null,
      progress: getWeeklyProgress(profile, date) };
  }

  function getHistorySummary(profile, history, date = new Date()) {
    const currentWeek = getWeekKey(date);
    const keys = Array.from({ length: 4 }, (_, index) => {
      const day = getWeekStart(date);
      day.setDate(day.getDate() - index * 7);
      return getWeekKey(day);
    });
    const records = new Map((profile.weeklyHistory || []).map((item) => [item.weekKey, item.sessions]));
    records.set(currentWeek, getWeeklyProgress(profile, date).count);
    for (const key of keys.slice(1)) {
      if (!records.has(key)) records.set(key, history.filter((item) => validSession(item) && getWeekKey(item.date) === key).length);
    }
    const lastFourWeeks = keys.reduce((sum, key) => sum + (Number(records.get(key)) || 0), 0);
    const recent = history.filter((item) => validSession(item) && keys.includes(getWeekKey(item.date)));
    const chronological = [...recent].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    return { thisWeek: getWeeklyProgress(profile, date).count, lastFourWeeks,
      stageStart: chronological[0]?.stageStart ?? chronological[0]?.stage ?? null,
      stageEnd: chronological.at(-1)?.stageEnd ?? chronological.at(-1)?.stage ?? null };
  }

  window.KapiWeeklyProgress = Object.freeze({ GOALS, getLocalDateKey, getWeekKey, getWeekStart, getWeeklyProgress,
    recordCompletedSession, closePreviousWeek, migrate, getHistorySummary });
})();
