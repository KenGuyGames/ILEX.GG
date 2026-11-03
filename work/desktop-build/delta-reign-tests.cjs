const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ui = path.resolve(process.argv[2] || 'work/desktop/ui');
const json = name => JSON.parse(fs.readFileSync(path.join(ui, name + '.json')));
const cards = json('cards');
const details = json('card-details');
const mapping = json('rules-card-map');
const packModel = require(path.join(ui, 'pack-model.js'));
const profiles = packModel.build(cards, json('sets'), details);
const delta = profiles.find(profile => profile.id === 'me06');
assert.deepEqual(delta.rareOdds, profiles.find(profile => profile.id === 'me05').rareOdds);
const setCards = cards.filter(card => card.id.startsWith('me06-'));
assert.equal(setCards.length, 141);
for (const card of setCards) {
  if (!card.scan.startsWith('https:')) assert(fs.existsSync(path.join(ui, card.scan)));
}
const pairHits = new Set();
for (let i = 0; i < 10000; i++) {
  const pack = packModel.generate(delta);
  assert.equal(pack.length, 11);
  assert.equal(pack.filter(card => card.slot === 'Uncommon').length, 3);
  const halves = pack.filter(card => details[card.id]?.dualStadium);
  if (halves.length) {
    assert.equal(halves.length, 2);
    assert.equal(details[halves[0].id].dualStadium, details[halves[1].id].dualStadium);
    assert.equal(details[halves[0].id].dualStadiumHalf, 'left');
    assert.equal(details[halves[1].id].dualStadiumHalf, 'right');
    assert(halves.every(card => card.tier === 'uncommon' && card.finish === 'normal'));
    pairHits.add(halves[0].id);
  }
  assert.equal(pack.find(card => card.slot === 'Rare slot').finish, 'holo');
}
assert.equal(pairHits.size, 3);
const context = {};
const bundle = fs.readFileSync(path.join(ui, 'rules-engine.js'), 'utf8');
vm.runInNewContext(bundle.replace(
  'return __toCommonJS(tcg_lab_entry_exports);',
  'return {setDeltaReign, canPlayDualStadium, assembleDualStadiumFromHand, StateUtils};'
), context);
const {setDeltaReign, canPlayDualStadium, assembleDualStadiumFromHand, StateUtils} = context.TCGRules;
function pile(...cards) {
  return {cards, moveTo(target){target.cards.push(...this.cards.splice(0));},
    moveCardTo(card,target){target.cards.push(...this.cards.splice(this.cards.indexOf(card),1));}};
}
for (const [leftId,rightId] of delta.dualPairs) {
  const left = setDeltaReign.find(card => card.fullName === mapping[leftId]);
  const right = setDeltaReign.find(card => card.fullName === mapping[rightId]);
  assert(left && right && left.name === right.name);
  assert(left.tags.includes('Dual Stadium') && right.tags.includes('Dual Stadium'));
  const player = {id:1,hand:pile(left,left),stadium:pile(),discard:pile()};
  const previous = {name:'Previous Stadium'};
  const opponent = {id:2,stadium:pile(previous),discard:pile()};
  const state = {phase:2,turn:4,activePlayer:0,players:[player,opponent]};
  const store = {log(){}};
  assert.equal(canPlayDualStadium(store,state,player,left), false);
  player.hand.cards.push(right);
  assert.equal(canPlayDualStadium(store,state,player,right), true);
  assembleDualStadiumFromHand(store,state,player,right);
  assert.deepEqual(player.stadium.cards,[left,right]);
  assert.deepEqual(opponent.discard.cards,[previous]);
  assert.equal(StateUtils.getStadiumCard(state),left);
  assert.equal(player.stadiumPlayedTurn,4);
  assert.equal(canPlayDualStadium(store,state,player,left),false);
}
console.log('141 entries, 10,000 packs, all three Stadium pairs, scan paths and holo slots passed');
