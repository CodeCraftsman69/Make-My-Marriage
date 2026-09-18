# Make My Marriage
## REST API Design — Version 1.0

---

# 1. Purpose

This document defines the V1 REST API design for **Make My Marriage**.

The API supports:

- Custom authentication
- Wedding workspace
- Family members
- Family invitations
- Events
- Tasks
- Guests
- Guest groups
- Guest invitations
- RSVP
- Vendors
- Gallery
- Wedding website
- Notifications
- Activity history
- File uploads

The API is implemented inside the existing **Next.js modular monolith**.

There is no separate Express backend.

---

# 2. Base API Path

Use API versioning from the beginning.

```text
/api/v1
```

Example:

```text
GET /api/v1/weddings/{weddingId}/events
```

This allows us to introduce:

```text
/api/v2
```

in the future without breaking existing clients.

---

# 3. API Categories

The API has three major access categories.

```text
PUBLIC
TOKEN-GATED
PRIVATE
```

---

# 4. Public APIs

Do not require user authentication.

Examples:

```text
GET /api/v1/public/weddings/{slug}
```

Used by the wedding website.

---

# 5. Token-Gated APIs

Do not require normal login but require a secure invitation token.

Examples:

```text
GET /api/v1/invitations/guest/{token}

POST /api/v1/invitations/guest/{token}/rsvp
```

and:

```text
GET /api/v1/invitations/family/{token}
```

---

# 6. Private APIs

Require a valid authenticated session.

Example:

```text
GET /api/v1/weddings/{weddingId}/tasks
```

Private wedding APIs must verify:

```text
Authenticated User
        ↓
Wedding Membership
        ↓
Resource belongs to Wedding
        ↓
Allow
```

---

# 7. Authentication Mechanism

Authentication is session-based.

The browser sends a secure HttpOnly cookie automatically.

Conceptually:

```text
Cookie:
__Host-mmm_session=<session-token>
```

The REST API does not require:

```text
Authorization: Bearer ...
```

for normal web requests.

---

# 8. Standard Response Format

Successful single-resource response:

```json
{
  "data": {
    "id": "..."
  }
}
```

Collection response:

```json
{
  "data": [],
  "pagination": {
    "nextCursor": "..."
  }
}
```

Successful mutation:

```json
{
  "data": {
    "id": "...",
    "updatedAt": "..."
  }
}
```

---

# 9. Standard Error Format

All API errors should follow one predictable structure.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "fields": {
      "email": "Invalid email address."
    }
  }
}
```

`fields` is optional.

---

# 10. Error Codes

Initial application error codes:

```text
VALIDATION_ERROR

UNAUTHENTICATED

FORBIDDEN

NOT_FOUND

CONFLICT

INVALID_CREDENTIALS

INVALID_TOKEN

TOKEN_EXPIRED

INVITATION_ALREADY_ACCEPTED

EMAIL_ALREADY_EXISTS

RATE_LIMITED

UPLOAD_FAILED

INTERNAL_ERROR
```

---

# 11. HTTP Status Codes

Use normal HTTP semantics.

```text
200 OK
```

Successful retrieval/update.

```text
201 Created
```

Resource successfully created.

```text
204 No Content
```

Successful deletion where no response body is required.

```text
400 Bad Request
```

Invalid input.

```text
401 Unauthorized
```

User is not authenticated.

```text
403 Forbidden
```

Authenticated but not allowed.

```text
404 Not Found
```

Resource doesn't exist or is inaccessible.

```text
409 Conflict
```

Example:

```text
Email already registered.
```

```text
429 Too Many Requests
```

Rate limited.

```text
500 Internal Server Error
```

Unexpected server failure.

---

# 12. Authentication APIs

## Register

```text
POST /api/v1/auth/register
```

Request:

```json
{
  "name": "Vinayak",
  "email": "vinayak@example.com",
  "password": "StrongPassword123"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "Vinayak",
      "email": "vinayak@example.com"
    }
  }
}
```

Side effect:

```text
Create User
Create Session
Set HttpOnly Cookie
```

No email verification in V1.

---

# 13. Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "vinayak@example.com",
  "password": "StrongPassword123"
}
```

