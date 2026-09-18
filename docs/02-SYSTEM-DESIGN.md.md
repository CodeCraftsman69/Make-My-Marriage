# Make My Marriage
## System Design — Version 1.0

---

# 1. Purpose

This document describes the initial technical architecture for **Make My Marriage**.

The system is designed as a lightweight, maintainable V1 that supports:

- Wedding management
- Event management
- Task management
- Guest management
- RSVP
- Vendor management
- Family collaboration
- Wedding website
- Photo gallery
- Email invitations
- Family-member invitations

The architecture intentionally avoids unnecessary infrastructure and distributed-system complexity.

---

# 2. Architecture Goals

The architecture should be:

- Simple to develop
- Simple to deploy
- Easy to maintain
- Secure enough for private family data
- Cost-effective for V1
- Scalable enough for early production usage
- Modular enough to evolve later
- Friendly to a small development team

The system should avoid premature adoption of:

- Microservices
- Kubernetes
- Kafka
- Redis
- Complex queues
- Dedicated image-processing pipelines
- Dedicated authentication platforms

---

# 3. High-Level Technology Stack

## Application Framework

Next.js

## Programming Language

TypeScript

## Runtime

Node.js

## Architecture Style

Modular Monolith

## Input Validation

Zod

## Authentication

Custom authentication

## Database

MongoDB Atlas

## File and Image Storage

Cloudflare R2

## CDN

Cloudflare CDN

## Email

Resend

## Deployment

Vercel

---

# 4. High-Level Architecture

```text
                         USERS
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Family Members                  Guests
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                    makemymarriage.in
                           │
                           ▼
                        Vercel
                 ┌──────────────────┐
                 │     Next.js      │
                 │    TypeScript    │
                 │                  │
                 │ Modular Monolith │
                 └────────┬─────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼

      MongoDB Atlas   Cloudflare R2    Resend
            │             │             │
            │             ▼             │
            │       Cloudflare CDN      │
            │                           │
            └───────────────────────────┘
```

---

# 5. Architecture Style

Make My Marriage will use a **Modular Monolith**.

This means:

- One codebase
- One deployable application
- One primary database
- Clear internal business modules

We will not build separate microservices for:

- Events
- Guests
- Tasks
- Vendors
- Notifications
- Gallery

during V1.

The goal is to keep deployment simple while still maintaining good separation between business domains.

---

# 6. Modular Monolith Domains

The application will be internally divided into modules.

```text
Application

├── Auth
│
├── Users
│
├── Wedding
│
├── Family Members
│
├── Events
│
├── Tasks
│
├── Guests
│
├── Guest Groups
│
├── Invitations
│
├── RSVP
│
├── Vendors
│
├── Gallery
│
├── Wedding Website
│
├── Notifications
│
└── Activity
```

Each module should own its:

- Validation
- Business rules
- Application logic
- Data-access logic

Modules may communicate internally but should avoid tightly coupling their implementation details.

---

# 7. Application Layering

A typical request should follow this structure:

```text
UI / Client
     ↓
Route Handler / Server Action
     ↓
Validation
     ↓
Authentication
     ↓
Authorization
     ↓
Application Service
     ↓
Business Logic
     ↓
Repository / Data Access
     ↓
MongoDB Atlas
```

Business logic should not be written directly inside HTTP route handlers.

For example:

```text
POST /api/tasks
       ↓
Validate input
       ↓
Authenticate user
       ↓
Verify wedding membership
       ↓
Task Service
       ↓
Task Repository
       ↓
MongoDB
```

---

# 8. Next.js Responsibilities

Next.js will be responsible for both frontend and backend responsibilities.

It will handle:

- Web pages
- Server rendering
- Client-side interactions
- API endpoints
- Authentication
- Sessions
- Business logic
- Database access
- R2 upload authorization
- Email integration

There will be no separate Express backend in V1.

---

# 9. Application Surfaces

The application has three distinct access surfaces.

---

# 10. Public Surface

Public routes do not require authentication.

Examples:

```text
/
```

Marketing / landing page.

```text
/w/{weddingSlug}
```

Published wedding website.

Only information explicitly selected for publication should appear on the public wedding website.

Private information such as:

- Internal tasks
- Vendor notes
- Family notes
- Private guest information

must never automatically become public.

---

# 11. Token-Gated Surface

Some pages are accessible through secure tokens instead of login.

Examples:

```text
/invite/{token}
```

Guest invitation and RSVP.

```text
/join/{token}
```

Family-member invitation.

