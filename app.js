'use strict';
/* ===== Nestly: household chores + shared shopping list ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const CFG = window.NESTLY_CONFIG || {};
const CLOUD = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const KEY = 'nestly:v1', AKEY = 'nestly:a11y';

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ds(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d); };
const diff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DSH = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); };

function dueInfo(s) {
  if (!s) return { t: 'בלי תאריך', c: '' };
  const n = diff(s, today());
  if (n < -1) return { t: `באיחור של ${-n} ימים`, c: 'due-late' };
  if (n === -1) return { t: 'מאתמול', c: 'due-late' };
  if (n === 0) return { t: 'היום', c: 'due-today' };
  if (n === 1) return { t: 'מחר', c: '' };
  if (n < 7) return { t: `יום ${DAYS[parse(s).getDay()]}`, c: '' };
  return { t: parse(s).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }), c: '' };
}
function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4);
  if (m < 1) return 'עכשיו';
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}

/* ---------- data dictionaries ---------- */
const ROOMS = [
  { id: 'kitchen', e: '🍳', n: 'מטבח' }, { id: 'living', e: '🛋️', n: 'סלון' }, { id: 'bath', e: '🛁', n: 'אמבטיה' },
  { id: 'laundry', e: '🧺', n: 'כביסה' }, { id: 'bedroom', e: '🛏️', n: 'חדרים' }, { id: 'outdoor', e: '🌿', n: 'מרפסת וחצר' },
  { id: 'pets', e: '🐾', n: 'חיות' }, { id: 'general', e: '🏠', n: 'כללי' }
];
const room = id => ROOMS.find(r => r.id === id) || ROOMS[7];
const POINTS = { 1: 5, 2: 10, 3: 20 };
const AVATARS = ['🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄', '🐙', '🐝', '🐱', '🐶', '🐰', '🐻', '🐧', '🦋', '🐢', '🦉', '🐳', '🌸'];
const COLORS = ['lav', 'mint', 'peach', 'pink', 'sky', 'butter'];
const TASK_EMOJIS = ['✨', '🧹', '🧽', '🫧', '🍽️', '🗑️', '🧺', '👕', '🧦', '🛁', '🚽', '🪞', '🛏️', '🪴', '🐾', '🐕', '🍳', '🧊', '🪟', '🛒', '💳', '🔥', '🪶', '🧸', '📦', '🔧', '🚗', '💡'];
const EMOJI_KW = [['כביס', '🧺'], ['תלי', '👕'], ['קיפול', '🧦'], ['גיהו', '👔'], ['כלים', '🍽️'], ['מדיח', '🍽️'], ['שאיב', '🧹'], ['טאטא', '🧹'], ['שטיפ', '🫧'], ['רצפ', '🫧'], ['אבק', '🪶'], ['זבל', '🗑️'], ['פח', '🗑️'], ['אמבט', '🛁'], ['מקלחת', '🛁'], ['שירותים', '🚽'], ['אסלה', '🚽'], ['מרא', '🪞'], ['מיטה', '🛏️'], ['מצעים', '🛏️'], ['צמח', '🪴'], ['השקי', '🪴'], ['כלב', '🐕'], ['חתול', '🐈'], ['האכל', '🐾'], ['בישול', '🍳'], ['ארוח', '🍳'], ['מקרר', '🧊'], ['חלונ', '🪟'], ['קניות', '🛒'], ['חשבונ', '💳'], ['תנור', '🔥'], ['כיריים', '🔥'], ['צעצוע', '🧸'], ['מגבות', '🧻'], ['רכב', '🚗'], ['אוטו', '🚗'], ['נורה', '💡'], ['תיקון', '🔧']];
const guessEmoji = t => (EMOJI_KW.find(([k]) => t.includes(k)) || [, '✨'])[1];

const CATS = [
  { id: 'pets', e: '🐾', n: 'לחיות המחמד', k: ['לכלב', 'לחתול', 'חול לחתול', 'אוכל לחיות'] },
  { id: 'cleaning', e: '🧽', n: 'ניקיון', k: ['סבון כלים', 'נוזל כלים', 'אקונומיקה', 'מרכך כביסה', 'אבקת כביסה', "ג'ל כביסה", 'ספוג', 'שקיות זבל', 'מטלי', 'נוזל רצפ', 'מסיר', 'כלור', 'טבליות למדיח', 'נייר אפי', 'נייר כסף', 'ניילון נצמד'] },
  { id: 'hygiene', e: '🧴', n: 'טואלטיקה ופארם', k: ['שמפו', 'מרכך שיער', 'סבון', 'משחת שיניים', 'מברשת', 'דאודורנט', 'נייר טואלט', 'טישו', 'מגבונים', 'חיתול', 'תרופ', 'קרם', 'פלסטר', 'תחבוש', 'גילוח', 'צמר גפן'] },
  { id: 'frozen', e: '🧊', n: 'קפואים', k: ['קפוא', 'גלידה', 'בורקס', 'פיצה קפואה', 'שלגון'] },
  { id: 'produce', e: '🥬', n: 'ירקות ופירות', k: ['עגבני', 'מלפפון', 'בצל', 'שום', 'תפוח', 'בננ', 'פלפל', 'חסה', 'גזר', 'לימון', 'אבוקדו', 'תפוחי אדמה', 'תפו"א', 'בטטה', 'פטרוזיליה', 'כוסברה', 'שמיר', 'נענע', 'תות', 'ענב', 'אבטיח', 'מלון', 'תפוז', 'קלמנטינ', 'אגס', 'אפרסק', 'מנגו', 'כרוב', 'ברוקולי', 'כרובית', 'קישוא', 'חציל', 'פטריות', 'תרד', 'סלק', 'ירקות', 'פירות'] },
  { id: 'dairy', e: '🧀', n: 'מוצרי חלב וביצים', k: ['חלב', 'גבינ', 'יוגורט', 'שמנת', 'חמאה', 'ביצ', 'קוטג', 'מעדן', 'לבנה', 'לבן', 'מוצרלה', 'פרמזן', 'צפתית', 'בולגרית'] },
  { id: 'bakery', e: '🥖', n: 'לחם ומאפים', k: ['לחם', 'פית', 'חלה', 'לחמני', 'באגט', 'עוג', 'קרואסון', 'טורטי', 'לאפה', 'פרוס'] },
  { id: 'meat', e: '🍗', n: 'בשר ודגים', k: ['עוף', 'בשר', 'חזה', 'שניצל', 'דג', 'סלמון', 'קציצ', 'נקניק', 'הודו', 'כרעיים', 'פרגית', 'טחון', 'המבורגר', 'אנטריקוט'] },
  { id: 'drinks', e: '🥤', n: 'משקאות', k: ['מים', 'מיץ', 'סודה', 'קולה', 'בירה', 'יין', 'שתי', 'פחית', 'משקה', 'תרכיז'] },
  { id: 'snacks', e: '🍫', n: 'חטיפים ומתוקים', k: ['במבה', 'ביסלי', 'שוקולד', 'חטיף', 'עוגיות', 'ממתק', 'צ׳יפס', "צ'יפס", 'פופקורן', 'וופל', 'סוכריות', 'גומי'] },
  { id: 'pantry', e: '🥫', n: 'מזווה', k: ['אורז', 'פסטה', 'ספגטי', 'קמח', 'סוכר', 'מלח', 'שמן', 'תבלין', 'פפריקה', 'פלפל שחור', 'רוטב', 'קפה', 'תה', 'דגני', 'קורנפלקס', 'טונה', 'שימור', 'חומוס', 'טחינה', 'ממרח', 'דבש', 'ריבה', 'פתיתים', 'עדשים', 'קטשופ', 'מיונז', 'חרדל', 'שקדי מרק', 'קוסקוס', 'שיבולת', 'אגוז', 'שקד', 'זית', 'חומץ', 'שמרים', 'קקאו'] },
  { id: 'other', e: '🛍️', n: 'שונות', k: [] }
];
const CAT_ORDER = ['produce', 'dairy', 'bakery', 'meat', 'pantry', 'frozen', 'drinks', 'snacks', 'cleaning', 'hygiene', 'pets', 'other'];
const cat = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];
const guessCat = name => (CATS.find(c => c.k.some(k => name.includes(k))) || CATS[CATS.length - 1]).id;

