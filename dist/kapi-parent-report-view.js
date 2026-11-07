(() => {
  "use strict";
  const model=window.KapiParentReport, catalog=window.KapiSkills;
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const labels={
    ru:{
      title:"Успехи ребёнка", intro:"Наблюдения по заданиям Капи.", method:"Как устроена оценка", stability:"Одна ошибка не снижает подтверждённый статус. Три затруднения среди пяти новых заданий могут стать поводом его пересмотреть.",
      sections:["Что получается","Что сейчас тренируем","Что радует в продвижении"],
      status:{new:"Знакомимся",support:"Получается с поддержкой",growing:"Всё увереннее",independent:"Получается самостоятельно"},
      reasons:{
        new:"Пока меньше пяти завершённых примеров. Мы знакомимся с темой.",
        support:"Пока полезна практика. Ниже отдельно показаны исправления и помощь.",
        growing:"Статус достигнут после не менее 10 примеров и 70% самостоятельных первых ответов.",
        independent:"Статус подтверждён после не менее 10 примеров и 85% самостоятельных первых ответов, включая самостоятельное возвращение в другой день."
      },
      choiceOnly:"Пока самостоятельные успехи получены только в заданиях с выбором ответа.",
      refresh:"Полезно немного освежить эту тему.",
      observations:"Завершено примеров", own:"Самостоятельно", corrected:"Исправлено без подсказки",
      supported:"Решено после подсказки", solution:"После показа решения", choice:"Выбор варианта", input:"Самостоятельный ввод",
      recent:"Без помощи с первой попытки в последних заданиях", last:"Последняя практика",
      practice:"Потренировать эту тему", previous:"Прошлые занятия",
      legacy:"Прошлые занятия остаются в истории. Подробный отчёт собирается только по новым завершённым примерам.",
      week:"За последние 7 дней", observationsShort:"сохранённых примеров",
      weekImproved:"В сопоставимых сохранённых заданиях этой темы доля самостоятельных первых ответов выросла по сравнению с предыдущими 7 днями.",
      choices:"выбор варианта", typed:"самостоятельный ввод", subskill:"Поднавыки"
    },
    de:{
      title:"Lernfortschritt", intro:"Beobachtungen aus Kapis Aufgaben.", method:"Wie wird eingeschätzt?", stability:"Ein einzelner Fehler senkt einen bestätigten Status nicht. Bei drei Schwierigkeiten in fünf neuen Aufgaben wird er erneut geprüft.",
      sections:["Was schon gelingt","Was wir gerade üben","Was am Fortschritt erfreut"],
      status:{new:"Wir lernen es kennen",support:"Mit Unterstützung",growing:"Immer sicherer",independent:"Selbstständig"},
      reasons:{
        new:"Weniger als fünf Aufgaben abgeschlossen. Das Thema wird erst kennengelernt.",
        support:"Weitere Übung hilft. Verbesserungen und Unterstützung stehen unten getrennt.",
        growing:"Der Status wurde nach mindestens 10 Aufgaben und 70 % selbstständigen ersten Lösungen erreicht.",
        independent:"Der Status wurde nach mindestens 10 Aufgaben und 85 % selbstständigen ersten Lösungen bestätigt, darunter eine erneute selbstständige Übung an einem anderen Tag."
      },
      choiceOnly:"Bisher gelangen selbstständige Lösungen nur bei Auswahlaufgaben.",
      refresh:"Eine kurze Wiederholung dieses Themas kann helfen.",
      observations:"Abgeschlossene Aufgaben", own:"Selbstständig", corrected:"Ohne Tipp verbessert",
      supported:"Mit Tipp gelöst", solution:"Nach der Lösung", choice:"Antwort ausgewählt", input:"Selbst eingegeben",
      recent:"Beim ersten Versuch ohne Hilfe in den letzten Aufgaben", last:"Zuletzt geübt",
      practice:"Dieses Thema üben", previous:"Frühere Übungen",
      legacy:"Frühere Übungen bleiben im Verlauf. Der ausführliche Bericht entsteht nur aus neu abgeschlossenen Aufgaben.",
      week:"In den letzten 7 Tagen", observationsShort:"gespeicherte Aufgaben",
      weekImproved:"Bei vergleichbaren gespeicherten Aufgaben dieses Themas ist der Anteil selbstständiger erster Antworten gegenüber den vorherigen 7 Tagen gestiegen.",
      choices:"Auswahlaufgabe", typed:"eigene Eingabe", subskill:"Teilfertigkeiten"
    }
  };
  function render(snapshot, language, options={}) {
    const ru=language==="ru", t=labels[ru?"ru":"de"], assessment=model.assess(snapshot.records,snapshot.summaries,snapshot.states,catalog);
    let overview=model.overview(assessment,language);
    const unknown=snapshot.summaries.unclassified?.total || 0;
    if (snapshot.partial && !snapshot.records.length) overview = ru
      ? ["Отчёт временно недоступен.","Проверьте доступ к хранилищу браузера.","Новые завершённые примеры пока остаются в памяти вкладки."]
      : ["Der Bericht ist vorübergehend nicht verfügbar.","Bitte den Zugriff auf den Browserspeicher prüfen.","Neu abgeschlossene Aufgaben bleiben vorerst im Tab-Speicher."];
    else if (!assessment.length && unknown) overview = ru
      ? ["Есть завершённые примеры, но их точную тему не удалось определить.","Для оценки темы нужны новые задания с известным навыком.","Сохранённые примеры остаются в журнале."]
      : ["Es gibt abgeschlossene Aufgaben, deren genaues Thema nicht bekannt ist.","Für eine Einschätzung des Themas werden neue Aufgaben mit bekannter Fertigkeit benötigt.","Die gespeicherten Aufgaben bleiben erhalten."];
    const week=model.weekly(snapshot.records,options.now||new Date());
    const boxes=overview.map((text,i)=>`<div class="parent-overview-item"><strong>${t.sections[i]}</strong><p>${escape(text)}</p></div>`).join("");
    const cards=assessment.map(a=>{
      const s=a.summary, label=a.skill[language];
      const parts=a.parts.map(part=>{
        const ps=part.summary, partLabel=catalog.subskillLabel(part.subskillId,language);
        const canPart=typeof options.canPractice==="function" && options.canPractice(a.skill,part.subskillId);
        return `<details class="parent-subtopic" data-report-topic="${escape(part.id)}"><summary><span>${escape(partLabel)}</span><strong>${t.status[part.status]}${part.choiceOnly ? (ru ? " · выбор ответа" : " · Auswahl") : ""}</strong></summary>
          <p>${t.reasons[part.status]}</p>${part.choiceOnly?`<p>${t.choiceOnly}</p>`:""}${part.refresh?`<p class="parent-refresh">${t.refresh}</p>`:""}
          <dl class="parent-details">
            <div><dt>${t.observations}</dt><dd>${ps.total}</dd></div><div><dt>${t.own}</dt><dd>${ps.independent}</dd></div>
            <div><dt>${t.corrected}</dt><dd>${ps.corrected}</dd></div><div><dt>${t.supported}</dt><dd>${ps.supported}</dd></div>
            <div><dt>${t.solution}</dt><dd>${ps.solution}</dd></div><div><dt>${t.choice}</dt><dd>${ps.choice} · ${t.own}: ${ps.independentChoice}</dd></div>
            <div><dt>${t.input}</dt><dd>${ps.input} · ${t.own}: ${ps.independentInput}</dd></div>
            <div><dt>${t.recent}</dt><dd>${part.own} / ${part.recent.length} (${Math.round(part.own/part.recent.length*100)}%)</dd></div>
            <div><dt>${t.last}</dt><dd>${escape(new Intl.DateTimeFormat(ru?"ru-RU":"de-DE",{dateStyle:"medium"}).format(new Date(ps.last)))}</dd></div>
          </dl>${canPart?`<button type="button" class="setting-toggle" data-report-practice="${escape(a.id)}" data-report-subskill="${escape(part.subskillId)}">${t.practice}</button>`:""}</details>`;
      }).join("");
      const canPractice=typeof options.canPractice==="function" && options.canPractice(a.skill);
      return `<details class="parent-topic" data-report-topic="${escape(a.id)}"><summary><span>${escape(label)}</span><strong>${t.status[a.status]}${a.choiceOnly ? (ru ? " · выбор ответа" : " · Auswahl") : ""}</strong></summary>
        <p>${t.reasons[a.status]}</p>${a.choiceOnly?`<p>${t.choiceOnly}</p>`:""}${a.refresh?`<p class="parent-refresh">${t.refresh}</p>`:""}
        <dl class="parent-details">
          <div><dt>${t.observations}</dt><dd>${s.total}</dd></div>
          <div><dt>${t.own}</dt><dd>${s.independent}</dd></div><div><dt>${t.corrected}</dt><dd>${s.corrected}</dd></div>
          <div><dt>${t.supported}</dt><dd>${s.supported}</dd></div><div><dt>${t.solution}</dt><dd>${s.solution}</dd></div>
          <div><dt>${t.choice}</dt><dd>${s.choice} · ${t.own}: ${s.independentChoice}</dd></div><div><dt>${t.input}</dt><dd>${s.input} · ${t.own}: ${s.independentInput}</dd></div>
          <div><dt>${t.recent}</dt><dd>${a.own} / ${a.recent.length} (${Math.round(a.own/a.recent.length*100)}%)</dd></div>
          <div><dt>${t.last}</dt><dd>${escape(new Intl.DateTimeFormat(ru?"ru-RU":"de-DE",{dateStyle:"medium"}).format(new Date(s.last)))}</dd></div>
        </dl>${parts?`<p><strong>${t.subskill}</strong></p><div class="parent-subtopics">${parts}</div>`:""}
        ${canPractice?`<button type="button" class="setting-toggle" data-report-practice="${escape(a.id)}">${t.practice}</button>`:""}</details>`;
    }).join("");
    const weekHTML=week?`<section class="parent-week"><strong>${t.week}: ${week.count} ${t.observationsShort}</strong>${week.improvement?`<p>${t.weekImproved} ${escape(week.subskillId ? catalog.subskillLabel(week.subskillId,language) : catalog.label(week.skillId,language))} · ${week.format==="choice"?t.choices:t.typed}.</p>`:""}</section>`:"";
    const partial=snapshot.partial ? `<p class="parent-refresh" role="alert">${ru ? "Сохранённый отчёт сейчас недоступен. Показаны только новые данные этой вкладки; резервная копия будет неполной." : "Der gespeicherte Bericht ist nicht verfügbar. Nur neue Daten dieses Tabs werden angezeigt; die Sicherung ist unvollständig."}</p>` : "";
    return `<div class="parent-report">${partial}<p class="parent-intro">${t.intro}</p><section class="parent-overview" aria-label="${t.title}">${boxes}</section>${options.afterOverview || ""}${weekHTML}
      <section aria-label="${ru?"Темы":"Themen"}" class="parent-topics">${cards}</section>
      ${options.afterCards || ""}<details class="parent-method"><summary>${t.method}</summary><p>${t.stability}</p></details>
      ${unknown ? `<p class="settings-note">${unknown} ${ru ? "завершённых примеров без точной темы не влияют на оценку навыков." : "abgeschlossene Aufgaben ohne bekanntes Thema beeinflussen die Einschätzung der Fertigkeiten nicht."}</p>` : ""}
      <p class="settings-note">${t.legacy}</p></div>`;
  }
  window.KapiParentReportView=Object.freeze({render,labels});
})();
