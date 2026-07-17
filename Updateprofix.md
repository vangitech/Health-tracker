# SugarCare — Prioritized Fix Plan

## Phase 1: Critical Bugs (ship-stopping)

1. **Fix the unit mismatch (mg/dL vs mmol/L)**
   - Standardize on **mmol/L** (consistent with UI labels and medical standards outside the US)
   - Update Mongoose `BloodSugarEntry.glucoseValue` `max: 600` → `max: 33.3`
   - Audit all thresholds, ranges, and A1C calculations in `routes/trends.js` to use mmol/L
   - Update frontend chart scales and stats calculations to match

2. **Delete `backend/routes/oauth.js`** (161 lines of dead code)
   - Consolidate remaining OAuth paths (custom Google callback in `index.js` + Auth.js) into **just Auth.js**
   - Remove the manual Google code exchange at `index.js:81-151`

## Phase 2: Security (P0)

3. **Rotate all credentials** in `backend/.env`
   - MongoDB password, JWT secret, Resend API key, Cloudinary keys

4. **Add rate limiting**
   - `express-rate-limit` on `/api/auth/login`, `/api/auth/register`, `/api/auth/resend-code`
   - e.g., 5 attempts per 15-minute window

5. **Fix `PUT /api/entries/:id`**
   - Replace `Object.assign(entry, req.body)` with whitelisted field assignment
   - Only allow: `glucoseValue`, `date`, `time`, `mealType`, `foodEaten`, `carbs`, `insulinUnits`, `notes`
   - Prevent `userId` overwrite

6. **Move JWT to httpOnly cookies**
   - Both patient and admin auth
   - httpOnly + `SameSite=Strict` prevents XSS token theft

## Phase 3: Reliability & DX

7. **Fix port references in docs** — Update all 4 `.md` files from port 5000 → 5001:
   - `QUICK_REFERENCE.md`, `SETUP_TESTING_GUIDE.md`, `OAUTH_EMAIL_SETUP.md`, `DEVELOPER_NOTES.md`

8. **Populate `frontend/.env`** — Set `VITE_API_URL=http://localhost:5001`

9. **Dependency cleanup**
   - Move `shadcn` from `dependencies` → `devDependencies`
   - Remove unused `@types/react` / `@types/react-dom`

10. **Add Prettier config** + format codebase. Add Husky + lint-staged for pre-commit linting.

## Phase 4: Testing

11. **Write actual tests**
    - Backend: integration tests for auth flow, entries CRUD, admin endpoints (Jest + supertest)
    - Frontend: component tests for EntryForm, StatsCard (Vitest + Testing Library)

12. **Set up CI** — GitHub Actions: lint → test → build on every PR

## Phase 5: Pay down tech debt

13. **Rename consistently** — Pick one app name ("SugarCare"), update package names, HTML title, UI headers

14. **Remove empty/useless files** — `App.css`, empty `backend/.gitignore`

15. **Add `.env` validation at startup** — crash early if required environment variables are missing

## Deferred

- **TypeScript migration** — too costly mid-cycle for a pure JS project
- **Capacitor / native builds** — only if mobile is actively being shipped
- **Admin panel UX overhaul** — functional; polish is lower priority than the above