const R = (type, extra = {}) => ({ type, ...extra });
const TEMPLATES = [
  ['kitchen', 'שטיפת כלים / ריקון מדיח', '🍽️', R('daily'), 1], ['kitchen', 'ניגוב משטחי המטבח', '🧽', R('daily'), 1],
  ['kitchen', 'הוצאת הזבל', '🗑️', R('daily'), 1], ['kitchen', 'הכנת ארוחת ערב', '🍳', R('daily'), 2],
  ['kitchen', 'ניקוי כיריים ותנור', '🔥', R('weekly'), 2], ['kitchen', 'ניקוי המקרר', '🧊', R('interval', { every: 14 }), 2],
  ['living', 'שאיבת אבק', '🧹', R('interval', { every: 3 }), 2], ['living', 'שטיפת רצפה', '🫧', R('weekly'), 3],
  ['living', 'ניגוב אבק', '🪶', R('weekly'), 2], ['living', 'סידור הסלון', '🛋️', R('daily'), 1], ['living', 'ניקוי חלונות', '🪟', R('monthly'), 3],
  ['bath', 'ניקוי אמבטיה ומקלחת', '🛁', R('weekly'), 3], ['bath', 'ניקוי שירותים', '🚽', R('weekly'), 2],
  ['bath', 'ניקוי כיור ומראה', '🪞', R('weekly'), 1], ['bath', 'החלפת מגבות', '🧻', R('weekly'), 1],
  ['laundry', 'הפעלת מכונת כביסה', '🧺', R('interval', { every: 2 }), 1], ['laundry', 'תליית כביסה', '👕', R('interval', { every: 2 }), 1],
  ['laundry', 'קיפול וסידור כביסה', '🧦', R('interval', { every: 2 }), 2], ['laundry', 'גיהוץ', '👔', R('weekly'), 2],
  ['bedroom', 'סידור המיטה', '🛏️', R('daily'), 1], ['bedroom', 'החלפת מצעים', '🛏️', R('weekly'), 2], ['bedroom', 'סידור החדר', '🧸', R('weekly'), 2],
  ['outdoor', 'השקיית צמחים', '🪴', R('interval', { every: 3 }), 1], ['outdoor', 'טאטוא המרפסת', '🍃', R('weekly'), 2],
  ['pets', 'האכלת חיית המחמד', '🐾', R('daily'), 1], ['pets', 'טיול עם הכלב', '🐕', R('daily'), 2], ['pets', 'ניקוי ארגז החול', '🐈', R('interval', { every: 2 }), 1],
  ['general', 'קניות שבועיות', '🛒', R('weekly'), 2], ['general', 'תשלום חשבונות', '💳', R('monthly'), 1], ['general', 'ניקוי פילטר המזגן', '💨', R('monthly'), 2]
];
const STARTER = [0, 2, 6, 7, 12, 15, 16, 20, 22];

/* ---------- state ---------- */
let S = load();
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } }
S.records ||= {}; S.outbox ||= {};
const rec = id => { const r = S.records[id]; return r && !r.deleted ? r.data : null; };
const rows = kind => Object.values(S.records).filter(r => r.kind === kind && !r.deleted).map(r => r.data);
const members = () => rows('member').sort((a, b) => (a.created || 0) - (b.created || 0));
const member = id => rec(id) && S.records[id].kind === 'member' ? rec(id) : null;
const me = () => member(S.meId);
const homeName = () => rec('meta')?.name || 'הבית שלנו';

function write(list) { // list of [kind, data] or ['del', id]
  for (const [kind, x] of list) {
    if (kind === 'del') { const r = S.records[x]; if (!r) continue; const row = { ...r, deleted: true }; S.records[x] = row; S.outbox[x] = row; }
    else { const row = { id: x.id, kind, data: x, deleted: false }; S.records[x.id] = row; S.outbox[x.id] = row; }
  }
  save(); refresh(); scheduleSync();
}
const put = (kind, data) => write([[kind, data]]);
const del = id => write([['del', id]]);

/* ---------- cloud sync (Supabase RPC) ---------- */
let syncing = false, syncTimer = 0;
async function rpc(fn, body) {
  const base = CFG.supabaseUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
function setSync(state) {
  const el = $('#sync'); if (!el) return;
  const map = { local: ['', 'מקומי'], ok: ['ok', 'מסונכרן'], busy: ['busy', 'מסנכרן'], err: ['err', 'אין חיבור'] };
  el.className = 'sync ' + map[state][0]; el.lastElementChild.textContent = map[state][1];
}
function scheduleSync(ms = 350) { clearTimeout(syncTimer); syncTimer = setTimeout(sync, ms); }
async function sync() {
  if (!CLOUD || !S.code) { setSync('local'); return; }
  if (syncing) { scheduleSync(800); return; }
  syncing = true; setSync('busy');
  try {
    const out = Object.values(S.outbox);
    if (out.length) {
      const snap = out.map(r => JSON.stringify(r));
      await rpc('nestly_push', { p_code: S.code, p_rows: out.map(({ id, kind, data, deleted }) => ({ id, kind, data, deleted })) });
      out.forEach((r, i) => { if (JSON.stringify(S.outbox[r.id]) === snap[i]) delete S.outbox[r.id]; });
    }
    const since = S.cursor ? new Date(new Date(S.cursor).getTime() - 15000).toISOString() : null;
    const got = await rpc('nestly_pull', { p_code: S.code, p_since: since });
    let changed = false;
    for (const r of got) {
      if (!S.cursor || new Date(r.updated_at) > new Date(S.cursor)) S.cursor = r.updated_at;
      if (S.outbox[r.id]) continue;
      const cur = S.records[r.id];
      if (!cur || !!cur.deleted !== !!r.deleted || JSON.stringify(cur.data) !== JSON.stringify(r.data)) {
        S.records[r.id] = { id: r.id, kind: r.kind, data: r.data, deleted: !!r.deleted }; changed = true;
      }
    }
    save(); if (changed) refresh(); setSync('ok');
  } catch (e) { console.warn('sync', e); setSync('err'); }
  finally { syncing = false; }
}
setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 5000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && sync());
addEventListener('online', () => sync());

/* ---------- helpers ---------- */
function avatar(m, cls = '') {
  if (!m) return `<span class="av any ${cls}" title="מי שפנוי">👐</span>`;
  return `<span class="av c-${m.color || 'lav'} ${cls}" title="${esc(m.name)}">${esc(m.emoji)}</span>`;
}
function chips(name, opts, val, multi = false, extra = '') {
  const sel = v => multi ? (val || []).includes(v) : v === val;
  return `<div class="chips ${extra}" data-group="${name}" ${multi ? 'data-multi' : ''} role="group">${opts.map(([v, l]) =>
    `<button type="button" class="chip" data-val="${esc(v)}" aria-pressed="${sel(v)}">${l}</button>`).join('')}</div>`;
}
const chipVal = (root, name) => { const b = $(`[data-group="${name}"] [aria-pressed="true"]`, root); return b ? b.dataset.val : null; };
const chipVals = (root, name) => $$(`[data-group="${name}"] [aria-pressed="true"]`, root).map(b => b.dataset.val);
const emojiGrid = (list, cur) => `<div class="emoji-grid" role="group" aria-label="בחירת אימוג׳י">${list.map(e => `<button type="button" data-emo="${e}" aria-pressed="${e === cur}" aria-label="${e}">${e}</button>`).join('')}</div>`;
const seen = new Set();
const pop = id => { const p = seen.has(id) ? '' : 'pop'; seen.add(id); return p; };
function repeatLabel(r) {
  if (!r || r.type === 'none') return '';
  if (r.type === 'daily') return 'כל יום';
  if (r.type === 'interval') return `כל ${r.every} ימים`;
  if (r.type === 'monthly') return 'כל חודש';
  return r.days?.length && r.days.length < 7 ? `כל ${r.days.map(d => DSH[d]).join(' ')}` : 'כל שבוע';
}
function nextDue(t) {
  const td = today(); const s = t.due && t.due > td ? t.due : td; const r = t.repeat || { type: 'none' };
  if (r.type === 'daily') return addDays(s, 1);
  if (r.type === 'interval') return addDays(s, Math.max(1, +r.every || 2));
  if (r.type === 'weekly') {
    const days = r.days?.length ? r.days.map(Number) : [parse(t.due || s).getDay()];
    for (let i = 1; i <= 7; i++) { const c = addDays(s, i); if (days.includes(parse(c).getDay())) return c; }
    return addDays(s, 7);
  }
  if (r.type === 'monthly') {
    const d = parse(s), day = parse(t.due || s).getDate();
    const n = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    n.setDate(Math.min(day, new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate()));
    return ds(n);
  }
  return null;
}
const owner = t => t.assignee === 'rotate' ? member(t.turn) || members()[0] : member(t.assignee);
const isMine = t => owner(t)?.id === S.meId;
function nextMember(id) { const ms = members(); if (!ms.length) return null; const i = ms.findIndex(m => m.id === id); return ms[(i + 1) % ms.length].id; }
const activeTasks = () => rows('task').filter(t => !t.done);
const logs = () => rows('log').sort((a, b) => b.at.localeCompare(a.at));
function weekPoints() {
  const ws = weekStart(), map = {};
  logs().forEach(l => { if (new Date(l.at).getTime() >= ws) map[l.memberId] = (map[l.memberId] || 0) + (l.points || 0); });
  return map;
}
function makeCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint32Array(6)); r.forEach(n => s += A[n % A.length]); return s; }
const fmtCode = c => c ? `${c.slice(0, 3)}-${c.slice(3)}` : '';
const joinLink = () => `${location.origin}${location.pathname}?join=${S.code}`;
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  toast(msg);
}

