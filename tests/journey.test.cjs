const assert = require('node:assert/strict');
global.window=global;require('../dist/kapi-rewards.js');const j=KapiJourney;
const p={totalXp:255,equippedOutfit:{back:'backpack'},unlockedRewards:['backpack'],journey:{step:3,sessions:['a','b','c']}};
j.normalize(p);assert.equal(p.journey.step,3);assert.equal(p.totalXp,255);assert.equal(j.complete(p,{id:'c',completed:true}),false);assert.equal(j.complete(p,{id:'next',completed:false}),false);
for(let step=4;step<=23;step++){assert.equal(j.complete(p,{id:'session'+step,completed:true}),true);assert.equal(p.journey.step,step);assert.equal(j.complete(p,{id:'session'+step,completed:true}),false);assert.equal(j.chapter(step),Math.floor(step/4));assert.ok(j.scene(step).asset);assert.equal(j.postcards(p).length,Math.floor((step-3)/4));}
assert.equal(j.complete(p,{id:'after-end',completed:true}),false);assert.equal(p.journey.step,23);assert.equal(p.journey.sessions.length,23);assert.equal(j.normalize(JSON.parse(JSON.stringify(p))).journey.step,23);
assert.equal(j.normalize({journey:{step:-3}}).journey.step,0);assert.equal(j.normalize({journey:{step:999}}).journey.step,23);
for(const lang of ['ru','de']){assert.equal(j.copy[lang].places.length,24);assert.equal(j.copy[lang].arrival.length,24);assert.equal(j.copy[lang].next.length,24);}
p.cosmeticVariants.backpack='forest';j.normalize(p);assert.equal(j.variant(p,'backpack').asset,'backpack-forest');
require('../dist/kapi-tasks.js');require('../dist/kapi-storage.js');
const profile={...p,currentStage:1,errorQueue:[],curriculumVersion:2};const settings={language:'ru',problemCount:20,automatic:true,sound:true,range:'10',manualStage:1,operations:['add']};
const backup=profile=>JSON.stringify({format:'kapi-backup',version:1,data:{profile,settings,history:[]}});
assert.equal(KapiStorage.validateBackup(backup(profile),profile).profile.journey.step,23);
assert.equal(KapiStorage.validateBackup(backup({...profile,journey:{step:3,sessions:['a','b','c']}}),profile).profile.journey.step,3);
assert.throws(()=>KapiStorage.validateBackup(backup({...profile,journey:{step:24,sessions:[]}}),profile));
console.log('PASS 24 stops, old lake migration, 20 new completions, dedup, incomplete sessions, cap, five postcards, RU/DE, outfits and backup validation');
