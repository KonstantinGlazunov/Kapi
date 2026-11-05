const test = require('node:test');
const assert = require('node:assert/strict');
global.window=global;require('../dist/kapi-skills.js');
const report=require('../dist/kapi-parent-report.js');
function row(i, opt={}) {
  const good=opt.good!==false, hint=opt.hint===true, solution=opt.solution===true;
  return {id:'s'+(opt.session||1)+':'+i,sessionId:'s'+(opt.session||1),date:`2026-11-${String(opt.day||1).padStart(2,'0')}T12:${String(i%60).padStart(2,'0')}:00Z`,
    day:`2026-11-${String(opt.day||1).padStart(2,'0')}`,skillId:'add:to10',subskillId:null,stage:5,operation:'add',fact:i,taskType:'equation',format:opt.format||'input',
    firstCorrect:good,errors:good?0:solution?2:1,hint,solution,outcome:solution?'solution':hint?'supported':good?'independent':'corrected',activeSeconds:null};
}
test('small samples never assert a negative conclusion or invent independent successes',()=>{
 for(let n=0;n<5;n++){
  const rows=Array.from({length:n},(_,i)=>row(i,{good:false}));
  assert.equal(report.candidate(rows),'new');
  const summaries=n?{'add:to10':rows.reduce(report.addToSummary,null)}:{};
  const text=report.overview(report.assess(rows,summaries,{},KapiSkills),'ru').join(' ');
  assert.doesNotMatch(text,/первые самостоятельные решения|всё увереннее/i);
 }
});
test('70% and 85% require sufficient samples, days, distinct sessions and input evidence',()=>{
 const seven=Array.from({length:10},(_,i)=>row(i,{good:i<7}));assert.equal(report.candidate(seven),'growing');
 const seventeen=Array.from({length:20},(_,i)=>row(i,{good:i<17,day:i<10?1:2,session:i<10?1:2}));
 assert.equal(report.candidate(seventeen),'independent');
 assert.equal(report.candidate(seventeen.map(r=>({...r,day:'2026-11-01'}))),'growing');
 assert.equal(report.candidate(seventeen.map(r=>({...r,sessionId:'same'}))),'growing');
 const noReturn=Array.from({length:20},(_,i)=>row(i,{good:i!==19,day:i===19?2:1,session:i===19?2:1}));
 assert.equal(report.candidate(noReturn),'growing');
 assert.equal(report.candidate(seventeen.map(r=>({...r,format:'choice'}))),'growing');
 assert.equal(report.candidate(Array.from({length:5},(_,i)=>row(i,{good:false}))),'support');
});
test('a single error cannot downgrade; repeated difficulties after confirmation can',()=>{
 const rows=Array.from({length:10},(_,i)=>row(i,{good:i!==0,day:i<5?1:2,session:i<5?1:2}));
 let state={status:'independent',recent:[],refresh:false};
 for(let i=0;i<3;i++){rows.push(row(10+i,{good:false,day:3,session:3}));state=report.advanceState(rows,state);if(i<2)assert.equal(state.status,'independent');}
 assert.notEqual(state.status,'independent');assert.equal(state.refresh,true);
 const many=Array.from({length:20},(_,i)=>row(i,{day:i<10?1:2,session:i<10?1:2}));
 let stable={status:'independent',recent:[],refresh:false};
 for(let i=0;i<3;i++){many.push(row(20+i,{good:false,day:3,session:3}));stable=report.advanceState(many,stable)}
 assert.equal(stable.status,'independent');assert.equal(stable.refresh,true,'repeated difficulty is explained even at 85%');
 const sums={'add:to10':many.reduce(report.addToSummary,null)};
 assert.match(report.overview(report.assess(many,sums,{'add:to10':stable},KapiSkills),'ru').join(' '),/освежить/);
});
test('explanation is evidence-based and distinguishes support and later independent success',()=>{
 const rows=[row(0,{good:false,hint:true}),row(1,{good:true})];
 const sum={'add:to10':rows.reduce(report.addToSummary,null)}, a=report.assess(rows,sum,{},KapiSkills);
 assert.doesNotMatch(report.overview(a,'ru').join(' '),/После помощи/); // under five: no premature inference
 rows.push(row(2),row(3),row(4));
 assert.match(report.overview(report.assess(rows,{'add:to10':rows.reduce(report.addToSummary,null)},{},KapiSkills),'ru').join(' '),/После помощи/);
 const solutionFirst=rows.map((r,i)=>i===0?{...r,errors:2,solution:true,outcome:'solution'}:r);
 assert.match(report.overview(report.assess(solutionFirst,{'add:to10':solutionFirst.reduce(report.addToSummary,null)},{},KapiSkills),'ru').join(' '),/После помощи/);
 const repeated=rows.map(r=>({...r,fact:1}));
 assert.doesNotMatch(report.overview(report.assess(repeated,{'add:to10':repeated.reduce(report.addToSummary,null)},{},KapiSkills),'ru').join(' '),/После помощи/);
 const noMatch=rows.map((r,i)=>i===0?{...r,taskType:'visualCount'}:r);
 assert.doesNotMatch(report.overview(report.assess(noMatch,{'add:to10':noMatch.reduce(report.addToSummary,null)},{},KapiSkills),'ru').join(' '),/После помощи/);
});
test('weekly improvement is reported only for comparable format, stage and adequate samples',()=>{
 const prev=Array.from({length:5},(_,i)=>row(i,{day:1,good:i<2}));
 const current=Array.from({length:5},(_,i)=>row(i+10,{day:8,session:2,good:true}));
 assert.equal(report.weekly([...prev,...current],new Date(2026,10,8)).improvement,true);
 assert.equal(report.weekly([...prev,...current.map(x=>({...x,format:'choice'}))],new Date(2026,10,8)).improvement,false);
 assert.equal(report.weekly(current.slice(0,4),new Date(2026,10,8)),null);
});
test('snapshots validate identifiers, format, totals and duplicate observations',()=>{
 const records=[row(1)], data={version:1,records,summaries:{'add:to10':records.reduce(report.addToSummary,null)},states:{}};
 assert.equal(report.validateSnapshot(data,KapiSkills),data);
 assert.throws(()=>report.validateSnapshot({...data,records:[...records,...records]},KapiSkills));
 assert.throws(()=>report.validateSnapshot({...data,records:[{...records[0],format:'invalid'}]},KapiSkills));
 assert.throws(()=>report.validateSnapshot({...data,records:[{...records[0],day:'2026-02-30'}]},KapiSkills));
 assert.throws(()=>report.validateSnapshot({...data,records:[]},KapiSkills));
 assert.throws(()=>report.validateSnapshot({...data,summaries:{'add:to10':{...data.summaries['add:to10'],total:999}}},KapiSkills));
});