/* ---------- toast + confetti ---------- */
function toast(msg, { undo, ms = 3800 } = {}) {
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>${msg}</span>${undo ? '<button type="button">ביטול ↩️</button>' : ''}`;
  $('#toasts').append(el);
  let gone = false; const kill = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => el.remove(), 300); };
  if (undo) el.querySelector('button').onclick = () => { undo(); kill(); };
  setTimeout(kill, ms);
}
const calm = () => document.documentElement.classList.contains('nk-still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
let parts = [], raf = 0;
function confetti(x = innerWidth / 2, y = innerHeight / 2, n = 70) {
  if (calm()) return;
  const cols = ['#1b2d5c', '#7cc4ef', '#3a9ad9', '#3d8a7a', '#a6dcf7', '#f7c47e', '#dcf3ea'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: 4 + Math.random() * 5, c: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 90 + Math.random() * 40, sq: Math.random() > .5 });
  }
  if (!raf) loop();
}
function loop() {
  const c = $('#confetti'), ctx = c.getContext('2d'), dpr = devicePixelRatio || 1;
  if (c.width !== innerWidth * dpr) { c.width = innerWidth * dpr; c.height = innerHeight * dpr; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life-- > 0);
  for (const p of parts) {
    p.vy += .25; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 30); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
    if (p.sq) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.4, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : (ctx.clearRect(0, 0, innerWidth, innerHeight), 0);
}

/* ---------- sheet (dialog) ---------- */
const dlg = $('#sheet');
let lastFocus = null;
function sheet(html, onOpen) {
  lastFocus = document.activeElement;
  const old = $('#sheet-body'), nb = old.cloneNode(false); old.replaceWith(nb); nb.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  onOpen && onOpen($('#sheet-body'));
  const f = $('#sheet-body input:not([type=hidden]), #sheet-body button.chip, #sheet-body .btn'); f && f.focus({ preventScroll: true });
}
function closeSheet() {
  if (!dlg.open) return;
  dlg.classList.add('closing');
  setTimeout(() => { dlg.close(); dlg.classList.remove('closing'); lastFocus?.focus?.(); }, 210);
}
dlg.addEventListener('click', e => { if (e.target === dlg) closeSheet(); });
dlg.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });

/* ---------- shared kit (noya-kit.js): accessibility button + dark mode ---------- */
// the kit's button starts above the tab bar here, unless the user already dragged it somewhere
function placeKit() {
  const t = document.querySelector('.nk-tab'); if (!t) return;
  let saved = null; try { saved = JSON.parse(localStorage.getItem('noya-kit:pos')); } catch { }
  if (saved) return;
  t.style.top = Math.max(80, innerHeight - (innerWidth < 700 ? 236 : 200)) + 'px';
}
addEventListener('load', () => setTimeout(placeKit, 60));
addEventListener('resize', () => setTimeout(placeKit, 60));

/* ---------- views ---------- */
let tab = 'home';
const main = $('#main');
const VIEWS = { home: homeView, tasks: tasksView, shop: shopView, family: familyView };
const credit = '';

function go(t, push = true) {
  if (!S.code) return;
  if (!VIEWS[t]) t = 'home';
  tab = t; seen.clear();
  if (push && location.hash !== '#' + t) history.pushState(null, '', '#' + t);
  $$('.tab').forEach(b => { const on = b.dataset.go === t; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
  setView(t); movePill();
  const v = VIEWS[t];
  main.innerHTML = `<div class="view">${v.shell ? v.shell() : '<div id="dyn"></div>'}</div>`;
  v.mount && v.mount();
  refresh();
  scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
  $('#fab').hidden = t === 'shop';
  $('#fab').setAttribute('aria-label', { home: 'הוספה מהירה', tasks: 'משימה חדשה', family: 'הוספת בן או בת בית' }[t] || 'הוספה');
}
addEventListener('popstate', () => go(location.hash.slice(1) || 'home', false));
function setView(v) { document.body.className = document.body.className.replace(/\bview-\S+/g, '').trim() + ' view-' + v; }
function movePill() {
  const bar = $('#tabbar'), on = $('.tab.on', bar), pill = $('.tab-pill', bar); if (!on || !pill || bar.hidden) return;
  pill.style.width = on.offsetWidth + 'px'; pill.style.height = on.offsetHeight + 'px';
  pill.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`; pill.classList.add('ready');
}
addEventListener('resize', movePill);
addEventListener('scroll', () => $('.topbar').classList.toggle('scrolled', scrollY > 8), { passive: true });

function refresh() {
  if (!S.code) return;
  $('#home-name').textContent = homeName();
  const lateOrToday = activeTasks().filter(t => t.due && t.due <= today()).length;
  const shopN = rows('shop').filter(i => !i.bought).length;
  const bt = $('#b-tasks'), bs = $('#b-shop');
  bt.hidden = !lateOrToday; bt.textContent = lateOrToday; bt.setAttribute('aria-label', `${lateOrToday} משימות להיום`);
  bs.hidden = !shopN; bs.textContent = shopN; bs.setAttribute('aria-label', `${shopN} פריטים לקנייה`);
  const dyn = $('#dyn'); if (dyn) dyn.innerHTML = VIEWS[tab].body();
  if (tab === 'family') drawQR();
}

/* ----- HOME ----- */
function homeView() { }
homeView.body = () => {
  const m = me(), h = new Date().getHours(), td = today();
  const greet = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
  const lines = ['בית מסודר מתחיל במשימה אחת קטנה ✨', 'ביחד זה הרבה יותר כיף 💜', 'כל וי קטן הוא ניצחון גדול 🏆', 'מוזיקה טובה ויאללה, מתחילים 🎶', 'היום הוא יום מצוין לבית נקי 🌈'];
  const todayLogs = logs().filter(l => l.type === 'task' && ds(new Date(l.at)) === td);
  const due = activeTasks().filter(t => t.due && t.due <= td);
  const total = todayLogs.length + due.length, pct = total ? Math.round(todayLogs.length / total * 100) : 100;
  const mine = due.filter(t => isMine(t) || t.assignee === 'any').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const shopN = rows('shop').filter(i => !i.bought).length;
  const wp = weekPoints(), ms = members();
  const board = ms.map(x => ({ m: x, p: wp[x.id] || 0 })).sort((a, b) => b.p - a.p);
  const max = Math.max(1, ...board.map(b => b.p));
  const feed = logs().slice(0, 6);
  return `<section class="hello">
    <p class="date">יום ${DAYS[new Date().getDay()]}, ${new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}</p>
    <h1>${greet}${m ? `, ${esc(m.name)}` : ''} <span class="wave">${m ? esc(m.emoji) : '👋'}</span></h1>
    <p class="sub">${lines[new Date().getDate() % lines.length]}</p><img src="logo.svg" alt="" class="hello-art" width="96" height="96"></section>
  <div class="stats">
    <button class="stat ring-card" data-go="tasks" aria-label="התקדמות היום: ${pct} אחוז. מעבר למשימות">
      <div class="ring" style="--p:${pct}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bgc" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42"/></svg><b>${pct}%</b></div>
      <span class="l">${total ? `${todayLogs.length} מתוך ${total} משימות להיום` : 'אין משימות להיום 🎉'}</span></button>
    <button class="stat s-shop" data-go="shop"><span class="n">🛒 ${shopN}</span><span class="l">${shopN === 1 ? 'פריט ברשימה' : 'פריטים ברשימה'}</span></button>
    <button class="stat s-pts" data-go="family"><span class="n">⭐ ${wp[S.meId] || 0}</span><span class="l">הנקודות שלי השבוע</span></button>
  </div>
  <section class="card"><div class="card-h"><h2>📌 מחכה לי היום</h2><button class="link-btn" data-go="tasks">לכל המשימות ←</button></div>
    ${mine.length ? `<ul class="list">${mine.map(taskCard).join('')}</ul>` : `<div class="empty"><span class="big">🌈</span>אין משימות שמחכות לך היום. איזה כיף!</div>`}</section>
  <section class="card"><div class="card-h"><h2>🏆 אלופי השבוע</h2><span class="muted" style="font-size:.85rem">מתאפס כל יום ראשון</span></div>
    <ol class="board">${board.map((b, i) => `<li class="${pop('b' + b.m.id)}" style="--i:${i}"><button class="board-row" data-act="edit-member" data-id="${b.m.id}" aria-label="${esc(b.m.name)}: ${b.p} נקודות. עריכה"><span class="medal">${['🥇', '🥈', '🥉'][i] || '✨'}</span>${avatar(b.m)}<div><b>${esc(b.m.name)}</b><div class="bar"><i style="--w:${Math.round(b.p / max * 100)}%"></i></div></div><span class="pts">${b.p}</span></button></li>`).join('')}</ol></section>
  <section class="card"><h2 style="margin-bottom:12px">⚡ מה קרה לאחרונה</h2>
    ${feed.length ? `<ul class="feed">${feed.map(l => { const w = member(l.memberId); return `<li>${avatar(w, 'sm')}<span><b>${esc(w?.name || 'מישהו')}</b> ${esc(l.emoji || '✨')} ${esc(l.title)} <span class="muted">+${l.points}</span></span><time datetime="${l.at}">${ago(l.at)}</time></li>`; }).join('')}</ul>` : `<div class="empty"><span class="big">🐣</span>עוד לא סומנו משימות. הראשון/ה שמסמנים מקבלים קונפטי!</div>`}</section>
  ${credit}`;
};

