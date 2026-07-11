# Dynamic Forms SDK

פרויקט סמינריוני: פלטפורמה לבניית טפסים דינמיים, הטמעתם באתרים חיצוניים באמצעות SDK, איסוף submissions, ומעקב אחר אירועי אנליטיקס — עם הפרדה ברורה בין פעולות ניהול (הדורשות מפתח API סודי) לבין הטמעה ציבורית (ללא מפתח כלל).

## סקירה כללית

הפרויקט מורכב מחמישה רכיבים עצמאיים שחולקים API אחד:

| רכיב | תיאור | טכנולוגיה |
|---|---|---|
| `backend` | ה-API המרכזי — CRUD לטפסים, submissions, analytics events, אימות API key | Node.js, Express, TypeScript, PostgreSQL, Prisma |
| `frontend` | Developer Portal — ממשק ניהול לבניית טפסים, פרסום, צפייה ב-submissions ואנליטיקס, ניהול מפתחות | React, TypeScript, Vite |
| `sdk/client` | SDK להטמעת טופס מפורסם באתר צד שלישי, ללא מפתח סודי | TypeScript, נבנה ל-ESM/CJS/IIFE |
| `sdk/server` | SDK ל-Node.js לניהול טפסים מקוד שרת, באמצעות מפתח סודי | TypeScript |
| `mobile-demo-app` | אפליקציית הדגמה שמטמיעה את `sdk/client` בתוך native app, דרך WebView בתוך bottom sheet | Expo, React Native, TypeScript |

## ערך מרכזי של ה-SDK: עדכון תוכן בלי redeploy

הרעיון המרכזי שעומד מאחורי `sdk/client`: **המפתח מטמיע את ה-SDK פעם אחת**, עם `formId` קבוע. מאותה נקודה והלאה, כל עדכון לתוכן הטופס קורה **בפורטל בלבד** — בלי לשנות אף שורת קוד באתר המוטמע, ובלי redeploy.

1. המפתח מטמיע את הטופס פעם אחת בעמוד שלו, עם `formId` יציב:
   ```ts
   new DynamicForm({ baseUrl, formId: "<form-id>", container: "#form" }).mount();
   ```
2. בכל פעם שה-SDK עולה (טעינת עמוד), הוא שולף מחדש מ-`GET /api/v1/public/forms/:formId` את **הגרסה שמפורסמת כרגע** — אין caching, ואין "תוכן קבוע" שנכתב בזמן הבנייה.
3. כשבעל הטופס עורך אותו בפורטל ולוחץ **Publish** על גרסה חדשה, האתר החיצוני מקבל את התוכן המעודכן **באופן מיידי** בטעינה הבאה — בלי שהמפתח נגע בקוד שלו ובלי שהוא צריך לדעת שבכלל קיים מנגנון גרסאות.

זה אפשרי כי `formId` מזהה את ה**טופס** (מכל יציב), לא גרסה ספציפית — וה-API הציבורי שומר על צורת תשובה שטוחה ועקבית בלי לחשוף את מודל הגרסאות בכלל. פירוט אדריכלי מלא ותרחיש בדיקה מלא נמצאים ב-[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) וב-[docs/TESTING.md](docs/TESTING.md) בהתאמה.

## ארכיטקטורה (תרשים טקסטואלי)

