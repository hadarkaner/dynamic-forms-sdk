# ארכיטקטורה

מסמך זה מסביר את ההחלטות האדריכליות מאחורי כל רכיב בפרויקט, ואת האופן שבו הם מתחברים יחד.

## עקרון היסוד: Public vs Admin routes

ההפרדה החשובה ביותר בפרויקט היא בין שני סוגי גישה ל-API:

| | נתיבים פרטיים (Admin) | נתיבים ציבוריים (Public) |
|---|---|---|
| נתיב בסיס | `/api/v1/forms`, `/api/v1/api-keys` | `/api/v1/public/forms/:formId/...` |
| אימות | כותרת `x-api-key` (מפתח סודי, נבדק מול טבלת `ApiKey`) | אין אימות בכלל |
| מי קורא | Developer Portal, `sdk/server` | `sdk/client` (רץ בדפדפן משתמש קצה, כולל בתוך WebView באפליקציות מובייל כמו `mobile-demo-app`) |
| מה חשוף | כל הטפסים של בעל המפתח, כולל draft, רשימות, מחיקה, אנליטיקס מסכם | רק טופס בודד לפי `formId`, ורק אם `isPublished === true` |

הסיבה לעיצוב הזה: `sdk/client` חייב לרוץ בדפדפן של מבקר אנונימי באתר צד שלישי. אם הוא היה שולח את מפתח ה-API הסודי, כל אחד שפותח DevTools היה יכול לגנוב אותו ולקבל גישה מלאה לכל הטפסים, ה-submissions וה-API keys של בעל החשבון. הפתרון, כמו ב-Stripe (`pk_` מול `sk_`) או Typeform: **מזהה הטופס (`formId`) הוא ציבורי בעיצומו** — מי שיודע אותו יכול לצפות בטופס ולהגיש תשובה, אבל לא יכול לרשום, לערוך, למחוק, או לראות טפסים אחרים. אין בכך פגיעה באבטחה כי זו בדיוק התכונה שצריך טופס מוטמע — מישהו שמבקר בעמוד שמכיל את הטופס *כבר* רואה את ה-`formId` בקוד המקור.

מימוש: `backend/src/routes/public.routes.ts` מורכב משלושה endpoints בלבד (`GET /public/forms/:formId`, `POST .../submissions`, `POST .../events`), וכל אחד מהם מסנן בשירות (`FormService.findPublishedById`, `SubmissionService.createPublic`, `AnalyticsEventService.createPublic`) לפי `isPublished: true` — לא לפי `apiKeyId`. בנוסף, השדה `apiKeyId` (מזהה הבעלים הפנימי) נשמט בכוונה מתשובת ה-GET הציבורית כדי לא לחשוף מידע פנימי שלא נחוץ ללקוח.

## Backend API

Express + TypeScript, מאורגן לפי Clean Architecture:

```
routes → controllers → services → Prisma (models)
```