These URLs are not publicly discoverable pages.

Possession of a valid secure token allows the user to access the associated invitation flow.

---

# 12. Private Surface

Private application routes require authentication.

Example:

```text
/app/dashboard

/app/wedding

/app/events

/app/tasks

/app/guests

/app/vendors

/app/family

/app/gallery

/app/settings
```

A private request must pass three checks:

```text
Authenticated?
      ↓
Member of the wedding?
      ↓
Requested resource belongs to that wedding?
      ↓
Allow access
```

---

# 13. Authentication Architecture

Authentication will be developed inside the application.

V1 will support:

- Email
- Password
- Login
- Logout
- Sessions
- Password reset

V1 will not initially support:

- Google login
- OAuth
- Phone OTP
- Two-factor authentication
- Passkeys
- Enterprise SSO

---

# 14. Registration Flow

```text
User enters:

Name
Email
Password

      ↓

Zod Validation

      ↓

Check whether email already exists

      ↓

Hash password

      ↓

Create user

      ↓

Create session

      ↓

Set secure cookie

      ↓

Redirect to wedding onboarding
```

Email verification will not be required during V1 registration.

Email-format validation should still be performed.

---

# 15. Password Storage

Passwords must never be stored as plaintext.

Password hashing should use:

**Argon2id**

Example conceptually:

```text
password
    ↓
Argon2id
    ↓
passwordHash
    ↓
MongoDB
```

Only the password hash is stored.

---

# 16. Session-Based Authentication

The system will use server-side sessions instead of JWT-based authentication.

Flow:

```text
Login
   ↓
Verify credentials
   ↓
Generate cryptographically secure random session token
   ↓
Store session in MongoDB
   ↓
Send session token through secure cookie
```

MongoDB session record:

```text
Session

id
userId
tokenHash
createdAt
expiresAt
lastUsedAt
```

The raw session token should not be stored in MongoDB.

Only:

```text
hash(sessionToken)
```

should be stored.

---

# 17. Session Cookie

The session cookie should use secure browser settings.

Conceptually:

```text
HttpOnly = true

Secure = true

SameSite = Lax

Path = /
```

JavaScript running in the browser should not have direct access to the session token.

Authentication tokens should not be stored in:

```text
localStorage
```

or

```text
sessionStorage
```

---

# 18. Current User Resolution

Private server operations can use a helper such as:

```text
getCurrentUser()
```

or:

```text
requireAuth()
```

Conceptual flow:

```text
Request
   ↓
Read session cookie
   ↓
Hash session token
   ↓
Find session
   ↓
Check expiration
   ↓
Load user
   ↓
Return authenticated user
```

---

# 19. Authentication vs Authorization

Authentication answers:

```text
Who is this user?
```

Example:

```text
User ID: U123
```

Authorization answers:

```text
Can this user access this wedding?
```

Example:

```text
User U123
   ↓
Wedding Member
   ↓
Wedding W456
```

These must remain separate concerns.

---

# 20. Wedding Membership

A user should not automatically have access to wedding information merely because they know a resource ID.

Every private wedding resource must be scoped to a wedding.

Conceptually:

```text
User
  ↓
Wedding Membership
  ↓
Wedding
```

Resources such as:

- Event
- Task
- Guest
- Vendor
- Photo

should belong to a wedding.

---

# 21. Wedding as Security Boundary

Most business entities should logically include:

```text
weddingId
```

Example:

```text
Task

id
weddingId
eventId
assignedTo
...
```

When fetching a task:

```text
Authenticated User
      ↓
Check wedding membership
      ↓
Check Task.weddingId
      ↓
Return task
```

This prevents one wedding family from accessing another wedding's data.

---

# 22. Family Member Invitation Flow

An existing family member creates an invitation.

```text
Family Member
      ↓
Invite Member
      ↓
Enter:
Name
Relationship
Email
      ↓
Generate secure invitation token
      ↓
Send invitation through Resend
      ↓
Recipient opens /join/{token}
```

---

# 23. Family Invitation Token

Invitation tokens should:

- Be cryptographically random
- Expire
- Be single-use
- Belong to one wedding
- Become invalid after acceptance

The raw token should not be stored in MongoDB.

Instead:

```text
Generate Token
      ↓
Send raw token in URL
      ↓
Hash token
      ↓
Store tokenHash
```

Invitation record conceptually:

```text
WeddingInvitation

id

weddingId

invitedBy

inviteeName

inviteeEmail

relationship

tokenHash

status

expiresAt

acceptedBy

createdAt

acceptedAt
```