Successful response:

```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "Vinayak",
      "email": "vinayak@example.com"
    }
  }
}
```

Invalid credentials:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

---

# 14. Logout

```text
POST /api/v1/auth/logout
```

Operations:

```text
Delete/revoke session
Delete session cookie
```

Response:

```text
204 No Content
```

---

# 15. Current User

```text
GET /api/v1/auth/me
```

Response:

```json
{
  "data": {
    "id": "...",
    "name": "Vinayak",
    "email": "vinayak@example.com"
  }
}
```

Useful when the application initializes.

---

# 16. Forgot Password

```text
POST /api/v1/auth/forgot-password
```

Request:

```json
{
  "email": "vinayak@example.com"
}
```

Always return a generic response:

```json
{
  "data": {
    "message": "If an account exists, a password reset email has been sent."
  }
}
```

Do not reveal whether an email is registered.

---

# 17. Reset Password

```text
POST /api/v1/auth/reset-password
```

Request:

```json
{
  "token": "...",
  "password": "NewStrongPassword123"
}
```

On success:

- update password
- invalidate existing sessions
- mark reset token as used

---

# 18. Wedding APIs

## Create Wedding

```text
POST /api/v1/weddings
```

Request:

```json
{
  "brideName": "Priya",
  "groomName": "Rahul",
  "title": "Rahul Weds Priya",
  "weddingDate": "2027-02-14T00:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "location": {
    "city": "Bengaluru",
    "state": "Karnataka"
  }
}
```

Side effects:

```text
Create Wedding
Create WeddingMember OWNER
Create WeddingWebsite draft
```

Response:

```json
{
  "data": {
    "id": "...",
    "title": "Rahul Weds Priya"
  }
}
```

---

# 19. Get Wedding

```text
GET /api/v1/weddings/{weddingId}
```

Private.

Returns wedding details.

---

# 20. Update Wedding

```text
PATCH /api/v1/weddings/{weddingId}
```

Example request:

```json
{
  "title": "Rahul & Priya",
  "weddingDate": "2027-02-15T00:00:00.000Z"
}
```

Use `PATCH` because partial updates are expected.

---

# 21. Wedding Dashboard

```text
GET /api/v1/weddings/{weddingId}/dashboard
```

Response conceptually:

```json
{
  "data": {
    "daysRemaining": 83,
    "events": {
      "total": 6,
      "nextEvent": {}
    },
    "tasks": {
      "total": 68,
      "completed": 45,
      "inProgress": 12,
      "overdue": 3
    },
    "guests": {
      "total": 520,
      "confirmed": 410,
      "declined": 25,
      "pending": 85
    },
    "vendors": {
      "total": 12,
      "confirmed": 9,
      "followUpsDue": 2
    }
  }
}
```

The dashboard endpoint can aggregate data from existing collections.

---

# 22. Family Member APIs

## List Members

```text
GET /api/v1/weddings/{weddingId}/members
```

---

# 23. Get Member

```text
GET /api/v1/weddings/{weddingId}/members/{memberId}
```

---

# 24. Update Member

```text
PATCH /api/v1/weddings/{weddingId}/members/{memberId}
```

Example:

```json
{
  "relationship": "BROTHER"
}
```

---

# 25. Remove Member

```text
DELETE /api/v1/weddings/{weddingId}/members/{memberId}
```

V1 business rules should prevent unsafe actions such as accidentally removing the only wedding owner.

---

# 26. Family Invitation APIs

## Create Invitation

```text
POST /api/v1/weddings/{weddingId}/family-invitations
```

Request:

```json
{
  "name": "Amit",
  "email": "amit@example.com",
  "relationship": "BROTHER"
}
```

Server:

```text
Generate secure token
Store token hash
Send invite using Resend
```

Response:

```json
{
  "data": {
    "id": "...",
    "status": "PENDING",
    "expiresAt": "..."
  }
}
```

---

# 27. List Family Invitations

```text
GET /api/v1/weddings/{weddingId}/family-invitations
```

Possible filter:

```text
?status=PENDING
```

---

# 28. Revoke Family Invitation

```text
POST /api/v1/weddings/{weddingId}/family-invitations/{invitationId}/revoke
```

Using an action endpoint here is acceptable because revoke is a business action rather than a generic resource update.

---

# 29. Resend Family Invitation

```text
POST /api/v1/weddings/{weddingId}/family-invitations/{invitationId}/resend
```

---

# 30. Public Family Invitation

```text
GET /api/v1/invitations/family/{token}
```

Returns only safe invitation data.

Example:

```json
{
  "data": {
    "weddingTitle": "Rahul Weds Priya",
    "inviteeName": "Amit",
    "relationship": "BROTHER",
    "expiresAt": "..."
  }
}
```

---

# 31. Accept Family Invitation

Requires login.

```text
POST /api/v1/invitations/family/{token}/accept
```

Server transaction:

```text
Validate token
Check status
Check expiration
Create WeddingMember
Mark Invitation ACCEPTED
```

---

# 32. Event APIs

## Create Event

```text
POST /api/v1/weddings/{weddingId}/events
```

Request:

```json
{
  "name": "Sangeet",
  "type": "SANGEET",
  "description": "...",
  "startAt": "...",
  "endAt": "...",
  "venue": {
    "name": "Grand Convention Hall",
    "address": "...",
    "city": "Bengaluru",
    "mapUrl": "..."
  },
  "dressCode": "Traditional"
}
```

---

# 33. List Events

```text
GET /api/v1/weddings/{weddingId}/events
```

Optional query parameters:

```text
?status=UPCOMING

?from=2027-02-01

?to=2027-02-20
```

---

# 34. Get Event

```text
GET /api/v1/weddings/{weddingId}/events/{eventId}
```

---

# 35. Update Event

```text
PATCH /api/v1/weddings/{weddingId}/events/{eventId}
```

---

# 36. Delete Event

```text
DELETE /api/v1/weddings/{weddingId}/events/{eventId}
```

Prefer soft deletion internally.

---

# 37. Event Timeline

Since timeline items are embedded, expose them as nested APIs.

Create:

```text
POST /api/v1/weddings/{weddingId}/events/{eventId}/timeline
```

Update:

```text
PATCH /api/v1/weddings/{weddingId}/events/{eventId}/timeline/{timelineItemId}
```

Delete:

```text
DELETE /api/v1/weddings/{weddingId}/events/{eventId}/timeline/{timelineItemId}
```

---

# 38. Task APIs

## Create Task

```text
POST /api/v1/weddings/{weddingId}/tasks
```

Request:

```json
{
  "eventId": "...",
  "title": "Finalize Photographer",
  "description": "...",
  "assignedTo": "...",
  "priority": "HIGH",
  "dueDate": "..."
}
```

`eventId` may be `null`.

---

# 39. List Tasks

```text
GET /api/v1/weddings/{weddingId}/tasks
```

Possible filters:

```text
?status=TODO

?priority=HIGH

?eventId=...

?assignedTo=...

?overdue=true
```

Multiple filters may be combined.

Example:

```text
GET /api/v1/weddings/123/tasks?status=TODO&assignedTo=456
```

---

# 40. Get Task

```text
GET /api/v1/weddings/{weddingId}/tasks/{taskId}
```

---

# 41. Update Task

```text
PATCH /api/v1/weddings/{weddingId}/tasks/{taskId}
```

Example:

```json
{
  "status": "COMPLETED"
}
```