```
                                ┌────────────────────────┐
                                │      PostgreSQL          │
                                │   (Neon, מנוהל בענן)     │
                                └────────────▲─────────────┘
                                             │ Prisma ORM
                                ┌────────────┴─────────────┐
                                │         backend          │
                                │   Express API (port 4000)│
                                │                           │
                                │  /api/v1/forms        ◄──┼── מפתח API סודי (x-api-key)
                                │  /api/v1/api-keys     ◄──┤   ניהול: Developer Portal,
                                │  /api/v1/forms/:id/... ◄─┤   sdk/server
                                │                           │
                                │  /api/v1/public/forms ◄──┼── ללא מפתח, רק טפסים מפורסמים
                                └─────┬──────────────┬──────┘
                                      │              │
                       x-api-key      │              │   ללא מפתח (formId ציבורי)
                                      │              │
                  ┌───────────────────┘              └───────────────────┐
                  │                                                      │
        ┌─────────▼─────────┐                                 ┌─────────▼─────────┐
        │     frontend       │                                 │     sdk/client      │
        │ Developer Portal   │                                 │  (חבילת דפדפן)      │
        │ (React, port 5173) │                                 └─────────▲───────────┘
        └─────────────────────┘                                          │ import / <script>,
                  ▲                                                      │ או מוטמע ב-WebView
                  │ import (Node)                              ┌─────────┴───────────┐
        ┌─────────┴─────────┐                                  │   mobile-demo-app     │
        │     sdk/server      │                                 │ (Expo · bottom sheet)  │
        │  (חבילת Node.js)    │                                 └───────────────────────┘
        └─────────────────────┘
```

**העיקרון המרכזי:** מזהה טופס (`formId`) הוא ציבורי — לא סוד. מפתח ה-API הוא הסוד היחיד, ולכן הוא נחשף רק לקוד שרת (Developer Portal ו-`sdk/server`), ולעולם לא ל-`sdk/client` שרץ בדפדפן המשתמש הסופי.

## מבנה תיקיות

```
DynamicFormsSDK
│
├── backend/              Express API
│   ├── prisma/           schema.prisma + migrations
│   └── src/
│       ├── config/        env, Prisma client
│       ├── controllers/   form, submission, analyticsEvent, apiKey, public
│       ├── services/      לוגיקה עסקית + גישה ל-DB
│       ├── models/        סכמות Zod לוולידציה
│       ├── middlewares/   apiKeyAuth, validateBody, errorHandler
│       ├── routes/        form, submission, analyticsEvent, apiKey, public
│       └── utils/         AppError, asyncHandler, generateApiKey
│
├── frontend/             Developer Portal (React)
│   └── src/
│       ├── types/        Form, FormSubmission, AnalyticsEvent, ApiKey
│       ├── services/     apiClient + form/submission/analytics/apiKey services
│       ├── hooks/        useConnection, useForms, useForm, useSubmissions, useAnalyticsSummary, useApiKeys
│       ├── components/   Layout, ConnectionGate, FormFieldEditor, StatusBadge וכו'
│       └── pages/        FormsList, CreateForm, EditForm, Submissions, Analytics, ApiKeys
│
├── sdk/
│   ├── client/           @dynamic-forms-sdk/client — SDK לדפדפן
│   └── server/           @dynamic-forms-sdk/server — SDK ל-Node.js
│
├── mobile-demo-app/      אפליקציית הדגמה (Expo) לאינטגרציה עם sdk/client בתוך WebView
│
├── database/             נכסי DB עצמאיים (seed data, דיאגרמות)
├── docs/
│   ├── ARCHITECTURE.md   הסבר אדריכלי מפורט
│   └── TESTING.md        מדריך בדיקת ה-flow המלא
└── README.md
```

## הקמה (Setup)