Possible status:

```text
PENDING

ACCEPTED

EXPIRED

REVOKED
```

---

# 24. Invitation Acceptance

If recipient already has an account:

```text
Open invite
    ↓
Login
    ↓
Accept invitation
    ↓
Create Wedding Membership
```

If recipient does not have an account:

```text
Open invite
    ↓
Register
    ↓
Accept invitation
    ↓
Create Wedding Membership
```

No email verification is required for this process during V1.

---

# 25. Guest Authentication

Wedding guests do not require accounts.

Their access is token-based.

```text
Guest receives invitation link

        ↓

/invite/{token}

        ↓

View invitation

        ↓

View invited events

        ↓

Submit RSVP
```

This avoids forcing guests to:

- Register
- Create password
- Login
- Verify email

---

# 26. Guest Invitation Tokens

Guest invitation tokens should follow similar security rules:

- Strong random token
- Difficult to guess
- Associated with guest/group
- Associated with wedding
- May expire if required
- Token stored as hash where appropriate

---

# 27. Password Reset

Password recovery uses Resend.

Flow:

```text
Forgot Password
      ↓
Enter Email
      ↓
Generate reset token
      ↓
Store reset token hash
      ↓
Send email through Resend
      ↓
/reset-password/{token}
      ↓
User enters new password
      ↓
Update password hash
      ↓
Invalidate existing sessions
```

Reset tokens should be short-lived.

Exact expiration duration is still an implementation decision.

---

# 28. Input Validation

Zod will be used for runtime validation.

Examples:

- Registration
- Login
- Wedding creation
- Event creation
- Task creation
- Guest creation
- RSVP
- Vendor creation
- File upload metadata
- Invitation acceptance

Example conceptually:

```text
Incoming Request
      ↓
Zod Schema
      ↓
Valid?
  │       │
 YES      NO
  │       │
Continue  Return validation error
```

---

# 29. MongoDB Atlas

MongoDB Atlas will be the primary application database.

Atlas will store:

- Users
- Sessions
- Weddings
- Memberships
- Events
- Tasks
- Guests
- Guest groups
- Invitations
- RSVP
- Vendors
- Gallery metadata
- Notifications
- Activity logs

Binary files should not be stored inside MongoDB.

---

# 30. Initial Collection Areas

Likely collections include:

```text
users

sessions

weddings

weddingMembers

events

eventTimelineItems

tasks

guestGroups

guests

guestInvitations

rsvps

familyInvitations

vendors

photos

albums

notifications

activityLogs

passwordResetTokens
```

Exact MongoDB schema design has not yet been finalized.

The decision between:

- embedded documents

and

- referenced collections

will be handled separately during detailed data-model design.

---

# 31. File Storage

Cloudflare R2 will store:

- Wedding photos
- Event images
- Cover photos
- Vendor documents
- Quotations
- Attachments

Files should not flow through the Next.js application server unless absolutely necessary.

---

# 32. Direct Upload Architecture

Preferred upload flow:

```text
Browser
   ↓
Request upload permission
   ↓
Next.js
   ↓
Authenticate user
   ↓
Verify wedding membership
   ↓
Validate metadata
   ↓
Generate R2 presigned upload URL
   ↓
Browser
   ↓
Upload directly to Cloudflare R2
```

This avoids:

```text
Browser
→ Next.js server
→ File memory
→ R2
```

for large files.

---

# 33. Media Metadata

MongoDB should store file metadata rather than file binaries.

Example:

```text
Photo

id

weddingId

eventId

albumId

uploadedBy

fileName

storageKey

mimeType

fileSize

visibility

createdAt
```

---

# 34. Image Processing

There will be no dedicated image-processing pipeline in V1.

We will not initially implement:

- Sharp workers
- Image resizing workers
- Lambda functions
- Thumbnail pipeline
- Compression service
- Image queue

Images will be stored and served largely as uploaded.

Reasonable file-size restrictions may be used to protect performance and storage usage.

---

# 35. Cloudflare CDN

Cloudflare CDN will serve public media.

Example domain:

```text
media.makemymarriage.in
```

Potential public assets include:

- Wedding website hero image
- Published wedding photos
- Public event images

---

# 36. Public vs Private Media

Media should be separated conceptually into:

```text
PUBLIC
```

and:

```text
PRIVATE
```

Public media may be delivered through the CDN.

Private media should require authorization.

Examples of private content:

- Family gallery
- Vendor quotations
- Internal documents