When transitioning to completed:

```text
completedAt = current timestamp
```

---

# 42. Delete Task

```text
DELETE /api/v1/weddings/{weddingId}/tasks/{taskId}
```

---

# 43. Guest Group APIs

## Create Group

```text
POST /api/v1/weddings/{weddingId}/guest-groups
```

Request:

```json
{
  "name": "Patil Family",
  "notes": "..."
}
```

---

# 44. List Guest Groups

```text
GET /api/v1/weddings/{weddingId}/guest-groups
```

---

# 45. Get Guest Group

```text
GET /api/v1/weddings/{weddingId}/guest-groups/{groupId}
```

Optionally include group members.

---

# 46. Update Guest Group

```text
PATCH /api/v1/weddings/{weddingId}/guest-groups/{groupId}
```

---

# 47. Delete Guest Group

```text
DELETE /api/v1/weddings/{weddingId}/guest-groups/{groupId}
```

Deletion behavior must account for guests currently assigned to the group.

Recommended V1 behavior:

```text
Remove group
→ guests remain
→ their groupId becomes null
```

---

# 48. Guest APIs

## Create Guest

```text
POST /api/v1/weddings/{weddingId}/guests
```

Request:

```json
{
  "name": "Rajesh Patil",
  "phone": "+919876543210",
  "email": null,
  "groupId": "...",
  "city": "Pune",
  "state": "Maharashtra",
  "side": "BRIDE",
  "relationship": "UNCLE",
  "dietaryPreference": "VEGETARIAN"
}
```

---

# 49. Bulk Create Guests

Useful for Indian weddings.

```text
POST /api/v1/weddings/{weddingId}/guests/bulk
```

Request:

```json
{
  "guests": [
    {},
    {},
    {}
  ]
}
```

Put a reasonable maximum on each bulk request.

---

# 50. List Guests

```text
GET /api/v1/weddings/{weddingId}/guests
```

Supported filters:

```text
?side=BRIDE

?groupId=...

?relationship=UNCLE

?search=rajesh
```

Pagination:

```text
?limit=30&cursor=...
```

---

# 51. Get Guest

```text
GET /api/v1/weddings/{weddingId}/guests/{guestId}
```

---

# 52. Update Guest

```text
PATCH /api/v1/weddings/{weddingId}/guests/{guestId}
```

---

# 53. Delete Guest

```text
DELETE /api/v1/weddings/{weddingId}/guests/{guestId}
```

Soft delete internally.

---

# 54. Guest Invitation APIs

## Create Invitation

```text
POST /api/v1/weddings/{weddingId}/guest-invitations
```

Request:

```json
{
  "inviteeType": "GROUP",
  "inviteeId": "...",
  "eventIds": [
    "...",
    "...",
    "..."
  ],
  "deliveryEmail": "rajesh@example.com"
}
```

Server:

```text
Validate guest/group
Validate events belong to wedding
Generate secure token
Store token hash
Create PENDING RSVP for each event
```

---

# 55. Bulk Create Guest Invitations

```text
POST /api/v1/weddings/{weddingId}/guest-invitations/bulk
```

Useful when assigning invitations to many guests/groups.

---

# 56. List Guest Invitations

```text
GET /api/v1/weddings/{weddingId}/guest-invitations
```

Filters:

```text
?rsvpStatus=PENDING

?eventId=...

?inviteeType=GROUP
```

---

# 57. Get Guest Invitation

```text
GET /api/v1/weddings/{weddingId}/guest-invitations/{invitationId}
```

Private family view.

---

# 58. Update Invitation Events

```text
PATCH /api/v1/weddings/{weddingId}/guest-invitations/{invitationId}
```

Example:

```json
{
  "eventIds": [
    "...",
    "..."
  ]
}
```

---

# 59. Send Guest Invitation Email

Individual:

```text
POST /api/v1/weddings/{weddingId}/guest-invitations/{invitationId}/send
```

