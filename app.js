'use strict';
/* ===== Nestly: household chores + shared shopping list ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const CFG = window.NESTLY_CONFIG || {};
const CLOUD = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const LIST = (new URLSearchParams(location.search).get('list') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
const LISTMODE = LIST.length === 12;
const KEY = LISTMODE ? 'nestly:list:' + LIST : 'nestly:v1', AKEY = 'nestly:a11y';

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ds(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d); };
const diff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
const EN = () => document.documentElement.lang === 'en';
const LOC = () => EN() ? 'en-US' : 'he-IL';
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DSH = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); };

function dueInfo(s) {
  if (!s) return { t: 'בלי תאריך', c: '' };
  const n = diff(s, today());
  if (n < -1) return { t: EN() ? `${-n} days late` : `באיחור של ${-n} ימים`, c: 'due-late' };
  if (n === -1) return { t: 'מאתמול', c: 'due-late' };
  if (n === 0) return { t: 'היום', c: 'due-today' };
  if (n === 1) return { t: 'מחר', c: '' };
  if (n < 7) return { t: EN() ? parse(s).toLocaleDateString('en-US', { weekday: 'long' }) : `יום ${DAYS[parse(s).getDay()]}`, c: '' };
  return { t: parse(s).toLocaleDateString(LOC(), { day: 'numeric', month: 'short' }), c: '' };
}
function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4);
  if (m < 1) return 'עכשיו';
  if (m < 60) return EN() ? `${m} min ago` : `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : EN() ? `${h} hours ago` : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? 'אתמול' : EN() ? `${d} days ago` : `לפני ${d} ימים`;
}

/* ---------- data dictionaries ---------- */
const BASE_ROOMS = [
  { id: 'kitchen', e: '🍳', n: 'מטבח' }, { id: 'living', e: '🛋️', n: 'סלון' }, { id: 'bath', e: '🛁', n: 'אמבטיה' },
  { id: 'laundry', e: '🧺', n: 'כביסה' }, { id: 'bedroom', e: '🛏️', n: 'חדרים' }, { id: 'outdoor', e: '🌿', n: 'מרפסת וחצר' },
  { id: 'pets', e: '🐾', n: 'חיות' }, { id: 'general', e: '🏠', n: 'כללי' }
];
/* rooms: the defaults, edited or hidden by the household, plus rooms they added */
function rooms() {
  const recs = {}; rows('room').forEach(r => recs[r.id] = r);
  const base = BASE_ROOMS.map((r, i) => ({ order: i, ...r, ...(recs[r.id] || {}) }));
  const extra = Object.values(recs).filter(r => !BASE_ROOMS.some(b => b.id === r.id));
  return [...base, ...extra].filter(r => !r.hidden).sort((a, b) => (a.id === 'general') - (b.id === 'general') || (a.order ?? 50) - (b.order ?? 50));
}
const room = id => rooms().find(r => r.id === id) || rooms().find(r => r.id === 'general') || BASE_ROOMS[7];
const ROOM_EMOJIS = ['🍳', '🛋️', '🛁', '🚽', '🧺', '🛏️', '🧸', '👶', '💻', '📚', '🌳', '🌿', '🌻', '🪴', '🚗', '🏊', '🐾', '🐕', '🐈', '🍽️', '🚪', '🏢', '🧰', '🎮', '🏋️', '🎨', '🪟', '🏠', '🏡', '⭐'];
const ROOM_PRESETS = [
  { id: 'garden', e: '🌳', n: 'גינה', t: [['השקיית הגינה', '💧', { type: 'interval', every: 2 }, 1], ['כיסוח הדשא', '🌱', { type: 'weekly', days: [5] }, 3], ['גיזום שיחים', '✂️', { type: 'monthly' }, 2], ['איסוף עלים', '🍂', { type: 'weekly', days: [5] }, 2]] },
  { id: 'car', e: '🚗', n: 'רכב', t: [['שטיפת הרכב', '🧽', { type: 'interval', every: 14 }, 2], ['ניקוי פנים הרכב', '🧹', { type: 'monthly' }, 2], ['בדיקת לחץ אוויר', '🛞', { type: 'monthly' }, 1]] },
  { id: 'kids', e: '🧸', n: 'חדר ילדים', t: [['סידור צעצועים', '🧸', { type: 'daily' }, 1], ['החלפת מצעים לילדים', '🛏️', { type: 'weekly', days: [4] }, 2], ['מיון בגדים קטנים', '👕', { type: 'monthly' }, 2]] },
  { id: 'office', e: '💻', n: 'חדר עבודה', t: [['סידור השולחן', '🗂️', { type: 'weekly', days: [4] }, 1], ['ניקוי אבק מהמחשב', '🖥️', { type: 'interval', every: 14 }, 1]] },
  { id: 'dining', e: '🍽️', n: 'פינת אוכל', t: [['עריכת שולחן', '🍽️', { type: 'daily' }, 1], ['ניגוב השולחן והכיסאות', '🧽', { type: 'daily' }, 1]] },
  { id: 'entry', e: '🚪', n: 'כניסה', t: [['סידור נעליים', '👟', { type: 'interval', every: 3 }, 1], ['ניקוי שטיח הכניסה', '🧹', { type: 'weekly', days: [5] }, 1]] },
  { id: 'storage', e: '🧰', n: 'מחסן', t: [['סידור המחסן', '📦', { type: 'monthly' }, 3]] },
  { id: 'pool', e: '🏊', n: 'בריכה', t: [['ניקוי הבריכה', '🫧', { type: 'weekly', days: [5] }, 3], ['בדיקת כלור', '🧪', { type: 'interval', every: 3 }, 1]] },
  { id: 'toilet', e: '🚽', n: 'שירותי אורחים', t: [['ניקוי שירותי האורחים', '🚽', { type: 'weekly', days: [4] }, 2], ['החלפת מגבת ידיים', '🧻', { type: 'interval', every: 3 }, 1]] }
];
const allTpl = () => [...TEMPLATES, ...ROOM_PRESETS.flatMap(p => p.t.map(([title, emoji, repeat, effort]) => [p.id, title, emoji, repeat, effort]))];
const POINTS = { 1: 5, 2: 10, 3: 20 };
const AVATARS = ['🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄', '🐙', '🐝', '🐱', '🐶', '🐰', '🐻', '🐧', '🦋', '🐢', '🦉', '🐳', '🌸'];
const COLORS = ['lav', 'mint', 'peach', 'pink', 'sky', 'butter'];
const TASK_EMOJIS = ['✨', '🧹', '🧽', '🫧', '🍽️', '🗑️', '🧺', '👕', '🧦', '🛁', '🚽', '🪞', '🛏️', '🪴', '🐾', '🐕', '🍳', '🧊', '🪟', '🛒', '💳', '🔥', '🪶', '🧸', '📦', '🔧', '🚗', '💡'];
const EMOJI_KW = [['כביס', '🧺'], ['תלי', '👕'], ['קיפול', '🧦'], ['גיהו', '👔'], ['כלים', '🍽️'], ['מדיח', '🍽️'], ['שאיב', '🧹'], ['טאטא', '🧹'], ['שטיפ', '🫧'], ['רצפ', '🫧'], ['אבק', '🪶'], ['זבל', '🗑️'], ['פח', '🗑️'], ['אמבט', '🛁'], ['מקלחת', '🛁'], ['שירותים', '🚽'], ['אסלה', '🚽'], ['מרא', '🪞'], ['מיטה', '🛏️'], ['מצעים', '🛏️'], ['צמח', '🪴'], ['השקי', '🪴'], ['כלב', '🐕'], ['חתול', '🐈'], ['האכל', '🐾'], ['בישול', '🍳'], ['ארוח', '🍳'], ['מקרר', '🧊'], ['חלונ', '🪟'], ['קניות', '🛒'], ['חשבונ', '💳'], ['תנור', '🔥'], ['כיריים', '🔥'], ['צעצוע', '🧸'], ['מגבות', '🧻'], ['רכב', '🚗'], ['אוטו', '🚗'], ['נורה', '💡'], ['תיקון', '🔧']];
const EMOJI_EN = [['laundry', '🧺'], ['wash', '🫧'], ['hang', '👕'], ['fold', '🧦'], ['iron', '👔'], ['dish', '🍽️'], ['vacuum', '🧹'], ['sweep', '🧹'], ['mop', '🫧'], ['floor', '🫧'], ['dust', '🪶'], ['trash', '🗑️'], ['garbage', '🗑️'], ['bath', '🛁'], ['shower', '🛁'], ['toilet', '🚽'], ['mirror', '🪞'], ['bed', '🛏️'], ['sheet', '🛏️'], ['plant', '🪴'], ['water', '💧'], ['dog', '🐕'], ['cat', '🐈'], ['feed', '🐾'], ['cook', '🍳'], ['dinner', '🍳'], ['fridge', '🧊'], ['window', '🪟'], ['shop', '🛒'], ['bill', '💳'], ['oven', '🔥'], ['toy', '🧸'], ['towel', '🧻'], ['car', '🚗'], ['fix', '🔧']];
const guessEmoji = t => (EMOJI_KW.find(([k]) => t.includes(k)) || EMOJI_EN.find(([k]) => t.toLowerCase().includes(k)) || [, '✨'])[1];

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
const CATS_EN = { pets: ['dog food', 'cat food', 'litter', 'pet'], cleaning: ['soap', 'detergent', 'bleach', 'softener', 'sponge', 'trash bag', 'cleaner', 'wipes', 'dishwasher', 'foil', 'cling'], hygiene: ['shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'toilet paper', 'tissue', 'diaper', 'razor', 'cream', 'plaster'], frozen: ['frozen', 'ice cream', 'popsicle'], produce: ['tomato', 'cucumber', 'onion', 'garlic', 'apple', 'banana', 'pepper', 'lettuce', 'carrot', 'lemon', 'avocado', 'potato', 'parsley', 'grape', 'orange', 'strawberr', 'melon', 'pear', 'peach', 'mango', 'cabbage', 'broccoli', 'zucchini', 'eggplant', 'mushroom', 'spinach', 'fruit', 'veg', 'herb'], dairy: ['milk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'egg', 'cottage', 'labneh', 'mozzarella'], bakery: ['bread', 'pita', 'challah', 'roll', 'baguette', 'cake', 'croissant', 'tortilla', 'bun', 'bagel'], meat: ['chicken', 'beef', 'meat', 'schnitzel', 'fish', 'salmon', 'sausage', 'turkey', 'steak', 'hot dog', 'tuna steak'], drinks: ['water', 'juice', 'soda', 'cola', 'beer', 'wine', 'drink', 'syrup'], snacks: ['bamba', 'bissli', 'chocolate', 'snack', 'cookie', 'candy', 'chips', 'popcorn', 'wafer', 'crackers'], pantry: ['rice', 'pasta', 'spaghetti', 'flour', 'sugar', 'salt', 'oil', 'spice', 'paprika', 'sauce', 'coffee', 'tea', 'cereal', 'cornflakes', 'tahini', 'tuna', 'beans', 'lentil', 'honey', 'jam'] };
const guessCat = name => { const low = name.toLowerCase(); return (CATS.find(c => c.k.some(k => name.includes(k))) || CATS.find(c => (CATS_EN[c.id] || []).some(k => low.includes(k))) || CATS[CATS.length - 1]).id; };
/* recommended shopping list, by aisle: [emoji, name] */
const RECS = {
  produce: [['🍅', 'עגבניות'], ['🥒', 'מלפפונים'], ['🧅', 'בצל'], ['🧄', 'שום'], ['🫑', 'פלפלים'], ['🥕', 'גזר'], ['🥬', 'חסה'], ['🥔', 'תפוחי אדמה'], ['🍋', 'לימונים'], ['🥑', 'אבוקדו'], ['🍌', 'בננות'], ['🍎', 'תפוחים'], ['🌿', 'פטרוזיליה'], ['🍇', 'ענבים']],
  dairy: [['🥛', 'חלב'], ['🥚', 'ביצים'], ['🧀', 'גבינה צהובה'], ['🥣', 'קוטג׳'], ['🫙', 'גבינה לבנה'], ['🍶', 'יוגורט'], ['🧈', 'חמאה'], ['🥛', 'שמנת מתוקה'], ['🍮', 'מעדנים'], ['🫓', 'לבנה']],
  bakery: [['🍞', 'לחם'], ['🫓', 'פיתות'], ['🥖', 'באגט'], ['🍞', 'חלה'], ['🥯', 'לחמניות'], ['🌯', 'טורטיות']],
  meat: [['🍗', 'חזה עוף'], ['🍗', 'שניצלים'], ['🥩', 'בשר טחון'], ['🍖', 'פרגיות'], ['🐟', 'סלמון'], ['🌭', 'נקניקיות']],
  pantry: [['🍚', 'אורז'], ['🍝', 'פסטה'], ['🫒', 'שמן זית'], ['🧂', 'מלח'], ['🍬', 'סוכר'], ['🌾', 'קמח'], ['🥫', 'טונה'], ['🥫', 'רסק עגבניות'], ['☕', 'קפה'], ['🫖', 'תה'], ['🥣', 'קורנפלקס'], ['🫘', 'טחינה']],
  frozen: [['🫛', 'אפונה קפואה'], ['🥟', 'בורקס קפוא'], ['🍕', 'פיצה קפואה'], ['🍦', 'גלידה'], ['🍟', 'צ׳יפס קפוא']],
  drinks: [['💧', 'מים מינרליים'], ['🧃', 'מיץ תפוזים'], ['🫧', 'סודה'], ['🥤', 'תרכיז'], ['🍷', 'יין']],
  snacks: [['🥜', 'במבה'], ['🥨', 'ביסלי'], ['🍫', 'שוקולד'], ['🍪', 'עוגיות'], ['🍿', 'פופקורן'], ['🧇', 'וופלים']],
  cleaning: [['🧴', 'סבון כלים'], ['🧽', 'ספוגים'], ['🗑️', 'שקיות זבל'], ['👕', 'אבקת כביסה'], ['🌸', 'מרכך כביסה'], ['🫧', 'נוזל רצפות'], ['🧻', 'מגבות נייר'], ['🧪', 'אקונומיקה']],
  hygiene: [['🧻', 'נייר טואלט'], ['🤧', 'טישו'], ['🧴', 'שמפו'], ['🧼', 'סבון ידיים'], ['🪥', 'משחת שיניים'], ['🌬️', 'דאודורנט'], ['👶', 'מגבונים']],
  pets: [['🐶', 'אוכל לכלב'], ['🐱', 'אוכל לחתול'], ['🪣', 'חול לחתול']]
};
const REC_ORDER = ['produce', 'dairy', 'bakery', 'meat', 'pantry', 'frozen', 'drinks', 'snacks', 'cleaning', 'hygiene', 'pets'];

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
if (LISTMODE) { S.code = LIST; S.list = true; }
const rec = id => { const r = S.records[id]; return r && !r.deleted ? r.data : null; };
const rows = kind => Object.values(S.records).filter(r => r.kind === kind && !r.deleted).map(r => r.data);
const members = () => rows('member').sort((a, b) => (a.created || 0) - (b.created || 0));
const member = id => rec(id) && S.records[id].kind === 'member' ? rec(id) : null;
const me = () => member(S.meId);
const homeName = () => rec('meta')?.name || 'הבית שלנו';

