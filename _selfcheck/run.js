'use strict';
const { normalizeName, parse9dbId, sortNewerFirst } = require('./name-sort.js');
const { applyDeleteIds, mergeWeaponsByName } = require('./import-merge.js');

let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed++; console.error('FAIL:', msg); }
  else console.log('OK:', msg);
}

// ★ strip dup
assert(normalizeName('★ロトの竜剣') === normalizeName('ロトの竜剣'), '★ strip: ★ロトの竜剣 ≡ ロトの竜剣');
assert(normalizeName('☆テスト') === 'テスト', '☆ strip');
assert(normalizeName('  甲　乙  ') === '甲乙', 'whitespace strip full/half');
assert(normalizeName('【試験】・剣') === '試験剣', 'symbol normalize 【】・');

// ウイング/ウィング
assert(normalizeName('メタルウイング') === normalizeName('メタルウィング'), 'ウイング↔ウィング');
assert(normalizeName('ガルーダウィング') === 'ガルーダウィング', 'ウィング stays');

// 杖↔つえ
assert(normalizeName('まほうの杖') === normalizeName('まほうのつえ'), '杖↔つえ');

// parse9dbId
assert(parse9dbId('9db.jp/dqwalk/data/19732') === 19732, 'parse classic 9db url');
assert(parse9dbId('https://9db.jp/dqwalk/data/13223') === 13223, 'parse https 9db');
assert(parse9dbId('検索結果より補完') === null, 'non-9db → null');
assert(parse9dbId('') === null, 'empty → null');

// sort prefers higher 9db id
const items = [
  { w: { name: 'old', source: '9db.jp/dqwalk/data/100' }, origIndex: 0 },
  { w: { name: 'new', source: '9db.jp/dqwalk/data/99999' }, origIndex: 1 },
  { w: { name: 'mid', source: '9db.jp/dqwalk/data/5000' }, origIndex: 2 },
];
const sorted = sortNewerFirst(items);
assert(sorted.map(x => x.w.name).join(',') === 'new,mid,old', 'sort by 9db id desc: ' + sorted.map(x => x.w.name).join(','));

// releasedAt beats 9db id
const items2 = [
  { w: { name: 'a', source: '9db.jp/dqwalk/data/99999', releasedAt: 1 }, origIndex: 0 },
  { w: { name: 'b', source: '9db.jp/dqwalk/data/1', releasedAt: 10 }, origIndex: 1 },
];
const s2 = sortNewerFirst(items2);
assert(s2[0].w.name === 'b', 'releasedAt preferred over 9db id');

// fallback origIndex (later = newer)
const items3 = [
  { w: { name: 'first', source: 'x' }, origIndex: 0 },
  { w: { name: 'second', source: 'y' }, origIndex: 5 },
];
const s3 = sortNewerFirst(items3);
assert(s3[0].w.name === 'second', 'origIndex later = newer');

// ---- A: delete patch ----
const baseW = [
  { id: 'a', name: '甲', type: '剣', inherit: {} },
  { id: 'b', name: '乙', type: '剣', inherit: {} },
  { id: 'c', name: '丙', type: '剣', inherit: {} },
];
const del1 = applyDeleteIds(baseW, ['a', 'missing', 'c']);
assert(del1.removed === 2, 'delete removes existing ids: removed=' + del1.removed);
assert(del1.skipped === 1, 'delete skips missing: skipped=' + del1.skipped);
assert(del1.weapons.map(w => w.id).join(',') === 'b', 'delete leftover ids: ' + del1.weapons.map(w => w.id).join(','));

const del2 = applyDeleteIds(baseW, ['nope', 'also_no']);
assert(del2.removed === 0 && del2.skipped === 2 && del2.weapons.length === 3, 'delete all-missing leaves DB intact');

// ---- C: same-name overwrite ----
const cur = [
  { id: 'old_id', name: '★サマーメモリー', type: '剣', inherit: { skill: '旧' }, note: 'keep-me' },
  { id: 'other', name: '別武器', type: '剣', inherit: {} },
];
const incoming = [
  { id: 'new_different_id', name: 'サマーメモリー', type: '剣', inherit: { skill: '新' }, rarity: 5, verified: true },
];
const m1 = mergeWeaponsByName(cur, incoming);
assert(m1.overwriteN === 1 && m1.newN === 0, '★ vs no-star → overwriteN=1 newN=0');
const overwritten = m1.weapons.find(w => normalizeName(w.name) === normalizeName('サマーメモリー'));
assert(overwritten && overwritten.id === 'old_id', 'same-name keeps existing id: ' + (overwritten && overwritten.id));
assert(overwritten.inherit && overwritten.inherit.skill === '新', 'same-name overwrites fields');
assert(overwritten.name === 'サマーメモリー', 'incoming name applied');
assert(!m1.weapons.some(w => w.id === 'new_different_id'), 'incoming different id NOT double-added');
assert(m1.weapons.length === 2, 'DB size stays 2 after same-name overwrite: ' + m1.weapons.length);

const m2 = mergeWeaponsByName(cur, [
  { id: 'brand_new', name: '完全新規', type: '斧', inherit: {} },
]);
assert(m2.overwriteN === 0 && m2.newN === 1, 'truly new weapon counted as new');
assert(m2.weapons.some(w => w.id === 'brand_new'), 'new id inserted');

if (failed) {
  console.error('\n' + failed + ' failure(s)');
  process.exit(1);
}
console.log('\nAll selfcheck tests passed.');
