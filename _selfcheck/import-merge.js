/* Mirrored pure helpers from index.html v1.8.0 — keep in sync */
const { normalizeName } = require('./name-sort.js');

function applyDeleteIds(current, ids) {
  const delSet = {};
  ids.forEach(function(id){ delSet[String(id)] = true; });
  const exist = {};
  current.forEach(function(w){ exist[w.id] = true; });
  let skipped = 0;
  ids.forEach(function(id){ if (!exist[String(id)]) skipped++; });
  let removed = 0;
  const weapons = current.filter(function(w){
    if (delSet[w.id]) { removed++; return false; }
    return true;
  });
  return { weapons: weapons, removed: removed, skipped: skipped };
}

function mergeWeaponsByName(current, incoming) {
  const map = new Map();
  current.forEach(function(w){ map.set(w.id, w); });
  const nameToId = new Map();
  current.forEach(function(w){
    const k = normalizeName(w.name);
    if (k && !nameToId.has(k)) nameToId.set(k, w.id);
  });
  let overwriteN = 0, newN = 0;
  const defaults = { verified: false, skills: [], ikinari: [], chosen: [], passives: [], limitBreakEffects: [], rarity: 5 };
  incoming.forEach(function(w){
    const nk = normalizeName(w.name);
    const existingId = nk ? nameToId.get(nk) : null;
    if (existingId != null && map.has(existingId)) {
      const prev = map.get(existingId);
      map.set(existingId, Object.assign({}, defaults, prev, w, { id: existingId }));
      overwriteN++;
    } else {
      map.set(w.id, Object.assign({}, defaults, w));
      if (nk) nameToId.set(nk, w.id);
      newN++;
    }
  });
  return { weapons: Array.from(map.values()), overwriteN: overwriteN, newN: newN };
}

module.exports = { applyDeleteIds, mergeWeaponsByName };