---

# 60. Batch Send Guest Invitations

```text
POST /api/v1/weddings/{weddingId}/guest-invitations/send-batch
```

Request:

```json
{
  "invitationIds": [
    "...",
    "...",
    "..."
  ]
}
```

Internally:

```text
Load eligible invitations
        ↓
Split into Resend-sized batches
        ↓
Send
        ↓
Update delivery status
```

No queue required for V1.

---

# 61. Public Guest Invitation

```text
GET /api/v1/invitations/guest/{token}
```

Returns:

```json
{
  "data": {
    "wedding": {
      "title": "Rahul Weds Priya"
    },
    "invitee": {
      "name": "Patil Family"
    },
    "events": [
      {
        "id": "...",
        "name": "Sangeet",
        "startAt": "...",
        "venue": {},
        "rsvpStatus": "PENDING"
      }
    ]
  }
}
```

Do not expose unrelated wedding information.

---

# 62. Submit RSVP

```text
POST /api/v1/invitations/guest/{token}/rsvp
```

Request:

```json
{
  "events": [
    {
      "eventId": "...",
      "status": "CONFIRMED",
      "attendeeCount": 3,
      "attendeeGuestIds": [
        "...",
        "...",
        "..."
      ]
    },
    {
      "eventId": "...",
      "status": "DECLINED",
      "attendeeCount": 0,
      "attendeeGuestIds": []
    }
  ]
}
```

The endpoint should only accept responses for events actually included in that invitation.

---

# 63. RSVP Summary

Family dashboard/list view:

```text
GET /api/v1/weddings/{weddingId}/rsvp-summary
```

Optional:

```text
?eventId=...
```

Response:

```json
{
  "data": {
    "confirmed": 410,
    "declined": 25,
    "pending": 85
  }
}
```

---

# 64. Vendor APIs

## Create Vendor

```text
POST /api/v1/weddings/{weddingId}/vendors
```

Request:

```json
{
  "name": "Royal Catering",
  "category": "CATERER",
  "contactPerson": "Ramesh",
  "phone": "+919876543210",
  "email": null,
  "eventIds": ["..."],
  "responsibleMemberId": "...",
  "status": "CONFIRMED",
  "nextFollowUpAt": "..."
}
```

---

# 65. List Vendors

```text
GET /api/v1/weddings/{weddingId}/vendors
```

Filters:

```text
?category=CATERER

?status=CONFIRMED

?eventId=...

?responsibleMemberId=...

?followUpDue=true
```

---

# 66. Get Vendor

```text
GET /api/v1/weddings/{weddingId}/vendors/{vendorId}
```

---

# 67. Update Vendor

```text
PATCH /api/v1/weddings/{weddingId}/vendors/{vendorId}
```

---

# 68. Delete Vendor

```text
DELETE /api/v1/weddings/{weddingId}/vendors/{vendorId}
```

---

# 69. Vendor Follow-Up

Can simply be handled through vendor update:

```text
PATCH /vendors/{vendorId}
```

with:

```json
{
  "nextFollowUpAt": "..."
}
```

No separate follow-up collection is required.

---

# 70. File Upload APIs

Files are uploaded directly to Cloudflare R2.

The application only creates upload permissions and metadata.

---

# 71. Request Upload URL

```text
POST /api/v1/weddings/{weddingId}/uploads/presign
```

Request:

```json
{
  "purpose": "GALLERY_PHOTO",
  "fileName": "IMG_1024.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 5432100,
  "eventId": "...",
  "albumId": "..."
}
```

Other purposes could include:

```text
WEDDING_COVER

EVENT_COVER

GALLERY_PHOTO

VENDOR_DOCUMENT
```

Server:

```text
Authenticate
Validate wedding
Validate file metadata
Generate safe object key
Generate presigned R2 URL
```

Response:

```json
{
  "data": {
    "uploadUrl": "...",
    "objectKey": "...",
    "expiresAt": "..."
  }
}
```

---

# 72. Confirm Upload

After direct R2 upload:

```text
POST /api/v1/weddings/{weddingId}/uploads/complete
```

Request:

```json
{
  "purpose": "GALLERY_PHOTO",
  "objectKey": "...",
  "fileName": "IMG_1024.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 5432100,
  "eventId": "...",
  "albumId": "..."
}
```

The server creates the corresponding metadata record.

For photos:

```text
photos
```

For vendor documents:

embedded metadata inside:

```text
vendors
```

---

# 73. Album APIs

## Create Album

```text
POST /api/v1/weddings/{weddingId}/albums
```

Request:

```json
{
  "name": "Sangeet",
  "eventId": "..."
}
```

---

# 74. List Albums

```text
GET /api/v1/weddings/{weddingId}/albums
```

---

# 75. Update Album

```text
PATCH /api/v1/weddings/{weddingId}/albums/{albumId}
```

---

# 76. Delete Album

```text
DELETE /api/v1/weddings/{weddingId}/albums/{albumId}
```

Deletion should not necessarily delete photos.

Recommended:

```text
Delete Album
→ photo.albumId = null
```

unless the user explicitly requests photo deletion.

---

# 77. Gallery APIs

List photos:

```text
GET /api/v1/weddings/{weddingId}/photos
```

Filters:

```text
?albumId=...

?eventId=...

?visibility=PUBLIC

?limit=30

?cursor=...
```

---

# 78. Update Photo

```text
PATCH /api/v1/weddings/{weddingId}/photos/{photoId}
```

Example:

```json
{
  "caption": "Sangeet night",
  "visibility": "PUBLIC"
}
```

---

# 79. Delete Photo

```text
DELETE /api/v1/weddings/{weddingId}/photos/{photoId}
```

Internally:

```text
Verify access
Delete / mark metadata deleted
Delete R2 object
```

---

# 80. Private Photo Access

If the photo is private:

```text
POST /api/v1/weddings/{weddingId}/photos/{photoId}/access-url
```

Server:

```text
Authenticate
Authorize wedding
Generate short-lived R2 URL
```

Response:

```json
{
  "data": {
    "url": "...",
    "expiresAt": "..."
  }
}
```

---

# 81. Wedding Website APIs

## Get Website Configuration

```text
GET /api/v1/weddings/{weddingId}/website
```

---

# 82. Update Website

```text
PATCH /api/v1/weddings/{weddingId}/website
```

Example:

```json
{
  "slug": "rahul-priya",
  "story": "...",
  "visibleEventIds": ["...", "..."],
  "publicAlbumIds": ["..."],
  "showGallery": true
}
```

---

# 83. Publish Wedding Website

```text
POST /api/v1/weddings/{weddingId}/website/publish
```

---

# 84. Unpublish Wedding Website

```text
POST /api/v1/weddings/{weddingId}/website/unpublish
```

---

# 85. Public Wedding Website API

```text
GET /api/v1/public/weddings/{slug}
```

Only returns explicitly public content.

Example:

```json
{
  "data": {
    "title": "Rahul Weds Priya",
    "weddingDate": "...",
    "story": "...",
    "events": [],
    "gallery": []
  }
}
```

---

# 86. Notification APIs

List:

```text
GET /api/v1/notifications
```

Query:

```text
?unread=true
```

---

# 87. Mark Notification Read

```text
PATCH /api/v1/notifications/{notificationId}
```

Request:

```json
{
  "read": true
}
```

---

# 88. Mark All Notifications Read

```text
POST /api/v1/notifications/read-all
```

---

# 89. Activity APIs

Wedding activity:

```text
GET /api/v1/weddings/{weddingId}/activities
```

Pagination:

```text
?limit=30&cursor=...
```

Activity creation should normally happen internally as part of business actions.

We should not expose:

```text
POST /activities
```

to the browser.

---

# 90. Pagination Design

Use cursor pagination for growing collections.

Example:

```text
GET /api/v1/weddings/{weddingId}/guests?limit=30
```

Response:

```json
{
  "data": [],
  "pagination": {
    "nextCursor": "..."
  }
}
```

Next request:

```text
?limit=30&cursor=...
```

---

# 91. Pagination Limits

Recommended defaults:

```text
Default = 30

Maximum = 100
```

Client should not be allowed to request:

```text
limit=100000
```

---

# 92. Sorting

Use explicit sort parameters only where useful.

Example:

```text
?sort=dueDate

?order=asc
```

Avoid supporting arbitrary database fields.

Each endpoint should define its allowed sort options.

---

# 93. Search

Example:

```text
GET /api/v1/weddings/{weddingId}/guests?search=patil
```

The backend determines which fields participate.

Client should not send database query operators.

Never accept raw MongoDB filters from clients.

---

# 94. Input Validation

Every mutation must validate its request with Zod.

Example:

```text
Request
   ↓
Zod
   ↓
Application Service
```

Never:

```text
Request
   ↓
MongoDB directly
```

---

# 95. Unknown Fields

Prefer stripping or rejecting unexpected input fields.

Example:

Client sends:

```json
{
  "title": "Task",
  "status": "TODO",
  "weddingId": "ANOTHER_WEDDING"
}
```

The client should not be able to override ownership fields.

Values such as:

```text
weddingId
createdBy
uploadedBy
```

must come from trusted server context.

---

# 96. Resource Authorization Pattern

For:

```text
PATCH /api/v1/weddings/W1/tasks/T1
```

the server should logically query:

```text
Task where:

_id = T1

AND

weddingId = W1
```

after verifying the current user belongs to W1.

Do not:

```text
find Task by T1
```

and only later trust its relationship.

---

# 97. CSRF

Since authentication uses cookies, state-changing requests should use protections such as:

- SameSite cookies
- Origin validation
- CSRF protection where required

GET requests must never change application state.

---

# 98. Rate-Limited APIs

At minimum:

```text
POST /auth/login

POST /auth/register

POST /auth/forgot-password

POST /auth/reset-password

POST /invitations/family/{token}/accept

POST /invitations/guest/{token}/rsvp
```

Potentially also:

```text
uploads/presign
```

to prevent abuse.

---

# 99. Idempotency

Most normal CRUD operations do not require explicit idempotency keys.

However, operations such as:

```text
batch email send
```

should avoid duplicate sends.

Example:

```text
POST /guest-invitations/send-batch
```

can internally use Resend idempotency mechanisms and invitation delivery state.

---

# 100. API Naming Conventions

Use:

```text
lowercase

plural nouns

hyphen-separated multi-word resources
```

Good:

```text
/family-invitations

/guest-groups

/guest-invitations
```

Avoid:

```text
/getGuests

/createEvent

/updateVendor
```

HTTP methods already describe the action.

---

# 101. REST Action Endpoints

Business actions that do not cleanly map to CRUD can use action-style subpaths.

Examples:

```text
POST /family-invitations/{id}/resend

POST /family-invitations/{id}/revoke

POST /website/publish

POST /website/unpublish
```

Keep these limited to meaningful domain actions.

---

# 102. API Version 1 Summary

Main route families:

```text
/api/v1/auth/*

/api/v1/weddings/*

/api/v1/weddings/{weddingId}/members/*

/api/v1/weddings/{weddingId}/family-invitations/*

/api/v1/weddings/{weddingId}/events/*

/api/v1/weddings/{weddingId}/tasks/*

/api/v1/weddings/{weddingId}/guest-groups/*

/api/v1/weddings/{weddingId}/guests/*

/api/v1/weddings/{weddingId}/guest-invitations/*

/api/v1/weddings/{weddingId}/vendors/*

/api/v1/weddings/{weddingId}/albums/*

/api/v1/weddings/{weddingId}/photos/*

/api/v1/weddings/{weddingId}/website/*

/api/v1/notifications/*

/api/v1/invitations/family/*

/api/v1/invitations/guest/*

/api/v1/public/weddings/*
```