---

# 37. R2 Bucket Strategy

A simple model may use:

```text
mmm-public
```

and:

```text
mmm-private
```

Public bucket:

- Published wedding website assets
- Published gallery images
- Public event images

Private bucket:

- Family-only gallery
- Vendor documents
- Quotations
- Internal files

Exact bucket design can be finalized during implementation.

---

# 38. Private File Access

For V1, private files can be delivered through short-lived presigned R2 URLs.

Flow:

```text
User requests private photo
        ↓
Next.js authentication
        ↓
Wedding authorization
        ↓
Generate short-lived signed URL
        ↓
Browser accesses file
```

This avoids introducing Cloudflare Workers solely for private-media authorization during V1.

---

# 39. Gallery Upload

Gallery should support multiple-file uploads.

Conceptually:

```text
Select Photos
      ↓
Validate files
      ↓
Request upload URLs
      ↓
Upload limited number concurrently
      ↓
Create photo metadata
      ↓
Display in gallery
```

Upload concurrency should be limited rather than uploading hundreds of files simultaneously.

---

# 40. Gallery States

Simple states are sufficient:

```text
UPLOADING

READY

FAILED

DELETED
```

No:

```text
PROCESSING
```

state is needed because V1 has no image-processing pipeline.

---

# 41. Email Architecture

Resend will provide transactional email.

Use cases:

- Family-member invitations
- Password reset
- Guest invitation email
- Optional event reminders
- Optional task reminders

---

# 42. Email Service Boundary

Application modules should not communicate with Resend directly.

Instead use an internal email service.

Conceptually:

```text
Wedding Module
      ↓
Email Service
      ↓
Resend
```

Example function:

```text
sendFamilyInvitation()
```

or:

```text
sendGuestInvitations()
```

This allows the email provider to be changed later without modifying all business modules.

---

# 43. Email Batching

For guest invitations, email can be sent in batches.

Example:

```text
450 guests
   ↓
Batch 1
Batch 2
Batch 3
Batch 4
Batch 5
```

We will not initially introduce:

- SQS
- RabbitMQ
- Kafka
- Dedicated email worker

Batch requests through Resend are considered sufficient for V1.

If email volume grows significantly, a queue can be introduced later.

---

# 44. Vendor Management

Vendor management is internal to the family workspace.

Vendors do not have:

- Accounts
- Login
- Dashboard
- Marketplace profiles

Family members manually maintain vendor information.

---

# 45. Vendor Discovery

Vendor discovery will remain lightweight for V1.

Preferred model:

```text
Vendor Management
      +
Manual Vendor Entry
      +
Find on Google Maps
```

Example:

```text
Category: Photographer

City: Bengaluru

      ↓

Find on Google Maps
```

The family finds the vendor externally and manually saves the vendor details.

---

# 46. Vendor Marketplace

The following will not be implemented in V1:

- Vendor registration
- Vendor search database
- Vendor recommendations
- Vendor reviews
- Vendor ratings
- Vendor bidding
- Vendor payments
- Vendor lead generation

Google Places API may be considered later.

---

# 47. Deployment

Vercel will host the Next.js application.

There will be one primary application deployment.

```text
Users
   ↓
Vercel
   ↓
Next.js Modular Monolith
```

No separate frontend/backend deployment is required.

---

# 48. Deployment Architecture

```text
                     Internet
                        │
                        ▼
                     Vercel
               Next.js Application
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼

   MongoDB Atlas   Cloudflare R2      Resend
                        │
                        ▼
                  Cloudflare CDN
```

---

# 49. Deployment Environments

Recommended environments:

```text
LOCAL

PREVIEW / STAGING

PRODUCTION
```

Production should use separate production resources.

Preview/staging should avoid writing into production:

- Database
- Storage
- Email data

where practical.

---

# 50. Git and Deployment Workflow

Recommended workflow:

```text
Feature Branch
      ↓
GitHub Pull Request
      ↓
Vercel Preview Deployment
      ↓
Review / Testing
      ↓
Merge to Main
      ↓
Production Deployment
```

No custom CI/CD platform is required initially.

---

# 51. Environment Variables

Sensitive configuration should be stored through environment configuration and not committed to source control.

Possible variables:

```text
MONGODB_URI

SESSION_SECRET

R2_ACCOUNT_ID

R2_ACCESS_KEY

R2_SECRET_KEY

R2_BUCKET_PRIVATE

R2_BUCKET_PUBLIC

R2_PUBLIC_URL

RESEND_API_KEY

APP_BASE_URL
```

