/* Mirrored pure helpers from index.html v1.7.0 — keep in sync */
/* 表記ゆれルール（ログ）: 先頭★／☆除去 / 空白除去 / 【】[]・･除去 / ウイング→ウィング / 杖→つえ */
function normalizeName(name) {
  let s = String(name == null ? '' : name);
  s = s.replace(/^[★☆]+/, '');
  s = s.replace(/[\s\u3000]+/g, '');
  s = s.replace(/[【】\[\]・･]/g, '');
  s = s.replace(/ウイング/g, 'ウィング');
  s = s.replace(/杖/g, 'つえ');
  return s;
}
function parse9dbId(source) {
  if (source == null || source === '') return null;
  const s = String(source);
  let m = s.match(/9db\.jp\/dqwalk\/data\/(\d+)/i);
  if (m) return Number(m[1]);
  m = s.match(/\/data\/(\d+)/);
  if (m) return Number(m[1]);
  if (/9db/i.test(s)) {
    m = s.match(/(\d{3,})/);
    if (m) return Number(m[1]);
  }
  return null;
}
function sortKeyNewer(w, origIndex) {
  let primary = null;
  if (w.releasedAt != null && w.releasedAt !== '') primary = w.releasedAt;
  else if (w.implOrder != null && w.implOrder !== '') primary = w.implOrder;
  const id9 = parse9dbId(w.source);
  return { primary: primary, id9: id9, origIndex: origIndex };
}
function sortNewerFirst(items) {
  /* items: [{ w, origIndex }, ...] — newer first */
  return items.slice().sort(function(a, b) {
    const ka = sortKeyNewer(a.w, a.origIndex);
    const kb = sortKeyNewer(b.w, b.origIndex);
    if (ka.primary != null && kb.primary != null) {
      if (ka.primary !== kb.primary) return ka.primary > kb.primary ? -1 : 1;
    } else if (ka.primary != null) return -1;
    else if (kb.primary != null) return 1;
    if (ka.id9 != null && kb.id9 != null && ka.id9 !== kb.id9) return kb.id9 - ka.id9;
    if (ka.id9 != null && kb.id9 == null) return -1;
    if (kb.id9 != null && ka.id9 == null) return 1;
    return b.origIndex - a.origIndex;
  });
}

module.exports = { normalizeName, parse9dbId, sortKeyNewer, sortNewerFirst };
