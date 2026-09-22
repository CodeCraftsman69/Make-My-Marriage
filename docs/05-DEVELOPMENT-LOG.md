# Make My Marriage Development Log

This document records meaningful product and engineering work completed in the repository. It complements the PRD and design documents: those files describe the intended product, while this log records what has actually been implemented.

## How to maintain this log

- Add an entry for every major feature, vertical slice, architecture change, or substantial redesign.
- Use the date the work was completed or last materially updated.
- State whether the work is `Completed`, `Implemented — pending commit`, `In progress`, or `Blocked`.
- Describe only functionality that exists in the repository. Keep planned work under **Remaining work**.
- Record important product or technical decisions, validation performed, and relevant commits or files.
- Minor typo fixes, formatting changes, and routine maintenance do not require individual entries.

## Entry template

```md
## YYYY-MM-DD — Feature name

**Status:** Completed
**Commit:** `<sha>` or `Pending commit`

### Delivered

- User-visible or engineering outcomes.

### Decisions and constraints

- Important product, architecture, security, or scope decisions.

### Verification

- Tests and checks performed.

### Remaining work

- Explicitly excluded, deferred, or follow-up work.
```

---

## 2026-09-18 — Application technical foundation

**Status:** Completed
**Commit:** `15684e11d2402391efe9c1f371a288afa1b25df3`

### Delivered

- Established the TypeScript and Next.js modular-monolith application structure.
- Added the public, authentication, token-gated, private application, and versioned `/api/v1` route surfaces.
- Added environment validation and MongoDB Atlas connection infrastructure using the native MongoDB driver.
- Added shared HTTP success/error envelopes, application errors, validation primitives, and secure token utilities.
- Added the `/api/v1/health` endpoint with database health reporting.
- Added initial responsive application styling, route placeholders, linting, typechecking, and Node test infrastructure.
- Added environment-variable documentation for MongoDB, sessions, Cloudflare R2, and Resend.

### Product and architecture documentation

- Added the product requirements document: `docs/01-PRD.md.md`.
- Added the system design: `docs/02-SYSTEM-DESIGN.md.md`.
- Added the database design: `docs/03-DATABASE-DESIGN.md.md`.
- Added the REST API design: `docs/04-REST-API-DESIGN.md,.md`.
- Established `weddingId` as the primary business and authorization boundary.
- Established MongoDB Atlas, Cloudflare R2, Resend, secure server-side sessions, and Vercel as the approved V1 architecture.

### Decisions and constraints

- The product remains one Next.js application rather than separate frontend and backend services.
- Domain logic belongs under `src/modules`; provider-specific code belongs under `src/infrastructure`.
- Route handlers remain thin adapters around application use cases.
- The initial release deliberately excludes microservices, queues, Redis, GraphQL, WebSockets, and speculative infrastructure.

### Verification

- Added tests for HTTP response conventions, validation primitives, and secure token behavior.

### Remaining work

- The initial routes for events, family, gallery, guests, tasks, vendors, invitations, notifications, and the wedding website were placeholders rather than completed feature modules.

---

## 2026-09-18 — Authentication and user accounts

**Status:** Completed
**Commit:** `061a06106b5029d1948680e8b27d1f0d1ab99f3b`

### Delivered

- Implemented registration, login, logout, and current-user APIs under `/api/v1/auth`.
- Added registration and login forms with validation and accessible password controls.
- Added user and session repositories backed by MongoDB.
- Added Argon2 password hashing and password verification.
- Added cryptographically secure session-token generation with only token hashes stored in MongoDB.
- Added secure, HttpOnly session-cookie policy with production `__Host-` cookie behavior.
- Added authentication helpers for resolving and requiring the current user.
- Added trusted-origin checks for state-changing authentication requests.
- Added unique database indexes for user email and session-token hashes.
- Added generic invalid-credential behavior and dummy-password verification to reduce account-enumeration timing differences.

### Decisions and constraints

- Authentication uses custom server-side sessions, as required by the system design.
- Raw passwords and raw session tokens are never persisted.
- Client components do not receive database records, password hashes, or server-only provider configuration.

### Verification

- Added coverage for registration, duplicate email handling, successful and failed login, disabled users, session resolution, expiration, logout, cookie policy, and protected helpers.

### Remaining work

- Forgot-password and reset-password pages remain placeholders.
- Family and guest invitation acceptance flows remain future vertical slices.

---

## 2026-09-18 — Wedding workspace creation and membership boundary

**Status:** Completed
**Commit:** `061a06106b5029d1948680e8b27d1f0d1ab99f3b`

### Delivered