### דרישות מוקדמות
- Node.js 18+ (יש בו `fetch` גלובלי, נדרש על ידי שני ה-SDKs)
- בסיס נתונים PostgreSQL — מומלץ [Neon](https://neon.tech) (ענן, free tier), אך כל PostgreSQL תקני יעבוד

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # עדכנו DATABASE_URL
npm run prisma:migrate      # יוצר את הטבלאות
npm run dev                 # http://localhost:4000
```

בדיקת תקינות: `GET http://localhost:4000/health`

### 2. Developer Portal (frontend)

```bash
cd frontend
npm install
cp .env.example .env        # אופציונלי: VITE_API_BASE_URL
npm run dev                 # http://localhost:5173
```

בכניסה הראשונה הפורטל יציג מסך "Connect" — אפשר ללחוץ "No key yet? Create one" כדי להנפיק מפתח API ראשון ישירות מהממשק (זה אפשרי כי `POST /api-keys` הוא נתיב פתוח לצורך ה-bootstrap הראשוני).

### 3. sdk/client

```bash
cd sdk/client
npm install
npm run build                # מפיק dist/index.{esm,cjs,global}.js + טיפוסים
```

ראו [sdk/client/README.md](sdk/client/README.md) לדוגמאות שימוש.

### 4. sdk/server

```bash
cd sdk/server
npm install
npm run build
```

ראו [sdk/server/README.md](sdk/server/README.md) לדוגמאות שימוש.

### 5. mobile-demo-app

```bash
cd sdk/client && npm install && npm run build
cd ../../mobile-demo-app && npm install && npm run sync-sdk   # מטמיע את ה-bundle של sdk/client
npm start                    # Expo — לסרוק QR עם Expo Go
```

לפני הרצה, חשוב שיהיה ב-backend טופס שפורסם (`isPublished: true`) — אפשר ליצור אחד דרך ה-Developer Portal ולפרסם אותו, ואז להדביק את ה-`formId` (ואת כתובת ה-API) ב-`mobile-demo-app/src/config.ts`. פירוט מלא, כולל ההבדל בין אמולטור לטלפון פיזי, ב-[mobile-demo-app/README.md](mobile-demo-app/README.md).

## משתני סביבה

| קובץ | משתנה | משמעות | דוגמה |
|---|---|---|---|
| `backend/.env` | `PORT` | פורט השרת | `4000` |
| `backend/.env` | `NODE_ENV` | סביבת הרצה | `development` |
| `backend/.env` | `DATABASE_URL` | מחרוזת חיבור ל-PostgreSQL | `postgresql://user:pass@host/db?sslmode=require` |
| `frontend/.env` | `VITE_API_BASE_URL` | כתובת בסיס ל-API | `http://localhost:4000/api/v1` |

`mobile-demo-app` לא משתמש ב-`.env` — הקונפיגורציה המקבילה (`API_BASE_URL`, `DEMO_FORM_ID`) נמצאת ישירות ב-`mobile-demo-app/src/config.ts`.

## זרימת ה-API (API Flow)

כל בקשה ל-`/api/v1/forms`, `/api/v1/forms/:formId/submissions`, `/api/v1/forms/:formId/events`, ו-`/api/v1/api-keys` דורשת כותרת:

```
x-api-key: dfsdk_xxxxxxxxxxxxxxxxxxxx
```

זרימה טיפוסית של בעל חשבון (Developer Portal / `sdk/server`):

```
1. POST  /api/v1/api-keys                       → הנפקת מפתח (נתיב פתוח, פעם אחת בלבד)
2. POST  /api/v1/forms                          → יצירת טופס + גרסה 1 (טיוטה)
3. PATCH /api/v1/forms/:id/publish              → פרסום הגרסה הנוכחית
4. POST  /api/v1/forms/:id/versions             → "שמירה" = יוצר את הגרסה הבאה (טיוטה, לא נוגעת במפורסם)
5. GET   /api/v1/forms/:id/versions             → היסטוריית גרסאות מלאה
6. GET   /api/v1/forms/:id/submissions          → צפייה בתשובות (x-api-key)
7. GET   /api/v1/forms/:id/events/summary       → סיכום אנליטיקס (x-api-key)
```

כל טופס הוא מכל יציב; התוכן (כותרת/תיאור/שדות) חי על **גרסאות** (`FormVersion`) בלתי-ניתנות-לשינוי. "שמירה" אף פעם לא עורכת גרסה קיימת — היא יוצרת את הבאה. פרסום הוא פעולה נפרדת ומפורשת על גרסה ספציפית. פירוט מלא ב-[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), בסעיף Version History.

זרימה טיפוסית של מבקר באתר חיצוני, כולל כשה-SDK רץ בתוך WebView באפליקציית מובייל (`sdk/client` / `mobile-demo-app`) — **ללא מפתח**:

```
1. GET  /api/v1/public/forms/:formId             → שליפת סכמת הגרסה המפורסמת בלבד
2. POST /api/v1/public/forms/:formId/events       → דיווח VIEW/START/FIELD_FOCUS/...
3. POST /api/v1/public/forms/:formId/submissions  → שליחת תשובה
```

הנתיב הציבורי לא חושף את מודל הגרסאות בכלל — מחזיר תמיד צורת תשובה שטוחה (`id`, `title`, `description`, `fields`) על בסיס הגרסה שמפורסמת כרגע, כך ש-`sdk/client` לא צריך לדעת שגרסאות קיימות.

פירוט מלא של כל ה-endpoints נמצא ב-[backend/README.md](backend/README.md).

## דוגמאות שימוש ב-SDK

### sdk/client — הטמעה בדפדפן

```ts
import { DynamicForm } from "@dynamic-forms-sdk/client";

const form = new DynamicForm({
  baseUrl: "https://api.example.com/api/v1",
  formId: "<published-form-id>",
  container: "#form-container",
  onSubmit: (data) => console.log("נשלח בהצלחה", data),
  onError: (err) => console.error(err),
});

form.mount();
```

או דרך תג `<script>` רגיל (ללא npm):

```html
<div id="form-container"></div>
<script src="https://unpkg.com/@dynamic-forms-sdk/client/dist/index.global.js"></script>
<script>
  new DynamicFormsSDK.DynamicForm({
    baseUrl: "https://api.example.com/api/v1",
    formId: "<published-form-id>",
    container: "#form-container",
  }).mount();
</script>
```

### sdk/server — ניהול מקוד שרת

```ts
import { DynamicFormsClient } from "@dynamic-forms-sdk/server";

const client = new DynamicFormsClient({
  apiKey: process.env.DYNAMIC_FORMS_API_KEY!,
  baseUrl: "https://api.example.com/api/v1",
});

// יצירת טופס יוצרת אוטומטית את הגרסה הראשונה שלו (v1), כטיוטה
const form = await client.createForm({
  title: "צור קשר",
  fields: [
    { label: "שם", type: "TEXT", isRequired: true, order: 0 },
    { label: "אימייל", type: "EMAIL", isRequired: true, order: 1 },
  ],
});

// פרסום v1 — מעתה זמין דרך הנתיבים הציבוריים / sdk/client
await client.publishVersion(form.id);

// עריכה לא משנה גרסה קיימת — היא יוצרת גרסה חדשה (v2) כטיוטה,
// בזמן ש-v1 ממשיכה להיות הגרסה החיה עד שמפרסמים את v2 במפורש
await client.createVersion(form.id, {
  title: "צור קשר",
  fields: [
    { label: "שם", type: "TEXT", isRequired: true, order: 0 },
    { label: "אימייל", type: "EMAIL", isRequired: true, order: 1 },
    { label: "טלפון", type: "TEXT", isRequired: false, order: 2 },
  ],
});

const history = await client.listVersions(form.id); // מהחדש לישן
await client.publishVersion(form.id);                // מפרסם את הגרסה הנוכחית (האחרונה)

const submissions = await client.listSubmissions(form.id);
const summary = await client.getAnalyticsSummary(form.id);
```

## תיעוד נוסף

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — הסבר אדריכלי מעמיק על כל רכיב, מודל הנתונים, וההחלטה לעבוד עם Neon.
- [docs/TESTING.md](docs/TESTING.md) — מדריך לבדיקת ה-flow המלא מקצה לקצה.
- [backend/README.md](backend/README.md) — מפת endpoints מלאה.
- [sdk/client/README.md](sdk/client/README.md), [sdk/server/README.md](sdk/server/README.md), [mobile-demo-app/README.md](mobile-demo-app/README.md) — תיעוד ספציפי לכל חבילה.