Exact names can be finalized later.

---

# 52. Security Principles

V1 should follow several basic security rules.

Authentication credentials and secrets must never be exposed to client-side code.

Every private resource request must verify wedding membership.

Uploads must be authorized before generating signed URLs.

Invitation tokens should be random and difficult to guess.

Passwords must be strongly hashed.

Sessions must use secure HttpOnly cookies.

Sensitive files must not automatically become publicly accessible.

---

# 53. Rate Limiting

Rate limiting should eventually be applied to sensitive endpoints such as:

```text
/register

/login

/forgot-password

/reset-password

/join/*

/invite/*
```

The exact rate-limiting implementation is still an open decision.

Redis will not be introduced solely for rate limiting during V1 unless required.

A lightweight solution should be preferred.

---

# 54. CSRF Protection

Because authentication will use cookies, CSRF protections must be considered for state-changing requests.

Possible protections include:

- SameSite cookies
- Origin validation
- CSRF tokens where necessary

The exact implementation will be finalized during security design.

---

# 55. Error Handling

The application should have consistent error responses.

Examples:

```text
VALIDATION_ERROR

UNAUTHENTICATED

FORBIDDEN

NOT_FOUND

CONFLICT

RATE_LIMITED

INTERNAL_ERROR
```

Technical implementation details should not be exposed to end users.

Production logs should contain enough information for debugging without exposing sensitive data.

---

# 56. Logging

Basic production logging should cover:

- Authentication failures
- Unexpected application errors
- File upload failures
- Resend failures
- Database errors
- Invitation failures

Sensitive values must not be logged.

Examples of values not to log:

- Passwords
- Session tokens
- Reset tokens
- Raw invitation tokens
- R2 credentials

---

# 57. Activity Logs

Application activity logs are separate from technical system logs.

Example:

```text
Priya created the Sangeet event.

Rahul added 25 guests.

Bride's father added a vendor.

Brother completed a task.
```

Activity logs support family collaboration and auditability.

---

# 58. Notifications

V1 notifications can initially exist inside the application.

Examples:

- Task assigned
- Task overdue
- RSVP received
- Vendor follow-up due
- Event approaching

A complex real-time notification system is not required initially.

---

# 59. Real-Time Architecture

V1 does not require:

- WebSockets
- Socket.io
- Pub/Sub
- Live synchronization

Normal application requests and periodic refresh/revalidation should be sufficient.

Real-time functionality may be added later if actual usage requires it.

---

# 60. Caching

No dedicated Redis caching layer will be introduced initially.

Possible caching can rely on:

- Next.js caching where appropriate
- Browser caching
- Cloudflare CDN for media

Database-level caching should only be introduced after performance measurements justify it.

---

# 61. Search

V1 does not require Elasticsearch or a separate search engine.

MongoDB queries should be sufficient for:

- Guests
- Tasks
- Vendors
- Events

Search infrastructure can be reconsidered if data volume or search complexity increases.

---

# 62. Scalability Strategy

V1 scalability is based primarily on managed services.

```text
Application
→ Vercel

Database
→ MongoDB Atlas

Files
→ Cloudflare R2

CDN
→ Cloudflare

Email
→ Resend
```

This allows the platform to scale without managing servers directly.

We should measure actual usage before introducing additional infrastructure.

---

# 63. Future Scaling Options

Potential future additions include:

- Queue for large email campaigns
- Redis for caching or distributed rate limiting
- Background workers
- Dedicated media service
- Advanced search
- Dedicated notification service
- Image-processing pipeline

These should only be introduced after a real requirement exists.

---

# 64. Explicitly Avoided V1 Infrastructure

The system will not initially use:

```text
Microservices

Kubernetes

Kafka

RabbitMQ

Redis

AWS SQS

AWS Lambda image processing

Dedicated media workers

Elasticsearch

Dedicated authentication provider

Separate Express backend

API Gateway

Dedicated load balancer
```

The goal is to keep V1 operationally simple.

---

# 65. Main Request Flow Example

Example: create a task.

```text
Browser

   ↓

POST /task

   ↓

Zod validation

   ↓

Session authentication

   ↓

Wedding membership authorization

   ↓

Task service

   ↓

Task repository

   ↓

MongoDB Atlas

   ↓

Response
```

---

# 66. Guest RSVP Flow

```text
Guest receives invitation

        ↓

/invite/{token}

        ↓

Validate invitation token

        ↓

Load guest + invited events

        ↓

Guest submits RSVP

        ↓

Validate RSVP

        ↓

Store RSVP

        ↓

Update dashboard information
```