- Implemented authenticated wedding creation, listing, retrieval, and update APIs.
- Added the wedding setup form for bride, groom, wedding date, location, relationship, and optional title.
- Created the initial wedding and its owner membership in one MongoDB transaction.
- Added wedding and wedding-member repositories, schemas, types, and mapping functions inside their owning modules.
- Added membership authorization checks before private wedding retrieval and updates.
- Prevented client ownership fields from entering the trusted wedding-creation boundary.
- Added the first authenticated dashboard view with wedding date, location, countdown, and honest empty states.
- Redirected authenticated users without a wedding to setup and users with a wedding to their dashboard.

### Decisions and constraints

- `weddingId` and active membership are enforced as the private-resource boundary.
- Unauthorized and nonexistent weddings use the same not-found behavior to avoid disclosing resource existence.
- The first user creating a wedding becomes its `OWNER`.
- The current experience focuses on one active wedding workspace, matching the initial PRD scope.

### Verification

- Added validation coverage for strict wedding input and rejection of ownership mass assignment.
- Added service coverage for trusted wedding creation and owner membership creation.

### Remaining work

- Events, tasks, guests, guest groups, invitations, RSVP, vendors, family invitations, activity history, gallery, and wedding-website management are documented but not yet implemented.
- The dashboard currently shows empty states for these future modules.

---

## 2026-09-18 — Initial public landing page and brand presentation

**Status:** Completed
**Commit:** `93b85c17e02331d5d3ca05fe5fdd27a7693c1816`

### Delivered

- Added the Make My Marriage SVG wordmark.
- Replaced the public placeholder page with a responsive product landing page.
- Added editorial typography, wedding-oriented product storytelling, feature previews, calls to action, and navigation to registration and login.
- Rendered the local SVG brand asset through the Next.js Image component.
- Added responsive layouts for desktop, tablet, and mobile.

### Decisions and constraints

- The landing page is part of the public route surface and contains no server secrets or private wedding data.
- The product presentation uses static demonstration content rather than pretending to load a real wedding workspace.

### Verification

- The page used the repository's existing lint, typecheck, and build workflow.

### Remaining work

- Product language and visual hierarchy were subsequently refined in the landing-page alignment work below.

---

## 2026-09-22 — Premium landing-page redesign and PRD alignment

**Status:** Completed
**Commit:** This entry is included with the landing-page alignment change.

### Delivered

- Redesigned the public landing page with a quieter, premium editorial direction and realistic Indian-wedding photography.
- Added a responsive split hero, product preview card, benefit strip, feature grid, family-collaboration story, dashboard preview, three-step explanation, wedding-website story, FAQ, final call to action, and footer.
- Reworked the product story to reflect the documented V1 areas:
  - multi-event wedding planning and event timelines;
  - assignable tasks, priorities, due dates, and progress;
  - centralized guests and family groups;
  - event-specific invitations and RSVP;
  - vendor contacts, quotations, documents, notes, assignments, and follow-ups;
  - shared family collaboration and visible activity history;
  - a simple wedding website with explicitly selected public information;
  - family albums and event-organized approved photographs.
- Added gallery and activity-history representation to the feature grid and product preview.
- Added a working `#privacy` target for the footer Privacy link.
- Added local photographs for the ceremony hero, family collaboration, and wedding-website presentation.

### PRD and system-design corrections

- Removed claims that family members can configure granular or event-specific permissions in V1; the PRD specifies common family access initially.
- Removed vendor payment-tracking claims; payment tracking is documented as a future enhancement.
- Removed accommodation and transportation-management claims; these are outside the initial release.
- Removed the implication that guests submit food or travel details through RSVP; the documented RSVP payload is event attendance-focused.
- Clarified that only selected wedding events and approved guest-facing information are published.
- Kept private plans, tasks, vendor notes, and guest data separate from public wedding content.

### Decisions and constraints

- No new runtime dependencies or backend infrastructure were introduced.
- Static demonstration names, dates, tasks, and progress values are presentation content, not application records or credentials.
- The page describes the approved V1 product direction. In the current repository, many of these modules remain planned rather than implemented.
- The layout uses a balanced four-column by two-row feature grid on desktop and responsive two-column or single-column arrangements on smaller screens.

### Verification

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- All 22 automated tests passed.
- `git diff --check` passed.
- The page was visually inspected at desktop and mobile viewport sizes.
- No hard-coded API keys, access keys, database credentials, bearer tokens, or private keys were found in the change.

### Remaining work

- The three files under `public/images/` are currently untracked and must be included in the same commit as the redesigned page.
- A production build remains dependent on access to the Google Fonts service used by the existing root layout; the earlier local build attempt was blocked when that external service was unavailable.
- Events, tasks, guests, RSVP, vendors, family collaboration, activity history, gallery, and wedding-website management still require their own implementation slices before every landing-page capability is usable end to end.