/* ----- TASKS ----- */
let tFilter = 'week', tRoom = 'all', showDone = false;
function tasksView() { }
tasksView.shell = () => `<div class="page-h"><h1>🧹 משימות הבית</h1><button class="btn soft" data-act="templates" style="min-height:42px;padding:0 14px">💡 רעיונות</button></div><div id="dyn"></div>`;
tasksView.body = () => {
  const td = today(), all = activeTasks();
  const F = { today: t => t.due && t.due <= td, week: t => !t.due || t.due <= addDays(td, 6), mine: t => isMine(t), all: () => true };
  const cnt = k => all.filter(F[k]).length;
  let list = all.filter(F[tFilter]).filter(t => tRoom === 'all' || t.room === tRoom);
  list.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title, 'he'));
  const groups = [['late', '⏰ באיחור', t => t.due && t.due < td], ['today', '☀️ היום', t => t.due === td], ['tomorrow', '🌙 מחר', t => t.due === addDays(td, 1)], ['later', '📅 בהמשך', t => t.due && t.due > addDays(td, 1)], ['none', '🗂️ בלי תאריך', t => !t.due]];
  const roomsUsed = ROOMS.filter(r => all.some(t => t.room === r.id));
  const done = rows('task').filter(t => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 15);
  let i = 0;
  const groupsHtml = groups.map(([k, n, fn]) => { const g = list.filter(fn); return g.length ? `<h3 class="group-t ${k === 'late' ? 'late' : ''}">${n} <span class="n">${g.length}</span></h3><ul class="list">${g.map(t => taskCard(t, i++)).join('')}</ul>` : ''; }).join('');
  return `${chips('tf', [['today', `☀️ היום <span class="cnt">${cnt('today')}</span>`], ['week', `📅 השבוע <span class="cnt">${cnt('week')}</span>`], ['mine', `🙋 שלי <span class="cnt">${cnt('mine')}</span>`], ['all', `🏠 הכל <span class="cnt">${cnt('all')}</span>`]], tFilter, false, 'scroll')}
  ${roomsUsed.length > 1 ? chips('tr', [['all', 'כל החדרים'], ...roomsUsed.map(r => [r.id, `${r.e} ${r.n}`])], tRoom, false, 'scroll') : ''}
  ${list.length ? groupsHtml : `<div class="card empty"><span class="big">${all.length ? '🎉' : '🪴'}</span>${all.length ? 'אין כאן משימות. אפשר להחליף מסנן או פשוט לנוח!' : 'עוד אין משימות. אפשר להוסיף עם הכפתור ➕ או לבחור מתוך הרעיונות 💡'}</div>`}
  ${done.length ? `<button class="btn ghost more-btn" data-act="toggle-done" aria-expanded="${showDone}">${showDone ? '🙈 הסתרת' : '✅ הצגת'} משימות שהושלמו (${done.length})</button>
  ${showDone ? `<ul class="list" style="margin-top:12px">${done.map(t => taskCard(t, i++)).join('')}</ul>` : ''}` : ''}
  ${credit}`;
};
function taskCard(t, i = 0) {
  const o = owner(t), d = dueInfo(t.due), r = room(t.room), rep = repeatLabel(t.repeat);
  return `<li class="task ${!t.done && t.due && t.due < today() ? 'late' : ''} ${t.done ? 'done' : ''} ${pop(t.id)}" style="--i:${i}" data-id="${t.id}">
    <button class="check" data-act="done" data-id="${t.id}" aria-label="${t.done ? 'החזרה לרשימה' : 'סימון כבוצע'}: ${esc(t.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
    <button class="task-main" data-act="edit-task" data-id="${t.id}" aria-label="עריכה: ${esc(t.title)}">
      <span class="t-emoji" aria-hidden="true">${esc(t.emoji || '✨')}</span>
      <span class="t-txt"><b>${esc(t.title)}</b><span class="meta">
        ${t.done ? `<span>✅ הושלם ${ago(t.doneAt)}</span>` : `<span class="${d.c}">${d.t}</span>`}
        <span>${r.e} ${r.n}</span>${rep ? `<span>🔁 ${rep}</span>` : ''}${t.assignee === 'rotate' ? '<span>🔄 תורנות</span>' : ''}<span>⭐ ${POINTS[t.effort] || 10}</span></span></span>
    </button>${avatar(o)}</li>`;
}
function completeTask(id, btn) {
  const t = rec(id); if (!t) return;
  if (t.done) { put('task', { ...t, done: false, doneAt: null, due: t.due && t.due >= today() ? t.due : today() }); toast(`↩️ "${esc(t.title)}" חזרה לרשימה`); return; }
  const prev = clone(t), pts = POINTS[t.effort] || 10, now = new Date().toISOString();
  const log = { id: uid(), type: 'task', memberId: S.meId, taskId: id, title: t.title, emoji: t.emoji, points: pts, at: now };
  const nt = { ...t, lastDone: now, lastBy: S.meId };
  const nd = nextDue(t);
  if (nd) { nt.due = nd; if (t.assignee === 'rotate') nt.turn = nextMember(t.turn || S.meId); }
  else { nt.done = true; nt.doneAt = now; nt.doneBy = S.meId; }
  const card = btn?.closest('.task'); const rect = btn?.getBoundingClientRect();
  card?.classList.add('checking'); navigator.vibrate?.(18);
  confetti(rect ? rect.left + rect.width / 2 : undefined, rect ? rect.top : undefined, 45);
  setTimeout(() => {
    write([['task', nt], ['log', log]]);
    const left = activeTasks().filter(x => x.due && x.due <= today()).length;
    if (!left) { confetti(innerWidth / 2, innerHeight / 3, 160); toast('🎉 כל משימות היום הושלמו! אתם אלופים'); }
    else toast(`${esc(t.emoji || '✨')} כל הכבוד! +${pts} נקודות${nd ? ` · הפעם הבאה: ${dueInfo(nd).t}` : ''}`, { undo: () => write([['task', prev], ['del', log.id]]) });
  }, calm() ? 0 : 650);
}
function taskSheet(id, preset) {
  const ms = members();
  const t = id ? clone(rec(id)) : { title: '', emoji: '', room: 'general', assignee: 'any', repeat: { type: 'none' }, due: today(), effort: 2, notes: '', ...preset };
  let emo = t.emoji, manual = !!t.emoji;
  sheet(`<h2 id="sheet-title">${id ? '✏️ עריכת משימה' : '✨ משימה חדשה'}</h2>
  <form class="form" id="f" novalidate>
    <label class="field"><span>מה צריך לעשות?</span>
      <div class="with-emoji"><button type="button" class="emoji-btn" id="emo" aria-label="בחירת אימוג׳י" aria-expanded="false">${esc(emo || '✨')}</button>
      <input name="title" maxlength="60" value="${esc(t.title)}" placeholder="למשל: לתלות כביסה" autocomplete="off" required></div></label>
    <div id="emo-box" hidden>${emojiGrid(TASK_EMOJIS, emo)}</div>
    <p class="err" id="err" aria-live="assertive"></p>
    <fieldset><legend>איפה בבית?</legend>${chips('room', ROOMS.map(r => [r.id, `${r.e} ${r.n}`]), t.room)}</fieldset>
    <fieldset><legend>מי אחראי/ת?</legend>${chips('as', [['any', '👐 מי שפנוי'], ['rotate', '🔄 תורנות'], ...ms.map(m => [m.id, `${esc(m.emoji)} ${esc(m.name)}`])], t.assignee)}</fieldset>
    <fieldset><legend>כל כמה זמן?</legend>${chips('rep', [['none', 'פעם אחת'], ['daily', 'כל יום'], ['weekly', 'כל שבוע'], ['interval', 'כל כמה ימים'], ['monthly', 'כל חודש']], t.repeat.type)}
      <div data-show="weekly">${chips('days', DSH.map((d, i) => [String(i), d]), (t.repeat.days || []).map(String), true, 'days')}<small class="muted">אפשר לבחור כמה ימים</small></div>
      <label class="inline" data-show="interval">כל <input type="number" name="every" min="2" max="90" value="${t.repeat.every || 3}" aria-label="מספר ימים"> ימים</label></fieldset>
    <label class="field"><span>📅 מתי בפעם הקרובה?</span><input type="date" name="due" value="${t.due || ''}"></label>
    <fieldset><legend>כמה מאמץ? (נקודות)</legend>${chips('eff', [['1', '🪶 קל · 5'], ['2', '💪 בינוני · 10'], ['3', '🔥 קשה · 20']], String(t.effort || 2))}</fieldset>
    <label class="field"><span>📝 הערות</span><textarea name="notes" rows="2" maxlength="200" placeholder="למשל: להשתמש בנוזל הסגול">${esc(t.notes || '')}</textarea></label>
    <div class="actions"><button class="btn primary">💾 שמירה</button>${id ? `<button type="button" class="btn ghost danger" data-act="del-task" data-id="${id}">🗑️ מחיקה</button>` : ''}</div>
  </form>`, b => {
    const f = $('#f', b), title = f.title, eb = $('#emo', b), box = $('#emo-box', b);
    const subs = () => $$('[data-show]', b).forEach(x => x.hidden = x.dataset.show !== chipVal(b, 'rep'));
    subs(); b.addEventListener('chip', subs);
    eb.onclick = () => { box.hidden = !box.hidden; eb.setAttribute('aria-expanded', !box.hidden); };
    box.onclick = e => { const x = e.target.closest('[data-emo]'); if (!x) return; emo = x.dataset.emo; manual = true; eb.textContent = emo; $$('[data-emo]', box).forEach(y => y.setAttribute('aria-pressed', y === x)); box.hidden = true; eb.setAttribute('aria-expanded', false); };
    title.oninput = () => { if (!manual) { emo = guessEmoji(title.value); eb.textContent = emo; } };
    f.onsubmit = e => {
      e.preventDefault();
      const name = title.value.trim(); if (!name) { $('#err', b).textContent = 'צריך לכתוב מה המשימה 🙂'; title.focus(); return; }
      const rt = chipVal(b, 'rep'), as = chipVal(b, 'as');
      const repeat = { type: rt }; if (rt === 'weekly') repeat.days = chipVals(b, 'days').map(Number); if (rt === 'interval') repeat.every = Math.max(2, +f.every.value || 3);
      const nt = { ...t, id: id || uid(), title: name, emoji: emo || guessEmoji(name), room: chipVal(b, 'room'), assignee: as, repeat, due: f.due.value || (rt !== 'none' ? today() : ''), effort: +chipVal(b, 'eff'), notes: f.notes.value.trim(), created: t.created || Date.now() };
      if (as === 'rotate' && !member(nt.turn)) nt.turn = S.meId || ms[0]?.id;
      if (rt === 'weekly' && repeat.days.length && nt.due && !repeat.days.includes(parse(nt.due).getDay())) nt.due = nextDue({ ...nt, due: addDays(nt.due, -1) });
      put('task', nt); closeSheet(); toast(id ? '✅ המשימה עודכנה' : `${esc(nt.emoji)} המשימה נוספה`);
    };
  });
}
function templatesSheet() {
  const have = new Set(rows('task').map(t => t.title));
  sheet(`<h2 id="sheet-title">💡 רעיונות למשימות</h2><p class="muted" style="margin-top:-8px">לוחצים על משימה כדי להוסיף אותה לבית. אפשר לערוך אותה אחר כך.</p>
  ${ROOMS.map(r => { const ts = TEMPLATES.map((x, i) => [x, i]).filter(([x]) => x[0] === r.id); return ts.length ? `<div class="tpl-room"><h3 class="group-t" style="margin:8px 0 2px">${r.e} ${r.n}</h3>${ts.map(([x, i]) => { const a = have.has(x[1]); return `<button type="button" class="tpl ${a ? 'added' : ''}" data-act="add-tpl" data-i="${i}" ${a ? 'aria-disabled="true"' : ''}><span class="e" aria-hidden="true">${x[2]}</span><span>${x[1]}<br><small>${repeatLabel(x[3]) || 'פעם אחת'} · ⭐ ${POINTS[x[4]]}</small></span><b aria-hidden="true">${a ? '✓' : '➕'}</b></button>`; }).join('')}</div>` : ''; }).join('')}`);
}
function tplTask(i) { const [r, title, emoji, repeat, effort] = TEMPLATES[i]; return { id: uid(), title, emoji, room: r, assignee: 'any', repeat: clone(repeat), due: today(), effort, notes: '', created: Date.now() }; }