---

# 103. Complete Access Model

```text
PUBLIC

GET /public/weddings/{slug}
```

```text
TOKEN-GATED

GET  /invitations/guest/{token}

POST /invitations/guest/{token}/rsvp

GET  /invitations/family/{token}

POST /invitations/family/{token}/accept
```

```text
AUTHENTICATED PRIVATE

/weddings/{weddingId}/...
```

---

# 104. Example Complete Request Flow

Creating a vendor:

```text
Browser

   ↓

POST
/api/v1/weddings/W1/vendors

   ↓

Session cookie

   ↓

Authenticate User

   ↓

Zod Validate Request

   ↓

Check WeddingMember
userId + W1

   ↓

Vendor Service

   ↓

Create Vendor with:
weddingId = W1
createdBy = currentUserId

   ↓

MongoDB

   ↓

Create Activity Log

   ↓

Return 201
```

---

# 105. Example Public RSVP Flow

```text
Guest opens invitation

     ↓

GET
/invitations/guest/{token}

     ↓

Hash token

     ↓

Find invitation

     ↓

Return invited events

     ↓

Guest chooses attendance

     ↓

POST
/invitations/guest/{token}/rsvp

     ↓

Validate token

     ↓

Validate submitted event IDs

     ↓

Update embedded RSVP

     ↓

Create notifications/activity where needed

     ↓

Return success
```

---

# 106. Example Gallery Upload Flow

```text
Browser selects photo

      ↓

POST
/weddings/W1/uploads/presign

      ↓

Auth + Wedding Access

      ↓

Generate R2 key

      ↓

Return presigned URL

      ↓

Browser uploads directly to R2

      ↓

POST
/weddings/W1/uploads/complete

      ↓

Create Photo metadata

      ↓

Return Photo record
```

---

# 107. API Design Decisions Locked for V1

```text
API Style
REST

Version
/api/v1

Authentication
Secure cookie-based sessions

Input Validation
Zod

Private Scope
Wedding ID in routes

Guest Access
Invitation token

Family Invite Access
Invitation token + authentication for acceptance

Partial Updates
PATCH

Deletion
DELETE + mostly soft delete internally

Pagination
Cursor-based

File Upload
Direct-to-R2 presigned URLs

Email
Resend

Batch Guest Email
Dedicated batch action endpoint

Public Wedding Site
Read-only public API

Dashboard
Dedicated aggregation endpoint
```

---

# 108. What We Are Not Building

No:

```text
GraphQL

gRPC

WebSocket API

Separate API Gateway

Microservice APIs

Public developer API

Webhook platform

Complex event bus

Kafka

API keys for external developers

External vendor API
```

for V1.

---

# 109. Open API Decisions

Still to finalize during implementation:

- Exact session expiry
- Exact family-invite expiry
- Exact guest token lifetime
- API rate-limit thresholds
- Maximum bulk guest size
- Maximum batch-email size exposed by our endpoint
- Allowed upload MIME types
- Maximum file sizes
- Exact cursor encoding format
- Exact Zod schemas
- Exact response fields per resource
- CSRF implementation details
- Whether API mutation responses return full resources or minimal resource representations

These decisions do not change the overall REST architecture.

---

# 110. Final API Philosophy

The V1 API should remain:

```text
Predictable
Secure
Wedding-scoped
Resource-oriented
Simple
```

The most important API boundary is:

> **Every authenticated wedding resource is accessed through its wedding context, while guest-facing interactions use restricted invitation tokens instead of authenticated family APIs.**

This keeps the API aligned with both the database design and the public/private application architecture.