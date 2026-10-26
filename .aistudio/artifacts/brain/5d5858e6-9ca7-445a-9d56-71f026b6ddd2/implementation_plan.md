# Vercel Serverless Image Persistence & Display Architecture

Resolve the root causes preventing uploaded product photos from displaying on Vercel deployments by routing `/uploads/(.*)` to the serverless function, utilizing `/tmp` for writable disk caching in serverless environments, and awaiting MongoDB Atlas photo persistence before sending responses.

## User Review & Critical Decisions

> [!IMPORTANT]
> The confirmed choices from the clarifying questions have been incorporated into this architecture:
> - **MongoDB Atlas Persistence**: The user confirmed `MONGODB_URI` is configured in Vercel settings.
> - **Serverless Routing Strategy**: Route `/uploads/(.*)` directly through the serverless function (`/api`) so Vercel does not attempt to serve dynamic runtime uploads from the static build assets, and await cloud database persistence on upload.

- **Confirmed Decision 1**: Add rewrite in `vercel.json` routing `/uploads/(.*)` to the Express serverless function `/api`.
- **Confirmed Decision 2**: Ensure `src/server/app.ts` uses `/tmp/sashroyi_uploads` when `VERCEL` is detected, preventing `EROFS` read-only errors.
- **Confirmed Decision 3**: Explicitly `await savePhotoToMongo(...)` in `POST /api/upload` before sending `res.json()`, preventing premature Lambda execution freezing.

---

### 1. Overview & Core Concept

- **The Problem on Vercel**:
  1. **Missing Rewrite in `vercel.json`**: Vercel currently only rewrites `/api/(.*)` to `/api`. When the browser requests `/uploads/img_....jpg`, Vercel searches the static build output (`dist`), finds nothing, and returns a 404 or falls back to SPA `index.html`. Express's `/uploads/:filename` route is never triggered.
  2. **Read-Only Serverless Filesystem**: In Vercel serverless functions, `process.cwd()/uploads` is read-only. Calling `fs.writeFileSync()` on it throws `EROFS: read-only file system`. The only writable directory in Lambda is `/tmp`.
  3. **Un-Awaited Serverless Promise**: `savePhotoToMongo()` was called in the background without `await`. In serverless functions, when `res.json()` returns, the Lambda process immediately freezes or terminates, aborting the MongoDB network write before completion.
  4. **Cold Start Connection**: On cold starts, `getPhotoFromMongo()` may run before MongoDB has established a connection.

- **The Solution**:
  1. Update `vercel.json` to route `/uploads/(.*)` to `/api` and apply long-lived edge cache headers.
  2. Detect serverless runtime (`process.env.VERCEL`) and point `uploadsDir` to `/tmp/sashroyi_uploads`.
  3. Change `POST /api/upload` to `await savePhotoToMongo(...)` before returning the response.
  4. In `GET /uploads/:filename`, call `await ensureMongoReady()` if the file is not yet cached in `/tmp`, pull the photo from MongoDB, cache it to `/tmp`, and serve it with proper binary headers.

---

### 2. User Experience & Visual Integrity

- **Storefront & Admin Experience**:
  - Newly uploaded product and category photos appear instantly in both admin edit modals and public product cards.
  - Zero broken image icons or fallbacks on Vercel.
  - Images load quickly via Vercel Edge caching and local `/tmp` rehydration.

---

### 3. Key Technical Decisions & Trade-Offs

- **Decision 1: Rewrite `/uploads/(.*)` in `vercel.json`**
  - *Chosen Approach*: Route `/uploads/(.*)` to `/api`, handled by the Express serverless function.
  - *Why*: Allows the existing image URL format (`/uploads/img_....jpg`) to work identically in local development, production Docker, and Vercel serverless without breaking database image paths.
  - *Alternatives Considered*: Changing all URLs to `/api/uploads/img_....jpg`. Rejected because existing products stored in MongoDB with `/uploads/...` would fail.

- **Decision 2: Await MongoDB Atlas Photo Insert in `POST /api/upload`**
  - *Chosen Approach*: `await savePhotoToMongo(...)`.
  - *Why*: Mandatory for serverless functions. Eliminates process freeze race conditions where Lambdas terminate before background MongoDB inserts finish.

- **Decision 3: Serverless-Aware `uploadsDir` (`/tmp`)**
  - *Chosen Approach*: `const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);` and use `/tmp/sashroyi_uploads`.
  - *Why*: Eliminates `EROFS: read-only file system` errors on Vercel while maintaining local `process.cwd()/uploads` for local dev.

---

### 4. Technical Architecture & Request Flow

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                  │
│                                                        │
│  GET /uploads/img_xyz.jpg                              │
│       │                                                │
│       ▼                                                │
│  vercel.json rewrite rule:                             │
│  "/uploads/(.*)" -> "/api"                             │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Vercel Serverless Function (/api)          │
│                      (api/index.ts)                    │
│                                                        │
│  app.get('/uploads/:filename')                         │
│  1. Check /tmp/sashroyi_uploads/img_xyz.jpg            │
│     Found? -> Return cached file (200 OK)              │
│                                                        │
│  2. Not in /tmp?                                       │
│     -> await ensureMongoReady()                        │
│     -> await getPhotoFromMongo('img_xyz.jpg')          │
│     -> Write buffer to /tmp/sashroyi_uploads/          │
│     -> Return image buffer with Content-Type & Cache   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  MongoDB Atlas Cluster                 │
│             Collection: 'photos' (Permanent)           │
│             Doc: { name: 'img_xyz.jpg', data: ... }    │
└────────────────────────────────────────────────────────┘
```

- **Execution Steps**:
  1. **Update `vercel.json`**:
     - Add rewrite for `/uploads/(.*)` to `/api`.
     - Add headers for `/uploads/(.*)` with `Cache-Control: public, max-age=31536000, immutable`.
  2. **Update `src/server/app.ts`**:
     - Detect `isServerless` and set `uploadsDir` to `/tmp/sashroyi_uploads` when on Vercel.
     - In `POST /api/upload`: `await savePhotoToMongo(...)` before returning JSON response.
     - In `GET /uploads/:filename`: `await ensureMongoReady()` before `getPhotoFromMongo(filename)` to handle cold-start serverless connections.
  3. **Verification**:
     - Run `compile_applet` and `lint_applet` to ensure zero compilation or type issues.
     - Restart dev server and verify local & serverless image routes.