Guest authentication is not required.

---

# 67. File Upload Flow

```text
Family Member

      ↓

Select file

      ↓

Request upload URL

      ↓

Authentication

      ↓

Wedding authorization

      ↓

Generate R2 presigned URL

      ↓

Browser uploads directly to R2

      ↓

Save file metadata in MongoDB
```

---

# 68. Public Wedding Website Flow

```text
Guest visits

/w/{slug}

      ↓

Find published wedding

      ↓

Return only public information

      ↓

Load public images through Cloudflare CDN
```

Private wedding information must remain excluded.

---

# 69. Family Invitation Flow

```text
Authenticated Family Member

        ↓

Create invitation

        ↓

Store token hash

        ↓

Send raw token link through Resend

        ↓

Recipient opens /join/{token}

        ↓

Validate token

        ↓

Login / Register

        ↓

Accept invitation

        ↓

Create Wedding Membership

        ↓

Mark invitation ACCEPTED
```

---

# 70. Initial Domain Relationship

High level:

```text
User
 │
 ▼
Wedding Membership
 │
 ▼
Wedding
 │
 ├── Events
 │    ├── Tasks
 │    ├── Guests
 │    ├── Vendors
 │    └── Timeline
 │
 ├── Tasks
 │
 ├── Guests
 │    ├── Guest Groups
 │    └── RSVP
 │
 ├── Vendors
 │
 ├── Family Members
 │
 ├── Invitations
 │
 ├── Gallery
 │
 ├── Wedding Website
 │
 ├── Notifications
 │
 └── Activity Logs
```

---

# 71. Current Architecture Decisions

The following decisions are considered accepted for V1:

```text
Architecture
Modular Monolith

Framework
Next.js

Language
TypeScript

Runtime
Node.js

Validation
Zod

Authentication
Custom session-based authentication

Password Hashing
Argon2id

Database
MongoDB Atlas

File Storage
Cloudflare R2

CDN
Cloudflare CDN

Email
Resend

Deployment
Vercel

Guest Authentication
None

Guest Access
Secure invitation token

Family Invitations
Secure single-use invitation token

Email Verification
Not required for V1

Image Processing
None for V1

Vendor Discovery
External Google Maps discovery + manual save

Queue
None initially

Redis
None initially

Microservices
None
```

---

# 72. Open Design Decisions

The following areas still need detailed design:

### MongoDB schema

We still need to define:

- Collections
- Fields
- Indexes
- Embedded vs referenced data
- Relationships

### Session Policy

Need to define:

- Session lifetime
- Session rotation
- Idle timeout
- Maximum concurrent sessions

### Authorization

Need detailed rules for:

- Wedding ownership
- Family members
- Resource-level access

### Rate Limiting

Need lightweight implementation choice.

### CSRF

Need exact protection strategy.

### Media

Need final:

- Bucket names
- File naming
- Maximum file sizes
- Allowed file types

### Observability

Need decision around:

- Error tracking
- Logging
- Performance monitoring

### Backup and Recovery

Need policies for:

- MongoDB backups
- Deleted wedding data
- R2 files

---

# 73. V1 Architecture Philosophy

The central philosophy for Make My Marriage V1 is:

> Build the simplest architecture that safely supports the complete product.

We should avoid designing the system as if millions of weddings already exist.

Instead:

```text
Simple architecture
      ↓
Real users
      ↓
Measure usage
      ↓
Identify bottlenecks
      ↓
Scale the components that actually need scaling
```

This keeps development fast and infrastructure manageable while preserving room for future growth.

---

# 74. Final V1 Architecture

```text
                       USERS
                         │
          ┌──────────────┴───────────────┐
          │                              │
      Family Users                     Guests
          │                              │
          │                              │
          ▼                              ▼
   Authenticated App            Token-Gated Pages
          │                              │
          └──────────────┬───────────────┘
                         │
                         ▼
                      VERCEL
               ┌───────────────────┐
               │      Next.js      │
               │    TypeScript     │
               │                   │
               │ Modular Monolith  │
               │                   │
               │ Custom Auth       │
               │ Zod Validation    │
               │ Business Modules  │
               └─────────┬─────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼

      MongoDB Atlas  Cloudflare R2   Resend
                          │
                          ▼
                   Cloudflare CDN
```

This architecture provides a strong foundation for the Make My Marriage V1 while keeping operational complexity intentionally low.