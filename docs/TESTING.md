# בדיקת ה-flow המלא

מדריך זה מראה איך לבדוק את כל המסע — מהנפקת מפתח API ועד צפייה באנליטיקס — בשתי דרכים מקבילות: דרך ה-Developer Portal (ממשק) ודרך `curl` (API גולמי, לבדיקות אוטומטיות/CI).

לפני הכול, הריצו את ה-backend (`cd backend && npm run dev`, ברירת מחדל `http://localhost:4000`) ווודאו שהוא מחובר ל-PostgreSQL (`GET /health` אמור להחזיר `{"success":true,...}`).

## דרך 1 — דרך הממשק (Developer Portal + mobile-demo-app)

1. **הרצת הפורטל:**
   ```bash
   cd frontend && npm install && npm run dev
   ```
   פתחו `http://localhost:5173`.

2. **יצירת מפתח API:** במסך הכניסה הראשון, לחצו "No key yet? Create one". הפורטל ינפיק מפתח (`POST /api-keys`, נתיב פתוח) ויתחבר איתו אוטומטית. אפשר גם לבדוק מאוחר יותר את כל המפתחות בעמוד **API Keys**.

3. **יצירת טופס:** בעמוד **Forms** → **+ Create form**. תנו כותרת, הוסיפו כמה שדות (למשל `שם` מסוג `TEXT`, `אימייל` מסוג `EMAIL`) ולחצו **Create form**.

4. **פרסום הטופס:** בעמוד העריכה של הטופס, לחצו **Publish**. הסטטוס יתחלף מ-`Draft` ל-`Published`. שימו לב ל-`formId` שמופיע בכתובת ה-URL (`/forms/<formId>`) — הוא הציבורי.

5. **טעינת הטופס ב-mobile-demo-app:** הדביקו את ה-`formId` (ואת כתובת ה-API) ב-`mobile-demo-app/src/config.ts`, ואז:
   ```bash
   cd sdk/client && npm install && npm run build
   cd ../../mobile-demo-app && npm install && npm run sync-sdk && npm start
   ```
   סרקו את ה-QR עם Expo Go ולחצו **Open Survey** (או המתינו ל-delay האוטומטי). הטופס יירונדר בתוך ה-WebView על בסיס הסכמה שהוגדרה בפורטל — ללא מפתח API בכלל. פירוט מלא ב-[mobile-demo-app/README.md](../mobile-demo-app/README.md).

6. **שליחת תשובה:** מלאו את הטופס בדמו ולחצו **Submit**. אמור להופיע מסך תודה, וה-bottom sheet נסגר אוטומטית.

7. **צפייה ב-submission:** חזרה לפורטל, בעמוד הטופס → **Submissions**. התשובה שנשלחה אמורה להופיע ברשימה עם חותמת זמן.

8. **צפייה באנליטיקס:** בעמוד הטופס → **Analytics**. אמורים להופיע: `VIEW` (מטעינת הדמו), `START` (מהפוקוס הראשון בשדה), `FIELD_FOCUS`/`FIELD_CHANGE` לכל שדה שמולא, ו-`SUBMIT`. ה-`conversionRate` (יחס `SUBMIT`/`VIEW`) אמור לשקף את הפעולה.

## תרחיש הדגמה: עדכון טופס מוטמע בלי redeploy

תרחיש זה מדגים את הערך המרכזי של ה-SDK (ראו [docs/ARCHITECTURE.md](ARCHITECTURE.md)): המפתח מטמיע את הטופס פעם אחת, ולעדכן אותו לא דורש שינוי קוד באתר המוטמע — רק פרסום גרסה חדשה בפורטל.

1. **יצירה ופרסום של v1** — בפורטל (`http://localhost:5173`), עמוד **Forms** → **+ Create form**. תנו כותרת ושדה אחד (למשל `שם` מסוג `TEXT`), שמרו, ולחצו **Publish**. שמרו את ה-`formId` מה-URL.

2. **טעינה ב-mobile-demo-app** — הציבו את ה-`formId` ב-`mobile-demo-app/src/config.ts` (`DEMO_FORM_ID`), הריצו `npm start`, וסרקו עם Expo Go. הטופס נטען אוטומטית בתוך ה-WebView ומציג את שדה `שם` בלבד — בלי שום קוד שמכיר את התוכן הספציפי הזה (ה-app רק מטמיע `formId`).

3. **יצירת v2 עם שדה חדש** — חזרה לפורטל, בעמוד עריכת הטופס הוסיפו שדה נוסף (למשל `הערות` מסוג `TEXTAREA`) ולחצו **Save as v2**. שימו לב: הגרסה החיה עדיין v1 — ה-app לא משתנה בשלב הזה.

4. **פרסום v2** — לחצו **Publish v2** (או דרך עמוד **History**: **Publish this version** על v2). עכשיו v2 היא הגרסה החיה.

5. **פתיחה מחדש של הסקר באותו `formId`** — סגרו את ה-bottom sheet ופתחו אותו שוב (או Reload מלא של Expo Go), **בלי לשנות שום קובץ באפליקציה ובלי להריץ build מחדש** — ה-WebView שולף מחדש את הסכמה בכל `mount()`.

6. **אימות שהשדה החדש מופיע** — הטופס המרונדר אמור להציג כעת גם את שדה `הערות`, בלי ששינינו קוד כלשהו באפליקציה. זו ההוכחה שהעדכון מגיע מהשרת בכל טעינה, ולא מתוכן שנארז בזמן build.

### אותו תרחיש דרך `curl`