test('unknown old problem stage is stored without guessing a skill',()=>{
 const unknown={...row(0),id:'s1:unknown',skillId:'unclassified',stage:null,operation:'unknown'};
 const data={version:1,records:[unknown],summaries:{unclassified:report.addToSummary(null,unknown)},states:{}};
 assert.equal(report.validateSnapshot(data,KapiSkills),data);
 assert.equal(report.assess(data.records,data.summaries,data.states,KapiSkills).length,0);
});

test('late commits from another tab use event order for the five-observation decline window',()=>{
 const initial=Array.from({length:10},(_,i)=>row(i,{day:i<5?1:2,session:i<5?1:2}));
 let state={status:'independent',recent:[],refresh:false,anchor:{date:initial.at(-1).date,id:initial.at(-1).id}};
 const bad1=row(11,{good:false,day:3,session:3}), bad2=row(12,{good:false,day:3,session:3}), good=row(13,{good:true,day:3,session:3});
 const rows=[...initial,bad2,good];state=report.advanceState(rows,state);
 rows.push(bad1);state=report.advanceState(rows,state);
 assert.deepEqual(state.recent,[true,true,false]);
 assert.equal(state.status,'independent');
});
test('subskills are assessed separately and weekly comparisons do not mix multiplication tables',()=>{
 const all=[];
 for(const factor of [2,7]) for(let i=0;i<10;i++) {
  const r=row(i,{good:factor===2 || i<3,day:i<5?1:2,session:i<5?1:2});
  all.push({...r,id:r.sessionId+':'+factor+':'+i,skillId:'multiply:einmaleins-sequence',subskillId:'multiply:table:'+factor,stage:23,operation:'multiply'});
 }
 const parent='multiply:einmaleins-sequence', summaries={[parent]:all.reduce(report.addToSummary,null)};
 for(const factor of [2,7]) {const key=report.partKey(parent,'multiply:table:'+factor);summaries[key]=all.filter(r=>r.subskillId==='multiply:table:'+factor).reduce((s,r)=>report.addToSummary(s,{...r,skillId:key}),null)}
 report.validateSnapshot({version:1,records:all,summaries,states:{}},KapiSkills);
 const parts=report.assess(all,summaries,{},KapiSkills)[0].parts;
 assert.equal(parts.find(p=>p.subskillId==='multiply:table:2').status,'independent');
 assert.equal(parts.find(p=>p.subskillId==='multiply:table:7').status,'support');
 const old=all.slice(0,5).map(r=>({...r,day:'2026-11-01',firstCorrect:false,errors:1,hint:false,outcome:'corrected'}));
 const now=all.slice(10,15).map(r=>({...r,day:'2026-11-08',firstCorrect:true,errors:0,hint:false,outcome:'independent'}));
 assert.equal(report.weekly([...old,...now],new Date(2026,10,8)).improvement,false);
});
