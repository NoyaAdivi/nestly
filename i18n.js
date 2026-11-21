/* i18n.js: Hebrew / English for Nestly.
   The app is written in Hebrew. In English mode every text node and label on the page is
   translated live from this dictionary (exact phrases first, then known phrases inside longer text).
   Text the family typed themselves stays as it is, unless it is one of the built-in suggestions. */
(() => {
  'use strict';
  const LS = 'nestly:lang';
  const root = document.documentElement;
  const D = {
    // days, dates
    'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday', 'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Saturday',
    'א׳': 'Sun', 'ב׳': 'Mon', 'ג׳': 'Tue', 'ד׳': 'Wed', 'ה׳': 'Thu', 'ו׳': 'Fri', 'ש׳': 'Sat',
    'בלי תאריך': 'No date', 'מאתמול': 'Since yesterday', 'היום': 'Today', 'מחר': 'Tomorrow', 'עכשיו': 'Just now', 'אתמול': 'Yesterday', 'לפני שעה': 'An hour ago',
    // rooms
    'מטבח': 'Kitchen', 'סלון': 'Living room', 'אמבטיה': 'Bathroom', 'כביסה': 'Laundry', 'חדרים': 'Bedrooms', 'מרפסת וחצר': 'Balcony & yard', 'חיות': 'Pets', 'כללי': 'General',
    'גינה': 'Garden', 'רכב': 'Car', 'חדר ילדים': 'Kids room', 'חדר עבודה': 'Office', 'פינת אוכל': 'Dining area', 'כניסה': 'Entrance', 'מחסן': 'Storage', 'בריכה': 'Pool', 'שירותי אורחים': 'Guest toilet',
    // room preset tasks
    'השקיית הגינה': 'Water the garden', 'כיסוח הדשא': 'Mow the lawn', 'גיזום שיחים': 'Trim the bushes', 'איסוף עלים': 'Rake the leaves',
    'שטיפת הרכב': 'Wash the car', 'ניקוי פנים הרכב': 'Clean the car inside', 'בדיקת לחץ אוויר': 'Check tire pressure',
    'סידור צעצועים': 'Tidy the toys', 'החלפת מצעים לילדים': 'Change the kids sheets', 'מיון בגדים קטנים': 'Sort outgrown clothes',
    'סידור השולחן': 'Tidy the desk', 'ניקוי אבק מהמחשב': 'Dust the computer', 'עריכת שולחן': 'Set the table', 'ניגוב השולחן והכיסאות': 'Wipe the table and chairs',
    'סידור נעליים': 'Tidy the shoes', 'ניקוי שטיח הכניסה': 'Clean the doormat', 'סידור המחסן': 'Tidy the storage room',
    'ניקוי הבריכה': 'Clean the pool', 'בדיקת כלור': 'Check the chlorine', 'ניקוי שירותי האורחים': 'Clean the guest toilet', 'החלפת מגבת ידיים': 'Change the hand towel',
    // aisles
    'לחיות המחמד': 'Pets', 'ניקיון': 'Cleaning', 'טואלטיקה ופארם': 'Toiletries', 'קפואים': 'Frozen', 'ירקות ופירות': 'Fruit & veg', 'מוצרי חלב וביצים': 'Dairy & eggs',
    'לחם ומאפים': 'Bread & bakery', 'בשר ודגים': 'Meat & fish', 'משקאות': 'Drinks', 'חטיפים ומתוקים': 'Snacks & sweets', 'מזווה': 'Pantry', 'שונות': 'Other',
    // recommended items
    'עגבניות': 'Tomatoes', 'מלפפונים': 'Cucumbers', 'בצל': 'Onions', 'שום': 'Garlic', 'פלפלים': 'Peppers', 'גזר': 'Carrots', 'חסה': 'Lettuce', 'תפוחי אדמה': 'Potatoes',
    'לימונים': 'Lemons', 'אבוקדו': 'Avocado', 'בננות': 'Bananas', 'תפוחים': 'Apples', 'פטרוזיליה': 'Parsley', 'ענבים': 'Grapes',
    'חלב': 'Milk', 'ביצים': 'Eggs', 'גבינה צהובה': 'Yellow cheese', 'קוטג׳': 'Cottage cheese', 'גבינה לבנה': 'White cheese', 'יוגורט': 'Yogurt', 'חמאה': 'Butter',
    'שמנת מתוקה': 'Whipping cream', 'מעדנים': 'Puddings', 'לבנה': 'Labneh',
    'לחם': 'Bread', 'פיתות': 'Pitas', 'באגט': 'Baguette', 'חלה': 'Challah', 'לחמניות': 'Rolls', 'טורטיות': 'Tortillas',
    'חזה עוף': 'Chicken breast', 'שניצלים': 'Schnitzels', 'בשר טחון': 'Ground beef', 'פרגיות': 'Chicken thighs', 'סלמון': 'Salmon', 'נקניקיות': 'Hot dogs',
    'אורז': 'Rice', 'פסטה': 'Pasta', 'שמן זית': 'Olive oil', 'מלח': 'Salt', 'סוכר': 'Sugar', 'קמח': 'Flour', 'טונה': 'Tuna', 'רסק עגבניות': 'Tomato paste',
    'קפה': 'Coffee', 'תה': 'Tea', 'קורנפלקס': 'Cornflakes', 'טחינה': 'Tahini',
    'אפונה קפואה': 'Frozen peas', 'בורקס קפוא': 'Frozen bourekas', 'פיצה קפואה': 'Frozen pizza', 'גלידה': 'Ice cream', 'צ׳יפס קפוא': 'Frozen fries',
    'מים מינרליים': 'Mineral water', 'מיץ תפוזים': 'Orange juice', 'סודה': 'Soda water', 'תרכיז': 'Syrup', 'יין': 'Wine',
    'במבה': 'Bamba', 'ביסלי': 'Bissli', 'שוקולד': 'Chocolate', 'עוגיות': 'Cookies', 'פופקורן': 'Popcorn', 'וופלים': 'Wafers',
    'סבון כלים': 'Dish soap', 'ספוגים': 'Sponges', 'שקיות זבל': 'Trash bags', 'אבקת כביסה': 'Laundry detergent', 'מרכך כביסה': 'Fabric softener',
    'נוזל רצפות': 'Floor cleaner', 'מגבות נייר': 'Paper towels', 'אקונומיקה': 'Bleach',
    'נייר טואלט': 'Toilet paper', 'טישו': 'Tissues', 'שמפו': 'Shampoo', 'סבון ידיים': 'Hand soap', 'משחת שיניים': 'Toothpaste', 'דאודורנט': 'Deodorant', 'מגבונים': 'Wet wipes',
    'אוכל לכלב': 'Dog food', 'אוכל לחתול': 'Cat food', 'חול לחתול': 'Cat litter',
    // chore templates
    'שטיפת כלים / ריקון מדיח': 'Wash dishes / empty dishwasher', 'ניגוב משטחי המטבח': 'Wipe kitchen counters', 'הוצאת הזבל': 'Take out the trash',
    'הכנת ארוחת ערב': 'Make dinner', 'ניקוי כיריים ותנור': 'Clean stove and oven', 'ניקוי המקרר': 'Clean the fridge', 'שאיבת אבק': 'Vacuum',
    'שטיפת רצפה': 'Mop the floor', 'ניגוב אבק': 'Dust', 'סידור הסלון': 'Tidy the living room', 'ניקוי חלונות': 'Clean the windows',
    'ניקוי אמבטיה ומקלחת': 'Clean bath and shower', 'ניקוי שירותים': 'Clean the toilet', 'ניקוי כיור ומראה': 'Clean sink and mirror', 'החלפת מגבות': 'Change towels',
    'הפעלת מכונת כביסה': 'Run the washing machine', 'תליית כביסה': 'Hang the laundry', 'קיפול וסידור כביסה': 'Fold and put away laundry', 'גיהוץ': 'Ironing',
    'סידור המיטה': 'Make the bed', 'החלפת מצעים': 'Change the sheets', 'סידור החדר': 'Tidy the room', 'השקיית צמחים': 'Water the plants', 'טאטוא המרפסת': 'Sweep the balcony',
    'האכלת חיית המחמד': 'Feed the pet', 'טיול עם הכלב': 'Walk the dog', 'ניקוי ארגז החול': 'Clean the litter box', 'קניות שבועיות': 'Weekly shopping',
    'תשלום חשבונות': 'Pay the bills', 'ניקוי פילטר המזגן': 'Clean the AC filter',
    // homes
    'הבית שלנו': 'Our home', '😕 הבית הזה לא נמצא במכשיר': '😕 This home is not on this device', '🏡 עברת ל': '🏡 Switched to ', '🏘️ הבתים שלי': '🏘️ My homes',
    'אפשר לנהל כמה בתים מאותו מכשיר: הבית של ההורים, דירת שותפים, הבית של סבתא... לחיצה על בית עוברת אליו.': 'You can manage several homes on one device: your parents\' place, a shared flat, grandma\'s house... Tap a home to switch to it.',
    'הבית הפעיל עכשיו ·': 'Active home ·', 'בני בית': 'members', '· קוד': '· code', 'פתיחת בית נוסף': 'Open another home', 'בית חדש עם משימות ורשימת קניות משלו': 'A new home with its own chores and shopping list',
    'הצטרפות לבית נוסף בקוד': 'Join another home with a code', 'קיבלת קוד מבית אחר? מכאן נכנסים': 'Got a code from another home? Join here',
    'מקומי': 'Local', 'מסנכרן': 'Syncing', 'מסונכרן': 'Synced', 'אין חיבור': 'Offline', 'עוד': 'More', 'גלילה ימינה': 'Scroll back', 'גלילה שמאלה': 'Scroll forward',
    'מי שפנוי': 'Whoever is free', 'בחירת אימוג׳י': 'Pick an emoji', 'כל יום': 'Every day', 'כל חודש': 'Every month', 'כל שבוע': 'Every week', 'כל': 'Every',
    'ביטול ↩️': 'Undo ↩️', 'הוספה מהירה': 'Quick add', 'משימה חדשה': 'New task', 'הוספת בן או בת בית': 'Add a member', 'הוספה': 'Add', 'בן/בת בית': 'Member',
    '🛒 הרשימה של': '🛒 Shopping list of', 'משימות להיום': 'tasks for today', 'פריטים לקנייה': 'items to buy',
    // home view
    'לילה טוב': 'Good night', 'בוקר טוב': 'Good morning', 'צהריים טובים': 'Good afternoon', 'ערב טוב': 'Good evening',
    'בית מסודר מתחיל במשימה אחת קטנה ✨': 'A tidy home starts with one small task ✨', 'ביחד זה הרבה יותר כיף 💜': 'Together it\'s way more fun 💜',
    'כל וי קטן הוא ניצחון גדול 🏆': 'Every small check is a big win 🏆', 'מוזיקה טובה ויאללה, מתחילים 🎶': 'Good music and off we go 🎶', 'היום הוא יום מצוין לבית נקי 🌈': 'Today is a great day for a clean home 🌈',
    'התקדמות היום:': 'Today\'s progress:', 'אחוז. מעבר למשימות': 'percent. Go to tasks', 'מתוך': 'of', 'אין משימות להיום 🎉': 'No tasks for today 🎉',
    'פריט ברשימה': 'item on the list', 'פריטים ברשימה': 'items on the list', 'הנקודות שלי השבוע': 'My points this week', '📌 מחכה לי היום': '📌 Waiting for me today',
    'לכל המשימות ←': 'All tasks →', 'אין משימות שמחכות לך היום. איזה כיף!': 'Nothing is waiting for you today. Nice!', '🏆 אלופי השבוע': '🏆 Champions of the week',
    'מתאפס כל יום ראשון': 'Resets every Sunday', 'נקודות. עריכה': 'points. Edit', '⚡ מה קרה לאחרונה': '⚡ Recent activity', 'מישהו': 'Someone',
    'עוד לא סומנו משימות. הראשון/ה שמסמנים מקבלים קונפטי!': 'No tasks checked yet. The first one gets confetti!',
    // tasks view
    '🧹 משימות הבית': '🧹 Household chores', 'החדרים': 'Rooms', 'רעיונות': 'Ideas', '🏷️ כדי לתייג מי עושה משימה, לוחצים על הכפתור': '🏷️ To tag who does a task, tap the',
    'תיוג': 'Tag', 'שבצד של המשימה': 'button next to it', '⏰ באיחור': '⏰ Overdue', '☀️ היום': '☀️ Today', '🌙 מחר': '🌙 Tomorrow', '📅 בהמשך': '📅 Later',
    '🗂️ בלי תאריך': '🗂️ No date', '📅 השבוע': '📅 This week', '🙋 שלי': '🙋 Mine', '🏠 הכל': '🏠 All', '🏠 לפי חדר': '🏠 By room', '✏️ עריכת החדרים': '✏️ Edit rooms',
    'כל החדרים': 'All rooms', 'אין כאן משימות. אפשר להחליף מסנן או פשוט לנוח!': 'No tasks here. Try another filter or just relax!',
    'עוד אין משימות. אפשר להוסיף עם הכפתור ➕ או לבחור מתוך הרעיונות 💡': 'No tasks yet. Add one with ➕ or pick from the ideas 💡',
    '🙈 הסתרת': '🙈 Hide', '✅ הצגת': '✅ Show', 'משימות שהושלמו (': 'completed tasks (', 'החזרה לרשימה': 'Back to the list', 'סימון כבוצע': 'Mark as done', 'עריכה:': 'Edit:',
    '✅ הושלם': '✅ Done', '🔄 תורנות': '🔄 Rotation', 'תיוג מי עושה את המשימה. כרגע:': 'Tag who does the task. Now:', 'תיוג מי עושה': 'Tag who does it',
    'משימות בחדר': 'tasks in the room', '⚙️ ניהול החדר': '⚙️ Manage room', '➕ משימה': '➕ Task', '✅ בוצע על ידי': '✅ Done by', '🔄 התור של': '🔄 Turn:',
    'עושה את זה': 'is on it', '👐 מי שפנוי': '👐 Whoever is free', '· בפעם הקודמת:': '· Last time:', 'חזרה לרשימה': 'back to the list',
    '🎉 כל משימות היום הושלמו! אתם אלופים': '🎉 All of today\'s tasks are done! You rock', 'כל הכבוד! +': 'Well done! +', 'נקודות': 'points', '· הפעם הבאה:': '· Next time:',
    '✏️ עריכת משימה': '✏️ Edit task', '✨ משימה חדשה': '✨ New task', 'מה צריך לעשות?': 'What needs doing?', 'למשל: לתלות כביסה': 'e.g. hang the laundry',
    'איפה בבית?': 'Where in the home?', '🏠 הוספה או עריכה של חדרים': '🏠 Add or edit rooms', '👤 מי עושה את המשימה?': '👤 Who does it?', 'כל כמה זמן?': 'How often?',
    'פעם אחת': 'Once', 'כל כמה ימים': 'Every few days', 'אפשר לבחור כמה ימים': 'You can pick several days', 'מספר ימים': 'Number of days',
    '📅 מתי בפעם הקרובה?': '📅 When is the next time?', 'כמה מאמץ? (נקודות)': 'How much effort? (points)', '🪶 קל · 5': '🪶 Easy · 5', '💪 בינוני · 10': '💪 Medium · 10', '🔥 קשה · 20': '🔥 Hard · 20',
    '📝 הערות': '📝 Notes', 'למשל: להשתמש בנוזל הסגול': 'e.g. use the purple cleaner', '💾 שמירה': '💾 Save', '🗑️ מחיקה': '🗑️ Delete',
    'צריך לכתוב מה המשימה 🙂': 'Please write what the task is 🙂', '✅ המשימה עודכנה': '✅ Task updated', 'המשימה נוספה': 'Task added', '💡 רעיונות למשימות': '💡 Task ideas',
    'לוחצים על משימה כדי להוסיף אותה לבית. אפשר לערוך אותה אחר כך.': 'Tap a task to add it to your home. You can edit it later.',
    // shop
    '🛒 רשימת קניות': '🛒 Shopping list', '💡 מומלצים': '💡 Suggested', 'שליחת הרשימה': 'Send the list', 'שליחה': 'Send', 'מה צריך לקנות?': 'What do we need?', 'מה צריך לקנות? 🥑': 'What do we need? 🥑',
    'הוספה בקול': 'Add by voice', 'הוספה מתמונה, מסמך או טקסט': 'Add from a photo, document or text', 'כמות': 'Quantity', 'הפחתת כמות': 'Less', 'הוספת כמות': 'More', 'הוספה לרשימה': 'Add to the list',
    '📸 רשימה מתמונה או כתב יד': '📸 List from a photo or handwriting', '📄 ממסמך': '📄 From a document', '✍️ הדבקת טקסט': '✍️ Paste text', '🖼️ פריט עם תמונה': '🖼️ Item with a photo',
    '🗂️ מחלקה:': '🗂️ Aisle:', '🪄 אוטומטית': '🪄 Automatic', 'פריטים נוספו לרשימה': 'items added to the list', '⚡ קונים הרבה:': '⚡ Often bought:', 'התקדמות הקנייה': 'Shopping progress', 'בעגלה': 'in the cart',
    'הכל בעגלה! אפשר לנקות את מה שנקנה.': 'Everything is in the cart! You can clear what was bought.',
    'הרשימה ריקה. כל בני הבית יכולים להוסיף כאן מה שצריך, וזה מתעדכן אצל כולם.': 'The list is empty. Everyone at home can add what\'s needed here, and it updates for everyone.',
    'טיפ: אפשר להוסיף כמה פריטים בבת אחת עם פסיקים, למשל: חלב, ביצים, לחם': 'Tip: add several items at once with commas, e.g. milk, eggs, bread',
    '💡 לרשימת הקניות המומלצת': '💡 Suggested shopping list', '✅ בעגלה (': '✅ In the cart (', '🧹 ניקוי מה שנקנה': '🧹 Clear bought items', 'סימון שנקנה': 'Mark as bought',
    'הגדלת התמונה של': 'Enlarge the photo of', 'נוסף על ידי': 'Added by', 'נוסף על ידי 🔗': 'Added by 🔗', 'נוסף לרשימה': 'added to the list', 'כבר ברשימה, הכמות עודכנה': 'is already on the list, quantity updated',
    'אורח/ת': 'Guest', '💡 רשימת קניות מומלצת': '💡 Suggested shopping list', 'בוחרים מחלקה ולוחצים על מה שצריך. לחיצה נוספת מורידה מהרשימה.': 'Pick an aisle and tap what you need. Tap again to remove it.',
    'מחלקות': 'Aisles', '➕ להוסיף הכל (': '➕ Add all (', '✓ הכל ברשימה': '✓ All on the list', '✅ סיימתי': '✅ Done', 'הוסר מהרשימה': 'removed from the list', 'התמונה של': 'Photo of',
    '👍 סגירה': '👍 Close', '✏️ עריכה': '✏️ Edit', '👤 מי עושה את': '👤 Who does', 'מתייגים בן או בת בית, והמשימה תופיע אצלם תחת': 'Tag a member and the task will show up for them under',
    'שלי': 'Mine', '(אני)': '(me)', 'תורנות, עובר לבא בתור': 'Rotation, passes to the next one', 'בן/בת בית חדש/ה': 'New member', 'להוסיף ולתייג מיד': 'Add and tag right away',
    // rooms sheet
    '🏠 החדרים בבית': '🏠 Rooms in the home',
    'מגדירים את הבית לפי מה שיש בו באמת. לוחצים על חדר כדי לראות ולערוך את המשימות שבו, ועל ✏️ כדי לשנות שם, אימוג׳י או להסיר.': 'Set up the home the way it really is. Tap a room to see and edit its tasks, and ✏️ to rename it, change the emoji or remove it.',
    'פתיחת': 'Open', ': משימות ועריכה': ': tasks and editing', 'משימות · לחיצה לניהול': 'tasks · tap to manage', 'אין משימות עדיין · לחיצה להוספה': 'No tasks yet · tap to add',
    'משימה חדשה ב': 'New task in ', 'עריכת': 'Edit', '➕ חדר או מקום חדש': '➕ New room or place', '✨ הוספה מהירה, עם משימות מוצעות': '✨ Quick add, with suggested tasks',
    '↩️ חדרים שהוסרו': '↩️ Removed rooms', '✏️ שם ואימוג׳י': '✏️ Name and emoji', '➕ משימה חדשה בחדר': '➕ New task in this room', '👀 להציג רק את החדר': '👀 Show only this room',
    '📋 המשימות בחדר': '📋 Tasks in this room', 'תיוג מי עושה:': 'Tag who does:', 'עריכה': 'Edit', 'מחיקה:': 'Delete:', 'מחיקה': 'Delete',
    '🪴 עוד אין משימות בחדר הזה. אפשר להוסיף משימה משלכם או לבחור מהרעיונות למטה.': '🪴 No tasks in this room yet. Add your own or pick from the ideas below.',
    '💡 רעיונות לחדר': '💡 Ideas for this room', '↩️ לכל החדרים': '↩️ All rooms', 'סגירה': 'Close', '✏️ עריכת חדר': '✏️ Edit room', 'שם': 'Name',
    'למשל: גינה, חדר של יואב, רכב': 'e.g. garden, Yoav\'s room, car', 'אימוג׳י': 'Emoji', '🗑️ הסרה': '🗑️ Remove', 'משימות יעברו ל': 'tasks will move to ', '↩️ חזרה': '↩️ Back',
    'צריך לתת שם 🙂': 'Please give it a name 🙂', 'החדר עודכן': 'Room updated', 'נוסף לבית': 'added to the home',
    // list link
    '🔗 קישור לרשימה בלבד': '🔗 Link to the list only',
    '🔒 כדי לשתף קישור צריך שהבית יהיה מחובר לענן (Supabase). במצב מקומי אפשר לשלוח את הרשימה כטקסט.': '🔒 Sharing a link needs the home to be connected to the cloud (Supabase). In local mode you can send the list as text.',
    '🔗 יוצרים קישור...': '🔗 Creating a link...', '😕 צריך עדכון קטן ב־Supabase': '😕 Supabase needs a small update',
    'כדי שקישור לרשימה בלבד יעבוד, צריך להריץ פעם אחת את החלק החדש בסוף הקובץ': 'For a list-only link to work, run the new part at the end of the file once',
    '(ב־Supabase ← SQL Editor ← Run).': '(in Supabase → SQL Editor → Run).', '📄 לקובץ ב־GitHub': '📄 File on GitHub', '😕 לא הצלחתי ליצור קישור, כדאי לנסות שוב': '😕 Couldn\'t create a link, please try again',
    '🛒 רשימת הקניות של': '🛒 The shopping list of', '🔗 הקישור לרשימה מוכן!': '🔗 The list link is ready!',
    'מי שפותח אותו רואה רק את רשימת הקניות ויכול להוסיף ולסמן. כל שינוי מגיע לכולם.': 'Whoever opens it sees only the shopping list and can add and check items. Every change reaches everyone.',
    '💬 שליחה בוואטסאפ': '💬 Send on WhatsApp', '📋 העתקת הקישור': '📋 Copy the link', '📲 שיתוף לאפליקציה אחרת': '📲 Share to another app', '⛔ ביטול הקישור': '⛔ Revoke the link',
    '📋 הקישור הועתק': '📋 Link copied', '⛔ כל הקישורים לרשימה בוטלו. מי שקיבל אותם כבר לא יכול להיכנס': '⛔ All list links were revoked. People who got them can no longer get in',
    '😕 לא הצלחתי לבטל. כדאי לבדוק חיבור לאינטרנט': '😕 Couldn\'t revoke. Please check your internet connection', '🔗 הקישור לא פעיל': '🔗 This link is not active',
    'יכול להיות שהקישור בוטל או שהוקלד לא נכון. אפשר לבקש מבני הבית קישור חדש.': 'The link may have been revoked or mistyped. Ask your family for a new one.',
    '🏡 לדף הבית של Nestly': '🏡 Nestly home page', 'רשימת קניות משותפת': 'Shared shopping list', '👋 ברוכים הבאים לרשימה!': '👋 Welcome to the list!', 'זו רשימת הקניות של': 'This is the shopping list of',
    '. איך לרשום את מה שתוסיפו?': '. What name should we show on what you add?', 'או בשם אחר:': 'Or another name:', 'השם שלך': 'Your name', 'למשל: סבתא רותי': 'e.g. Grandma Ruth', '✨ יאללה': '✨ Let\'s go', '👋 היי': '👋 Hi',
    // legal
    '♿ הצהרת נגישות': '♿ Accessibility statement',
    'אנחנו רואים חשיבות רבה במתן שירות שוויוני לכל המשתמשים, ומשקיעים כדי ש־Nestly יהיה נוח ונגיש גם לאנשים עם מוגבלות.': 'We care about giving everyone an equal experience, and we work to make Nestly comfortable and accessible for people with disabilities too.',
    'רמת הנגישות': 'Accessibility level', 'האתר הונגש בהתאם לתקן הישראלי ת': 'The site follows Israeli Standard', 'י 5568 ולהנחיות WCAG 2.1 ברמה AA, ככל שהדבר אפשרי.': 'IS 5568 and WCAG 2.1 level AA, as far as possible.',
    'מה עשינו באתר': 'What we did',
    'כפתור נגישות שאפשר להזיז לכל מקום במסך: הגדלת טקסט, ניגודיות גבוהה, גופן קריא, הדגשת קישורים, סמן גדול, גווני אפור ועצירת אנימציות': 'An accessibility button you can move anywhere: bigger text, high contrast, readable font, highlighted links, big cursor, grayscale and stop animations',
    'מצב כהה ותמיכה בהגדרת': 'Dark mode and support for the', 'הפחתת תנועה': 'reduce motion', 'של המכשיר': 'setting of your device', 'ניווט מלא במקלדת, קישור': 'Full keyboard navigation, a', 'דילוג לתוכן': 'skip to content', 'ומיקוד ברור': 'link and clear focus',
    'תוויות ותיאורים לקוראי מסך, הודעות חיות על פעולות והתראות': 'Labels and descriptions for screen readers, live messages for actions and alerts', 'ניגודיות צבעים מספקת, כפתורים גדולים ונוחים ללחיצה': 'Good color contrast, big easy to tap buttons',
    'אפשרות לבטל כמעט כל פעולה, כדי שטעות לא תעלה ביוקר': 'Almost every action can be undone, so a mistake won\'t cost you', 'האתר עובד בעברית מימין לשמאל ומותאם לטלפון, טאבלט ומחשב': 'The site works in Hebrew and English and fits phones, tablets and computers',
    'מגבלות ידועות': 'Known limitations', 'תמונות של מוצרים שמעלים בני הבית לא תמיד כוללות תיאור מלא': 'Product photos uploaded by members don\'t always have a full description',
    'קוד ה־QR מיוצר על ידי ספרייה חיצונית. לצידו תמיד יש גם קוד וקישור להעתקה': 'The QR code comes from an external library. A code and link to copy are always next to it', 'מראה האימוג׳י תלוי במכשיר': 'Emoji look depends on the device',
    'נתקלתם בבעיה?': 'Found a problem?', 'אם משהו לא נגיש או לא עובד כמו שצריך, נשמח לשמוע ולתקן. כדאי לציין באיזה עמוד, מה ניסיתם לעשות ובאיזה מכשיר ודפדפן.': 'If something isn\'t accessible or doesn\'t work right, we\'d love to hear and fix it. Please say which page, what you tried and which device and browser.',
    'רכזת הנגישות:': 'Accessibility coordinator:', 'נויה אדיבי': 'Noya Adivi', 'ההצהרה עודכנה בתאריך': 'Statement updated on',
    '🔒 מדיניות פרטיות': '🔒 Privacy policy', 'Nestly נבנה כך שיאסוף כמה שפחות מידע, ורק את מה שצריך כדי שהבית יעבוד.': 'Nestly is built to collect as little as possible, only what the home needs to work.',
    'איזה מידע נשמר': 'What is saved', 'שם הבית, שמות ודמויות של בני הבית': 'The home name, names and avatars of members', 'המשימות, רשימת הקניות, הערות ותמונות מוצרים שהעליתם': 'Tasks, the shopping list, notes and product photos you uploaded',
    'היסטוריית נקודות ומשימות שבוצעו': 'History of points and completed tasks', 'אין צורך בהרשמה, באימייל או בטלפון, ואנחנו לא מבקשים מידע מזהה.': 'No sign up, email or phone needed, and we never ask for identifying details.',
    'איפה המידע נשמר': 'Where it is saved', 'המידע נשמר במכשיר שלכם, ואם הבית מחובר לענן, גם במסד נתונים של Supabase. הגישה אליו אפשרית רק עם קוד הבית, וכל החוקים נאכפים בצד השרת.': 'Data is saved on your device, and if the home is connected to the cloud, also in a Supabase database. It can only be reached with the home code, and all rules are enforced on the server.',
    'מה אנחנו לא עושים': 'What we don\'t do', 'לא מוכרים ולא משתפים מידע עם אף אחד': 'We never sell or share data with anyone', 'אין פרסומות ואין כלי מעקב או אנליטיקה': 'No ads, no trackers, no analytics',
    'אין עוגיות מעקב. האתר שומר רק העדפות כמו מצב כהה והגדרות נגישות': 'No tracking cookies. The site only saves preferences like dark mode, language and accessibility settings', 'שירותים חיצוניים': 'External services',
    'הגופנים נטענים מ־Google Fonts, וספריות ה־QR, זיהוי הכתב וקריאת המסמכים נטענות מ־jsDelivr. שירותים אלה מקבלים את כתובת ה־IP שלכם כמו בכל אתר.': 'Fonts load from Google Fonts, and the QR, handwriting and document libraries load from jsDelivr. These services see your IP address like on any site.',
    'תמונות ומסמכים': 'Photos and documents', 'כשמעלים תמונה או מסמך כדי להוסיף רשימה, הזיהוי נעשה בתוך הדפדפן שלכם. הקובץ עצמו לא נשלח לשום שרת ולא נשמר, רק הפריטים שאישרתם.': 'When you upload a photo or document to add a list, recognition happens inside your browser. The file itself is never sent or saved, only the items you approved.',
    'מחיקת מידע': 'Deleting data', 'אפשר למחוק פריטים ומשימות בכל רגע, להוריד גיבוי מלא, או לצאת מהבית במכשיר דרך ההגדרות. למחיקת בית שלם מהענן אפשר לפנות אלינו.': 'You can delete items and tasks any time, download a full backup, or leave the home on this device from the settings. To delete a whole home from the cloud, contact us.',
    'עודכן בתאריך': 'Updated on', '📜 תנאי שימוש': '📜 Terms of use', 'ברוכים הבאים ל־Nestly. השימוש באתר מהווה הסכמה לתנאים הבאים.': 'Welcome to Nestly. Using the site means you agree to these terms.',
    'מה זה Nestly': 'What is Nestly', 'אתר חינמי לניהול משימות הבית ורשימת קניות משותפת. זהו פרויקט אישי בקוד פתוח, ואין בו תשלומים.': 'A free site for household chores and a shared shopping list. It\'s a personal open source project with no payments.',
    'שימוש הוגן': 'Fair use', 'משתמשים באתר לצרכים אישיים ומשפחתיים': 'Use the site for personal and family needs', 'לא מעלים תוכן פוגעני, לא חוקי או מידע רגיש (כמו מספרי אשראי או סיסמאות)': 'Don\'t upload offensive or illegal content or sensitive data (like card numbers or passwords)',
    'שומרים את קוד הבית רק בין בני הבית': 'Keep the home code between members only', 'אחריות': 'Liability',
    'האתר ניתן כמו שהוא (AS IS). אנחנו עושים כמיטב יכולתנו שיעבוד תמיד, אבל לא ניתן להבטיח שלא יהיו תקלות או אובדן מידע. מומלץ להוריד גיבוי מדי פעם.': 'The site is provided AS IS. We do our best to keep it working, but can\'t promise there will never be bugs or data loss. Download a backup now and then.',
    'קוד פתוח': 'Open source', 'קוד המקור זמין ב־': 'The source code is on', 'שינויים': 'Changes', 'התנאים עשויים להתעדכן מעת לעת. התאריך למטה מראה מתי עודכנו לאחרונה.': 'These terms may change from time to time. The date below shows the last update.',
    '✉️ יצירת קשר': '✉️ Contact', 'יש שאלה, רעיון לשיפור או משהו שלא עובד? נשמח לשמוע!': 'A question, an idea or something not working? We\'d love to hear!', 'אפשר גם לקרוא את': 'You can also read the',
    '❓ השאלות הנפוצות': '❓ FAQ', '🐞 דיווח על בעיה ב־GitHub': '🐞 Report a bug on GitHub', '💼 הודעה בלינקדאין': '💼 Message on LinkedIn', 'עמודי מידע': 'Info pages', '👍 הבנתי': '👍 Got it',
    // import
    '✍️ הדבקת רשימה': '✍️ Paste a list', 'כותבים או מדביקים רשימה, למשל מוואטסאפ. כל שורה או פסיק הם פריט.': 'Type or paste a list, for example from WhatsApp. Every line or comma is an item.',
    'הרשימה': 'The list', '👀 המשך לבדיקה': '👀 Review', '🤔 לא מצאתי פריטים בטקסט': '🤔 No items found in the text', 'טקסט': 'Text',
    '➕ מה רוצים להוסיף?': '➕ What would you like to add?', 'אפשר להוסיף פריט אחד בשורה למעלה, או רשימה שלמה בבת אחת:': 'Add one item in the row above, or a whole list at once:',
    'תמונה או כתב יד': 'Photo or handwriting', 'מצלמים רשימה על פתק או מעלים צילום מסך': 'Snap a note or upload a screenshot', 'מסמך': 'Document', 'PDF, Word או קובץ טקסט': 'PDF, Word or a text file',
    'מדביקים רשימה מוואטסאפ או מהפתקים': 'Paste a list from WhatsApp or your notes', 'פריט עם תמונה': 'Item with a photo', 'כדי שכולם יידעו בדיוק מה לקנות': 'So everyone knows exactly what to buy',
    'רשימה מומלצת': 'Suggested list', 'בוחרים לפי מחלקות בסופר': 'Pick by supermarket aisle', 'פריט אחד': 'One item', 'כותבים בשורה למעלה ולוחצים ➕': 'Type in the row above and tap ➕',
    '😕 לא הצלחתי לקרוא את התמונה': '😕 Couldn\'t read the photo', 'התמונה שנבחרה': 'The selected photo', 'מה זה?': 'What is it?', 'למשל: שמפו של יעל': 'e.g. Yael\'s shampoo',
    '➕ הוספה לרשימה': '➕ Add to the list', '🔁 תמונה אחרת': '🔁 Another photo', 'נוסף עם תמונה': 'added with a photo', '🔎 קוראים את הרשימה...': '🔎 Reading the list...',
    'בפעם הראשונה זה לוקח קצת יותר זמן. הכל נעשה בדפדפן שלכם.': 'The first time takes a bit longer. Everything happens in your browser.', '✍️ מזהים את הכתב...': '✍️ Recognizing the writing...',
    '⬇️ טוענים את כלי הזיהוי...': '⬇️ Loading the recognition tool...', '📂 פותחים את הקובץ...': '📂 Opening the file...', '📄 קוראים את המסמך...': '📄 Reading the document...', '📄 קוראים את ה־PDF...': '📄 Reading the PDF...',
    '🤔 לא מצאתי פריטים': '🤔 No items found', 'לא הצלחתי לקרוא פריטים מהקובץ. כדאי לנסות תמונה חדה יותר, באור טוב, עם כתב ברור ושורה לכל פריט.': 'Couldn\'t read items from the file. Try a sharper photo in good light, with clear writing and one line per item.',
    '📸 לנסות תמונה אחרת': '📸 Try another photo', '✍️ להקליד במקום': '✍️ Type instead', 'תמונה': 'Photo', '😕 משהו לא הסתדר': '😕 Something went wrong',
    'אפשר להעלות תמונה, PDF, Word (docx) או קובץ טקסט.': 'You can upload a photo, PDF, Word (docx) or a text file.', 'לא הצלחתי לקרוא את הקובץ. לזיהוי צריך חיבור לאינטרנט בפעם הראשונה.': 'Couldn\'t read the file. Recognition needs internet the first time.',
    '👀 זה מה שמצאתי': '👀 Here\'s what I found', 'מצאתי': 'Found', 'פריטים בתמונה': 'items in the photo', 'פריטים במסמך': 'items in the document', 'פריטים בטקסט': 'items in the text', 'פריטים ב': 'items in ',
    '. אפשר לתקן שמות, לשנות כמות או להוריד סימון לפני ההוספה.': '. You can fix names, change amounts or uncheck items before adding.', 'להוסיף את': 'Add', 'שם הפריט': 'Item name', '➕ להוסיף': '➕ Add',
    'פריטים': 'items', 'לא נבחרו פריטים': 'No items selected', '✏️ עריכת פריט': '✏️ Edit item', 'קטגוריה': 'Category', 'הערה': 'Note', 'למשל: 3% שומן, המותג הכחול': 'e.g. 3% fat, the blue brand',
    '📷 תמונה של המוצר': '📷 Product photo', 'החלפת תמונה': 'Replace photo', 'הוספת תמונה': 'Add a photo', 'כדי שכולם יידעו בדיוק איזה מוצר לקנות': 'So everyone knows exactly which product to buy',
    'תמונה חדשה': 'New photo', '✅ הפריט עודכן': '✅ Item updated', '🧺 הרשימה ריקה כרגע': '🧺 The list is empty right now', '🛒 רשימת קניות:': '🛒 Shopping list:',
    '📤 שיתוף רשימת הקניות': '📤 Share the shopping list', '🔗 קישור לרשימת הקניות בלבד': '🔗 Link to the shopping list only',
    'מי שמקבל אותו רואה ויכול להוסיף ולסמן רק ברשימת הקניות. בלי המשימות, בלי ההגדרות ובלי קוד הבית. מתאים לסבתא, לבייביסיטר או לשותפים.': 'Whoever gets it can only see, add and check the shopping list. No tasks, no settings and no home code. Great for grandma, the babysitter or flatmates.',
    '🔗 יצירת קישור לרשימה': '🔗 Create a list link', '⛔ ביטול כל הקישורים': '⛔ Revoke all links', '📝 שליחה כטקסט': '📝 Send as text', 'פריטים, מסודרים לפי מחלקות בסופר.': 'items, sorted by supermarket aisle.',
    '📋 העתקה כטקסט': '📋 Copy as text', '📋 הרשימה הועתקה': '📋 List copied', 'מקשיב... לחיצה לעצירה': 'Listening... tap to stop',
    '🎤 לא הצלחתי לשמוע. כדאי לבדוק הרשאת מיקרופון': '🎤 Couldn\'t hear you. Please check microphone permission', '🎤 מקשיב... אפשר לומר כמה פריטים': '🎤 Listening... you can say several items',
    // family
    'הבתים שלי (': 'My homes (', 'בית נוסף': 'Another home', '✏️ שינוי שם': '✏️ Rename', '💌 מזמינים את בני הבית': '💌 Invite your family', 'שולחים קישור או קוד, וכל אחד מצטרף מהטלפון שלו': 'Send a link or code, and everyone joins from their own phone',
    'קוד הבית:': 'Home code:', '📋 העתקת קוד': '📋 Copy code', '🔗 העתקת קישור': '🔗 Copy link', '💬 וואטסאפ': '💬 WhatsApp', 'קוד QR להצטרפות': 'QR code to join', '💌 הזמנת בני הבית': '💌 Invite your family',
    '🔒 כרגע האפליקציה שומרת הכל רק במכשיר הזה. כדי שכל בני הבית יוכלו להצטרף בקישור או בקוד ולראות את אותה רשימה, צריך לחבר את Supabase פעם אחת (לפי ההוראות ב-README). עד אז אפשר להוסיף את בני הבית ידנית ולנהל הכל מכאן.': '🔒 Right now the app saves everything on this device only. So everyone can join with a link or code and see the same list, connect Supabase once (see the README). Until then you can add members by hand and manage everything here.',
    '👪 בני הבית (': '👪 Members (', '➕ הוספה': '➕ Add', 'אני': 'me', 'השבוע · ✅': 'this week · ✅', 'משימות בסך הכל': 'tasks in total', '⚙️ הגדרות': '⚙️ Settings', 'הבתים שלי': 'My homes',
    'בתים במכשיר הזה · מעבר בין בתים': 'homes on this device · switch between them', 'פתיחה או הצטרפות לבית נוסף': 'Open or join another home', 'מי אני במכשיר הזה?': 'Who am I on this device?', 'כרגע:': 'Now:', 'לא נבחר': 'Not chosen',
    'נגישות': 'Accessibility', 'גודל טקסט, ניגודיות, גופן קריא, עצירת אנימציות': 'Text size, contrast, readable font, stop animations', 'מצב כהה / בהיר': 'Dark / light mode', 'החלפת צבעי התצוגה': 'Switch the display colors',
    'החדרים בבית': 'Rooms in the home', 'גינה, רכב, חדר ילדים... מגדירים את הבית לפי מה שיש': 'Garden, car, kids room... set up your home the way it is', 'רעיונות למשימות': 'Task ideas', 'חבילת משימות מוכנות לפי חדרים': 'Ready-made tasks by room',
    'הורדת גיבוי': 'Download a backup', 'קובץ JSON עם כל הנתונים של הבית': 'A JSON file with all the home\'s data', 'יציאה מהבית במכשיר הזה': 'Leave this home on this device', 'הנתונים נשארים אצל שאר בני הבית': 'The data stays with the other members',
    'שימו לב: במצב מקומי הנתונים של הבית הזה יימחקו': 'Note: in local mode this home\'s data will be deleted', '✏️ עריכת בן/בת בית': '✏️ Edit member', '🙋 נעים להכיר!': '🙋 Nice to meet you!', '➕ בן/בת בית חדש/ה': '➕ New member',
    'למשל: אמא, יואב': 'e.g. Mom, Yoav', 'הדמות שלי': 'My avatar', 'צבע': 'Color', 'סגול': 'Purple', 'מנטה': 'Mint', 'אפרסק': 'Peach', 'ורוד': 'Pink', 'תכלת': 'Light blue', 'צהוב': 'Yellow',
    'צריך לכתוב שם 🙂': 'Please write a name 🙂', '✅ נשמר': '✅ Saved', 'הצטרפ/ה לבית': 'joined the home', 'נוספ/ה לבית': 'was added to the home', '🙋 מי את/ה?': '🙋 Who are you?', 'הצטרפת לבית': 'You joined',
    'בחרו את עצמכם מהרשימה כדי שהנקודות יירשמו נכון.': 'Pick yourself from the list so points are counted right.', 'אני חדש/ה כאן': 'I\'m new here', 'יצירת דמות חדשה': 'Create a new avatar',
    '🚪 יציאה מהבית?': '🚪 Leave the home?', 'הבית ימשיך להתקיים אצל כל השאר. תמיד אפשר לחזור עם הקוד': 'The home stays for everyone else. You can always come back with the code',
    'במצב מקומי כל המשימות והרשימות במכשיר הזה יימחקו. כדאי להוריד גיבוי קודם.': 'In local mode all tasks and lists on this device will be deleted. Download a backup first.', '🏡 נשארים': '🏡 Stay', 'יציאה': 'Leave', '💾 הגיבוי ירד למכשיר': '💾 Backup downloaded',
    // onboarding
    'הבית המשותף שלכם': 'Your shared home', 'משימות שחוזרות לבד': 'Chores that repeat by themselves', 'כל יום, כל שבוע או בימים שבוחרים': 'Daily, weekly or on the days you pick', 'רשימת קניות חכמה': 'Smart shopping list',
    'מסודרת לפי מחלקות, גם בקול': 'Sorted by aisle, even by voice', 'תורנויות הוגנות': 'Fair rotations', 'התור עובר לבד לבא בתור': 'The turn passes to the next one by itself', 'נקודות ואלופי השבוע': 'Points and weekly champions',
    'קצת תחרות וקונפטי 🎉': 'A little competition and confetti 🎉', '✨ אפליקציית הבית המשותף': '✨ The shared home app', 'הבית שלכם,': 'Your home,', 'מסודר ושמח': 'tidy and happy',
    'כל משימות הבית ורשימת הקניות במקום אחד, משותף לכל בני הבית. מצטרפים בקוד או בקישור, בלי הרשמה ובלי סיסמה.': 'All the chores and the shopping list in one place, shared by everyone at home. Join with a code or a link, no sign up and no password.',
    '🏡 פתיחת בית חדש': '🏡 Open a new home', '🔑 יש לי קוד הצטרפות': '🔑 I have a join code', '🔒 מצב מקומי: הנתונים נשמרים במכשיר הזה. לשיתוף עם בני הבית צריך לחבר את Supabase לפי ה-README.': '🔒 Local mode: data is saved on this device. To share with your family, connect Supabase as the README explains.',
    '💡 איך זה עובד?': '💡 How does it work?', '🚀 שלושה צעדים וזהו': '🚀 Three steps and done', 'פותחים בית': 'Open a home', 'נותנים לו שם ובוחרים דמות': 'Name it and pick an avatar', 'מזמינים את בני הבית': 'Invite your family',
    'קיבלתם קוד? לחצו כאן להצטרפות': 'Got a code? Tap here to join', 'קוד, קישור או QR בוואטסאפ': 'Code, link or QR on WhatsApp', 'מסמנים וי ומקבלים נקודות': 'Check tasks and earn points', 'איך זה עובד? לחצו כאן': 'How does it work? Tap here',
    '💡 איך Nestly עובד?': '💡 How Nestly works', 'בית אחד לכולם': 'One home for everyone', 'פותחים בית ומשתפים את הקוד. כל מי שנכנס רואה את אותן משימות ואותה רשימה.': 'Open a home and share the code. Everyone who joins sees the same tasks and the same list.',
    'מסמנים וי': 'Check it off', 'לחיצה על העיגול מסמנת משימה כבוצעה, נותנת נקודות ומעבירה את התור.': 'Tapping the circle marks a task done, gives points and passes the turn.', 'מוסיפים לקניות': 'Add to the shopping list',
    'כותבים כמה פריטים עם פסיקים או אומרים בקול, והכל מסתדר לפי מחלקות.': 'Type several items with commas or say them out loud, and everything is sorted by aisle.', 'נגישות ומצב כהה': 'Accessibility and dark mode',
    'כפתור הירח מחליף מצב תצוגה. את כפתור הנגישות העגול אפשר לגרור לכל מקום.': 'The moon button switches the display mode. You can drag the round accessibility button anywhere.', 'יאללה, הבנתי': 'Got it, let\'s go', '❓ לשאלות נפוצות': '❓ FAQ',
    '✨ בית חדש': '✨ New home', 'איך קוראים לבית?': 'What\'s the home called?', 'למשל: הבית של משפחת לוי': 'e.g. The Levi family home', 'ואיך קוראים לך?': 'And what\'s your name?', 'בחרו דמות': 'Pick an avatar',
    '💡 להוסיף משימות בית מומלצות': '💡 Add recommended chores', 'כלים, כביסה, שאיבה, מצעים ועוד. אפשר לערוך אחר כך': 'Dishes, laundry, vacuuming, sheets and more. You can edit them later', '🏡 יצירת הבית': '🏡 Create the home',
    'צריך למלא את שם הבית ואת השם שלך 🙂': 'Please fill in the home name and your name 🙂', '⏳ רגע...': '⏳ One moment...', '😕 לא הצלחנו להתחבר לשרת. כדאי לבדוק אינטרנט ואת הגדרות Supabase ב-config.js': '😕 Couldn\'t reach the server. Check your internet and the Supabase settings in config.js',
    '🏡 הבית': '🏡 The home', 'מוכן!': 'is ready!', 'עכשיו מזמינים את בני הבית': 'Now invite your family', '🔑 הצטרפות לבית': '🔑 Join a home', 'קוד הבית (6 תווים)': 'Home code (6 characters)', '🚪 כניסה': '🚪 Join',
    'הקוד צריך להיות באורך 6 תווים': 'The code needs to be 6 characters', '⏳ מחפשים את הבית...': '⏳ Looking for the home...', '🤔 לא מצאנו בית עם הקוד הזה. כדאי לבדוק שוב': '🤔 No home with this code. Please check again',
    '😕 אין חיבור לשרת כרגע. נסו שוב עוד רגע': '😕 Can\'t reach the server right now. Try again in a moment', '➕ מה מוסיפים?': '➕ What are we adding?', 'משהו שצריך לעשות בבית': 'Something to do at home', 'פריט לקניות': 'Shopping item',
    'משהו שנגמר או שצריך': 'Something that ran out or is needed', 'משימות מוכנות לפי חדרים': 'Ready-made tasks by room', 'נמחקה': 'deleted', 'נוספה': 'added', 'הוסר': 'removed', 'פריטים נוקו': 'items cleared',
    '↩️ החדר חזר': '↩️ The room is back', 'משימות עברו לכללי': 'tasks moved to General', 'נוסף לבית!': 'was added to the home!', 'רוצים להוסיף גם משימות מוצעות? לוחצים על מה שמתאים:': 'Want some suggested tasks too? Tap what fits:',
    '👍 סיימתי': '👍 Done', '✍️ משימה משלי': '✍️ My own task', '👐 כל מי שפנוי יכול לעשות את זה': '👐 Anyone free can do it', '🔄 המשימה עברה לתורנות': '🔄 The task is now on rotation', 'מתויג/ת על': 'is tagged on',
    '📋 הקוד הועתק': '📋 Code copied', '🔗 הקישור הועתק. אפשר להדביק בוואטסאפ': '🔗 Link copied. Paste it on WhatsApp', '✏️ שם הבית': '✏️ Home name', '✅ שם הבית עודכן': '✅ Home name updated', 'הוסר/ה מהבית': 'was removed from the home',
    // page shell
    'Nestly · הבית המשותף שלנו': 'Nestly · Our shared home', 'משימות הבית ורשימת קניות משותפת לכל בני הבית': 'Household chores and a shared shopping list for everyone at home', 'דילוג לתוכן הראשי': 'Skip to main content',
    'Nestly, מעבר לדף הבית': 'Nestly, go to home', 'ניווט ראשי': 'Main navigation', 'בית': 'Home', 'משימות': 'Tasks', 'קניות': 'Shopping', 'איך זה עובד': 'How it works',
    'כדי להשתמש ב־Nestly צריך להפעיל JavaScript בדפדפן 🙂': 'Nestly needs JavaScript turned on 🙂', 'חזרה לראש העמוד': 'Back to top', 'משימות הבית ורשימת הקניות של כל הבית, במקום אחד': 'The whole home\'s chores and shopping list, in one place',
    'קישורים': 'Links', '💡 איך זה עובד': '💡 How it works', '❓ שאלות נפוצות': '❓ FAQ', 'הקוד ב־GitHub': 'Code on GitHub', '🌐 הפורטפוליו שלי': '🌐 My portfolio', 'מידע משפטי ונגישות': 'Legal and accessibility',
    'Nestly · נבנה על ידי': 'Nestly · Built by', 'שאלות נפוצות': 'FAQ', 'חזרה למעלה': 'Back to top', 'בחירת שפה': 'Choose language', 'אפשר לגרור את הכפתור לכל מקום במסך': 'You can drag this button anywhere on the screen', 'English': 'English', 'עברית': 'עברית'
  };

  const HEB = /[א-ת]/;
  const keys = Object.keys(D).filter(k => k.length > 1).sort((a, b) => b.length - a.length);
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // a phrase is only replaced as a whole word: no Hebrew letter right before or after it,
  // except phrases ending with a one-letter Hebrew prefix (ב, ל) that is glued to the next word
  const mk = list => new RegExp(list.map(k => `(?<![\\u05D0-\\u05EA])${escRe(k)}${/ [בלה]$/.test(k) ? '' : '(?![\\u05D0-\\u05EA])'}`).join('|'), 'g');
  const MULTI = mk(keys.filter(k => /\s/.test(k))), SINGLE = mk(keys.filter(k => !/\s/.test(k)));
  const KNOWN = new Set(keys.filter(k => !/\s/.test(k)).map(k => k.replace(/^[^\u05D0-\u05EA]+|[^\u05D0-\u05EA׳״]+$/g, '')));
  const WORD = /[\u05D0-\u05EA][\u05D0-\u05EA׳״'\-]*/g;

  function tx(s) {
    if (lang() !== 'en' || !s || !HEB.test(s)) return s;
    const t = s.trim();
    if (D[t] !== undefined) return s.replace(t, D[t]);
    let out = s.replace(MULTI, m => D[m]);
    // single words are translated only when every Hebrew word left is a known one,
    // so a name the family typed (like "בית לוי") is never half translated
    const rest = out.match(WORD) || [];
    if (rest.every(w => KNOWN.has(w) || KNOWN.has(w.replace(/['׳״-]+$/, '')))) out = out.replace(SINGLE, m => D[m]);
    return out.replace(/←/g, '→');
  }

  const lang = () => (root.lang || 'he').slice(0, 2) === 'en' ? 'en' : 'he';
  const orig = new WeakMap();   // text node -> original Hebrew
  const done = new WeakMap();   // text node -> last translated output
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

  function doText(n) {
    const cur = n.nodeValue;
    const src = done.get(n) === cur ? orig.get(n) : cur;   // our own output → keep the original source
    orig.set(n, src);
    const out = lang() === 'en' ? tx(src) : src;
    done.set(n, out);
    if (out !== cur) n.nodeValue = out;
  }
  function doAttrs(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const v = el.getAttribute(a), key = 'i18n' + a.replace(/-/g, '');
      const src = el.dataset[key + 'Out'] === v && el.dataset[key] !== undefined ? el.dataset[key] : v;
      el.dataset[key] = src;
      const out = lang() === 'en' ? tx(src) : src;
      el.dataset[key + 'Out'] = out;
      if (out !== v) el.setAttribute(a, out);
    }
  }
  const SKIP = 'script,style,textarea,input,[data-no-i18n]';
  function walk(node) {
    if (node.nodeType === 3) { if (!node.parentElement?.closest(SKIP)) doText(node); return; }
    if (node.nodeType !== 1 || node.matches(SKIP)) { if (node.nodeType === 1 && node.matches('input,textarea')) doAttrs(node); return; }
    doAttrs(node);
    const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: x => x.nodeType === 1 ? (x.matches('script,style,[data-no-i18n]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) : NodeFilter.FILTER_ACCEPT
    });
    let x; while ((x = w.nextNode())) { if (x.nodeType === 3) { if (!x.parentElement.closest('textarea')) doText(x); } else doAttrs(x); }
  }

  let busy = false;
  const mo = new MutationObserver(list => {
    if (busy) return; busy = true;
    for (const m of list) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
    mo.takeRecords(); busy = false;
  });

  const TITLE = { he: document.title, en: 'Nestly · Our shared home' };
  function apply(l, first) {
    root.lang = l; root.dir = l === 'en' ? 'ltr' : 'rtl';
    document.title = TITLE[l];
    const m = document.querySelector('meta[name="description"]'); if (m) { m.dataset.he ??= m.content; m.content = l === 'en' ? 'Nestly: household chores and a shared shopping list for the whole family, with a join code, rotations, points and animations.' : m.dataset.he; }
    try { localStorage.setItem(LS, l); } catch { }
    busy = true; walk(document.body); mo.takeRecords(); busy = false;
    document.querySelectorAll('[data-lang-btn]').forEach(b => {
      b.querySelector('b').textContent = l === 'en' ? 'עב' : 'EN';
      b.setAttribute('aria-label', l === 'en' ? 'מעבר לעברית' : 'Switch to English');
      b.setAttribute('lang', l === 'en' ? 'he' : 'en');
    });
    if (!first) dispatchEvent(new CustomEvent('nestly:lang', { detail: l }));
  }
  window.NestlyI18n = { tx, lang, set: l => apply(l), toggle: () => apply(lang() === 'en' ? 'he' : 'en') };
  window.tx = tx;

  const boot = () => {
    apply(lang(), true);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    document.addEventListener('click', e => { if (e.target.closest('[data-lang-btn]')) window.NestlyI18n.toggle(); });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