/* ----- SHOP ----- */
let qty = 1, rec2 = null;
function shopView() { }
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
shopView.shell = () => `<div class="page-h"><h1>🛒 רשימת קניות</h1><button class="btn soft" data-act="share-list" style="min-height:42px;padding:0 14px">📤 שליחה</button></div>
  <form class="add-bar" id="add-item" autocomplete="off">
    <label class="sr" for="item-in">מה צריך לקנות?</label>
    <input id="item-in" placeholder="מה צריך לקנות? 🥑" maxlength="80" enterkeyhint="done">
    ${SR ? '<button type="button" class="mic" data-act="mic" aria-label="הוספה בקול">🎤</button>' : ''}
    <div class="qty" role="group" aria-label="כמות"><button type="button" data-act="q" data-d="-1" aria-label="הפחתת כמות">−</button><output id="q-out" aria-live="polite">1</output><button type="button" data-act="q" data-d="1" aria-label="הוספת כמות">+</button></div>
    <button class="btn primary" aria-label="הוספה לרשימה">➕</button>
  </form><div id="dyn"></div>`;
shopView.mount = () => {
  $('#add-item').onsubmit = e => {
    e.preventDefault(); const inp = $('#item-in');
    const names = inp.value.split(/[,\n،]+/).map(s => s.trim()).filter(Boolean);
    if (!names.length) { inp.focus(); return; }
    names.forEach(n => addItem(n, names.length > 1 ? 1 : qty, names.length > 1));
    if (names.length > 1) toast(`🛒 ${names.length} פריטים נוספו לרשימה`);
    inp.value = ''; qty = 1; $('#q-out').textContent = 1; inp.focus();
  };
};
shopView.body = () => {
  const items = rows('shop'), act = items.filter(i => !i.bought), bought = items.filter(i => i.bought);
  const hist = rec('hist') || {}, onList = new Set(act.map(i => i.name));
  const sugg = Object.entries(hist).filter(([n]) => n !== 'id' && !onList.has(n)).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const pct = items.length ? Math.round(bought.length / items.length * 100) : 0;
  let i = 0;
  const groups = CAT_ORDER.map(cat).map(c => { const g = act.filter(x => x.cat === c.id).sort((a, b) => a.name.localeCompare(b.name, 'he')); return g.length ? `<h3 class="cat-t"><span class="e" aria-hidden="true">${c.e}</span>${c.n} <span class="muted" style="font-weight:500">(${g.length})</span></h3><ul class="list">${g.map(x => itemRow(x, i++)).join('')}</ul>` : ''; }).join('');
  return `${sugg.length ? `<div class="sugg"><small class="muted">⚡ קונים הרבה:</small>${chips('sg', sugg.map(([n]) => [n, `➕ ${esc(n)}`]), null, false, 'scroll')}</div>` : ''}
  ${items.length ? `<div class="progress" role="progressbar" aria-label="התקדמות הקנייה" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="--w:${pct}%"></i></div><small class="muted" style="margin-inline-start:6px">${bought.length} מתוך ${items.length} בעגלה</small>` : ''}
  ${act.length ? groups : `<div class="card empty"><span class="big">${bought.length ? '🎉' : '🧺'}</span>${bought.length ? 'הכל בעגלה! אפשר לנקות את מה שנקנה.' : 'הרשימה ריקה. כל בני הבית יכולים להוסיף כאן מה שצריך, וזה מתעדכן אצל כולם.'}<br><small>טיפ: אפשר להוסיף כמה פריטים בבת אחת עם פסיקים, למשל: חלב, ביצים, לחם</small></div>`}
  ${bought.length ? `<div class="card-h" style="margin-top:22px"><h3 class="group-t" style="margin:0">✅ בעגלה (${bought.length})</h3><button class="link-btn" data-act="clear-bought">🧹 ניקוי מה שנקנה</button></div><ul class="list">${bought.map(x => itemRow(x, i++)).join('')}</ul>` : ''}
  ${credit}`;
};
function itemRow(x, i) {
  const by = member(x.by);
  return `<li class="item ${x.bought ? 'bought' : ''} ${pop(x.id + (x.bought ? 'b' : ''))}" style="--i:${i}" data-id="${x.id}">
    <button class="check" data-act="buy" data-id="${x.id}" aria-label="${x.bought ? 'החזרה לרשימה' : 'סימון שנקנה'}: ${esc(x.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
    <button class="i-main" data-act="edit-item" data-id="${x.id}" aria-label="עריכה: ${esc(x.name)}"><span><b>${esc(x.name)}</b>${x.qty > 1 ? `<span class="qty-badge">×${x.qty}</span>` : ''}${x.note ? `<small>${esc(x.note)}</small>` : ''}</span></button>
    ${by ? avatar(by, 'sm') : ''}</li>`;
}
function addItem(name, q = 1, quiet = false) {
  name = name.slice(0, 80);
  const ex = rows('shop').find(i => !i.bought && i.name === name);
  const hist = { ...(rec('hist') || {}) }; hist[name] = (hist[name] || 0) + 1; delete hist.id;
  const histRow = ['hist', { ...hist, id: 'hist' }];
  if (ex) { write([['shop', { ...ex, qty: (ex.qty || 1) + q }], histRow]); quiet || toast(`🔁 "${esc(name)}" כבר ברשימה, הכמות עודכנה`); flash(ex.id); return; }
  const it = { id: uid(), name, qty: q, cat: guessCat(name), by: S.meId, at: Date.now() };
  write([['shop', it], histRow]);
  quiet || toast(`${cat(it.cat).e} "${esc(name)}" נוסף לרשימה`);
}
const flash = id => setTimeout(() => $(`.item[data-id="${id}"]`)?.classList.add('flash'), 30);
function itemSheet(id) {
  const x = clone(rec(id)); if (!x) return;
  sheet(`<h2 id="sheet-title">✏️ עריכת פריט</h2><form class="form" id="f" novalidate>
    <label class="field"><span>שם הפריט</span><input name="name" maxlength="80" value="${esc(x.name)}" required></label>
    <label class="field"><span>כמות</span><input type="number" name="qty" min="1" max="99" value="${x.qty || 1}"></label>
    <fieldset><legend>קטגוריה</legend>${chips('cat', CATS.map(c => [c.id, `${c.e} ${c.n}`]), x.cat)}</fieldset>
    <label class="field"><span>הערה</span><input name="note" maxlength="80" value="${esc(x.note || '')}" placeholder="למשל: 3% שומן, המותג הכחול"></label>
    <p class="muted" style="margin:0">${member(x.by) ? `נוסף על ידי ${esc(member(x.by).emoji)} ${esc(member(x.by).name)}` : ''}</p>
    <div class="actions"><button class="btn primary">💾 שמירה</button><button type="button" class="btn ghost danger" data-act="del-item" data-id="${id}">🗑️ מחיקה</button></div></form>`, b => {
    $('#f', b).onsubmit = e => { e.preventDefault(); const f = e.target; const n = f.name.value.trim(); if (!n) return f.name.focus(); put('shop', { ...x, name: n, qty: Math.max(1, +f.qty.value || 1), cat: chipVal(b, 'cat'), note: f.note.value.trim() }); closeSheet(); toast('✅ הפריט עודכן'); };
  });
}
function shareList() {
  const act = rows('shop').filter(i => !i.bought);
  if (!act.length) return toast('🧺 הרשימה ריקה כרגע');
  const txt = `🛒 רשימת קניות: ${homeName()}\n` + CAT_ORDER.map(cat).map(c => { const g = act.filter(x => x.cat === c.id); return g.length ? `\n${c.e} ${c.n}\n${g.map(x => `• ${x.name}${x.qty > 1 ? ` ×${x.qty}` : ''}${x.note ? ` (${x.note})` : ''}`).join('\n')}` : ''; }).join('') + (CLOUD ? `\n\n📲 להוספה לרשימה: ${joinLink()}` : '');
  sheet(`<h2 id="sheet-title">📤 שליחת הרשימה</h2><p class="muted" style="margin-top:-6px">${act.length} פריטים, מסודרים לפי מחלקות בסופר.</p>
    <div class="actions" style="flex-direction:column">
      <a class="btn primary wide" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">💬 שליחה בוואטסאפ</a>
      ${navigator.share ? '<button type="button" class="btn soft wide" data-act="native-share">📲 שיתוף לאפליקציה אחרת</button>' : ''}
      <button type="button" class="btn ghost wide" data-act="copy-list">📋 העתקה כטקסט</button></div>`, b => {
    b.onclick = async e => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'copy-list') { copy(txt, '📋 הרשימה הועתקה'); closeSheet(); }
      if (a === 'native-share') { try { await navigator.share({ text: txt }); closeSheet(); } catch { } }
    };
  });
}
function startMic(btn) {
  if (rec2) { rec2.stop(); return; }
  rec2 = new SR(); rec2.lang = 'he-IL'; rec2.interimResults = false;
  btn.classList.add('on'); btn.setAttribute('aria-label', 'מקשיב... לחיצה לעצירה');
  rec2.onresult = e => { const t = e.results[0][0].transcript; const inp = $('#item-in'); inp.value = t.replace(/ ו(?=\S)/g, ', ').replace(/ וגם /g, ', '); inp.focus(); };
  rec2.onerror = () => toast('🎤 לא הצלחתי לשמוע. כדאי לבדוק הרשאת מיקרופון');
  rec2.onend = () => { btn.classList.remove('on'); btn.setAttribute('aria-label', 'הוספה בקול'); rec2 = null; };
  rec2.start(); toast('🎤 מקשיב... אפשר לומר כמה פריטים');
}