```bash
BASE=http://localhost:4000/api/v1
KEY=$(curl -s -X POST $BASE/api-keys -H "Content-Type: application/json" -d '{"name":"Live Update Demo"}' | grep -o '"key":"[^"]*"' | cut -d'"' -f4)

# 1. יצירה ופרסום v1
FORM=$(curl -s -X POST $BASE/forms -H "Content-Type: application/json" -H "x-api-key: $KEY" \
  -d '{"title":"Customer Survey","isPublished":true,"fields":[{"label":"Name","type":"TEXT","order":0}]}')
FORM_ID=$(echo "$FORM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Form id (קבוע, זה מה שמוטמע): $FORM_ID"

# 2. מה שה-SDK המוטמע מקבל כרגע
curl -s $BASE/public/forms/$FORM_ID | grep -o '"label":"[^"]*"'

# 3. יצירת v2 עם שדה חדש (לא משפיע על מה שמוגש כרגע)
curl -s -X POST $BASE/forms/$FORM_ID/versions -H "Content-Type: application/json" -H "x-api-key: $KEY" \
  -d '{"title":"Customer Survey","fields":[{"label":"Name","type":"TEXT","order":0},{"label":"Comments","type":"TEXTAREA","order":1}]}' > /dev/null

# 4. פרסום v2
curl -s -X PATCH $BASE/forms/$FORM_ID/publish -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{}' > /dev/null

# 5+6. אותו formId בדיוק, בלי שום שינוי קוד — השדה החדש מופיע
curl -s $BASE/public/forms/$FORM_ID | grep -o '"label":"[^"]*"'
```

**תוצאה צפויה:** הקריאה הראשונה ל-`/public/forms/$FORM_ID` מחזירה שדה אחד (`Name`); הקריאה השנייה, **לאותו `formId` בדיוק**, מחזירה שני שדות (`Name`, `Comments`) — בלי ששינינו אף קובץ קוד בין שתי הקריאות.

## דרך 2 — API גולמי (`curl`), לבדיקות אוטומטיות

מתאים להרצה ב-CI או לאימות מהיר בלי לפתוח דפדפן.

```bash
BASE=http://localhost:4000/api/v1

# 1. יצירת מפתח API (ללא אימות)
KEY=$(curl -s -X POST $BASE/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Suite"}' | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
echo "API key: $KEY"

# 2. יצירת טופס מפורסם עם שני שדות
FORM=$(curl -s -X POST $BASE/forms \
  -H "Content-Type: application/json" -H "x-api-key: $KEY" \
  -d '{
        "title": "Contact Us",
        "isPublished": true,
        "fields": [
          { "label": "Name",  "type": "TEXT",  "isRequired": true, "order": 0 },
          { "label": "Email", "type": "EMAIL", "isRequired": true, "order": 1 }
        ]
      }')
FORM_ID=$(echo "$FORM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Form id: $FORM_ID"

# 3. (אופציונלי) אימות שהפרסום הצליח, ושליפה ציבורית עובדת בלי מפתח
curl -s $BASE/public/forms/$FORM_ID

# 4. דיווח אירוע VIEW (כמו ש-sdk/client היה עושה בטעינת הטופס)
curl -s -X POST $BASE/public/forms/$FORM_ID/events \
  -H "Content-Type: application/json" -d '{"type":"VIEW"}'

# 5. שליחת submission ציבורית (ללא מפתח)
curl -s -X POST $BASE/public/forms/$FORM_ID/submissions \
  -H "Content-Type: application/json" \
  -d '{"data":{"Name":"Dorin","Email":"dorin@example.com"}}'

# 6. דיווח אירוע SUBMIT
curl -s -X POST $BASE/public/forms/$FORM_ID/events \
  -H "Content-Type: application/json" -d '{"type":"SUBMIT"}'

# 7. צפייה ב-submissions דרך ה-API הפרטי
curl -s $BASE/forms/$FORM_ID/submissions -H "x-api-key: $KEY"

# 8. סיכום אנליטיקס
curl -s $BASE/forms/$FORM_ID/events/summary -H "x-api-key: $KEY"
```

### תוצאה צפויה

- שלב 3: מחזיר את סכמת הטופס (`title`, `fields`) בלי שדה `apiKeyId` — הוכחה שהנתיב הציבורי לא חושף מידע פנימי.
- שלב 5: מחזיר submission עם `id` ו-`submittedAt`, וכולל `ipAddress`/`userAgent` שנאספו אוטומטית.
- שלב 7: רשימה עם ה-submission שנשלח בשלב 5.
- שלב 8: `{"byType":[{"type":"VIEW","count":1},{"type":"SUBMIT","count":1}],"conversionRate":1}`.

### בדיקת חסימת גישה (ביטחון)

כדאי גם לאמת שההפרדה Public/Admin עובדת בכיוון השני:

```bash
# בלי מפתח — אמור להחזיר 401
curl -s -o /dev/null -w "%{http_code}\n" $BASE/forms

# מפתח לא תקין — אמור להחזיר 401
curl -s -o /dev/null -w "%{http_code}\n" $BASE/forms -H "x-api-key: dfsdk_invalid"

# טופס שלא פורסם, דרך הנתיב הציבורי — אמור להחזיר 404
curl -s -X PUT $BASE/forms/$FORM_ID -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{"isPublished":false}'
curl -s -o /dev/null -w "%{http_code}\n" $BASE/public/forms/$FORM_ID
```

## ניקוי נתוני בדיקה

```bash
curl -s -X DELETE $BASE/forms/$FORM_ID -H "x-api-key: $KEY"          # מוחק טופס + submissions + events בקאסקייד
curl -s -X PATCH $BASE/api-keys/<api-key-id>/revoke                  # מבטל את המפתח (לא מוחק)
```
