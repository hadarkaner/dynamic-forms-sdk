# Testing the Full Flow

This guide shows how to test the whole journey — from issuing an API key to viewing analytics — in two parallel ways: through the Developer Portal (UI) and through `curl` (raw API, for automated tests/CI).

First, run the backend (`cd backend && npm run dev`, defaults to `http://localhost:4000`) and confirm it's connected to PostgreSQL (`GET /health` should return `{"success":true,...}`).

## Way 1 — Through the UI (Developer Portal + curl as the visitor)

1. **Run the portal:**
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Open `http://localhost:5173`.

2. **Create an API key:** on the first login screen, click "No key yet? Create one". The portal issues a key (`POST /api-keys`, an open route) and connects with it automatically. You can also check all keys later on the **API Keys** page.

3. **Create a form:** on the **Forms** page → **+ Create form**. Give it a title, add a few fields (e.g. `Name` of type `TEXT`, `Email` of type `EMAIL`), and click **Create form**.

4. **Publish the form:** on the form's edit page, click **Publish**. The status flips from `Draft` to `Published`. Note the `formId` in the URL (`/forms/<formId>`) — it's the public one.

5. **Simulate a visitor** (standing in for `sdk/client`, with no key at all):
   ```bash
   FORM_ID=<paste the formId from the previous step>
   curl -s http://localhost:4000/api/v1/public/forms/$FORM_ID
   curl -s -X POST http://localhost:4000/api/v1/public/forms/$FORM_ID/submissions \
     -H "Content-Type: application/json" -d '{"data":{"Name":"Dorin","Email":"dorin@example.com"}}'
   curl -s -X POST http://localhost:4000/api/v1/public/forms/$FORM_ID/events \
     -H "Content-Type: application/json" -d '{"type":"VIEW"}'
   curl -s -X POST http://localhost:4000/api/v1/public/forms/$FORM_ID/events \
     -H "Content-Type: application/json" -d '{"type":"SUBMIT"}'
   ```

6. **View the submission:** back in the portal, on the form's page → **Submissions**. The submitted response should appear in the list with a timestamp.

7. **View analytics:** on the form's page → **Analytics**. `VIEW` and `SUBMIT` should appear, and `conversionRate` (the `SUBMIT`/`VIEW` ratio) should reflect the action.

## Demo scenario: updating an embedded form without a redeploy

This scenario demonstrates the SDK's core value (see [Architecture & Implementation](/implementation)): the integrator embeds the form once, and updating it requires no code change on the embedding site — only publishing a new version in the portal. The simplest way to prove this without depending on any rendered client is to hit the public route directly, before and after publishing a new version, and see that `formId` didn't change while the content did:

```bash
BASE=http://localhost:4000/api/v1
KEY=$(curl -s -X POST $BASE/api-keys -H "Content-Type: application/json" -d '{"name":"Live Update Demo"}' | grep -o '"key":"[^"]*"' | cut -d'"' -f4)

# 1. Create and publish v1
FORM=$(curl -s -X POST $BASE/forms -H "Content-Type: application/json" -H "x-api-key: $KEY" \
  -d '{"title":"Customer Survey","isPublished":true,"fields":[{"label":"Name","type":"TEXT","order":0}]}')
FORM_ID=$(echo "$FORM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Form id (fixed, this is what's embedded): $FORM_ID"

# 2. What the embedded SDK gets right now
curl -s $BASE/public/forms/$FORM_ID | grep -o '"label":"[^"]*"'

# 3. Create v2 with a new field (doesn't affect what's currently served)
curl -s -X POST $BASE/forms/$FORM_ID/versions -H "Content-Type: application/json" -H "x-api-key: $KEY" \
  -d '{"title":"Customer Survey","fields":[{"label":"Name","type":"TEXT","order":0},{"label":"Comments","type":"TEXTAREA","order":1}]}' > /dev/null

# 4. Publish v2
curl -s -X PATCH $BASE/forms/$FORM_ID/publish -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{}' > /dev/null

# 5+6. The exact same formId, no code change at all — the new field appears
curl -s $BASE/public/forms/$FORM_ID | grep -o '"label":"[^"]*"'
```

**Expected result:** the first call to `/public/forms/$FORM_ID` returns one field (`Name`); the second call, to **the exact same `formId`**, returns two fields (`Name`, `Comments`) — with no code file changed between the two calls.

## Way 2 — Raw API (`curl`), for automated tests

Suited to running in CI, or a quick check without opening a browser.

