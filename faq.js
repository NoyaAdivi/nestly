window.NOYA_FAQ = {
  title: { he: 'יש שאלה על Nestly? יש תשובה', en: 'Questions about Nestly? Answered' },
  topics: [
    { id: 'start', icon: '🏡', he: 'התחלה', en: 'Getting started' },
    { id: 'tasks', icon: '🧹', he: 'משימות', en: 'Chores' },
    { id: 'shop', icon: '🛒', he: 'קניות', en: 'Shopping' },
    { id: 'data', icon: '🔒', he: 'נתונים ופרטיות', en: 'Data & privacy' }
  ],
  items: [
    { t: 'start', he: ['איך פותחים בית חדש?', 'לוחצים על "פתיחת בית חדש", נותנים שם לבית ולעצמכם, ובוחרים דמות. אפשר להוסיף בלחיצה משימות בית מומלצות כדי להתחיל מהר.'], en: ['How do I open a new home?', 'Tap "Open a new home", name the home and yourself, and pick an avatar. You can add recommended chores in one tap.'] },
    { t: 'start', he: ['איך בני הבית מצטרפים?', 'בלשונית "הבית שלנו" יש קוד בן 6 תווים, קישור הצטרפות וקוד QR. שולחים לבני הבית בוואטסאפ, והם נכנסים מהטלפון שלהם.'], en: ['How do family members join?', 'The "Our home" tab has a 6 character code, a join link and a QR code. Send it on WhatsApp and they join from their own phone.'] },
    { t: 'start', he: ['צריך להירשם או לתת אימייל?', 'לא. אין הרשמה ואין סיסמה. הקוד של הבית הוא המפתח, אז כדאי לשתף אותו רק עם בני הבית.'], en: ['Do I need to sign up?', 'No sign up and no password. The home code is the key, so share it only with your household.'] },
    { t: 'start', he: ['אפשר להתקין את Nestly כאפליקציה?', 'כן. בדפדפן בטלפון בוחרים "הוספה למסך הבית", ו-Nestly נפתח כמו אפליקציה רגילה, גם בלי אינטרנט.'], en: ['Can I install Nestly as an app?', 'Yes. Choose "Add to Home Screen" in your phone browser and it opens like a regular app, even offline.'] },
    { t: 'tasks', he: ['איך עובדות תורנויות?', 'כשיוצרים משימה בוחרים "תורנות". בכל פעם שמישהו מסמן אותה כבוצעה, התור עובר אוטומטית לבן הבית הבא.'], en: ['How do rotations work?', 'Choose "Rotate" when creating a chore. Every time it is marked done, the turn moves to the next person automatically.'] },
    { t: 'tasks', he: ['איך צוברים נקודות?', 'כל משימה שווה נקודות לפי המאמץ: קלה 5, בינונית 10, קשה 20. טבלת אלופי השבוע מתאפסת בכל יום ראשון.'], en: ['How do points work?', 'Each chore is worth points by effort: easy 5, medium 10, hard 20. The weekly leaderboard resets every Sunday.'] },
    { t: 'tasks', he: ['משימה חוזרת, מה זה אומר?', 'אפשר לקבוע שמשימה חוזרת כל יום, כל כמה ימים, בימים קבועים בשבוע או פעם בחודש. אחרי שמסמנים אותה, התאריך הבא נקבע לבד.'], en: ['What is a repeating chore?', 'A chore can repeat daily, every few days or on set weekdays. Once done, the next date is set automatically.'] },
    { t: 'tasks', he: ['מחקתי משימה בטעות, אפשר לשחזר?', 'כן. מיד אחרי מחיקה מופיעה הודעה עם כפתור "ביטול" שמחזיר אותה.'], en: ['I deleted a chore by mistake', 'Right after deleting, a message appears with an "Undo" button that brings it back.'] },
    { t: 'shop', he: ['איך מוסיפים כמה פריטים ביחד?', 'כותבים אותם עם פסיקים, למשל "חלב, לחם, ביצים", או לוחצים על המיקרופון ואומרים אותם בקול. כל פריט נכנס למחלקה המתאימה בסופר.'], en: ['How do I add several items at once?', 'Type them with commas, like "milk, bread, eggs", or tap the mic and say them. Each lands in the right supermarket aisle.'] },
    { t: 'shop', he: ['איך שולחים את הרשימה למי שבסופר?', 'לוחצים "שליחה" ברשימת הקניות, ואפשר לשלוח בוואטסאפ, לשתף לאפליקציה אחרת או להעתיק כטקסט מסודר לפי מחלקות.'], en: ['How do I send the list to whoever is shopping?', 'Tap "Send" on the list to share on WhatsApp, to another app, or copy it as text sorted by aisle.'] },
    { t: 'data', he: ['איפה נשמרים הנתונים?', 'במכשיר שלכם, ובנוסף בשרת מאובטח (Supabase) כדי שכל בני הבית יראו את אותה רשימה בזמן אמת. רק מי שיש לו את הקוד רואה את הבית.'], en: ['Where is my data stored?', 'On your device and on a secure server (Supabase) so the whole home stays in sync. Only people with the code can see it.'] },
    { t: 'data', he: ['מה קורה בלי אינטרנט?', 'הכל ממשיך לעבוד. השינויים נשמרים במכשיר ומסתנכרנים לבד כשהחיבור חוזר. הנקודה ליד הלוגו מראה את מצב הסנכרון.'], en: ['What happens offline?', 'Everything keeps working. Changes are saved on the device and sync when you are back online. The dot near the logo shows the sync state.'] },
    { t: 'data', he: ['איך מגבים או עוזבים בית?', 'בלשונית "הבית שלנו" למטה יש "הורדת גיבוי" שמוריד את כל הנתונים, ו"יציאה מהבית במכשיר הזה" שמנקה את המכשיר בלבד.'], en: ['How do I back up or leave a home?', 'At the bottom of "Our home" there is "Download backup" and "Leave this home", which clears only this device.'] },
    { t: 'data', he: ['יש מצב כהה ונגישות?', 'כן. כפתור הירח למעלה מחליף למצב כהה, וכפתור הנגישות העגול (אפשר לגרור אותו לכל מקום) מגדיל טקסט, מוסיף ניגודיות, עוצר אנימציות ועוד.'], en: ['Is there dark mode and accessibility?', 'Yes. The moon button switches to dark mode, and the round accessibility button (drag it anywhere) enlarges text, adds contrast, stops animations and more.'] }
  ]
};
