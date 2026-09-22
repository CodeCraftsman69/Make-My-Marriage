# Make My Marriage Engineering Rules

## Architecture

- Build a TypeScript Next.js modular monolith deployed as one application on Vercel.
- Do not introduce a separate Express backend, microservices, GraphQL, queues, Redis, Kafka, WebSockets, or background infrastructure without explicit approval.
- Keep the public, authentication, token-gated, private application, and `/api/v1` route surfaces distinct.
- Add dependencies only when they are required for the current vertical slice and have been approved.

## Domain ownership

- Business logic belongs in its owning directory under `src/modules`.
- Domain-specific validation, data access, types, and components stay with that domain.
- Do not create global `services`, `models`, `controllers`, or `repositories` directories.
- Keep `src/shared` limited to genuinely domain-neutral code.
- Avoid circular module dependencies. Expose narrow module APIs instead of importing another module's internals.

## HTTP and validation

- Next.js Route Handlers are thin HTTP adapters. They parse requests, invoke application use cases, and map results to HTTP responses.
- Validate untrusted input with Zod before it reaches business logic or data access.
- Never trust client-provided ownership fields such as `weddingId`, `createdBy`, or `uploadedBy` when they can be derived from authenticated server context.
- Keep REST endpoints versioned under `/api/v1` and use the documented response and error conventions.

## Security and data

- MongoDB Atlas is the primary database. Use the native MongoDB driver unless the architecture is explicitly revised.
- `weddingId` is the primary business and security boundary.
- Every private wedding request must establish authentication, wedding membership, and resource ownership within that wedding.
- Authentication uses custom server-side sessions with secure HttpOnly cookies. Store hashes, never raw session, reset, or invitation tokens.
- Do not expose secrets or server-only providers to client components.

## External providers

- Cloudflare R2 stores files; browsers upload directly using server-authorized presigned URLs.
- Resend provides transactional email.
- Provider-specific implementation details belong under `src/infrastructure`, behind small internal interfaces.
- Actual file bytes do not belong in MongoDB; store R2 object keys and metadata.

## Delivery discipline

- Implement small vertical slices and do not scaffold empty internals for future domains.
- Do not invent requirements beyond the PRD and approved design documents.
- Prefer the simplest implementation that satisfies V1 requirements.
- Run lint, typecheck, relevant tests, and build when the local toolchain is available. Fix only issues introduced by the current change.
- For every major feature, vertical slice, architecture change, or substantial redesign, update `docs/05-DEVELOPMENT-LOG.md` in the same change. Record delivered scope, important decisions and constraints, verification performed, and explicit remaining work. Do not add individual entries for trivial fixes or formatting-only changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