/* ---------- several homes on one device ---------- */
const HKEY = 'nestly:homes', hKey = c => 'nestly:h:' + c;
const homeCodes = () => { try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch { return []; } };
const setCodes = l => { try { localStorage.setItem(HKEY, JSON.stringify([...new Set(l)])); } catch { } };
function stashState(st) { if (!st?.code || st.list) return; try { localStorage.setItem(hKey(st.code), JSON.stringify(st)); } catch { } setCodes([...homeCodes(), st.code]); }
function readHome(c) { try { return JSON.parse(localStorage.getItem(hKey(c))); } catch { return null; } }
function homes() { // all homes saved on this device, active first
  if (!LISTMODE && S.code) setCodes([S.code, ...homeCodes()]);
  return homeCodes().map(c => { const st = c === S.code ? S : readHome(c); if (!st) return null; const m = st.records?.meta; return { code: c, name: (m && !m.deleted && m.data?.name) || 'הבית שלנו', active: c === S.code, n: Object.values(st.records || {}).filter(r => !r.deleted && r.kind === 'member').length }; }).filter(Boolean);
}
function useState(st) { // make st the active home
  if (S.code && S.code !== st.code) stashState(S);
  S = st; S.records ||= {}; S.outbox ||= {}; save(); stashState(S);
  try { localStorage.removeItem(hKey(S.code)); } catch { }
  tRoom = 'all'; tFilter = 'week'; seen.clear();
}
function switchHome(code) {
  if (code === S.code) { closeSheet(); return; }
  const st = readHome(code); if (!st) { toast('😕 הבית הזה לא נמצא במכשיר'); return; }
  useState(st); closeSheet(); history.replaceState(null, '', location.pathname + '#home'); start(); refresh();
  toast(`🏡 עברת ל"${esc(homeName())}"`);
}
function homesSheet() {
  const hs = homes();
  sheet(`<h2 id="sheet-title">🏘️ הבתים שלי</h2><p class="muted" style="margin-top:-6px">אפשר לנהל כמה בתים מאותו מכשיר: הבית של ההורים, דירת שותפים, הבית של סבתא... לחיצה על בית עוברת אליו.</p>
    <div class="settings">${hs.map(h => `<button class="set-row" data-act="home-switch" data-id="${h.code}" ${h.active ? 'aria-current="true"' : ''}><span class="e">${h.active ? '🏡' : '🏠'}</span><span><b>${esc(h.name)}</b><small>${h.active ? 'הבית הפעיל עכשיו · ' : ''}👪 ${h.n} בני בית${CLOUD ? ` · קוד <span dir="ltr">${fmtCode(h.code)}</span>` : ''}</small></span><span aria-hidden="true">${h.active ? '✓' : '←'}</span></button>`).join('')}
    <button class="set-row" data-act="create"><span class="e">✨</span><span><b>פתיחת בית נוסף</b><small>בית חדש עם משימות ורשימת קניות משלו</small></span><span aria-hidden="true">←</span></button>
    ${CLOUD ? '<button class="set-row" data-act="join"><span class="e">🔑</span><span><b>הצטרפות לבית נוסף בקוד</b><small>קיבלת קוד מבית אחר? מכאן נכנסים</small></span><span aria-hidden="true">←</span></button>' : ''}</div>`);
}

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
  syncing = true; setSync('busy'); const st = S;
  try {
    const out = Object.values(st.outbox);
    if (out.length) {
      const snap = out.map(r => JSON.stringify(r));
      const rws = out.filter(r => !LISTMODE || r.kind === 'shop' || r.kind === 'hist').map(({ id, kind, data, deleted }) => ({ id, kind, data, deleted }));
      if (rws.length) await rpc(LISTMODE ? 'nestly_list_push' : 'nestly_push', LISTMODE ? { p_token: LIST, p_rows: rws } : { p_code: st.code, p_rows: rws });
      out.forEach((r, i) => { if (JSON.stringify(st.outbox[r.id]) === snap[i]) delete st.outbox[r.id]; });
    }
    const since = st.cursor ? new Date(new Date(st.cursor).getTime() - 15000).toISOString() : null;
    const got = await rpc(LISTMODE ? 'nestly_list_pull' : 'nestly_pull', LISTMODE ? { p_token: LIST, p_since: since } : { p_code: st.code, p_since: since });
    if (LISTMODE && !st.cursor && !got.length) { listMissing(); syncing = false; return; }
    if (LISTMODE && got.length && !st.meId && !st.guest && !st.welcomed) { st.welcomed = true; setTimeout(guestSheet, 300); }
    let changed = false;
    for (const r of got) {
      if (!st.cursor || new Date(r.updated_at) > new Date(st.cursor)) st.cursor = r.updated_at;
      if (st.outbox[r.id]) continue;
      const cur = st.records[r.id];
      if (!cur || !!cur.deleted !== !!r.deleted || JSON.stringify(cur.data) !== JSON.stringify(r.data)) {
        st.records[r.id] = { id: r.id, kind: r.kind, data: r.data, deleted: !!r.deleted }; changed = true;
      }
    }
    if (st === S) { save(); if (changed) refresh(); } else stashState(st); setSync('ok');
  } catch (e) { console.warn('sync', e); setSync('err'); }
  finally { syncing = false; }
}
setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 5000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && sync());
addEventListener('online', () => sync());

/* ---------- helpers ---------- */
/* horizontal rows: arrows, soft edges, wheel and drag, so it is clear they scroll */
function scrollers(root) {
  if (!root) return;
  $$('.chips.scroll, .shop-tools', root).forEach(el => {
    if (el.parentElement?.classList.contains('scroller')) return;
    const wrap = document.createElement('div'); wrap.className = 'scroller'; el.before(wrap); wrap.append(el);
    const mk = (cls, label, dir) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sc-arrow ' + cls; b.setAttribute('aria-label', label); b.innerHTML = cls === 'sc-prev' ? '<span aria-hidden="true">›</span>' : '<span class="t">עוד</span><span aria-hidden="true">‹</span>'; b.onclick = () => el.scrollBy({ left: dir * (getComputedStyle(el).direction === 'rtl' ? 1 : -1) * el.clientWidth * .7, behavior: calm() ? 'auto' : 'smooth' }); return b; };
    wrap.append(mk('sc-prev', 'גלילה ימינה', 1), mk('sc-next', 'גלילה שמאלה', -1));
    const upd = () => { const max = el.scrollWidth - el.clientWidth, pos = Math.abs(el.scrollLeft); wrap.classList.toggle('can-prev', pos > 4); wrap.classList.toggle('can-next', max - pos > 4); };
    el.addEventListener('scroll', upd, { passive: true }); new ResizeObserver(upd).observe(el); upd();
    el.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) { e.preventDefault(); el.scrollBy({ left: getComputedStyle(el).direction === 'rtl' ? -e.deltaY : e.deltaY }); } }, { passive: false });
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; el.scrollLeft = sl - dx; } });
    addEventListener('pointerup', () => { down = false; });
    el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    const on = $('[aria-pressed="true"]', el); if (on && el.scrollWidth > el.clientWidth) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
}
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
  if (r.type === 'interval') return EN() ? `Every ${r.every} days` : `כל ${r.every} ימים`;
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
  const cols = ['#7cc4ef', '#a8dcf8', '#8fdcc0', '#c9c2f7', '#f6b8c6', '#6fa8e8', '#1b2d5c'];
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
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
function restoreFaq() { const f = $('#sheet #faq'); if (f) { f.classList.remove('in-sheet'); $('.site-foot').before(f); } }
function sheet(html, onOpen) {
  if (!dlg.open) lastFocus = document.activeElement;
  restoreFaq();
  const old = $('#sheet-body'), nb = old.cloneNode(false); old.replaceWith(nb); nb.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  $('.sheet-card').scrollTop = 0;
  onOpen && onOpen($('#sheet-body')); scrollers($('#sheet-body'));
  // on a phone, opening the keyboard by itself pushes the sheet around, so only a computer gets the cursor in the first field
  const f = FINE ? $('#sheet-body input:not([type=hidden]):not([type=search]), #sheet-body button.chip, #sheet-body .btn') : null;
  (f || $('#sheet-title') || $('.sheet-card .x')).focus({ preventScroll: true });
}
function faqSheet() {
  const f = $('#faq'); if (!f) return;
  sheet('<h2 id="sheet-title" class="sr">❓ שאלות נפוצות</h2><div id="faq-slot"></div>', b => { f.hidden = false; f.classList.add('in-sheet'); $('#faq-slot', b).replaceWith(f); });
}
function closeSheet() {
  if (!dlg.open) return;
  dlg.classList.add('closing');
  setTimeout(() => { dlg.close(); dlg.classList.remove('closing'); restoreFaq(); lastFocus?.focus?.({ preventScroll: true }); }, 210);
}
dlg.addEventListener('click', e => { if (e.target === dlg) closeSheet(); });
dlg.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });

