# API Contract — Assignment 4

**Status:** ✅ Agreed by Denis (backend) and Yael (frontend) — 2026-06-19
**Purpose:** the single source of truth for the frontend↔backend boundary on the A4 features
(AI image analysis, saving AI meals, and the Socket.IO live updates). If anything here changes,
change it via a Pull Request so both sides review it — do not diverge silently.

Related issues: #4, #5, #6, #7, #8, #9, #11.

---

## 1. REST endpoints

All responses use the standard envelope. The frontend's `services/api.js` `request()` helper
unwraps and returns `data` on success, and throws `Error(error.message)` on failure.

### `POST /api/ai/analyze-image`
- **Request:** `multipart/form-data` — required field **`image`** (the photo), optional `mealDate`.
- **Auth:** sends the existing `x-user-id` / `x-user-role` headers (no body `userId`).
- **Success `data`:**
```json
{
  "analysisId": "uuid-or-temp-id",
  "imagePath": "uploads/generated-file.jpg",
  "modelName": "gemini-vision-model",
  "detectedItems": [
    {
      "clientItemId": "item-1",
      "foodName": "chicken breast",
      "estimatedPortionGrams": 180,
      "confidence": 0.87,
      "calories": 297, "protein": 55.8, "carbs": 0, "fat": 6.5
    }
  ],
  "totals": { "calories": 297, "protein": 55.8, "carbs": 0, "fat": 6.5 },
  "nextStep": "review_and_confirm"
}
```

### `POST /api/meals/from-ai`
- **Request:** JSON. Frontend sends `analysisId`, `mealName`, `mealDate`, `imagePath`, reviewed `items[]`.
- **Owner:** derived server-side from `x-user-id`. The frontend does **not** send a trusted `userId`.
- **Note the field rename:** analysis returns `estimatedPortionGrams`; on save the frontend maps the
  (possibly user-edited) value to **`confirmedPortionGrams`**.
```json
{
  "analysisId": "uuid-or-temp-id",
  "mealName": "AI reviewed lunch",
  "mealDate": "2026-06-19",
  "imagePath": "uploads/generated-file.jpg",
  "items": [
    { "foodName": "chicken breast", "confirmedPortionGrams": 180,
      "calories": 297, "protein": 55.8, "carbs": 0, "fat": 6.5 }
  ]
}
```
- **Success `data`:** `{ "mealId": 12, "meal": { ...savedMeal } }`

### `GET /dashboard/today` (existing endpoint, reused)
Used by the frontend to **re-fetch** the dashboard after a `dashboard:updated` socket event (see §3).

### Error envelope (all endpoints)
```json
{ "success": false, "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "Human readable message", "details": {} } }
```

---

## 2. Socket.IO events

| Event | Direction | Payload |
|---|---|---|
| `presence:join` | client → server | `{ userId, fullName }` |
| `presence:updated` | server → clients | `{ onlineUsers: [{ userId, fullName }] }` |
| `meal:created` | server → clients | `{ mealId, userId, mealDate, mealName, totals }` |
| `dashboard:updated` | server → clients | `{ userId, date, mealId }` (signal only — see §3.5) |
| `notification:new` | server → clients (optional) | `{ type, message, mealId }` |

---

## 3. Agreed conventions (the decisions both sides follow)

**3.1 Image upload bypasses the JSON helper.**
The image goes up as `multipart/form-data` via a dedicated frontend upload function (NOT the JSON
`request()` wrapper). The frontend must **not** set a `Content-Type` header for it — the browser sets
the multipart boundary itself. The file field is named **`image`**.

**3.2 Mocks mirror this contract exactly.**
The frontend builds against mock fixtures whose shape is a byte-for-byte copy of the JSON above, so
swapping mock → real backend requires no UI changes.

**3.3 Socket connection location & lifecycle.**
Socket.IO runs on the **same origin as the API (`http://localhost:3000`)**. The client connects
**after login**, emits `presence:join` with the logged-in user's `{ userId, fullName }`, and
**disconnects on logout**.

**3.4 Targeting: broadcast + client-side filter.**
The server **broadcasts** events to all clients and includes `userId` in every payload. The **client
filters** by comparing `payload.userId` to the logged-in user and ignores events that aren't theirs.
(The backend does not need per-user "rooms".)

**3.5 `dashboard:updated` is a signal, not data.**
The event is a *nudge* meaning "your dashboard changed." On receiving it (after the userId filter),
the client **re-fetches `GET /dashboard/today`** rather than reading numbers from the payload. This
keeps the live view identical to a manual refresh and avoids payload-shape drift.

**3.6 Image limits (validated on BOTH sides).**
Allowed types: **`jpg`, `jpeg`, `png`, `webp`**. Max size: **5 MB**. The frontend validates before
upload (friendly message); the backend enforces the same rule.

**3.7 Meal name is supplied by the frontend.**
The AI analysis returns foods but no meal name. The frontend provides `mealName` (user-editable,
default `"AI meal – <YYYY-MM-DD>"`). The backend stores whatever name it receives.

**3.8 Dates use a shared local `YYYY-MM-DD` helper.**
Frontend, backend, and tests all format dates with the same local-date helper. Do **not** use raw
`new Date().toISOString()` (it is UTC-shifted and can land on the wrong day). The dashboard's "today"
uses the real current local date (see #9).

---

## Change log
- **2026-06-19** — initial agreed version (Denis + Yael).