```bash
BASE=http://localhost:4000/api/v1

# 1. Create an API key (no auth)
KEY=$(curl -s -X POST $BASE/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Suite"}' | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
echo "API key: $KEY"

# 2. Create a published form with two fields
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

# 3. (optional) Confirm publishing worked, and the public fetch works with no key
curl -s $BASE/public/forms/$FORM_ID

# 4. Report a VIEW event (as sdk/client would on form load)
curl -s -X POST $BASE/public/forms/$FORM_ID/events \
  -H "Content-Type: application/json" -d '{"type":"VIEW"}'

# 5. Submit a public submission (no key)
curl -s -X POST $BASE/public/forms/$FORM_ID/submissions \
  -H "Content-Type: application/json" \
  -d '{"data":{"Name":"Dorin","Email":"dorin@example.com"}}'

# 6. Report a SUBMIT event
curl -s -X POST $BASE/public/forms/$FORM_ID/events \
  -H "Content-Type: application/json" -d '{"type":"SUBMIT"}'

# 7. View submissions through the private API
curl -s $BASE/forms/$FORM_ID/submissions -H "x-api-key: $KEY"

# 8. Analytics summary
curl -s $BASE/forms/$FORM_ID/events/summary -H "x-api-key: $KEY"
```

### Expected result

- Step 3: returns the form schema (`title`, `fields`) without an `apiKeyId` field — proof the public route doesn't leak internal information.
- Step 5: returns a submission with `id` and `submittedAt`, including `ipAddress`/`userAgent` collected automatically.
- Step 7: a list containing the submission sent in step 5.
- Step 8: `{"byType":[{"type":"VIEW","count":1},{"type":"SUBMIT","count":1}],"conversionRate":1}`.

### Testing access is blocked (security)

Worth also confirming the Public/Admin split works in the other direction:

```bash
# No key — should return 401
curl -s -o /dev/null -w "%{http_code}\n" $BASE/forms

# Invalid key — should return 401
curl -s -o /dev/null -w "%{http_code}\n" $BASE/forms -H "x-api-key: dfsdk_invalid"

# An unpublished form, via the public route — should return 404
curl -s -X PUT $BASE/forms/$FORM_ID -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{"isPublished":false}'
curl -s -o /dev/null -w "%{http_code}\n" $BASE/public/forms/$FORM_ID
```

## Testing Form Slots

```bash
BASE=http://localhost:4000/api/v1
KEY=$(curl -s -X POST $BASE/api-keys -H "Content-Type: application/json" -d '{"name":"Slot Test"}' | grep -o '"key":"[^"]*"' | cut -d'"' -f4)

FORM=$(curl -s -X POST $BASE/forms -H "Content-Type: application/json" -H "x-api-key: $KEY" \
  -d '{"title":"Slot Test Form","isPublished":true,"fields":[{"label":"Name","type":"TEXT","order":0}]}')
FORM_ID=$(echo "$FORM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 1. Create a slot with no form assigned
SLOT=$(curl -s -X POST $BASE/form-slots -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{"key":"main-survey"}')
SLOT_ID=$(echo "$SLOT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 2. Resolve an unassigned slot — 404 with a clear message
curl -s -o /dev/null -w "unassigned: %{http_code}\n" $BASE/public/form-slots/main-survey

# 3. Assign the form to the slot
curl -s -X PATCH $BASE/form-slots/$SLOT_ID -H "Content-Type: application/json" -H "x-api-key: $KEY" -d "{\"formId\":\"$FORM_ID\"}" > /dev/null

# 4. Resolve — now returns formId + versionId
curl -s $BASE/public/form-slots/main-survey

# 5. Duplicate key — 409
curl -s -o /dev/null -w "duplicate key: %{http_code}\n" -X POST $BASE/form-slots -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{"key":"main-survey"}'

# cleanup
curl -s -X DELETE $BASE/form-slots/$SLOT_ID -H "x-api-key: $KEY" -o /dev/null
curl -s -X DELETE $BASE/forms/$FORM_ID -H "x-api-key: $KEY" -o /dev/null
```

**Expected result:** step 2 returns `404`; step 4 returns `{"slot":"main-survey","formId":"...","versionId":"..."}`; step 5 returns `409`.

## Cleaning up test data

```bash
curl -s -X DELETE $BASE/forms/$FORM_ID -H "x-api-key: $KEY"          # deletes a form + its submissions/events, cascading
curl -s -X PATCH $BASE/api-keys/<api-key-id>/revoke                  # revokes the key (doesn't delete it)
```