/* ---------- shared kit (noya-kit.js): accessibility button + dark mode ---------- */
// the kit's button starts above the tab bar here, unless the user already dragged it somewhere
function placeKit() {
  const t = document.querySelector('.nk-tab'); if (!t) return;
  let saved = null; try { saved = JSON.parse(localStorage.getItem('noya-kit:pos')); } catch { }
  if (saved) return;
  // bottom corner on the start side (right in Hebrew, left in English), level with the + button
  const sz = t.offsetWidth || 56, mob = innerWidth < 880;
  t.style.top = Math.max(80, innerHeight - sz - (mob ? 98 : 24)) + 'px';
  t.style.left = (EN() ? 16 : innerWidth - sz - 16) + 'px';
}
addEventListener('nestly:lang', () => setTimeout(placeKit, 30));
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
  if (LISTMODE) t = 'shop';
  tab = t; seen.clear();
  main.classList.add('enter'); clearTimeout(go.t); go.t = setTimeout(() => main.classList.remove('enter'), 900);
  if (push && location.hash !== '#' + t) history.pushState(null, '', '#' + t);
  $$('.tab, .tnav').forEach(b => { const on = b.dataset.go === t; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
  setView(t); movePill();
  const v = VIEWS[t];
  main.innerHTML = `<div class="view">${v.shell ? v.shell() : '<div id="dyn"></div>'}</div>`;
  v.mount && v.mount();
  refresh();
  scrollTo({ top: 0, behavior: 'instant' });
  $('#fab').hidden = t === 'shop' || LISTMODE;
  $('#fab').setAttribute('aria-label', { home: 'הוספה מהירה', tasks: 'משימה חדשה', family: 'הוספת בן או בת בית' }[t] || 'הוספה');
  { const ta = $('#top-add'); if (ta) { ta.hidden = $('#fab').hidden; ta.lastElementChild.textContent = { home: 'הוספה', tasks: 'משימה חדשה', family: 'בן/בת בית' }[t] || 'הוספה'; } }
}
addEventListener('popstate', () => { const h = location.hash.slice(1); if (LEGAL[h]) return legalSheet(h); go(h || 'home', false); });
function setView(v) { document.body.className = document.body.className.replace(/\bview-\S+/g, '').trim() + ' view-' + v; }
function movePill() {
  const bar = $('#tabbar'), on = $('.tab.on', bar), pill = $('.tab-pill', bar); if (!on || !pill || bar.hidden) return;
  pill.style.width = on.offsetWidth + 'px'; pill.style.height = on.offsetHeight + 'px';
  pill.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`; pill.classList.add('ready');
}
addEventListener('resize', movePill);
/* swipe left or right on phones to move between the main pages */
(() => {
  const ORDER = ['home', 'tasks', 'shop', 'family']; let sx = 0, sy = 0, ok = false;
  main.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; ok = S.code && !dlg.open && !e.target.closest('.chips, .rec-cats, input, textarea, select, .add-bar'); }, { passive: true });
  main.addEventListener('touchend', e => {
    if (!ok) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 80 || Math.abs(dy) > 50) return;
    const i = ORDER.indexOf(tab) + (dx < 0 ? 1 : -1); if (i < 0 || i >= ORDER.length) return;
    main.dataset.slide = dx < 0 ? 'next' : 'prev'; go(ORDER[i]); setTimeout(() => delete main.dataset.slide, 450);
  }, { passive: true });
})();
addEventListener('scroll', () => $('.topbar').classList.toggle('scrolled', scrollY > 8), { passive: true });

function refresh() {
  if (!S.code) return;
  $('#home-name').textContent = LISTMODE ? `🛒 הרשימה של ${homeName()}` : homeName();
  const lateOrToday = activeTasks().filter(t => t.due && t.due <= today()).length;
  const shopN = rows('shop').filter(i => !i.bought).length;
  const bt = $('#b-tasks'), bs = $('#b-shop');
  bt.hidden = !lateOrToday; bt.textContent = lateOrToday; bt.setAttribute('aria-label', `${lateOrToday} משימות להיום`);
  bs.hidden = !shopN; bs.textContent = shopN; bs.setAttribute('aria-label', `${shopN} פריטים לקנייה`);
  $$('[data-tb]').forEach(x => { const n = x.dataset.tb === 'tasks' ? lateOrToday : shopN; x.hidden = !n; x.textContent = n; });
  const dyn = $('#dyn'); if (dyn) dyn.innerHTML = VIEWS[tab].body();
  scrollers(main);
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
    <p class="date">${EN() ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : `יום ${DAYS[new Date().getDay()]}, ${new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}`}</p>
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
tasksView.shell = () => `<div class="page-h"><h1>🧹 משימות הבית</h1><div class="page-btns"><button class="btn soft rec-btn" data-act="rooms" style="min-height:42px;padding:0 14px">🏠<span class="bt"> החדרים</span></button><button class="btn soft" data-act="templates" style="min-height:42px;padding:0 14px">💡<span class="bt"> רעיונות</span></button></div></div>
  <p class="tag-tip">🏷️ כדי לתייג מי עושה משימה, לוחצים על הכפתור "תיוג" שבצד של המשימה</p><div id="dyn"></div>`;
tasksView.body = () => {
  const td = today(), all = activeTasks();
  const F = { today: t => t.due && t.due <= td, week: t => !t.due || t.due <= addDays(td, 6), mine: t => isMine(t), all: () => true };
  const cnt = k => all.filter(F[k]).length;
  let list = all.filter(F[tFilter]).filter(t => tRoom === 'all' || t.room === tRoom);
  list.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title, 'he'));
  const groups = [['late', '⏰ באיחור', t => t.due && t.due < td], ['today', '☀️ היום', t => t.due === td], ['tomorrow', '🌙 מחר', t => t.due === addDays(td, 1)], ['later', '📅 בהמשך', t => t.due && t.due > addDays(td, 1)], ['none', '🗂️ בלי תאריך', t => !t.due]];
  const roomsUsed = rooms().filter(r => all.some(t => t.room === r.id));
  const done = rows('task').filter(t => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 15);
  let i = 0;
  const groupsHtml = groups.map(([k, n, fn]) => { const g = list.filter(fn); return g.length ? `<h3 class="group-t ${k === 'late' ? 'late' : ''}">${n} <span class="n">${g.length}</span></h3><ul class="list">${g.map(t => taskCard(t, i++)).join('')}</ul>` : ''; }).join('');
  return `${chips('tf', [['today', `☀️ היום <span class="cnt">${cnt('today')}</span>`], ['week', `📅 השבוע <span class="cnt">${cnt('week')}</span>`], ['mine', `🙋 שלי <span class="cnt">${cnt('mine')}</span>`], ['all', `🏠 הכל <span class="cnt">${cnt('all')}</span>`]], tFilter, false, 'scroll')}
  <div class="row-h"><span>🏠 לפי חדר</span><button type="button" class="link-btn" data-act="rooms">✏️ עריכת החדרים</button></div>
  ${chips('tr', [['all', 'כל החדרים'], ...roomsUsed.map(r => [r.id, `${r.e} ${r.n}`])], tRoom, false, 'scroll')}
  ${tRoom !== 'all' ? roomBanner(tRoom) : ''}
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
        <span>${r.e} ${r.n}</span>${rep ? `<span>🔁 ${rep}</span>` : ''}${t.assignee === 'rotate' ? '<span>🔄 תורנות</span>' : ''}<span>⭐ ${POINTS[t.effort] || 10}</span></span>${whoLine(t, o)}</span>
    </button><button class="who-btn ${o ? '' : 'empty'}" data-act="assign" data-id="${t.id}" aria-label="תיוג מי עושה את המשימה. כרגע: ${o ? esc(o.name) : 'מי שפנוי'}" title="תיוג מי עושה">${o ? avatar(o) : '<span class="av tag-av" aria-hidden="true">🏷️</span>'}<small>${o ? esc(o.name) : 'תיוג'}</small></button></li>`;
}
function roomBanner(id) {
  const r = room(id), n = activeTasks().filter(t => t.room === id).length;
  return `<div class="room-banner"><span class="e" aria-hidden="true">${r.e}</span><div><b>${esc(r.n)}</b><small>${n} משימות בחדר</small></div>
    <div class="rb-btns"><button type="button" class="btn soft" data-act="room-open" data-id="${id}">⚙️ ניהול החדר</button><button type="button" class="btn primary" data-act="room-tasks" data-id="${id}">➕ משימה</button></div></div>`;
}
function whoLine(t, o) {
  const by = member(t.done ? t.doneBy : t.lastBy);
  if (t.done && by) return `<small class="who-line">✅ בוצע על ידי ${esc(by.emoji)} ${esc(by.name)}</small>`;
  const tag = t.assignee === 'rotate' ? `🔄 התור של ${o ? esc(o.name) : '...'}` : o ? `👤 ${esc(o.name)} עושה את זה` : '👐 מי שפנוי';
  return `<small class="who-line">${tag}${by ? ` · בפעם הקודמת: ${esc(by.name)}` : ''}</small>`;
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
    <fieldset><legend>איפה בבית?</legend>${chips('room', rooms().map(r => [r.id, `${r.e} ${r.n}`]), t.room)}<button type="button" class="link-btn" data-act="rooms" style="margin-top:6px">🏠 הוספה או עריכה של חדרים</button></fieldset>
    <fieldset><legend>👤 מי עושה את המשימה?</legend>${chips('as', [['any', '👐 מי שפנוי'], ['rotate', '🔄 תורנות'], ...ms.map(m => [m.id, `${esc(m.emoji)} ${esc(m.name)}`])], t.assignee)}</fieldset>
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
  ${rooms().map(r => { const ts = allTpl().map((x, i) => [x, i]).filter(([x]) => x[0] === r.id); return ts.length ? `<div class="tpl-room"><h3 class="group-t" style="margin:8px 0 2px">${r.e} ${r.n}</h3>${ts.map(([x, i]) => { const a = have.has(x[1]); return `<button type="button" class="tpl ${a ? 'added' : ''}" data-act="add-tpl" data-i="${i}" ${a ? 'aria-disabled="true"' : ''}><span class="e" aria-hidden="true">${x[2]}</span><span>${x[1]}<br><small>${repeatLabel(x[3]) || 'פעם אחת'} · ⭐ ${POINTS[x[4]]}</small></span><b aria-hidden="true">${a ? '✓' : '➕'}</b></button>`; }).join('')}</div>` : ''; }).join('')}`);
}
function tplTask(i) { const [r, title, emoji, repeat, effort] = allTpl()[i]; return { id: uid(), title, emoji, room: r, assignee: 'any', repeat: clone(repeat), due: today(), effort, notes: '', created: Date.now() }; }

/* ----- SHOP ----- */
let qty = 1, rec2 = null;
function shopView() { }
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
shopView.shell = () => `<div class="page-h"><h1>🛒 רשימת קניות</h1><div class="page-btns"><button class="btn soft rec-btn" data-act="recs" style="min-height:42px;padding:0 14px">💡 מומלצים</button><button class="btn soft" data-act="share-list" aria-label="שליחת הרשימה" style="min-height:42px;padding:0 14px">📤<span class="bt"> שליחה</span></button></div></div>
  <form class="add-bar" id="add-item" autocomplete="off">
    <label class="sr" for="item-in">מה צריך לקנות?</label>
    <input id="item-in" placeholder="מה צריך לקנות? 🥑" maxlength="80" enterkeyhint="done">
    ${SR ? '<button type="button" class="mic" data-act="mic" aria-label="הוספה בקול">🎤</button>' : ''}<button type="button" class="mic" data-act="import" aria-label="הוספה מתמונה, מסמך או טקסט">📷</button>
    <div class="qty" role="group" aria-label="כמות"><button type="button" data-act="q" data-d="-1" aria-label="הפחתת כמות">−</button><output id="q-out" aria-live="polite">1</output><button type="button" data-act="q" data-d="1" aria-label="הוספת כמות">+</button></div>
    <button class="btn primary" aria-label="הוספה לרשימה">➕</button>
  </form>
  <div class="shop-tools"><button type="button" class="tool-btn" data-act="import" data-m="image">📸 רשימה מתמונה או כתב יד</button><button type="button" class="tool-btn" data-act="import" data-m="doc">📄 ממסמך</button><button type="button" class="tool-btn" data-act="import" data-m="text">✍️ הדבקת טקסט</button><button type="button" class="tool-btn" data-act="import" data-m="photo-item">🖼️ פריט עם תמונה</button></div>
  <div class="cat-pick"><label for="cat-sel">🗂️ מחלקה:</label><select id="cat-sel"><option value="">🪄 אוטומטית</option>${CAT_ORDER.map(cat).map(c => `<option value="${c.id}">${c.e} ${c.n}</option>`).join('')}</select><span id="cat-guess" class="muted" aria-live="polite"></span></div><div id="dyn"></div>`;
