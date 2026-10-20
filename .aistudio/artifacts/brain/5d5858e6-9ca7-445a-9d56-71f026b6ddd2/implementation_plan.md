# Header-Delivered JWT & Minimal Message-Only Response Security

An ultra-clean, hardened security architecture where authentication tokens are delivered exclusively via HTTP Response Headers, and API response bodies contain only status messages, completely removing user data, roles, and token strings from JSON bodies.

### User Review & Critical Decisions

> [!IMPORTANT]
> In direct accordance with your exact specification:
> 1. **JWT Exclusively in HTTP Response Header**: The server sends the JWT token in standard HTTP response headers (`Authorization: Bearer <token>` and `X-Auth-Token: <token>`) with `Access-Control-Expose-Headers` enabled.
> 2. **Message-Only JSON Response Body**: The JSON body for `/api/auth/login`, `/api/auth/register`, and `/api/auth/me` will contain only:
>    ```json
>    {
>      "success": true,
>      "message": "সফলভাবে লগইন হয়েছে"
>    }
>    ```
>    All user objects (`id`, `name`, `email`, `phone`, `role`, `createdAt`) and token strings are completely removed from the JSON body.
> 3. **Client-Side Header Extraction & Claims Decoding**: The client (`api.ts` & `AuthContext`) reads the token directly from `response.headers.get('Authorization')` (or `X-Auth-Token`), decodes the cryptographic payload in memory to establish user state and role, and passes the Bearer token on all subsequent requests.
> 4. **Authoritative Server Verification**: All sensitive routes (`/api/admin/*`, `/api/orders/*`) verify the token signature and re-verify the active user record against the database. Any client-side tampering results in instant HTTP 401/403 rejection, session purge, and redirect to login.

- **Confirmed Decision 1**: Deliver JWT strictly via HTTP response headers (`Authorization` / `X-Auth-Token`).
- **Confirmed Decision 2**: Keep JSON response body strictly to `{ success: true, message: "..." }`, with zero user or role data exposed in the body.
- **Confirmed Decision 3**: The frontend retrieves the token from the response header, safely decodes identity claims in memory, and purges credentials on any tampering or permission rejection.

---

### 1. Overview & Core Concept

- **What It Does**: Streamlines the authentication API response to the cleanest possible security posture: credentials travel in HTTP headers, while the body carries only human-readable feedback.
- **Target Audience / Persona**: Merchants, store administrators, and fulfillment managers who require zero unauthorized role leaks and total protection against browser tampering.
- **Key Value**: Prevents unauthorized users or eavesdroppers from viewing, editing, or spoofing user objects and roles in body payloads.

---

### 2. User Experience & Security Workflow

- **Login Workflow**:
  - User submits credentials on the login form.
  - Server validates credentials, generates a signed HMAC-SHA256 JWT, sets `res.setHeader('Authorization', 'Bearer ' + token)` and `res.setHeader('X-Auth-Token', token)`.
  - Server sends minimal body: `{ "success": true, "message": "সফলভাবে লগইন হয়েছে" }`.
  - Frontend intercepts the response, extracts the token from headers, decodes `{ sub, name, email, role }` in memory, and updates the application state.
- **Session Validation & Verification**:
  - On page load, `api.getMe()` sends `Authorization: Bearer <token>`.
  - Server verifies the token and re-checks the database record. It returns `{ "success": true, "message": "সেশন সক্রিয় আছে" }` with the fresh token in the response header.
  - If a user tries to alter their role or token in the browser, the server detects the HMAC mismatch, rejects with 401/403, and the client automatically purges all stored credentials and displays a security alert.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Delivering JWT in Headers vs. Body**:
  - *Chosen Approach*: Send token in `Authorization` and `X-Auth-Token` response headers with `Access-Control-Expose-Headers`.
  - *Why*: Exactly what you requested. Keeps HTTP body payload clean, prevents body-level JSON parsing attacks, and aligns with standard REST protocol conventions.

- **Decision 2: Message-Only Response Body**:
  - *Chosen Approach*: Response body strictly contains `{ success: true, message: "..." }`.
  - *Why*: Completely removes sensitive account metadata from network body inspections.

- **Decision 3: Zero-Trust Database Checks**:
  - *Chosen Approach*: Server validates token signature and looks up the authoritative database record on every protected request.
  - *Why*: Eliminates privilege escalation even if someone tries to create custom tokens.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                              │
│                                                                        │
│  1. POST /api/auth/login { identifier, password }                      │
│  2. Read response headers: res.headers.get('Authorization')            │
│  3. Read response body: { success: true, message: "..." }              │
│  4. Decode token claims in memory: { sub, name, email, role }          │
│  5. Store token in localStorage ('oshesh_auth_token')                  │
│  6. Subsequent requests send Header: Authorization: Bearer <token>     │
│  7. If 401/403 returned -> wipe localStorage and force logout          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP Request / Response
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Server Auth Layer                               │
│                                                                        │
│  - Response Middleware:                                                │
│      res.setHeader('Access-Control-Expose-Headers',                    │
│                    'Authorization, X-Auth-Token')                      │
│      res.setHeader('Authorization', `Bearer ${token}`)                 │
│      res.setHeader('X-Auth-Token', token)                              │
│      res.json({ success: true, message: "সফলভাবে লগইন হয়েছে" })        │
│                                                                        │
│  - Request Middleware (authenticateUser & requireRole):                │
│      verifyAuthToken(token) -> extracts sub (user ID)                  │
│      db.users.find(u => u.id === decoded.sub)                          │
│      Checks active status & role permissions                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Verified DB Authorization
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Authoritative Database                          │
│   (Local JSON Database / MongoDB Atlas)                                │
└────────────────────────────────────────────────────────────────────────┘
```

#### Files to be Updated Upon Approval:
1. **`src/server/routes/auth.ts`**:
   - Set `Authorization` and `X-Auth-Token` headers and expose headers on login, register, and me endpoints.
   - Change response body to `{ success: true, message: "..." }`.
2. **`src/server/auth.ts`**:
   - Secure token secret generation, verify HMAC signatures, and enforce database role verification.
3. **`src/lib/api.ts`**:
   - In `request()`, inspect response headers to extract new or refreshed tokens.
   - Add lightweight JWT decoder `parseJwtPayload(token)` to extract claims from the signed token.
   - Update `login()`, `register()`, and `getMe()` return types.
4. **`src/context/AuthContext.tsx`**:
   - Populate `user` and `isAdmin` states from decoded JWT claims.
   - Auto-logout on 401/403 responses.
