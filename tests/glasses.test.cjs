const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

function drawHead(headAsset, state, ready = true) {
  const animator = Object.create(environment().sandbox.CanvasKapiAnimator.prototype);
  animator.reducedMotion = true;
  const glasses = [], heads = [];
  animator.loadImage = path => ({ ready: ready || !path.endsWith('/head-dance.png') });
  animator.effectiveOutfit = () => ({ glasses: 'glasses' });
  animator.drawCosmetic = (context, slot, id) => { if (slot === 'glasses' && id) glasses.push(id); };
  animator.drawPart = (context, name) => heads.push(name);
  const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {} };
  animator.drawRigPose({canvas:{width:700,height:700},context},
    animator.pose('idle',0),animator.limbPose('idle',0),1,{headAsset,state,drawBody:false});
  return { glasses, heads };
}

test('dance art with built-in star glasses does not get a second equipped pair', () => {
  for (const state of ['dance','trainingFinished']) {
    const result = drawHead('headDance',state);
    assert.deepEqual(result.heads,['headDance']);
    assert.deepEqual(result.glasses,[]);
  }
});

test('ordinary and continuation heads retain the equipped glasses', () => {
  for (const head of ['head','headComplete','headPerfect','headCheer']) {
    assert.deepEqual(drawHead(head,'trainingFinished').glasses,['glasses']);
  }
});

test('unloaded dance head falls back to ordinary head with one equipped pair', () => {
  const result = drawHead('headDance','dance',false);
  assert.deepEqual(result.heads,['head']);
  assert.deepEqual(result.glasses,['glasses']);
});