shopView.mount = () => {
  const inp0 = $('#item-in'), sel = $('#cat-sel'), guess = $('#cat-guess');
  const showGuess = () => { const n = inp0.value.split(/[,\n،]+/)[0].trim(); guess.textContent = !sel.value && n ? `← ${cat(guessCat(n)).e} ${cat(guessCat(n)).n}` : ''; };
  inp0.addEventListener('input', showGuess); sel.onchange = showGuess;
  $('#add-item').onsubmit = e => {
    e.preventDefault(); const inp = $('#item-in');
    const names = inp.value.split(/[,\n،]+/).map(s => s.trim()).filter(Boolean);
    if (!names.length) { importSheet(); return; }
    names.forEach(n => addItem(n, names.length > 1 ? 1 : qty, names.length > 1, sel.value || null));
    if (names.length > 1) toast(`🛒 ${names.length} פריטים נוספו לרשימה`);
    inp.value = ''; qty = 1; $('#q-out').textContent = 1; sel.value = ''; showGuess(); inp.focus();
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
  ${act.length ? groups : `<div class="card empty"><span class="big">${bought.length ? '🎉' : '🧺'}</span>${bought.length ? 'הכל בעגלה! אפשר לנקות את מה שנקנה.' : 'הרשימה ריקה. כל בני הבית יכולים להוסיף כאן מה שצריך, וזה מתעדכן אצל כולם.'}<br><small>טיפ: אפשר להוסיף כמה פריטים בבת אחת עם פסיקים, למשל: חלב, ביצים, לחם</small>${bought.length ? '' : '<br><button type="button" class="btn soft rec-btn" data-act="recs" style="margin-top:12px">💡 לרשימת הקניות המומלצת</button>'}</div>`}
  ${bought.length ? `<div class="card-h" style="margin-top:22px"><h3 class="group-t" style="margin:0">✅ בעגלה (${bought.length})</h3><button class="link-btn" data-act="clear-bought">🧹 ניקוי מה שנקנה</button></div><ul class="list">${bought.map(x => itemRow(x, i++)).join('')}</ul>` : ''}
  ${credit}`;
};
function itemRow(x, i) {
  const by = member(x.by);
  return `<li class="item ${x.bought ? 'bought' : ''} ${pop(x.id + (x.bought ? 'b' : ''))}" style="--i:${i}" data-id="${x.id}">
    <button class="check" data-act="buy" data-id="${x.id}" aria-label="${x.bought ? 'החזרה לרשימה' : 'סימון שנקנה'}: ${esc(x.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
    ${x.photo ? `<button class="i-photo" data-act="photo" data-id="${x.id}" aria-label="הגדלת התמונה של ${esc(x.name)}"><img src="${x.photo}" alt=""></button>` : ''}
    <button class="i-main" data-act="edit-item" data-id="${x.id}" aria-label="עריכה: ${esc(x.name)}"><span><b>${esc(x.name)}</b>${x.qty > 1 ? `<span class="qty-badge">×${x.qty}</span>` : ''}${x.note ? `<small>${esc(x.note)}</small>` : ''}<small class="by-line">${by ? `נוסף על ידי ${esc(by.emoji)} ${esc(by.name)}` : x.byName ? `נוסף על ידי 🔗 ${esc(x.byName)}` : 'נוסף לרשימה'}${x.at ? ` · ${ago(new Date(x.at).toISOString())}` : ''}</small></span></button>
    ${by ? avatar(by, 'sm') : ''}</li>`;
}
function addItem(name, q = 1, quiet = false, forceCat = null) {
  name = name.slice(0, 80);
  const ex = rows('shop').find(i => !i.bought && i.name === name);
  const hist = { ...(rec('hist') || {}) }; hist[name] = (hist[name] || 0) + 1; delete hist.id;
  const histRow = ['hist', { ...hist, id: 'hist' }];
  if (ex) { write([['shop', { ...ex, qty: (ex.qty || 1) + q }], histRow]); quiet || toast(`🔁 "${esc(name)}" כבר ברשימה, הכמות עודכנה`); flash(ex.id); return; }
  const it = { id: uid(), name, qty: q, cat: forceCat || guessCat(name), by: S.meId, at: Date.now() }; if (LISTMODE && !member(S.meId)) it.byName = S.guest || 'אורח/ת';
  write([['shop', it], histRow]);
  quiet || toast(`${cat(it.cat).e} "${esc(name)}" נוסף לרשימה`);
}
let recCat = 'produce';
function recsSheet(c = recCat) {
  recCat = c;
  const on = new Set(rows('shop').filter(i => !i.bought).map(i => i.name)), list = RECS[c], cc = cat(c);
  const left = list.filter(([, n]) => !on.has(n)).length;
  const card = $('.sheet-card'), top = dlg.open && card ? card.scrollTop : 0, focusKey = document.activeElement?.dataset?.key;
  sheet(`<h2 id="sheet-title">💡 רשימת קניות מומלצת</h2><p class="muted" style="margin-top:-8px">בוחרים מחלקה ולוחצים על מה שצריך. לחיצה נוספת מורידה מהרשימה.</p>
    <div class="chips scroll rec-cats" role="tablist" aria-label="מחלקות">${REC_ORDER.map(id => { const x = cat(id), n = RECS[id].filter(([, m]) => on.has(m)).length; return `<button type="button" class="chip" role="tab" data-act="rec-cat" data-c="${id}" data-key="c-${id}" aria-pressed="${id === c}" aria-selected="${id === c}">${x.e} ${x.n}${n ? ` <span class="cnt">${n}</span>` : ''}</button>`; }).join('')}</div>
    <div class="rec-head"><h3>${cc.e} ${cc.n}</h3>${left ? `<button type="button" class="link-btn" data-act="rec-all" data-key="all">➕ להוסיף הכל (${left})</button>` : '<span class="muted">✓ הכל ברשימה</span>'}</div>
    <div class="rec-grid" role="group" aria-label="${cc.n}">${list.map(([e, n], i) => { const a = on.has(n); return `<button type="button" class="rec ${a ? 'added' : ''}" style="--i:${i}" data-act="rec-add" data-n="${esc(n)}" data-key="r-${i}" aria-pressed="${a}"><span class="e" aria-hidden="true">${e}</span><span class="n">${esc(n)}</span><b aria-hidden="true">${a ? '✓' : '+'}</b></button>`; }).join('')}</div>
    <div class="actions" style="margin-top:16px"><button type="button" class="btn primary" data-act="close">✅ סיימתי</button></div>`);
  const nc = $('.sheet-card'); if (nc) nc.scrollTop = top;
  if (focusKey) $(`#sheet-body [data-key="${focusKey}"]`)?.focus({ preventScroll: true });
  $('.rec-cats [aria-pressed="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
}
function recToggle(name) {
  const ex = rows('shop').find(i => !i.bought && i.name === name);
  if (ex) { const x = clone(ex); del(ex.id); toast(`↩️ "${esc(name)}" הוסר מהרשימה`, { undo: () => { put('shop', x); recsSheet(); } }); }
  else { addItem(name, 1, true); const it = rows('shop').find(i => !i.bought && i.name === name); if (it && it.cat !== recCat) put('shop', { ...it, cat: recCat }); toast(`${cat(recCat).e} "${esc(name)}" נוסף לרשימה`); }
  recsSheet();
}
/* shrink a photo to a small JPEG so it fits the 20 KB row limit */
function shrinkPhoto(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      for (const [size, q] of [[320, .72], [260, .62], [200, .55], [160, .5]]) {
        const k = Math.min(1, size / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const d = c.toDataURL('image/jpeg', q); if (d.length < 15000) return res(d);
      }
      rej(new Error('big'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}
function photoSheet(id) {
  const x = rec(id); if (!x?.photo) return;
  sheet(`<h2 id="sheet-title">📷 ${esc(x.name)}</h2><img class="photo-big" src="${x.photo}" alt="התמונה של ${esc(x.name)}">${x.note ? `<p class="muted">📝 ${esc(x.note)}</p>` : ''}<div class="actions"><button type="button" class="btn primary" data-act="close">👍 סגירה</button><button type="button" class="btn ghost" data-act="edit-item" data-id="${id}">✏️ עריכה</button></div>`);
}
function assignSheet(id) {
  const t = rec(id); if (!t) return;
  const opt = (v, html, sub) => `<button class="set-row" data-act="assign-to" data-id="${id}" data-who="${v}"><span>${html}</span><span><b>${sub}</b></span><span aria-hidden="true">${t.assignee === v ? '✓' : '←'}</span></button>`;
  sheet(`<h2 id="sheet-title">👤 מי עושה את "${esc(t.title)}"?</h2><p class="muted" style="margin-top:-6px">מתייגים בן או בת בית, והמשימה תופיע אצלם תחת "שלי".</p>
    <div class="settings">${members().map(m => opt(m.id, avatar(m), `${esc(m.name)}${m.id === S.meId ? ' (אני)' : ''}`)).join('')}
    ${opt('any', '<span class="av any">👐</span>', 'מי שפנוי')}${opt('rotate', '<span class="av any">🔄</span>', 'תורנות, עובר לבא בתור')}
    <button class="set-row" data-act="assign-new" data-id="${id}"><span class="e">✨</span><span><b>בן/בת בית חדש/ה</b><small>להוסיף ולתייג מיד</small></span><span aria-hidden="true">←</span></button></div>`);
}

/* ----- rooms manager ----- */
function roomsSheet() {
  const rs = rooms(), used = id => rows('task').filter(t => !t.done && t.room === id).length;
  const have = new Set(rs.map(r => r.id)), presets = ROOM_PRESETS.filter(p => !have.has(p.id));
  const hiddenBase = BASE_ROOMS.filter(b => !have.has(b.id));
  sheet(`<h2 id="sheet-title">🏠 החדרים בבית</h2><p class="muted" style="margin-top:-6px">מגדירים את הבית לפי מה שיש בו באמת. לוחצים על חדר כדי לראות ולערוך את המשימות שבו, ועל ✏️ כדי לשנות שם, אימוג׳י או להסיר.</p>
    <div class="settings">${rs.map(r => `<div class="room-row"><button type="button" class="room-open" data-act="room-open" data-id="${r.id}" aria-label="פתיחת ${esc(r.n)}: משימות ועריכה"><span class="e" aria-hidden="true">${r.e}</span><span><b>${esc(r.n)}</b><small>${used(r.id) ? `${used(r.id)} משימות · לחיצה לניהול` : 'אין משימות עדיין · לחיצה להוספה'}</small></span><span class="go" aria-hidden="true">←</span></button>
      <button type="button" class="link-btn" data-act="room-tasks" data-id="${r.id}" aria-label="משימה חדשה ב${esc(r.n)}">➕ משימה</button><button type="button" class="link-btn" data-act="room-edit" data-id="${r.id}" aria-label="עריכת ${esc(r.n)}">✏️</button></div>`).join('')}</div>
    <div class="actions" style="margin-top:12px"><button type="button" class="btn primary" data-act="room-edit">➕ חדר או מקום חדש</button></div>
    ${presets.length ? `<h3 class="group-t" style="margin:18px 0 6px">✨ הוספה מהירה, עם משימות מוצעות</h3><div class="chips">${presets.map(p => `<button type="button" class="chip" data-act="room-preset" data-id="${p.id}">${p.e} ${p.n}</button>`).join('')}</div>` : ''}
    ${hiddenBase.length ? `<h3 class="group-t" style="margin:16px 0 6px">↩️ חדרים שהוסרו</h3><div class="chips">${hiddenBase.map(b => `<button type="button" class="chip" data-act="room-restore" data-id="${b.id}">${b.e} ${b.n}</button>`).join('')}</div>` : ''}`);
}
function roomSheet(id) {
  const r = room(id), list = activeTasks().filter(t => t.room === id).sort((a, b) => a.title.localeCompare(b.title, 'he'));
  const have = new Set(rows('task').map(t => t.title)), ideas = allTpl().map((x, i) => [x, i]).filter(([x]) => x[0] === id && !have.has(x[1]));
  const top = $('.sheet-card')?.scrollTop || 0;
  sheet(`<div class="room-hero"><span class="e" aria-hidden="true">${r.e}</span><div><h2 id="sheet-title">${esc(r.n)}</h2><small>${list.length} משימות בחדר</small></div><button type="button" class="btn soft" data-act="room-edit" data-id="${id}">✏️ שם ואימוג׳י</button></div>
    <div class="actions" style="margin:12px 0 4px"><button type="button" class="btn primary" data-act="room-tasks" data-id="${id}">➕ משימה חדשה בחדר</button>${tab === 'tasks' ? `<button type="button" class="btn ghost" data-act="room-filter" data-id="${id}">👀 להציג רק את החדר</button>` : ''}</div>
    <h3 class="group-t" style="margin:16px 0 6px">📋 המשימות בחדר</h3>
    ${list.length ? `<ul class="rt-list">${list.map(t => { const o = owner(t), rep = repeatLabel(t.repeat); return `<li><span class="e" aria-hidden="true">${esc(t.emoji || '✨')}</span><span class="tx"><b>${esc(t.title)}</b><small>${rep ? '🔁 ' + rep : 'פעם אחת'} · ${t.assignee === 'rotate' ? '🔄 תורנות' : o ? '👤 ' + esc(o.name) : '👐 מי שפנוי'} · ⭐ ${POINTS[t.effort] || 10}</small></span>
      <button type="button" class="ib" data-act="assign" data-id="${t.id}" aria-label="תיוג מי עושה: ${esc(t.title)}" title="תיוג">🏷️</button><button type="button" class="ib" data-act="edit-task" data-id="${t.id}" aria-label="עריכה: ${esc(t.title)}" title="עריכה">✏️</button><button type="button" class="ib" data-act="room-task-del" data-id="${t.id}" data-r="${id}" aria-label="מחיקה: ${esc(t.title)}" title="מחיקה">🗑️</button></li>`; }).join('')}</ul>`
      : '<div class="note">🪴 עוד אין משימות בחדר הזה. אפשר להוסיף משימה משלכם או לבחור מהרעיונות למטה.</div>'}
    ${ideas.length ? `<h3 class="group-t" style="margin:18px 0 2px">💡 רעיונות לחדר</h3>${ideas.map(([x, i]) => `<button type="button" class="tpl" data-act="add-tpl" data-i="${i}"><span class="e" aria-hidden="true">${x[2]}</span><span>${x[1]}<br><small>${repeatLabel(x[3]) || 'פעם אחת'} · ⭐ ${POINTS[x[4]]}</small></span><b aria-hidden="true">➕</b></button>`).join('')}` : ''}
    <div class="actions" style="margin-top:16px"><button type="button" class="btn ghost" data-act="rooms">↩️ לכל החדרים</button><button type="button" class="btn ghost" data-act="close">סגירה</button></div>`);
  const c = $('.sheet-card'); if (c) c.scrollTop = top;
}
function roomEditSheet(id) {
  const r = id ? room(id) : { e: '🌳', n: '' }; let emo = r.e;
  const n = id ? rows('task').filter(t => t.room === id && !t.done).length : 0;
  sheet(`<h2 id="sheet-title">${id ? '✏️ עריכת חדר' : '➕ חדר או מקום חדש'}</h2><form class="form" id="f" novalidate>
    <label class="field"><span>שם</span><input name="n" maxlength="24" value="${esc(r.n)}" placeholder="למשל: גינה, חדר של יואב, רכב" required></label>
    <p class="err" id="err" aria-live="assertive"></p>
    <fieldset><legend>אימוג׳י</legend>${emojiGrid(ROOM_EMOJIS, emo)}</fieldset>
    <div class="actions"><button class="btn primary">💾 שמירה</button>${id && id !== 'general' ? `<button type="button" class="btn ghost danger" data-act="room-del" data-id="${id}">🗑️ הסרה${n ? ` (${n} משימות יעברו ל"כללי")` : ''}</button>` : ''}<button type="button" class="btn ghost" data-act="${id ? 'room-open' : 'rooms'}" ${id ? `data-id="${id}"` : ''}>↩️ חזרה</button></div></form>`, b => {
    $('.emoji-grid', b).onclick = e => { const x = e.target.closest('[data-emo]'); if (!x) return; emo = x.dataset.emo; $$('[data-emo]', b).forEach(y => y.setAttribute('aria-pressed', y === x)); };
    $('#f', b).onsubmit = e => { e.preventDefault(); const nm = e.target.n.value.trim(); if (!nm) { $('#err', b).textContent = 'צריך לתת שם 🙂'; return e.target.n.focus(); }
      const rid = id || 'r' + uid(); put('room', { ...(rows('room').find(x => x.id === rid) || {}), id: rid, n: nm, e: emo, hidden: false, order: id ? room(id).order : 100 + rooms().length });
      toast(`${esc(emo)} ${id ? 'החדר עודכן' : `"${esc(nm)}" נוסף לבית`}`); roomSheet(rid); };
  });
}
/* ----- shopping list only links ----- */
const listLink = t => `${location.origin}${location.pathname}?list=${t}`;
async function listLinkSheet() {
  if (!CLOUD) return sheet(`<h2 id="sheet-title">🔗 קישור לרשימה בלבד</h2><div class="note">🔒 כדי לשתף קישור צריך שהבית יהיה מחובר לענן (Supabase). במצב מקומי אפשר לשלוח את הרשימה כטקסט.</div><div class="actions"><button type="button" class="btn primary" data-act="share-list">↩️ חזרה</button></div>`);
  let t = S.shareToken;
  if (!t) {
    sheet(`<h2 id="sheet-title">🔗 יוצרים קישור...</h2><div class="progress"><i style="--w:60%"></i></div>`);
    try { for (let i = 0; i < 3 && !t; i++) { const c = Array.from(crypto.getRandomValues(new Uint8Array(12)), x => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join(''); if (await rpc('nestly_share_create', { p_code: S.code, p_token: c })) t = c; } }
    catch (x) { console.warn(x); return sheet(`<h2 id="sheet-title">😕 צריך עדכון קטן ב־Supabase</h2><p>כדי שקישור לרשימה בלבד יעבוד, צריך להריץ פעם אחת את החלק החדש בסוף הקובץ <b>supabase.sql</b> (ב־Supabase ← SQL Editor ← Run).</p><div class="actions"><a class="btn primary" href="https://github.com/NoyaAdivi/nestly/blob/main/supabase.sql" target="_blank" rel="noopener">📄 לקובץ ב־GitHub</a><button type="button" class="btn ghost" data-act="share-list">↩️ חזרה</button></div>`); }
    if (!t) return toast('😕 לא הצלחתי ליצור קישור, כדאי לנסות שוב');
    S.shareToken = t; save();
  }
  const link = listLink(t), msg = EN() ? `🛒 The shopping list of "${homeName()}" on Nestly. You can add and check off items:\n${link}` : `🛒 רשימת הקניות של "${homeName()}" ב־Nestly. אפשר להוסיף ולסמן מה נקנה:\n${link}`;
  sheet(`<h2 id="sheet-title">🔗 הקישור לרשימה מוכן!</h2><p class="muted" style="margin-top:-6px">מי שפותח אותו רואה רק את רשימת הקניות ויכול להוסיף ולסמן. כל שינוי מגיע לכולם.</p>
    <div class="link-box" dir="ltr">${esc(link)}</div>
    <div class="actions" style="flex-direction:column"><a class="btn primary wide" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">💬 שליחה בוואטסאפ</a>
      <button type="button" class="btn soft wide" data-act="list-copy">📋 העתקת הקישור</button>
      ${navigator.share ? '<button type="button" class="btn ghost wide" data-act="list-native">📲 שיתוף לאפליקציה אחרת</button>' : ''}
      <button type="button" class="btn ghost danger wide" data-act="list-revoke">⛔ ביטול הקישור</button></div>`, b => {
    b.onclick = async e => { const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'list-copy') copy(link, '📋 הקישור הועתק');
      if (a === 'list-native') { try { await navigator.share({ text: msg }); } catch { } } };
  });
}
async function listRevoke() {
  try { await rpc('nestly_share_revoke', { p_code: S.code }); delete S.shareToken; save(); closeSheet(); toast('⛔ כל הקישורים לרשימה בוטלו. מי שקיבל אותם כבר לא יכול להיכנס'); }
  catch { toast('😕 לא הצלחתי לבטל. כדאי לבדוק חיבור לאינטרנט'); }
}
function listMissing() {
  sheet(`<h2 id="sheet-title">🔗 הקישור לא פעיל</h2><p>יכול להיות שהקישור בוטל או שהוקלד לא נכון. אפשר לבקש מבני הבית קישור חדש.</p><div class="actions"><a class="btn primary" href="${location.pathname}">🏡 לדף הבית של Nestly</a></div>`);
}
function listStart() {
  document.body.classList.add('list-mode');
  $('#home-name').textContent = 'רשימת קניות משותפת';
  start();
}
function guestSheet() {
  const ms = members();
  sheet(`<h2 id="sheet-title">👋 ברוכים הבאים לרשימה!</h2><p class="muted" style="margin-top:-6px">זו רשימת הקניות של <b>${esc(homeName())}</b>. איך לרשום את מה שתוסיפו?</p>
    ${ms.length ? `<div class="settings">${ms.map(m => `<button class="set-row" data-act="guest-pick" data-id="${m.id}">${avatar(m)}<span><b>${esc(m.name)}</b></span><span aria-hidden="true">←</span></button>`).join('')}</div><p class="muted" style="margin:10px 0 4px">או בשם אחר:</p>` : ''}
    <form class="form" id="f"><label class="field"><span class="sr">השם שלך</span><input name="n" maxlength="24" placeholder="למשל: סבתא רותי" required></label><div class="actions"><button class="btn primary">✨ יאללה</button></div></form>`, b => {
    $('#f', b).onsubmit = e => { e.preventDefault(); const n = e.target.n.value.trim(); if (!n) return e.target.n.focus(); S.guest = n; S.meId = null; save(); closeSheet(); toast(`👋 היי ${esc(n)}!`); };
  });
}
/* ----- legal and info pages (deep links: #accessibility #privacy #terms #contact) ----- */
const UPDATED = '19.11.2026';
const LEGAL = {
  accessibility: ['♿ הצהרת נגישות', () => `<p>אנחנו רואים חשיבות רבה במתן שירות שוויוני לכל המשתמשים, ומשקיעים כדי ש־Nestly יהיה נוח ונגיש גם לאנשים עם מוגבלות.</p>
    <h3>רמת הנגישות</h3><p>האתר הונגש בהתאם לתקן הישראלי ת"י 5568 ולהנחיות WCAG 2.1 ברמה AA, ככל שהדבר אפשרי.</p>
    <h3>מה עשינו באתר</h3><ul>
      <li>כפתור נגישות שאפשר להזיז לכל מקום במסך: הגדלת טקסט, ניגודיות גבוהה, גופן קריא, הדגשת קישורים, סמן גדול, גווני אפור ועצירת אנימציות</li>
      <li>מצב כהה ותמיכה בהגדרת "הפחתת תנועה" של המכשיר</li>
      <li>ניווט מלא במקלדת, קישור "דילוג לתוכן" ומיקוד ברור</li>
      <li>תוויות ותיאורים לקוראי מסך, הודעות חיות על פעולות והתראות</li>
      <li>ניגודיות צבעים מספקת, כפתורים גדולים ונוחים ללחיצה</li>
      <li>אפשרות לבטל כמעט כל פעולה, כדי שטעות לא תעלה ביוקר</li>
      <li>האתר עובד בעברית מימין לשמאל ומותאם לטלפון, טאבלט ומחשב</li></ul>
    <h3>מגבלות ידועות</h3><ul><li>תמונות של מוצרים שמעלים בני הבית לא תמיד כוללות תיאור מלא</li><li>קוד ה־QR מיוצר על ידי ספרייה חיצונית. לצידו תמיד יש גם קוד וקישור להעתקה</li><li>מראה האימוג׳י תלוי במכשיר</li></ul>
    <h3>נתקלתם בבעיה?</h3><p>אם משהו לא נגיש או לא עובד כמו שצריך, נשמח לשמוע ולתקן. כדאי לציין באיזה עמוד, מה ניסיתם לעשות ובאיזה מכשיר ודפדפן.</p>
    <p><b>רכזת הנגישות:</b> נויה אדיבי</p>${contactBtns()}<p class="muted">ההצהרה עודכנה בתאריך ${UPDATED}</p>`],
  privacy: ['🔒 מדיניות פרטיות', () => `<p>Nestly נבנה כך שיאסוף כמה שפחות מידע, ורק את מה שצריך כדי שהבית יעבוד.</p>
    <h3>איזה מידע נשמר</h3><ul><li>שם הבית, שמות ודמויות של בני הבית</li><li>המשימות, רשימת הקניות, הערות ותמונות מוצרים שהעליתם</li><li>היסטוריית נקודות ומשימות שבוצעו</li></ul>
    <p>אין צורך בהרשמה, באימייל או בטלפון, ואנחנו לא מבקשים מידע מזהה.</p>
    <h3>איפה המידע נשמר</h3><p>המידע נשמר במכשיר שלכם, ואם הבית מחובר לענן, גם במסד נתונים של Supabase. הגישה אליו אפשרית רק עם קוד הבית, וכל החוקים נאכפים בצד השרת.</p>
    <h3>מה אנחנו לא עושים</h3><ul><li>לא מוכרים ולא משתפים מידע עם אף אחד</li><li>אין פרסומות ואין כלי מעקב או אנליטיקה</li><li>אין עוגיות מעקב. האתר שומר רק העדפות כמו מצב כהה והגדרות נגישות</li></ul>
    <h3>שירותים חיצוניים</h3><p>הגופנים נטענים מ־Google Fonts, וספריות ה־QR, זיהוי הכתב וקריאת המסמכים נטענות מ־jsDelivr. שירותים אלה מקבלים את כתובת ה־IP שלכם כמו בכל אתר.</p><h3>תמונות ומסמכים</h3><p>כשמעלים תמונה או מסמך כדי להוסיף רשימה, הזיהוי נעשה בתוך הדפדפן שלכם. הקובץ עצמו לא נשלח לשום שרת ולא נשמר, רק הפריטים שאישרתם.</p>
    <h3>מחיקת מידע</h3><p>אפשר למחוק פריטים ומשימות בכל רגע, להוריד גיבוי מלא, או לצאת מהבית במכשיר דרך ההגדרות. למחיקת בית שלם מהענן אפשר לפנות אלינו.</p>
    <p class="muted">עודכן בתאריך ${UPDATED}</p>`],
  terms: ['📜 תנאי שימוש', () => `<p>ברוכים הבאים ל־Nestly. השימוש באתר מהווה הסכמה לתנאים הבאים.</p>
    <h3>מה זה Nestly</h3><p>אתר חינמי לניהול משימות הבית ורשימת קניות משותפת. זהו פרויקט אישי בקוד פתוח, ואין בו תשלומים.</p>
    <h3>שימוש הוגן</h3><ul><li>משתמשים באתר לצרכים אישיים ומשפחתיים</li><li>לא מעלים תוכן פוגעני, לא חוקי או מידע רגיש (כמו מספרי אשראי או סיסמאות)</li><li>שומרים את קוד הבית רק בין בני הבית</li></ul>
    <h3>אחריות</h3><p>האתר ניתן כמו שהוא (AS IS). אנחנו עושים כמיטב יכולתנו שיעבוד תמיד, אבל לא ניתן להבטיח שלא יהיו תקלות או אובדן מידע. מומלץ להוריד גיבוי מדי פעם.</p>
    <h3>קוד פתוח</h3><p>קוד המקור זמין ב־<a href="https://github.com/NoyaAdivi/nestly" target="_blank" rel="noopener">GitHub</a>.</p>
    <h3>שינויים</h3><p>התנאים עשויים להתעדכן מעת לעת. התאריך למטה מראה מתי עודכנו לאחרונה.</p>
    <p class="muted">עודכן בתאריך ${UPDATED}</p>`],
  contact: ['✉️ יצירת קשר', () => `<p>יש שאלה, רעיון לשיפור או משהו שלא עובד? נשמח לשמוע!</p>${contactBtns()}<p class="muted">אפשר גם לקרוא את <button type="button" class="link-btn" data-act="to-faq">❓ השאלות הנפוצות</button></p>`]
};
function contactBtns() {
  return `<div class="contact-btns"><a class="btn soft" href="https://github.com/NoyaAdivi/nestly/issues/new" target="_blank" rel="noopener">🐞 דיווח על בעיה ב־GitHub</a><a class="btn soft" href="https://www.linkedin.com/in/noya-adivi/" target="_blank" rel="noopener">💼 הודעה בלינקדאין</a></div>`;
}
function legalSheet(k) {
  const L = LEGAL[k]; if (!L) return;
  sheet(`<h2 id="sheet-title">${L[0]}</h2><div class="legal">${L[1]()}</div>
    <nav class="legal-nav" aria-label="עמודי מידע">${Object.entries(LEGAL).filter(([x]) => x !== k).map(([x, v]) => `<a href="#${x}" data-act="legal" data-p="${x}">${v[0]}</a>`).join('')}</nav>
    <div class="actions"><button type="button" class="btn primary" data-act="close">👍 הבנתי</button></div>`);
  $('.sheet-card') && ($('.sheet-card').scrollTop = 0);
}
/* ----- import a whole list: text, photo (also handwriting) or document ----- */
const loadScript = src => new Promise((ok, no) => { if ([...document.scripts].some(x => x.src === src)) return ok(); const el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = () => no(new Error('load')); document.head.append(el); });
const CDN = { ocr: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', pdf: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs', pdfw: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs', docx: 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js' };
function parseList(text) {
  const out = [], seen = new Set();
  String(text || '').split(/[\n\r,،;•·]+/).forEach(raw => {
    let t = raw.replace(/^[\s\-\u2013*+.)\]☐☑✓✔□■●○◦>]+/, '').replace(/^\d+[.)]\s*/, '').replace(/[|_~`"“”]+/g, ' ').replace(/\s+/g, ' ').trim();
    let q = 1, m = t.match(/^(\d{1,2})\s*(?:x|×|יח'?|יחידות)?\s+(.+)$/i) || null;
    if (m) { q = +m[1]; t = m[2]; } else if ((m = t.match(/^(.+?)\s*(?:x|×)\s*(\d{1,2})$/i))) { t = m[1]; q = +m[2]; }
    t = t.replace(/[^\p{L}\p{N}\s%'׳"״\-]/gu, '').trim();
    if (!/[\p{L}]{2,}/u.test(t) || t.length > 40) return;
    const k = t.toLowerCase(); if (seen.has(k)) return; seen.add(k);
    out.push({ name: t, qty: Math.min(99, Math.max(1, q)) });
  });
  return out.slice(0, 60);
}
function importSheet(mode) {
  if (mode === 'text') return sheet(`<h2 id="sheet-title">✍️ הדבקת רשימה</h2><p class="muted" style="margin-top:-6px">כותבים או מדביקים רשימה, למשל מוואטסאפ. כל שורה או פסיק הם פריט.</p>
    <form class="form" id="f"><label class="field"><span class="sr">הרשימה</span><textarea name="t" rows="7" placeholder="חלב&#10;2 לחם&#10;עגבניות, מלפפונים&#10;סבון כלים" required></textarea></label>
    <div class="actions"><button class="btn primary">👀 המשך לבדיקה</button><button type="button" class="btn ghost" data-act="import">↩️ חזרה</button></div></form>`, b => {
      $('#f', b).onsubmit = e => { e.preventDefault(); const l = parseList(e.target.t.value); if (!l.length) return toast('🤔 לא מצאתי פריטים בטקסט'); reviewSheet(l, 'טקסט'); };
    });
  if (mode) return pickFile(mode);
  sheet(`<h2 id="sheet-title">➕ מה רוצים להוסיף?</h2><p class="muted" style="margin-top:-6px">אפשר להוסיף פריט אחד בשורה למעלה, או רשימה שלמה בבת אחת:</p>
    <div class="imp-grid">
      <button type="button" class="imp" data-act="import" data-m="image"><span class="e">📸</span><b>תמונה או כתב יד</b><small>מצלמים רשימה על פתק או מעלים צילום מסך</small></button>
      <button type="button" class="imp" data-act="import" data-m="doc"><span class="e">📄</span><b>מסמך</b><small>PDF, Word או קובץ טקסט</small></button>
      <button type="button" class="imp" data-act="import" data-m="text"><span class="e">✍️</span><b>טקסט</b><small>מדביקים רשימה מוואטסאפ או מהפתקים</small></button>
      <button type="button" class="imp" data-act="import" data-m="photo-item"><span class="e">🖼️</span><b>פריט עם תמונה</b><small>כדי שכולם יידעו בדיוק מה לקנות</small></button>
      <button type="button" class="imp" data-act="recs"><span class="e">💡</span><b>רשימה מומלצת</b><small>בוחרים לפי מחלקות בסופר</small></button>
      <button type="button" class="imp" data-act="close-focus"><span class="e">⌨️</span><b>פריט אחד</b><small>כותבים בשורה למעלה ולוחצים ➕</small></button>
    </div>`);
}
function pickFile(mode) {
  const inp = document.createElement('input'); inp.type = 'file';
  inp.accept = mode === 'doc' ? '.pdf,.txt,.csv,.docx,image/*' : 'image/*';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; mode === 'photo-item' ? photoItemSheet(f) : readFile(f); };
  inp.click();
}
async function photoItemSheet(file) {
  let photo = ''; try { photo = await shrinkPhoto(file); } catch { return toast('😕 לא הצלחתי לקרוא את התמונה'); }
  sheet(`<h2 id="sheet-title">🖼️ פריט עם תמונה</h2><form class="form" id="f"><img class="photo-big" src="${photo}" alt="התמונה שנבחרה" style="max-height:38vh">
    <label class="field"><span>מה זה?</span><input name="n" maxlength="80" placeholder="למשל: שמפו של יעל" required></label>
    <div class="actions"><button class="btn primary">➕ הוספה לרשימה</button><button type="button" class="btn ghost" data-act="import" data-m="photo-item">🔁 תמונה אחרת</button></div></form>`, b => {
    $('#f', b).onsubmit = e => { e.preventDefault(); const n = e.target.n.value.trim(); if (!n) return e.target.n.focus();
      const it = { id: uid(), name: n.slice(0, 80), qty: 1, cat: guessCat(n), by: S.meId, at: Date.now(), photo }; put('shop', it); closeSheet(); toast(`📷 "${esc(n)}" נוסף עם תמונה`); };
  });
}
function progressSheet(msg) {
  sheet(`<h2 id="sheet-title">🔎 קוראים את הרשימה...</h2><p class="muted" id="ocr-msg" aria-live="polite">${msg}</p><div class="progress"><i id="ocr-bar" style="--w:4%"></i></div><p class="muted" style="font-size:.84rem">בפעם הראשונה זה לוקח קצת יותר זמן. הכל נעשה בדפדפן שלכם.</p>`);
}
const setProg = (p, msg) => { const b = $('#ocr-bar'); if (b) b.style.setProperty('--w', Math.round(p * 100) + '%'); if (msg && $('#ocr-msg')) $('#ocr-msg').textContent = msg; };
async function prepImage(src) {
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const k = Math.min(1, 2000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = img.width * k; c.height = img.height * k; const x = c.getContext('2d');
  x.filter = 'grayscale(1) contrast(1.45) brightness(1.08)'; x.drawImage(img, 0, 0, c.width, c.height); return c;
}
async function ocr(canvases) {
  await loadScript(CDN.ocr);
  const w = await Tesseract.createWorker(['heb', 'eng'], 1, { logger: m => { if (m.status === 'recognizing text') setProg(.3 + m.progress * .7, '✍️ מזהים את הכתב...'); else setProg(.15, '⬇️ טוענים את כלי הזיהוי...'); } });
  let text = ''; for (const c of canvases) text += '\n' + (await w.recognize(c)).data.text;
  await w.terminate(); return text;
}
async function readFile(f) {
  const name = f.name.toLowerCase();
  progressSheet('📂 פותחים את הקובץ...');
  try {
    let text = '';
    if (f.type.startsWith('image/')) { const url = URL.createObjectURL(f); text = await ocr([await prepImage(url)]); URL.revokeObjectURL(url); }
    else if (name.endsWith('.txt') || name.endsWith('.csv')) text = await f.text();
    else if (name.endsWith('.docx')) { setProg(.3, '📄 קוראים את המסמך...'); await loadScript(CDN.docx); text = (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value; }
    else if (name.endsWith('.pdf')) {
      setProg(.2, '📄 קוראים את ה־PDF...');
      const pdfjs = await import(CDN.pdf); pdfjs.GlobalWorkerOptions.workerSrc = CDN.pdfw;
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise, pages = Math.min(doc.numPages, 5), scans = [];
      for (let i = 1; i <= pages; i++) {
        const pg = await doc.getPage(i), tc = await pg.getTextContent();
        const lines = {}; tc.items.forEach(it => { const y = Math.round(it.transform[5]); (lines[y] = lines[y] || []).push(it.str); });
        const t = Object.keys(lines).sort((a, b) => b - a).map(y => lines[y].join(' ')).join('\n');
        if (t.trim().length > 3) text += '\n' + t;
        else { const v = pg.getViewport({ scale: 2 }), c = document.createElement('canvas'); c.width = v.width; c.height = v.height; await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise; scans.push(c); }
      }
      if (scans.length) text += await ocr(scans);
    } else throw new Error('type');
    const l = parseList(text);
    if (!l.length) return sheet(`<h2 id="sheet-title">🤔 לא מצאתי פריטים</h2><p>לא הצלחתי לקרוא פריטים מהקובץ. כדאי לנסות תמונה חדה יותר, באור טוב, עם כתב ברור ושורה לכל פריט.</p><div class="actions"><button type="button" class="btn primary" data-act="import" data-m="image">📸 לנסות תמונה אחרת</button><button type="button" class="btn ghost" data-act="import" data-m="text">✍️ להקליד במקום</button></div>`);
    reviewSheet(l, f.type.startsWith('image/') ? 'תמונה' : 'מסמך');
  } catch (x) {
    console.warn(x);
    sheet(`<h2 id="sheet-title">😕 משהו לא הסתדר</h2><p>${x.message === 'type' ? 'אפשר להעלות תמונה, PDF, Word (docx) או קובץ טקסט.' : 'לא הצלחתי לקרוא את הקובץ. לזיהוי צריך חיבור לאינטרנט בפעם הראשונה.'}</p><div class="actions"><button type="button" class="btn primary" data-act="import">↩️ חזרה</button><button type="button" class="btn ghost" data-act="import" data-m="text">✍️ להקליד במקום</button></div>`);
  }
}
function reviewSheet(list, src) {
  sheet(`<h2 id="sheet-title">👀 זה מה שמצאתי</h2><p class="muted" style="margin-top:-6px">מצאתי ${list.length} פריטים ב${src}. אפשר לתקן שמות, לשנות כמות או להוריד סימון לפני ההוספה.</p>
    <form id="f" class="form"><ul class="rev">${list.map((x, i) => `<li><input type="checkbox" checked aria-label="להוסיף את ${esc(x.name)}" data-i="${i}"><span class="e" aria-hidden="true">${cat(guessCat(x.name)).e}</span><input class="rn" value="${esc(x.name)}" maxlength="80" aria-label="שם הפריט"><input class="rq" type="number" min="1" max="99" value="${x.qty}" aria-label="כמות"></li>`).join('')}</ul>
    <div class="actions"><button class="btn primary" id="rev-go">➕ להוסיף ${list.length} פריטים</button><button type="button" class="btn ghost" data-act="import">↩️ חזרה</button></div></form>`, b => {
    const upd = () => { const n = $$('.rev input[type=checkbox]:checked', b).length; $('#rev-go', b).textContent = n ? `➕ להוסיף ${n} פריטים` : 'לא נבחרו פריטים'; $('#rev-go', b).disabled = !n; };
    b.addEventListener('change', upd);
    b.addEventListener('input', e => { if (e.target.classList.contains('rn')) e.target.parentElement.querySelector('.e').textContent = cat(guessCat(e.target.value)).e; });
    $('#f', b).onsubmit = e => { e.preventDefault(); let n = 0;
      $$('.rev li', b).forEach(li => { if (!$('input[type=checkbox]', li).checked) return; const nm = $('.rn', li).value.trim(); if (!nm) return; addItem(nm, Math.max(1, +$('.rq', li).value || 1), true); n++; });
      closeSheet(); if (tab !== 'shop') go('shop'); confetti(innerWidth / 2, innerHeight / 3, 60); toast(`🛒 ${n} פריטים נוספו לרשימה`); };
  });
}
const flash = id => setTimeout(() => $(`.item[data-id="${id}"]`)?.classList.add('flash'), 30);
function itemSheet(id) {
  const x = clone(rec(id)); if (!x) return;
  sheet(`<h2 id="sheet-title">✏️ עריכת פריט</h2><form class="form" id="f" novalidate>
    <label class="field"><span>שם הפריט</span><input name="name" maxlength="80" value="${esc(x.name)}" required></label>
    <label class="field"><span>כמות</span><input type="number" name="qty" min="1" max="99" value="${x.qty || 1}"></label>
    <fieldset><legend>קטגוריה</legend>${chips('cat', CATS.map(c => [c.id, `${c.e} ${c.n}`]), x.cat)}</fieldset>
    <label class="field"><span>הערה</span><input name="note" maxlength="80" value="${esc(x.note || '')}" placeholder="למשל: 3% שומן, המותג הכחול"></label>
    <fieldset><legend>📷 תמונה של המוצר</legend><div class="photo-field"><div class="photo-prev" id="ph-prev">${x.photo ? `<img src="${x.photo}" alt="התמונה של ${esc(x.name)}">` : '<span aria-hidden="true">🖼️</span>'}</div>
      <div class="photo-btns"><label class="btn soft" tabindex="0">📸 ${x.photo ? 'החלפת תמונה' : 'הוספת תמונה'}<input type="file" id="ph-in" accept="image/*" class="sr"></label>${x.photo ? '<button type="button" class="btn ghost" id="ph-del">🗑️ הסרה</button>' : ''}<small class="muted">כדי שכולם יידעו בדיוק איזה מוצר לקנות</small></div></div></fieldset>
    <p class="muted" style="margin:0">${member(x.by) ? `נוסף על ידי ${esc(member(x.by).emoji)} ${esc(member(x.by).name)}` : ''}</p>
    <div class="actions"><button class="btn primary">💾 שמירה</button><button type="button" class="btn ghost danger" data-act="del-item" data-id="${id}">🗑️ מחיקה</button></div></form>`, b => {
    let photo = x.photo || '';
    const prev = $('#ph-prev', b), lab = $('#ph-in', b).closest('label');
    lab.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#ph-in', b).click(); } };
    $('#ph-in', b).onchange = async e => { const f = e.target.files[0]; if (!f) return; prev.innerHTML = '<span aria-hidden="true">⏳</span>'; try { photo = await shrinkPhoto(f); prev.innerHTML = `<img src="${photo}" alt="תמונה חדשה">`; } catch { prev.innerHTML = '<span aria-hidden="true">🖼️</span>'; toast('😕 לא הצלחתי לקרוא את התמונה'); } };
    $('#ph-del', b) && ($('#ph-del', b).onclick = () => { photo = ''; prev.innerHTML = '<span aria-hidden="true">🖼️</span>'; });
    $('#f', b).onsubmit = e => { e.preventDefault(); const f = e.target; const n = f.name.value.trim(); if (!n) return f.name.focus(); const nx = { ...x, name: n, qty: Math.max(1, +f.qty.value || 1), cat: chipVal(b, 'cat'), note: f.note.value.trim() }; if (photo) nx.photo = photo; else delete nx.photo; put('shop', nx); closeSheet(); toast('✅ הפריט עודכן'); };
  });
}
function shareList() {
  const act = rows('shop').filter(i => !i.bought);
  if (!act.length && LISTMODE) return toast('🧺 הרשימה ריקה כרגע');
  const txt = `${EN() ? '🛒 Shopping list' : '🛒 רשימת קניות'}: ${homeName()}\n` + CAT_ORDER.map(cat).map(c => { const g = act.filter(x => x.cat === c.id); return g.length ? `\n${c.e} ${tx(c.n)}\n${g.map(x => `• ${tx(x.name)}${x.qty > 1 ? ` ×${x.qty}` : ''}${x.note ? ` (${x.note})` : ''}`).join('\n')}` : ''; }).join('') + (CLOUD ? `\n\n📲 ${EN() ? 'Add to the list' : 'להוספה לרשימה'}: ${joinLink()}` : '');
  sheet(`<h2 id="sheet-title">📤 שיתוף רשימת הקניות</h2>
    ${LISTMODE ? '' : `<div class="share-box"><b>🔗 קישור לרשימת הקניות בלבד</b><small>מי שמקבל אותו רואה ויכול להוסיף ולסמן רק ברשימת הקניות. בלי המשימות, בלי ההגדרות ובלי קוד הבית. מתאים לסבתא, לבייביסיטר או לשותפים.</small>
      <div class="actions"><button type="button" class="btn primary" data-act="list-link">🔗 יצירת קישור לרשימה</button>${S.shareToken ? '<button type="button" class="btn ghost danger" data-act="list-revoke">⛔ ביטול כל הקישורים</button>' : ''}</div></div>`}
    <h3 class="group-t" style="margin:16px 0 4px">📝 שליחה כטקסט</h3><p class="muted" style="margin:0 0 6px">${act.length} פריטים, מסודרים לפי מחלקות בסופר.</p>
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
  rec2 = new SR(); rec2.lang = EN() ? 'en-US' : 'he-IL'; rec2.interimResults = false;
  btn.classList.add('on'); btn.setAttribute('aria-label', 'מקשיב... לחיצה לעצירה');
  rec2.onresult = e => { const t = e.results[0][0].transcript; const inp = $('#item-in'); inp.value = t.replace(/ ו(?=\S)/g, ', ').replace(/ וגם /g, ', ').replace(/ and (also )?/gi, ', '); inp.focus(); };
  rec2.onerror = () => toast('🎤 לא הצלחתי לשמוע. כדאי לבדוק הרשאת מיקרופון');
  rec2.onend = () => { btn.classList.remove('on'); btn.setAttribute('aria-label', 'הוספה בקול'); rec2 = null; };
  rec2.start(); toast('🎤 מקשיב... אפשר לומר כמה פריטים');
}

/* ----- FAMILY ----- */
function familyView() { }
familyView.body = () => {
  const ms = members(), wp = weekPoints(), done = {};
  logs().forEach(l => done[l.memberId] = (done[l.memberId] || 0) + 1);
  return `<div class="page-h"><h1>👨‍👩‍👧 ${esc(homeName())}</h1><div class="page-h-btns"><button class="btn soft" data-act="homes" style="min-height:42px;padding:0 14px">🏘️ ${homes().length > 1 ? `הבתים שלי (${homes().length})` : 'בית נוסף'}</button><button class="btn soft" data-act="rename" style="min-height:42px;padding:0 14px">✏️ שינוי שם</button></div></div>
  ${CLOUD ? `<section class="card code-box"><h2>💌 מזמינים את בני הבית</h2><p style="margin:6px 0 0">שולחים קישור או קוד, וכל אחד מצטרף מהטלפון שלו</p>
    <div class="code" aria-label="קוד הבית: ${S.code.split('').join(' ')}">${fmtCode(S.code)}</div>
    <div class="code-actions"><button class="btn" data-act="copy-code">📋 העתקת קוד</button><button class="btn" data-act="copy-link">🔗 העתקת קישור</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent(EN() ? `🏡 Come join our home "${homeName()}" on Nestly! Shared chores and shopping list\n${joinLink()}\nCode: ${fmtCode(S.code)}` : `🏡 בואו להצטרף לבית "${homeName()}" ב-Nestly! משימות ורשימת קניות משותפת\n${joinLink()}\nקוד: ${fmtCode(S.code)}`)}" target="_blank" rel="noopener">💬 וואטסאפ</a></div>
    <div class="qr" id="qr" aria-label="קוד QR להצטרפות" role="img" hidden></div></section>`
    : `<section class="card"><h2>💌 הזמנת בני הבית</h2><div class="note">🔒 כרגע האפליקציה שומרת הכל רק במכשיר הזה. כדי שכל בני הבית יוכלו להצטרף בקישור או בקוד ולראות את אותה רשימה, צריך לחבר את Supabase פעם אחת (לפי ההוראות ב-README). עד אז אפשר להוסיף את בני הבית ידנית ולנהל הכל מכאן.</div></section>`}
  <section class="card"><div class="card-h"><h2>👪 בני הבית (${ms.length})</h2><button class="link-btn" data-act="add-member">➕ הוספה</button></div>
    ${ms.map((m, i) => `<div class="member ${pop('m' + m.id)}" style="--i:${i}">${avatar(m, 'lg')}<div class="nm"><b>${esc(m.name)}${m.id === S.meId ? '<span class="me-tag">אני</span>' : ''}</b><small>⭐ ${wp[m.id] || 0} השבוע · ✅ ${done[m.id] || 0} משימות בסך הכל</small></div><button class="link-btn" data-act="edit-member" data-id="${m.id}" aria-label="עריכת ${esc(m.name)}">✏️</button></div>`).join('')}</section>
  <section class="card settings"><h2 style="margin-bottom:4px">⚙️ הגדרות</h2>
    <button class="set-row" data-act="homes"><span class="e">🏘️</span><span>הבתים שלי<small>${homes().length > 1 ? `${homes().length} בתים במכשיר הזה · מעבר בין בתים` : 'פתיחה או הצטרפות לבית נוסף'}</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="whoami"><span class="e">🙋</span><span>מי אני במכשיר הזה?<small>כרגע: ${esc(me()?.name || 'לא נבחר')}</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="a11y"><span class="e">♿</span><span>נגישות<small>גודל טקסט, ניגודיות, גופן קריא, עצירת אנימציות</small></span><span aria-hidden="true">←</span></button><button class="set-row" data-act="theme"><span class="e">🌗</span><span>מצב כהה / בהיר<small>החלפת צבעי התצוגה</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="rooms"><span class="e">🏠</span><span>החדרים בבית<small>גינה, רכב, חדר ילדים... מגדירים את הבית לפי מה שיש</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="templates"><span class="e">💡</span><span>רעיונות למשימות<small>חבילת משימות מוכנות לפי חדרים</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="backup"><span class="e">💾</span><span>הורדת גיבוי<small>קובץ JSON עם כל הנתונים של הבית</small></span><span aria-hidden="true">←</span></button>
    <button class="set-row" data-act="leave"><span class="e">🚪</span><span>יציאה מהבית במכשיר הזה<small>${CLOUD ? 'הנתונים נשארים אצל שאר בני הבית' : 'שימו לב: במצב מקומי הנתונים של הבית הזה יימחקו'}</small></span><span aria-hidden="true">←</span></button>
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
  $('#tabbar').hidden = true; $('#topnav').hidden = true; $('#fab').hidden = true; $('#top-add') && ($('#top-add').hidden = true); $('#home-name').textContent = 'הבית המשותף שלכם'; setView('onb');
  const feats = [['🧹', 'משימות שחוזרות לבד', 'כל יום, כל שבוע או בימים שבוחרים', 'sky'], ['🛒', 'רשימת קניות חכמה', 'מסודרת לפי מחלקות, גם בקול', 'mint'], ['🔄', 'תורנויות הוגנות', 'התור עובר לבד לבא בתור', 'peach'], ['🏆', 'נקודות ואלופי השבוע', 'קצת תחרות וקונפטי 🎉', 'sky']];
  main.innerHTML = `<div class="view onb">
    <section class="onb-hero">
      <div class="hero-badge" aria-hidden="true">
        <img src="logo.svg" alt="" class="hero-logo" width="132" height="132">
        <span class="orbit"><i>🧺</i><i>🫧</i><i>🛒</i><i>🩵</i></span>
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
      useState({ code, records: {}, outbox: {}, cursor: null });
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
        if (homeCodes().includes(code)) { switchHome(code); return; }
        useState({ code, records: {}, outbox: {}, cursor: null });
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
      if (name === 'tf') { tFilter = val; refresh(); return; }
      if (name === 'tr') { tRoom = val; refresh(); return; }
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
    case 'to-faq': faqSheet(); break;
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
    case 'photo': photoSheet(id); break;
    case 'import': importSheet(a.dataset.m); break;
    case 'list-link': listLinkSheet(); break;
    case 'list-revoke': listRevoke(); break;
    case 'guest-pick': S.meId = id; delete S.guest; save(); closeSheet(); toast(`👋 היי ${esc(member(id)?.name || '')}!`); break;
    case 'rooms': roomsSheet(); break;
    case 'room-open': roomSheet(id); break;
    case 'room-filter': closeSheet(); tRoom = id; tFilter = 'all'; refresh(); $('.room-banner')?.scrollIntoView({ block: 'nearest' }); break;
    case 'room-task-del': { const t = clone(rec(id)); if (!t) break; del(id); toast(`🗑️ "${esc(t.title)}" נמחקה`, { undo: () => { put('task', t); dlg.open && roomSheet(a.dataset.r); } }); roomSheet(a.dataset.r); break; }
    case 'room-edit': roomEditSheet(id); break;
    case 'room-tasks': taskSheet(null, { room: id }); break;
    case 'room-restore': { const r0 = rows('room').find(x => x.id === id) || { id }; put('room', { ...r0, hidden: false }); toast('↩️ החדר חזר'); roomsSheet(); break; }
    case 'room-del': { if (tRoom === id) tRoom = 'all'; const r0 = room(id), moved = rows('task').filter(t => t.room === id).map(t => ['task', { ...t, room: 'general' }]); write([...moved, ['room', { ...(rows('room').find(x => x.id === id) || {}), id, n: r0.n, e: r0.e, hidden: true }]]); toast(`🗑️ "${esc(r0.n)}" הוסר${moved.length ? `, ${moved.length} משימות עברו לכללי` : ''}`, { undo: () => { write([...moved.map(([, t]) => ['task', { ...t, room: id }]), ['room', { ...(rows('room').find(x => x.id === id) || {}), id, hidden: false }]]); } }); roomsSheet(); break; }
    case 'room-preset': { const p = ROOM_PRESETS.find(x => x.id === id); if (!p) break; put('room', { id: p.id, n: p.n, e: p.e, order: 100 + rooms().length }); sheet(`<h2 id="sheet-title">${p.e} ${p.n} נוסף לבית!</h2><p class="muted" style="margin-top:-6px">רוצים להוסיף גם משימות מוצעות? לוחצים על מה שמתאים:</p>${allTpl().map((x, i) => [x, i]).filter(([x]) => x[0] === p.id).map(([x, i]) => `<button type="button" class="tpl" data-act="add-tpl" data-i="${i}"><span class="e" aria-hidden="true">${x[2]}</span><span>${x[1]}<br><small>${repeatLabel(x[3]) || 'פעם אחת'} · ⭐ ${POINTS[x[4]]}</small></span><b aria-hidden="true">➕</b></button>`).join('')}<div class="actions" style="margin-top:14px"><button type="button" class="btn primary" data-act="rooms">👍 סיימתי</button><button type="button" class="btn ghost" data-act="room-tasks" data-id="${p.id}">✍️ משימה משלי</button></div>`); break; }
    case 'close-focus': closeSheet(); if (tab !== 'shop') go('shop'); setTimeout(() => $('#item-in')?.focus(), 260); break;
    case 'assign': assignSheet(id); break;
    case 'assign-to': { const t = rec(id), w = a.dataset.who; if (!t) break; const nt = { ...t, assignee: w }; if (w === 'rotate' && !member(nt.turn)) nt.turn = S.meId || members()[0]?.id; put('task', nt); closeSheet(); toast(w === 'any' ? '👐 כל מי שפנוי יכול לעשות את זה' : w === 'rotate' ? '🔄 המשימה עברה לתורנות' : `🏷️ ${esc(member(w)?.name || '')} מתויג/ת על "${esc(t.title)}"`); break; }
    case 'assign-new': memberSheet(null, { onDone: m => { const t = rec(id); if (t) put('task', { ...t, assignee: m.id }); } }); break;
    case 'legal': e.preventDefault(); legalSheet(a.dataset.p); break;
    case 'recs': recsSheet(); break;
    case 'rec-cat': recsSheet(a.dataset.c); break;
    case 'rec-add': recToggle(a.dataset.n); break;
    case 'rec-all': { const on = new Set(rows('shop').filter(i => !i.bought).map(i => i.name)), add = RECS[recCat].filter(([, n]) => !on.has(n)).map(([, n]) => ({ id: uid(), name: n, qty: 1, cat: recCat, by: S.meId, at: Date.now() })); if (!add.length) break; write(add.map(i => ['shop', i])); toast(`${cat(recCat).e} ${add.length} פריטים נוספו לרשימה`, { undo: () => { write(add.map(i => ['del', i.id])); recsSheet(); } }); recsSheet(); break; }
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
    case 'leave-yes': {
      const gone = S.code, other = homeCodes().find(c => c !== gone && readHome(c)); setCodes(homeCodes().filter(c => c !== gone)); localStorage.removeItem(KEY); try { localStorage.removeItem(hKey(gone)); } catch { }
      S = { records: {}, outbox: {} };
      if (other) { useState(readHome(other)); closeSheet(); history.replaceState(null, '', location.pathname + '#home'); start(); refresh(); toast(`🏡 עברת ל"${esc(homeName())}"`); }
      else { closeSheet(); history.replaceState(null, '', location.pathname); onboarding(); setSync('local'); }
      break;
    }
    case 'homes': homesSheet(); break;
    case 'home-switch': switchHome(id); break;
  }
});

/* ---------- start ---------- */
{ const y = $('#yr'); if (y) y.textContent = new Date().getFullYear(); }
addEventListener('nestly:lang', () => { if (S.code) { refresh(); requestAnimationFrame(movePill); } });
function start() {
  $('#tabbar').hidden = false; $('#topnav').hidden = false; requestAnimationFrame(movePill);
  const h = location.hash.slice(1);
  go(LEGAL[h] ? 'home' : h || 'home', false);
  if (LEGAL[h]) setTimeout(() => legalSheet(h), 300);
  sync();
}
window.addEventListener('load', () => tab === 'family' && drawQR());

const joinParam = new URLSearchParams(location.search).get('join');
if (LISTMODE) listStart();
else if (S.code && (!joinParam || joinParam.toUpperCase() === S.code)) { if (joinParam) history.replaceState(null, '', location.pathname + '#home'); start(); }
else if (S.code && joinParam) { const jc = joinParam.toUpperCase().replace(/[^A-Z0-9]/g, ''); history.replaceState(null, '', location.pathname + '#home'); if (homeCodes().includes(jc) && readHome(jc)) switchHome(jc); else { start(); if (CLOUD) joinSheet(jc); } }
else { onboarding(joinParam); setSync('local'); const h = location.hash.slice(1); if (LEGAL[h]) setTimeout(() => legalSheet(h), 300); }