/* ----- FAMILY ----- */
function familyView() { }
familyView.body = () => {
  const ms = members(), wp = weekPoints(), done = {};
  logs().forEach(l => done[l.memberId] = (done[l.memberId] || 0) + 1);
  return `<div class="page-h"><h1>👨‍👩‍👧 ${esc(homeName())}</h1><button class="btn soft" data-act="rename" style="min-height:42px;padding:0 14px">✏️ שינוי שם</button></div>
  ${CLOUD ? `<section class="card code-box"><h2>💌 מזמינים את בני הבית</h2><p style="margin:6px 0 0">שולחים קישור או קוד, וכל אחד מצטרף מהטלפון שלו</p>
    <div class="code" aria-label="קוד הבית: ${S.code.split('').join(' ')}">${fmtCode(S.code)}</div>
    <div class="code-actions"><button class="btn" data-act="copy-code">📋 העתקת קוד</button><button class="btn" data-act="copy-link">🔗 העתקת קישור</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent(`🏡 בואו להצטרף לבית "${homeName()}" ב-Nestly! משימות ורשימת קניות משותפת\n${joinLink()}\nקוד: ${fmtCode(S.code)}`)}" target="_blank" rel="noopener">💬 וואטסאפ</a></div>
    <div class="qr" id="qr" aria-label="קוד QR להצטרפות" role="img" hidden></div></section>`
    : `<section class="card"><h2>💌 הזמנת בני הבית</h2><div class="note">🔒 כרגע האפליקציה שומרת הכל רק במכשיר הזה. כדי שכל בני הבית יוכלו להצטרף בקישור או בקוד ולראות את אותה רשימה, צריך לחבר את Supabase פעם אחת (לפי ההוראות ב-README). עד אז אפשר להוסיף את בני הבית ידנית ולנהל הכל מכאן.</div></section>`}
  <section class="card"><div class="card-h"><h2>👪 בני הבית (${ms.length})</h2><button class="link-btn" data-act="add-member">➕ הוספה</button></div>
    ${ms.map((m, i) => `<div class="member ${pop('m' + m.id)}" style="--i:${i}">${avatar(m, 'lg')}<div class="nm"><b>${esc(m.name)}${m.id === S.meId ? '<span class="me-tag">אני</span>' : ''}</b><small>⭐ ${wp[m.id] || 0} השבוע · ✅ ${done[m.id] || 0} משימות בסך הכל</small></div><button class="link-btn" data-act="edit-member" data-id="${m.id}" aria-label="עריכת ${esc(m.name)}">✏️</button></div>`).join('')}</section>
  <section class="card settings"><h2 style="margin-bottom:4px">⚙️ הגדרות</h2>
    <button class="set-row" data-act="whoami"><span class="e">🙋</span><span>מי אני במכשיר הזה?<small>כרגע: ${esc(me()?.name || 'לא נבחר')}</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="a11y"><span class="e">♿</span><span>נגישות<small>גודל טקסט, ניגודיות, גופן קריא, עצירת אנימציות</small></span><span aria-hidden="true">←</span></button><button class="set-row" data-act="theme"><span class="e">🌗</span><span>מצב כהה / בהיר<small>החלפת צבעי התצוגה</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="templates"><span class="e">💡</span><span>רעיונות למשימות<small>חבילת משימות מוכנות לפי חדרים</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="backup"><span class="e">💾</span><span>הורדת גיבוי<small>קובץ JSON עם כל הנתונים של הבית</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="leave"><span class="e">🚪</span><span>יציאה מהבית במכשיר הזה<small>${CLOUD ? 'הנתונים נשארים אצל שאר בני הבית' : 'שימו לב: במצב מקומי הנתונים יימחקו'}</small></span><span aria-hidden="true">←</span></button>
  </section>${credit}`;
};
function drawQR() {
  const box = $('#qr'); if (!box || !window.qrcode) return;
  try { const q = qrcode(0, 'M'); q.addData(joinLink()); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); box.hidden = false; } catch { }
}
function memberSheet(id, { forMe = false, onDone } = {}) {
  const ms = members();
  const m = id ? clone(member(id)) : { name: '', emoji: AVATARS[ms.length % AVATARS.length], color: COLORS[ms.length % COLORS.length] };
  let emo = m.emoji;
  sheet(`<h2 id="sheet-title">${id ? '✏️ עריכת בן/בת בית' : forMe ? '🙋 נעים להכיר!' : '➕ בן/בת בית חדש/ה'}</h2><form class="form" id="f" novalidate>
    <label class="field"><span>שם</span><input name="name" maxlength="24" value="${esc(m.name)}" placeholder="למשל: אמא, יואב" required></label>
    <p class="err" id="err" aria-live="assertive"></p>
    <fieldset><legend>הדמות שלי</legend>${emojiGrid(AVATARS, emo)}</fieldset>
    <fieldset><legend>צבע</legend>${chips('col', COLORS.map(c => [c, `<span class="av sm c-${c}" style="display:inline-grid" aria-hidden="true"></span>`]), m.color)}</fieldset>
    <div class="actions"><button class="btn primary">${id ? '💾 שמירה' : '✨ יאללה'}</button>${id && id !== S.meId ? `<button type="button" class="btn ghost danger" data-act="del-member" data-id="${id}">🗑️ הסרה</button>` : ''}</div></form>`, b => {
    $$('[data-group="col"] .chip', b).forEach((c, i) => c.setAttribute('aria-label', ['סגול', 'מנטה', 'אפרסק', 'ורוד', 'תכלת', 'צהוב'][i]));
    $('.emoji-grid', b).onclick = e => { const x = e.target.closest('[data-emo]'); if (!x) return; emo = x.dataset.emo; $$('[data-emo]', b).forEach(y => y.setAttribute('aria-pressed', y === x)); };
    $('#f', b).onsubmit = e => {
      e.preventDefault(); const n = e.target.name.value.trim();
      if (!n) { $('#err', b).textContent = 'צריך לכתוב שם 🙂'; return e.target.name.focus(); }
      const nm = { ...m, id: id || uid(), name: n, emoji: emo, color: chipVal(b, 'col'), created: m.created || Date.now() };
      put('member', nm); if (forMe) { S.meId = nm.id; save(); }
      closeSheet(); toast(id ? '✅ נשמר' : `${esc(emo)} ${esc(n)} ${forMe ? 'הצטרפ/ה לבית' : 'נוספ/ה לבית'}`);
      onDone && onDone(nm);
    };
  });
}
function whoAmISheet(first = false) {
  const ms = members();
  sheet(`<h2 id="sheet-title">🙋 מי את/ה?</h2><p class="muted" style="margin-top:-6px">${first ? `הצטרפת לבית <b>${esc(homeName())}</b>! ` : ''}בחרו את עצמכם מהרשימה כדי שהנקודות יירשמו נכון.</p>
    <div class="settings">${ms.map(m => `<button class="set-row" data-act="pick-me" data-id="${m.id}">${avatar(m)}<span><b>${esc(m.name)}</b></span><span aria-hidden="true">${m.id === S.meId ? '✓' : '←'}</span></button>`).join('')}
    <button class="set-row" data-act="new-me"><span class="e">✨</span><span><b>אני חדש/ה כאן</b><small>יצירת דמות חדשה</small></span><span aria-hidden="true">←</span></button></div>`);
}
function textSheet(title, label, val, onSave) {
  sheet(`<h2 id="sheet-title">${title}</h2><form class="form" id="f"><label class="field"><span>${label}</span><input name="v" maxlength="30" value="${esc(val)}" required></label><div class="actions"><button class="btn primary">💾 שמירה</button></div></form>`, b => {
    $('#f', b).onsubmit = e => { e.preventDefault(); const v = e.target.v.value.trim(); if (v) { onSave(v); closeSheet(); } };
  });
}
function leaveSheet() {
  sheet(`<h2 id="sheet-title">🚪 יציאה מהבית?</h2><p>${CLOUD ? `הבית ימשיך להתקיים אצל כל השאר. תמיד אפשר לחזור עם הקוד <b dir="ltr">${fmtCode(S.code)}</b>.` : 'במצב מקומי כל המשימות והרשימות במכשיר הזה יימחקו. כדאי להוריד גיבוי קודם.'}</p>
    <div class="actions"><button type="button" class="btn primary" data-act="close">🏡 נשארים</button><button type="button" class="btn ghost danger" data-act="leave-yes">יציאה</button></div>`);
}
function backup() {
  const blob = new Blob([JSON.stringify({ app: 'Nestly', code: S.code, exported: new Date().toISOString(), records: Object.values(S.records).filter(r => !r.deleted) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nestly-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('💾 הגיבוי ירד למכשיר');
}

/* ----- ONBOARDING ----- */
function onboarding(joinCode) {
  $('#tabbar').hidden = true; $('#fab').hidden = true; $('#home-name').textContent = 'הבית המשותף שלכם'; setView('onb');
  const feats = [['🧹', 'משימות שחוזרות לבד', 'כל יום, כל שבוע או בימים שבוחרים', 'sky'], ['🛒', 'רשימת קניות חכמה', 'מסודרת לפי מחלקות, גם בקול', 'mint'], ['🔄', 'תורנויות הוגנות', 'התור עובר לבד לבא בתור', 'peach'], ['🏆', 'נקודות ואלופי השבוע', 'קצת תחרות וקונפטי 🎉', 'sky']];
  main.innerHTML = `<div class="view onb">
    <section class="onb-hero">
      <div class="hero-badge" aria-hidden="true">
        <img src="logo.svg" alt="" class="hero-logo" width="132" height="132">
        <span class="orbit"><i>🧺</i><i>🧽</i><i>🛒</i><i>⭐</i></span>
      </div>
      <span class="eyebrow">✨ אפליקציית הבית המשותף</span>
      <h1>הבית שלכם, <span class="grad-txt">מסודר ושמח</span></h1>
      <p class="lead">כל משימות הבית ורשימת הקניות במקום אחד, משותף לכל בני הבית. מצטרפים בקוד או בקישור, בלי הרשמה ובלי סיסמה.</p>
      <div class="btns"><button class="btn primary wide" data-act="create">🏡 פתיחת בית חדש</button>
      ${CLOUD ? '<button class="btn soft wide" data-act="join">🔑 יש לי קוד הצטרפות</button>' : '<div class="note">🔒 מצב מקומי: הנתונים נשמרים במכשיר הזה. לשיתוף עם בני הבית צריך לחבר את Supabase לפי ה-README.</div>'}
      <button class="link-btn" data-act="help">💡 איך זה עובד?</button></div>
    </section>
    <section class="features">${feats.map(([e, t, d, c], i) => `<button class="feat c-${c}" style="--i:${i}" data-act="help"><span class="fe">${e}</span><b>${t}</b><small>${d}</small></button>`).join('')}</section>
    <section class="steps card"><h2>🚀 שלושה צעדים וזהו</h2>
      <ol><li><button class="step" data-act="create"><span>1</span><div><b>פותחים בית</b><small>נותנים לו שם ובוחרים דמות</small></div><em>←</em></button></li>
      <li><button class="step" data-act="${CLOUD ? 'join' : 'help'}"><span>2</span><div><b>מזמינים את בני הבית</b><small>${CLOUD ? 'קיבלתם קוד? לחצו כאן להצטרפות' : 'קוד, קישור או QR בוואטסאפ'}</small></div><em>←</em></button></li>
      <li><button class="step" data-act="help"><span>3</span><div><b>מסמנים וי ומקבלים נקודות</b><small>איך זה עובד? לחצו כאן</small></div><em>←</em></button></li></ol></section>
  </div>`;
  if (joinCode && CLOUD) joinSheet(joinCode);
}
function helpSheet() {
  sheet(`<h2 id="sheet-title">💡 איך Nestly עובד?</h2>
  <div class="help">
    <div><span class="e">🏡</span><p><b>בית אחד לכולם</b><br><small class="muted">פותחים בית ומשתפים את הקוד. כל מי שנכנס רואה את אותן משימות ואותה רשימה.</small></p></div>
    <div><span class="e">✅</span><p><b>מסמנים וי</b><br><small class="muted">לחיצה על העיגול מסמנת משימה כבוצעה, נותנת נקודות ומעבירה את התור.</small></p></div>
    <div><span class="e">🛒</span><p><b>מוסיפים לקניות</b><br><small class="muted">כותבים כמה פריטים עם פסיקים או אומרים בקול, והכל מסתדר לפי מחלקות.</small></p></div>
    <div><span class="e">♿</span><p><b>נגישות ומצב כהה</b><br><small class="muted">כפתור הירח מחליף מצב תצוגה. את כפתור הנגישות העגול אפשר לגרור לכל מקום.</small></p></div>
  </div>
  <div class="actions" style="margin-top:16px"><button type="button" class="btn primary" data-act="close">יאללה, הבנתי</button><button type="button" class="btn soft" data-act="to-faq">❓ לשאלות נפוצות</button></div>`);
}
function createSheet() {
  let emo = AVATARS[0];
  sheet(`<h2 id="sheet-title">✨ בית חדש</h2><form class="form" id="f" novalidate>
    <label class="field"><span>איך קוראים לבית?</span><input name="home" maxlength="30" placeholder="למשל: הבית של משפחת לוי" required></label>
    <label class="field"><span>ואיך קוראים לך?</span><input name="name" maxlength="24" placeholder="השם שלך" required></label>
    <fieldset><legend>בחרו דמות</legend>${emojiGrid(AVATARS, emo)}</fieldset>
    <label class="switch-row" style="cursor:pointer"><span><b>💡 להוסיף משימות בית מומלצות</b><br><small class="muted">כלים, כביסה, שאיבה, מצעים ועוד. אפשר לערוך אחר כך</small></span><input type="checkbox" name="starter" checked style="width:24px;height:24px;accent-color:var(--lav-d)"></label>
    <p class="err" id="err" aria-live="assertive"></p>
    <button class="btn primary wide">🏡 יצירת הבית</button></form>`, b => {
    $('.emoji-grid', b).onclick = e => { const x = e.target.closest('[data-emo]'); if (!x) return; emo = x.dataset.emo; $$('[data-emo]', b).forEach(y => y.setAttribute('aria-pressed', y === x)); };
    $('#f', b).onsubmit = async e => {
      e.preventDefault(); const f = e.target, home = f.home.value.trim(), name = f.name.value.trim(), err = $('#err', b);
      if (!home || !name) { err.textContent = 'צריך למלא את שם הבית ואת השם שלך 🙂'; return; }
      const btn = $('button.primary', f); btn.disabled = true; btn.textContent = '⏳ רגע...';
      let code = makeCode();
      try {
        if (CLOUD) { let ok = false; for (let i = 0; i < 4 && !ok; i++) { ok = await rpc('nestly_create', { p_code: code, p_name: home }); if (!ok) code = makeCode(); } if (!ok) throw new Error('code'); }
      } catch (x) { console.warn(x); err.textContent = '😕 לא הצלחנו להתחבר לשרת. כדאי לבדוק אינטרנט ואת הגדרות Supabase ב-config.js'; btn.disabled = false; btn.textContent = '🏡 יצירת הבית'; return; }
      S = { code, records: {}, outbox: {}, cursor: null };
      const mid = uid(); S.meId = mid;
      const list = [['meta', { id: 'meta', name: home }], ['member', { id: mid, name, emoji: emo, color: 'lav', created: Date.now() }]];
      if (f.starter.checked) STARTER.forEach(i => list.push(['task', tplTask(i)]));
      write(list); closeSheet(); history.replaceState(null, '', location.pathname + '#home'); start();
      setTimeout(() => { confetti(innerWidth / 2, innerHeight / 3, 150); toast(`🏡 הבית "${esc(home)}" מוכן!${CLOUD ? ' עכשיו מזמינים את בני הבית' : ''}`); }, 300);
    };
  });
}
function joinSheet(pre = '') {
  sheet(`<h2 id="sheet-title">🔑 הצטרפות לבית</h2><form class="form" id="f" novalidate>
    <label class="field"><span>קוד הבית (6 תווים)</span><input name="code" maxlength="8" value="${esc(fmtCode(pre.toUpperCase().replace(/[^A-Z0-9]/g, '')))}" placeholder="ABC-123" dir="ltr" style="text-align:center;font-size:1.5rem;letter-spacing:.2em;text-transform:uppercase" autocomplete="off" autocapitalize="characters" required></label>
    <p class="err" id="err" aria-live="assertive"></p><button class="btn primary wide">🚪 כניסה</button></form>`, b => {
    $('#f', b).onsubmit = async e => {
      e.preventDefault(); const code = e.target.code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''), err = $('#err', b), btn = $('button.primary', b);
      if (code.length !== 6) { err.textContent = 'הקוד צריך להיות באורך 6 תווים'; return; }
      btn.disabled = true; btn.textContent = '⏳ מחפשים את הבית...';
      try {
        const name = await rpc('nestly_info', { p_code: code });
        if (!name) { err.textContent = '🤔 לא מצאנו בית עם הקוד הזה. כדאי לבדוק שוב'; btn.disabled = false; btn.textContent = '🚪 כניסה'; return; }
        S = { code, records: {}, outbox: {}, cursor: null }; save();
        await sync(); history.replaceState(null, '', location.pathname + '#home'); start();
        members().length ? whoAmISheet(true) : memberSheet(null, { forMe: true });
      } catch (x) { console.warn(x); err.textContent = '😕 אין חיבור לשרת כרגע. נסו שוב עוד רגע'; btn.disabled = false; btn.textContent = '🚪 כניסה'; }
    };
  });
}

/* ---------- global events ---------- */
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (chip) {
    const g = chip.closest('[data-group]');
    if (g) {
      if (g.hasAttribute('data-multi')) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
      else $$('.chip', g).forEach(c => c.setAttribute('aria-pressed', c === chip));
      const name = g.dataset.group, val = chip.dataset.val;
      if (name === 'tf') { tFilter = val; seen.clear(); refresh(); return; }
      if (name === 'tr') { tRoom = val; seen.clear(); refresh(); return; }
      if (name === 'sg') { addItem(val, 1); return; }
      g.dispatchEvent(new CustomEvent('chip', { bubbles: true, detail: { group: name, val } }));
    }
  }
  const g = e.target.closest('[data-go]');
  if (g) { closeSheet(); go(g.dataset.go); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const id = a.dataset.id;
  switch (a.dataset.act) {
    case 'close': closeSheet(); break;
    case 'help': helpSheet(); break;
    case 'top': scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' }); break;
    case 'a11y': { const k = $('.nk-tab'); if (k) { k.scrollIntoView?.({ block: 'nearest' }); if (k.getAttribute('aria-expanded') !== 'true') k.click(); } break; }
    case 'theme': $('[data-nk-theme]')?.click(); break;
    case 'to-faq': closeSheet(); if (S.code && tab !== 'home') go('home'); setTimeout(() => { const f = $('#faq'); if (f) { f.hidden = false; f.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' }); } }, 260); break;
    case 'create': createSheet(); break;
    case 'join': joinSheet(); break;
    case 'fab':
      if (tab === 'tasks') taskSheet();
      else if (tab === 'family') memberSheet();
      else sheet(`<h2 id="sheet-title">➕ מה מוסיפים?</h2><div class="settings">
        <button class="set-row" data-act="new-task"><span class="e">🧹</span><span><b>משימה חדשה</b><small>משהו שצריך לעשות בבית</small></span><span>←</span></button>
        <button class="set-row" data-act="new-item"><span class="e">🛒</span><span><b>פריט לקניות</b><small>משהו שנגמר או שצריך</small></span><span>←</span></button>
        <button class="set-row" data-act="templates"><span class="e">💡</span><span><b>רעיונות למשימות</b><small>משימות מוכנות לפי חדרים</small></span><span>←</span></button></div>`);
      break;
    case 'new-task': taskSheet(); break;
    case 'new-item': closeSheet(); go('shop'); setTimeout(() => $('#item-in')?.focus(), 300); break;
    case 'done': completeTask(id, a); break;
    case 'edit-task': taskSheet(id); break;
    case 'del-task': { const t = clone(rec(id)); del(id); closeSheet(); toast(`🗑️ "${esc(t.title)}" נמחקה`, { undo: () => put('task', t) }); break; }
    case 'templates': templatesSheet(); break;
    case 'add-tpl': {
      if (a.classList.contains('added')) break;
      const t = tplTask(+a.dataset.i); put('task', t); a.classList.add('added', 'pop'); a.setAttribute('aria-disabled', 'true'); a.lastElementChild.textContent = '✓';
      toast(`${t.emoji} "${esc(t.title)}" נוספה`); break;
    }
    case 'toggle-done': showDone = !showDone; refresh(); break;
    case 'q': qty = Math.min(99, Math.max(1, qty + +a.dataset.d)); $('#q-out').textContent = qty; break;
    case 'mic': startMic(a); break;
    case 'buy': {
      const x = rec(id); if (!x) break; a.closest('.item')?.classList.add('checking'); navigator.vibrate?.(12);
      if (!x.bought) { const r = a.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 18); }
      setTimeout(() => put('shop', { ...x, bought: !x.bought, boughtBy: S.meId, boughtAt: Date.now() }), calm() ? 0 : 280); break;
    }
    case 'edit-item': itemSheet(id); break;
    case 'del-item': { const x = clone(rec(id)); del(id); closeSheet(); toast(`🗑️ "${esc(x.name)}" הוסר`, { undo: () => put('shop', x) }); break; }
    case 'clear-bought': { const b = rows('shop').filter(i => i.bought).map(clone); write(b.map(i => ['del', i.id])); toast(`🧹 ${b.length} פריטים נוקו`, { undo: () => write(b.map(i => ['shop', i])) }); break; }
    case 'share-list': shareList(); break;
    case 'copy-code': copy(fmtCode(S.code), '📋 הקוד הועתק'); break;
    case 'copy-link': copy(joinLink(), '🔗 הקישור הועתק. אפשר להדביק בוואטסאפ'); break;
    case 'rename': textSheet('✏️ שם הבית', 'איך קוראים לבית?', homeName(), v => { put('meta', { id: 'meta', name: v }); toast('✅ שם הבית עודכן'); }); break;
    case 'add-member': memberSheet(); break;
    case 'edit-member': memberSheet(id); break;
    case 'del-member': {
      const m = clone(member(id)); const fix = rows('task').filter(t => t.assignee === id || t.turn === id).map(t => ['task', { ...t, assignee: t.assignee === id ? 'any' : t.assignee, turn: t.turn === id ? nextMember(id) : t.turn }]);
      write([['del', id], ...fix]); closeSheet(); toast(`👋 ${esc(m.name)} הוסר/ה מהבית`, { undo: () => put('member', m) }); break;
    }
    case 'whoami': whoAmISheet(); break;
    case 'pick-me': S.meId = id; save(); closeSheet(); refresh(); toast(`👋 היי ${esc(member(id).name)}!`); break;
    case 'new-me': memberSheet(null, { forMe: true }); break;
    case 'backup': backup(); break;
    case 'leave': leaveSheet(); break;
    case 'leave-yes': localStorage.removeItem(KEY); S = { records: {}, outbox: {} }; closeSheet(); history.replaceState(null, '', location.pathname); onboarding(); setSync('local'); break;
  }
});

/* ---------- start ---------- */
function start() {
  $('#tabbar').hidden = false; requestAnimationFrame(movePill);
  go(location.hash.slice(1) || 'home', false);
  sync();
}
window.addEventListener('load', () => tab === 'family' && drawQR());

const joinParam = new URLSearchParams(location.search).get('join');
if (S.code && (!joinParam || joinParam.toUpperCase() === S.code)) { if (joinParam) history.replaceState(null, '', location.pathname + '#home'); start(); }
else if (S.code && joinParam) { start(); sheet(`<h2 id="sheet-title">🏡 קישור לבית אחר</h2><p>כבר יש לך בית במכשיר הזה (${esc(homeName())}). כדי להצטרף לבית אחר צריך קודם לצאת מהבית הנוכחי בהגדרות.</p><div class="actions"><button class="btn primary" data-act="close">הבנתי</button></div>`); history.replaceState(null, '', location.pathname + '#home'); }
else { onboarding(joinParam); setSync('local'); }