- **routes** — מגדירים endpoint + middleware (אימות, ולידציה).
- **controllers** — מתרגמים HTTP request/response, לא מכילים לוגיקה עסקית.
- **services** — הלוגיקה העסקית וכל הגישה ל-DB דרך Prisma. שכבה זו היחידה שיודעת על `prisma.*`.
- **models** — סכמות [Zod](https://zod.dev) לוולידציית קלט (לא Prisma models — אלו נמצאים ב-`prisma/schema.prisma`).
- **middlewares** — `apiKeyAuth` (בודק `x-api-key` מול `ApiKey` בטבלה), `validateBody` (מריץ סכמת Zod), `errorHandler` (ממפה `AppError`/`ZodError` לתשובת JSON אחידה).

ה-resources: **Form** (עם **FormField**ים מקוננים), **FormSubmission**, **AnalyticsEvent**, **ApiKey** — כל אחד עם service/controller/routes נפרדים תחת `backend/src/`.

## Developer Portal (frontend)

אפליקציית React+TypeScript (Vite) שמשתמשת **רק** בנתיבים הפרטיים. מאורגנת:

- `types/` — טיפוסי TypeScript תואמים למודלים של ה-backend.
- `services/` — `apiClient.ts` מרכזי שמוסיף את `x-api-key` (נשמר ב-`localStorage`) לכל קריאה; שירות נפרד לכל resource.
- `hooks/` — `useConnection` (קונטקסט גלובלי למפתח/base URL), ו-hooks לשליפת נתונים (`useForms`, `useForm`, `useSubmissions`, `useAnalyticsSummary`, `useApiKeys`) עם loading/error/refetch.
- `components/` — `Layout` (סיידבר ניווט), `ConnectionGate` (מסך כניסה שמבקש/מנפיק מפתח), `FormFieldEditor` (בנאי שדות דינמי), רכיבי UI משותפים.
- `pages/` — Forms list, Create, Edit (כולל toggle פרסום), Submissions, Analytics (סיכום + טבלת אירועים), API Keys.

**בעיית ה-bootstrap:** כדי לנהל טפסים צריך מפתח API, אבל כדי ליצור מפתח ראשון לא צריך אימות (`POST /api-keys` פתוח בכוונה — ראו "החלטות אבטחה" למטה). ה-`ConnectionGate` מנצל זאת: הוא מאפשר ליצור מפתח ראשון ישירות מהממשק, בלי לדרוש משהו שעדיין לא קיים.

## Client SDK (`sdk/client`)

חבילת TypeScript שנבנית (`tsup`) לשלושה פורמטים — ESM, CommonJS, ו-IIFE גלובלי (`DynamicFormsSDK.DynamicForm`) — כך שאפשר להשתמש בה גם דרך `npm install` וגם דרך תג `<script>` רגיל באתר שלא משתמש ב-bundler כלל.

מחלקת `DynamicForm` מקבלת `baseUrl`, `formId`, ו-`container` (אלמנט DOM או selector), ו:
1. שולפת את סכמת הטופס מ-`/public/forms/:formId`.
2. מרנדרת קלט מתאים לכל סוג שדה (`TEXT`, `TEXTAREA`, `NUMBER`, `EMAIL`, `DATE`, `CHECKBOX`, `RADIO`, `SELECT`).
3. שולחת אוטומטית אירועי אנליטיקס: `VIEW` בעת mount, `START` בפוקוס ראשון, `FIELD_FOCUS`/`FIELD_CHANGE` לכל שדה, `SUBMIT` בהצלחה, `ABANDON` אם הדף נסגר לפני שליחה (`beforeunload`), `ERROR` אם השליחה נכשלה.
4. שולחת submissions ל-`/public/forms/:formId/submissions`.

דיווח האנליטיקס תמיד "שקט" — כשל בשליחת אירוע לא חוסם ולא שובר את חוויית מילוי הטופס.

### ערך מרכזי: עדכון תוכן בלי redeploy אצל המפתח

זו התכונה שמניעה את כל עיצוב ה-SDK: **המפתח מטמיע את `DynamicForm` פעם אחת**, עם `formId` קבוע — ומשם והלאה, כל שינוי בתוכן הטופס מתבצע **רק בפורטל**, בלי לגעת בקוד הצד-שלישי.

זה אפשרי כי שני העקרונות הבאים פועלים יחד:

1. **`formId` מזהה טופס (מכל יציב), לא גרסה.** ה-`formId` שנכתב בקוד ההטמעה לא משתנה לעולם, גם כשבעל הטופס יוצר ומפרסם גרסאות חדשות (ראו "Version History" למטה).
2. **`DynamicForm.mount()` שולף סכמה טרייה בכל קריאה**, בלי caching בצד הלקוח. כל טעינת עמוד אצל המבקר באתר החיצוני מריצה `GET /public/forms/:formId` מחדש, וה-backend מחזיר את הגרסה שמסומנת `isPublished: true` **באותו רגע** — לא תמונת מצב שנשמרה בזמן ה-build של אתר המפתח.

המשמעות בפועל: בעל הטופס עורך שדה, מוסיף שאלה, או משנה ניסוח בפורטל ולוחץ **Publish** — והאתר החיצוני "מקבל" את העדכון באופן מיידי, בלי build חדש, בלי deploy, ובלי לדעת שבכלל קיים מנגנון גרסאות. תרחיש בדיקה מלא לכך מתועד ב-[docs/TESTING.md](TESTING.md).

## Server SDK (`sdk/server`)

חבילת Node.js (TypeScript, `tsup`, ESM+CJS) עם מחלקת `DynamicFormsClient` שעוטפת את **כל** הנתיבים הפרטיים (`createForm`, `listForms`, `deleteForm`, `createVersion`, `listVersions`, `publishVersion`, `unpublish`, `restoreVersion`, `listSubmissions`, `getAnalyticsSummary`, `createApiKey` וכו') באמצעות `fetch` + כותרת `x-api-key`. מיועדת לרוץ רק בקוד שרת — אם מפתח חיצוני מטמיע אותה בקוד צד-לקוח, המפתח הסודי שלו יישלח לדפדפן. ה-README של החבילה מזהיר על כך במפורש.

## mobile-demo-app

לא רכיב פרודקשן — קיים רק כדי להוכיח את חוויית האינטגרציה בצד מובייל. מכיוון ש-`sdk/client` הוא קוד דפדפן (DOM), הוא לא יכול לרוץ ישירות כרכיבי React Native: הפתרון הוא `WebView` שטוען את אותו HTML/JS שהיה נטען באתר, מוצג כ-bottom sheet מעל מסך native קיים. ה-bundle (`sdk/client/dist/index.global.js`) מוטמע כמחרוזת בקוד (`src/sdkBundle.ts`, נוצר אוטומטית ע"י `npm run sync-sdk`) במקום להיטען מ-URL, כי Metro לא יודע לטעון קובץ מ-`node_modules` כטקסט גולמי בזמן ריצה. תקשורת בין ה-WebView לצד ה-native עוברת דרך `window.ReactNativeWebView.postMessage` בתוך `onSubmit`/`onError`.

## Version History לטפסים

זו התכונה המרכזית של ה-Developer Portal: לכל טופס יש היסטוריית גרסאות מלאה, ואין דרך "לערוך במקום" — כל שינוי תוכן יוצר גרסה חדשה ובלתי-ניתנת-לשינוי.

- **Form** הוא מכל יציב בלבד — `id`, `apiKeyId` (הבעלים), חותמות זמן. אין לו כותרת, תיאור או שדות משל עצמו.
- **FormVersion** הוא יחידת התוכן היחידה — `versionNumber` (1, 2, 3...), `title`, `description?`, רשימת `FormField`, ודגל `isPublished`.
- **"הגרסה הנוכחית" (current)** = הגרסה עם `versionNumber` הגבוה ביותר עבור הטופס — זו שמוצגת לעריכה ב-`EditFormPage`.
- **"הגרסה המפורסמת" (published)** = הגרסה היחידה (לכל היותר אחת) עם `isPublished: true` — זו שה-SDK הציבורי מגיש. יתכן שהגרסה הנוכחית *אינה* הגרסה המפורסמת (טיוטה שעדיין לא פורסמה).

זרימת העבודה ב-API:

```
POST   /forms                              → יוצר טופס + גרסה 1 (טיוטה)
POST   /forms/:id/versions                 → "שמירה" = יוצר את הגרסה הבאה (טיוטה, לא משנה את המפורסם)
GET    /forms/:id/versions                 → היסטוריה מלאה, מהחדש לישן
GET    /forms/:id/versions/:versionId      → צפייה בגרסה בודדת
POST   /forms/:id/versions/:versionId/restore → מעתיק תוכן גרסה ישנה לגרסה חדשה (לא מפרסם אוטומטית)
PATCH  /forms/:id/publish  { versionId? }  → מפרסם גרסה (ברירת מחדל: הנוכחית); מבטל פרסום מכל גרסה אחרת של הטופס בטרנזקציה אחת
PATCH  /forms/:id/unpublish                → מוריד את הטופס מהאוויר בלי למחוק היסטוריה
```

נקודה אדריכלית חשובה: הנתיב הציבורי (`GET /public/forms/:formId`) **לא נחשף למודל הגרסאות בכלל** — הוא ממשיך להחזיר את אותה צורת תשובה שטוחה כמו לפני הוספת ה-versioning (`id`, `title`, `description`, `isPublished`, `fields`). כך `sdk/client` לא נדרש לשום שינוי כשהתכונה נוספה — הוא פשוט מקבל את תוכן הגרסה המפורסמת, בלי לדעת שגרסאות קיימות.

## מודל הנתונים (PostgreSQL + Prisma)

```
ApiKey 1───* Form 1───* FormVersion 1───* FormField
                  │
                  ├───* FormSubmission
                  └───* AnalyticsEvent
```

- **ApiKey** — `id`, `key` (ייחודי, בפורמט `dfsdk_<hex>`), `name`, `isActive`. מחיקת `ApiKey` מוחקת בקאסקייד את כל הטפסים שלו.
- **Form** — מכל יציב: `apiKeyId` (הבעלים), חותמות זמן. אין שדות תוכן.
- **FormVersion** — `versionNumber`, `title`, `description?`, `isPublished`, `publishedAt?`. ייחודיות `(formId, versionNumber)`. גרסאות הן immutable — אף endpoint לא מעדכן גרסה קיימת, רק יוצר חדשות או מהפך את `isPublished`.
- **FormField** — שייך ל-`FormVersion` (לא ל-`Form`!) דרך `formVersionId`: `label`, `type` (enum `FieldType`), `isRequired`, `order`, `options?` (JSON, למשל רשימת בחירה ל-`SELECT`/`RADIO`/`CHECKBOX`), `placeholder?`.
- **FormSubmission** — `data` (JSON חופשי, מבנה תלוי בשדות הטופס), `submittedAt`, `ipAddress?`, `userAgent?` (נאספים אוטומטית מה-request). נשאר משויך ל-`Form` (לא לגרסה ספציפית) — submission לא "שייך" לגרסה כלשהי, רק לטופס.
- **AnalyticsEvent** — `type` (enum `EventType`: `VIEW`, `START`, `FIELD_FOCUS`, `FIELD_CHANGE`, `SUBMIT`, `ABANDON`, `ERROR`), `metadata?` (JSON חופשי). גם הוא משויך ל-`Form`, לא לגרסה — כך שאנליטיקס מצטבר על כל היסטוריית הטופס.

כל הטבלאות עם `onDelete: Cascade` מ-`Form` כלפי מטה — מחיקת טופס מנקה את כל הגרסאות, השדות, ה-submissions וה-events שלו.

אינדקסים: `Form.apiKeyId`, `FormField.formId`, `FormSubmission.formId`, `AnalyticsEvent.formId`, `AnalyticsEvent.type` — כולם נבחרו כי הם עמודות הסינון השכיחות ביותר (שליפת כל הטפסים של בעל מפתח, כל ה-submissions/events של טופס, וסיכום אנליטיקס לפי סוג אירוע).

## בחירת Neon לפריסת PostgreSQL

לפרויקט נבחר [Neon](https://neon.tech) — שירות PostgreSQL מנוהל בענן (serverless) — מהשיקולים הבאים:

1. **ללא התקנה מקומית** — אין תלות ב-Docker/PostgreSQL מותקן על מחשב הסטודנט, מה שמייעל הקמה ובדיקה (חשוב לפרויקט סמינריוני שעשוי לרוץ על כמה מחשבים/להיבדק על ידי מרצה).
2. **Free tier מספק** — מתאים לעומס פרויקט סמינריוני, בלי עלות.
3. **תאימות מלאה ל-Prisma** — Neon הוא PostgreSQL רגיל (לא תחליף proprietary), כך ש-`prisma migrate` ו-`prisma generate` עובדים ללא שינוי בקוד.
4. **חיבור מאובטח כברירת מחדל** — מחרוזת החיבור מגיעה עם `sslmode=require` מובנה.

מגבלה ידועה: Neon מספק connection pooling דרך PgBouncer (`-pooler` ב-hostname). חלק מהפעולות הכבדות יותר (כגון migrations מורכבים) עדיפות מול חיבור ישיר ולא מאוחה (non-pooled), אך בפרויקט זה ה-`migrate dev` הראשוני רץ בהצלחה גם מול ה-pooled connection.
