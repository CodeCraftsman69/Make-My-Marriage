# Make My Marriage
## Database Design — Version 1.0

---

# 1. Purpose

This document defines the initial database design for **Make My Marriage**.

The primary database will be:

**MongoDB Atlas**

The design supports the V1 product domains:

- Authentication
- Wedding
- Family Members
- Events
- Tasks
- Guests
- Guest Groups
- Invitations
- RSVP
- Vendors
- Wedding Website
- Gallery
- Notifications
- Activity History

This document focuses only on database/data-model decisions.

---

# 2. Database Design Principles

The database should follow these principles:

### Wedding is the primary business boundary

Almost every business entity belongs to a wedding.

```text
Wedding
   │
   ├── Members
   ├── Events
   ├── Tasks
   ├── Guests
   ├── Invitations
   ├── Vendors
   ├── Gallery
   └── Website
```

Most business documents will therefore contain:

```text
weddingId
```

---

### Use references for growing data

Large or continuously growing entities should have their own collections.

Examples:

- Tasks
- Guests
- Photos
- Notifications
- Activity Logs

---

### Embed small bounded data

Information that:

- has limited size
- belongs exclusively to one parent
- is normally loaded together

can be embedded.

Examples:

- Event timeline
- Vendor documents metadata
- Invitation RSVP responses
- Wedding website configuration sections

---

### Store files outside MongoDB

MongoDB stores metadata only.

Actual files are stored in:

**Cloudflare R2**

---

### Avoid unnecessary duplication

V1 should avoid maintaining multiple copies of values unless there is a clear performance requirement.

---

# 3. ID Strategy

MongoDB `ObjectId` will be used for internal entity IDs.

Example:

```text
_id: ObjectId(...)
```

Public-facing resources should not expose predictable IDs where a secure token or slug is more appropriate.

Examples:

```text
Wedding website
→ slug

Family invite
→ secure token

Guest invitation
→ secure token

Password reset
→ secure token
```

---

# 4. Date and Time Strategy

All timestamps should be stored in UTC using MongoDB Date values.

Examples:

```text
createdAt
updatedAt
expiresAt
respondedAt
deletedAt
```

Wedding timezone should also be stored.

For V1:

```text
timezone: "Asia/Kolkata"
```

Since the application initially targets India.

---

# 5. Main Collections

Recommended V1 collections:

```text
users

sessions

passwordResetTokens

weddings

weddingMembers

familyInvitations

events

tasks

guestGroups

guests

guestInvitations

vendors

albums

photos

weddingWebsites

notifications

activityLogs
```

RSVP does not require a separate collection initially.

Event-level RSVP information will be stored inside:

```text
guestInvitations
```

---

# 6. High-Level Relationship Model

```text
User
 │
 ├── Sessions
 │
 └── WeddingMember
          │
          ▼
       Wedding
          │
          ├── Events
          │     ├── Timeline
          │     └── Tasks
          │
          ├── Tasks
          │
          ├── GuestGroups
          │      └── Guests
          │
          ├── GuestInvitations
          │      └── Event RSVP
          │
          ├── Vendors
          │
          ├── Albums
          │      └── Photos
          │
          ├── WeddingWebsite
          │
          ├── Notifications
          │
          └── ActivityLogs
```

---

# 7. Users Collection

Collection:

```text
users
```

Represents registered family users.

Example:

```javascript
{
  _id: ObjectId,

  name: "Vinayak Teradali",

  email: "vinayak@example.com",
  normalizedEmail: "vinayak@example.com",

  passwordHash: "...",

  emailVerifiedAt: null,

  status: "ACTIVE",

  createdAt: Date,
  updatedAt: Date
}
```

### User Status

```text
ACTIVE
DISABLED
```

Email verification is not required in V1.

Therefore:

```text
emailVerifiedAt
```

may remain `null`.

---

# 8. User Indexes

Important index:

```text
normalizedEmail
```

Unique:

```javascript
{ normalizedEmail: 1 }
```

This prevents duplicate accounts such as:

```text
VINAYAK@example.com
vinayak@example.com
```

from becoming separate users.

---

# 9. Sessions Collection

Collection:

```text
sessions
```

Used by custom authentication.

Example:

```javascript
{
  _id: ObjectId,

  userId: ObjectId,

  tokenHash: "...",

  createdAt: Date,

  lastUsedAt: Date,

  expiresAt: Date
}
```

The raw session token must never be stored.

Only:

```text
hash(rawSessionToken)
```

is stored.

---

# 10. Session Indexes

Recommended:

```javascript
{ tokenHash: 1 }
```

Unique.

Also:

```javascript
{ userId: 1 }
```

And a TTL index:

```javascript
{ expiresAt: 1 }
```

so expired sessions can automatically be removed.

---

# 11. Password Reset Tokens

Collection:

```text
passwordResetTokens
```

Example:

```javascript
{
  _id: ObjectId,

  userId: ObjectId,

  tokenHash: "...",

  createdAt: Date,

  expiresAt: Date,

  usedAt: null
}
```

Only the hash of the reset token is stored.

---

# 12. Password Reset Indexes

```javascript
{ tokenHash: 1 }
```

Unique.

TTL:

```javascript
{ expiresAt: 1 }
```

Expired reset tokens can automatically disappear.

---

# 13. Weddings Collection

Collection:

```text
weddings
```

Represents the main wedding workspace.

Example:

```javascript
{
  _id: ObjectId,

  bride: {
    name: "Priya"
  },

  groom: {
    name: "Rahul"
  },

  title: "Rahul Weds Priya",

  weddingDate: Date,

  timezone: "Asia/Kolkata",

  location: {
    city: "Bengaluru",
    state: "Karnataka"
  },

  coverPhotoId: ObjectId,

  description: "...",

  status: "PLANNING",

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 14. Wedding Status

Recommended statuses:

```text
PLANNING

ACTIVE

COMPLETED

CANCELLED
```

`PLANNING` and `ACTIVE` may later be merged if the distinction proves unnecessary.

---

# 15. Wedding Members

Collection:

```text
weddingMembers
```

This is the relationship between:

```text
User ↔ Wedding
```

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  userId: ObjectId,

  relationship: "BROTHER",

  role: "FAMILY_MEMBER",

  joinedAt: Date,

  invitedBy: ObjectId,

  status: "ACTIVE",

  createdAt: Date,
  updatedAt: Date
}
```

Even though V1 provides common access, storing a role now makes future permissions easier.

---

# 16. Wedding Member Roles

Initial values:

```text
OWNER

FAMILY_MEMBER
```

V1 authorization may treat them almost identically.

Future roles could include:

```text
ADMIN

VIEWER

EVENT_MANAGER
```

without changing the membership relationship.

---

# 17. Wedding Member Relationship

Examples:

```text
BRIDE

GROOM

BRIDE_FATHER

BRIDE_MOTHER

GROOM_FATHER

GROOM_MOTHER

BROTHER

SISTER

COUSIN

UNCLE

AUNT

OTHER
```

---

# 18. Wedding Member Indexes

Very important unique index:

```javascript
{
  weddingId: 1,
  userId: 1
}
```

Unique.

This prevents the same user from joining the same wedding multiple times.

Also:

```javascript
{ userId: 1 }
```

for finding a user's wedding membership.

---

# 19. Family Invitations

Collection:

```text
familyInvitations
```

Represents invitations for relatives to join the private wedding workspace.

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  invitedBy: ObjectId,

  inviteeName: "Amit",

  inviteeEmail: "amit@example.com",

  relationship: "BROTHER",

  tokenHash: "...",

  status: "PENDING",

  expiresAt: Date,

  acceptedBy: null,

  acceptedAt: null,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 20. Family Invitation Status

```text
PENDING

ACCEPTED

EXPIRED

REVOKED
```

The invitation token should be single-use.

After acceptance:

```text
status = ACCEPTED
```

and:

```text
acceptedBy
acceptedAt
```

should be populated.

---

# 21. Family Invitation Indexes

```javascript
{ tokenHash: 1 }
```

Unique.

Also:

```javascript
{
  weddingId: 1,
  status: 1
}
```

Useful for displaying:

```text
Pending Family Invitations
```

---

# 22. Events Collection

Collection:

```text
events
```

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  name: "Sangeet",

  type: "SANGEET",

  description: "...",

  startAt: Date,

  endAt: Date,

  venue: {
    name: "Grand Convention Hall",
    address: "...",
    city: "Bengaluru",
    mapUrl: "..."
  },

  dressCode: "Traditional",

  coverPhotoId: ObjectId,

  liveStreamUrl: null,

  status: "UPCOMING",

  timeline: [
    {
      _id: ObjectId,
      time: Date,
      title: "Guest Entry",
      description: "",
      responsibleMemberId: ObjectId
    }
  ],

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 23. Event Timeline

The event timeline will be embedded inside the event document.

Reason:

- Timeline belongs entirely to the event.
- Timeline is bounded.
- Timeline is normally loaded with the event.
- Timeline items have little value independently.

Therefore we do not need:

```text
eventTimelineItems
```

as a separate collection for V1.

---

# 24. Event Types

Examples:

```text
ENGAGEMENT

HALDI

MEHENDI

SANGEET

WEDDING

RECEPTION

POOJA

COCKTAIL

FAMILY_DINNER

CUSTOM
```

For custom events:

```text
type = CUSTOM
name = "..."
```

---

# 25. Event Indexes

Important:

```javascript
{
  weddingId: 1,
  startAt: 1
}
```

Used for upcoming events.

Also:

```javascript
{
  weddingId: 1,
  status: 1
}
```

---

# 26. Tasks Collection

Collection:

```text
tasks
```

Tasks are separate documents because a wedding may contain many tasks.

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  eventId: ObjectId | null,

  title: "Finalize Photographer",

  description: "...",

  assignedTo: ObjectId,

  createdBy: ObjectId,

  priority: "HIGH",

  status: "IN_PROGRESS",

  dueDate: Date,

  notes: "...",

  completedAt: null,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 27. Task Status

```text
TODO

IN_PROGRESS

COMPLETED
```

---

# 28. Task Priority

```text
LOW

MEDIUM

HIGH
```

---

# 29. Task Indexes

For dashboard/task views:

```javascript
{
  weddingId: 1,
  status: 1,
  dueDate: 1
}
```

For "My Tasks":

```javascript
{
  weddingId: 1,
  assignedTo: 1,
  status: 1
}
```

For event tasks:

```javascript
{
  weddingId: 1,
  eventId: 1
}
```

---

# 30. Guest Groups Collection

Collection:

```text
guestGroups
```

Represents a family or invitation group.

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  name: "Patil Family",

  primaryContactGuestId: ObjectId | null,

  notes: "...",

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

Members themselves remain in the `guests` collection.

---

# 31. Guests Collection

Collection:

```text
guests
```

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  groupId: ObjectId | null,

  name: "Rajesh Patil",

  phone: "+919876543210",

  email: null,

  city: "Pune",

  state: "Maharashtra",

  side: "BRIDE",

  relationship: "UNCLE",

  dietaryPreference: "VEGETARIAN",

  notes: "...",

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 32. Guest Side

Values:

```text
BRIDE

GROOM

COMMON
```

---

# 33. Guest Relationship

Examples:

```text
UNCLE

AUNT

COUSIN

FRIEND

COLLEAGUE

NEIGHBOR

FAMILY_FRIEND

OTHER
```

Relationship may eventually become free text if predefined categories prove too restrictive.

---

# 34. Guest Indexes

Useful indexes:

```javascript
{
  weddingId: 1,
  groupId: 1
}
```

```javascript
{
  weddingId: 1,
  side: 1
}
```

Potential lookup:

```javascript
{
  weddingId: 1,
  phone: 1
}
```

Guest phone numbers do not necessarily need to be globally unique.

---

# 35. Guest Invitation Model

Collection:

```text
guestInvitations
```

This collection handles:

- Invitation link
- Invited events
- RSVP
- Guest/group relationship
- Email sending status

This avoids needing a separate RSVP collection in V1.

---

# 36. Guest Invitation Example

Example group invitation:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  inviteeType: "GROUP",

  inviteeId: ObjectId,

  tokenHash: "...",

  status: "ACTIVE",

  events: [
    {
      eventId: ObjectId,

      rsvpStatus: "CONFIRMED",

      attendeeCount: 3,

      attendeeGuestIds: [
        ObjectId,
        ObjectId,
        ObjectId
      ],

      respondedAt: Date
    },

    {
      eventId: ObjectId,

      rsvpStatus: "DECLINED",

      attendeeCount: 0,

      attendeeGuestIds: [],

      respondedAt: Date
    }
  ],

  delivery: {
    email: "raj@example.com",
    lastSentAt: Date,
    sendStatus: "SENT",
    providerMessageId: "..."
  },

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 37. Invitee Type

```text
GUEST

GROUP
```

This allows invitations to be created for:

```text
One person
```

or:

```text
Entire family/group
```

---

# 38. RSVP Status

Each invited event contains:

```text
PENDING

CONFIRMED

DECLINED
```

Example:

```text
Patil Family

Sangeet
→ CONFIRMED

Wedding
→ CONFIRMED

Reception
→ DECLINED
```

---

# 39. Why RSVP Is Embedded

RSVP is stored in the invitation because:

- Each invitation has only a limited number of wedding events.
- Responses are normally viewed together with the invitation.
- It avoids another collection and additional lookups.
- Updating a guest response becomes straightforward.

If RSVP activity later becomes extremely complex, it can be moved to its own collection.

---

# 40. Guest Invitation Indexes

Token lookup:

```javascript
{ tokenHash: 1 }
```

Unique.

Invitation lookup:

```javascript
{
  weddingId: 1,
  inviteeType: 1,
  inviteeId: 1
}
```

Prefer one active invitation record per guest/group.

The token can be regenerated if an invitation must be reissued.

---

# 41. Vendors Collection

Collection:

```text
vendors
```

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  name: "Royal Catering",

  category: "CATERER",

  contactPerson: "Ramesh",

  phone: "+919876543210",

  alternatePhone: null,

  email: null,

  address: "...",

  website: null,

  socialMedia: null,

  serviceDescription: "...",

  eventIds: [
    ObjectId
  ],

  responsibleMemberId: ObjectId,

  status: "CONFIRMED",

  nextFollowUpAt: Date,

  notes: "...",

  documents: [
    {
      _id: ObjectId,

      type: "QUOTATION",

      fileName: "quotation.pdf",

      r2Key: "private/...",

      mimeType: "application/pdf",

      fileSize: 123456,

      uploadedBy: ObjectId,

      createdAt: Date
    }
  ],

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 42. Vendor Status

```text
SHORTLISTED

CONTACTED

CONFIRMED

CANCELLED
```

---

# 43. Vendor Documents

Vendor document metadata is embedded because each vendor is expected to have only a limited number of related documents.

Actual document files remain in Cloudflare R2.

---

# 44. Vendor Indexes

Useful indexes:

```javascript
{
  weddingId: 1,
  category: 1
}
```

```javascript
{
  weddingId: 1,
  status: 1
}
```

```javascript
{
  weddingId: 1,
  responsibleMemberId: 1
}
```

```javascript
{
  weddingId: 1,
  nextFollowUpAt: 1
}
```

---

# 45. Albums Collection

Collection:

```text
albums
```

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  eventId: ObjectId | null,

  name: "Sangeet",

  type: "EVENT",

  coverPhotoId: ObjectId | null,

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 46. Album Type

```text
EVENT

CUSTOM
```

An event can automatically have an associated album.

Users may also create custom albums.

---

# 47. Photos Collection

Collection:

```text
photos
```

Photos are separate because galleries may contain hundreds or thousands of records.

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  eventId: ObjectId | null,

  albumId: ObjectId | null,

  uploadedBy: ObjectId,

  fileName: "IMG_1024.jpg",

  r2Key: "weddings/.../IMG_1024.jpg",

  mimeType: "image/jpeg",

  fileSize: 5432100,

  visibility: "PRIVATE",

  uploadStatus: "READY",

  caption: null,

  createdAt: Date,
  updatedAt: Date,

  deletedAt: null
}
```

---

# 48. Photo Visibility

```text
PRIVATE

PUBLIC
```

`PRIVATE`

means visible within the authenticated family workspace.

`PUBLIC`

means it can be exposed through the wedding website/CDN.

---

# 49. Photo Upload Status

```text
PENDING

READY

FAILED
```

Possible upload lifecycle:

```text
PENDING
   ↓
Upload to R2
   ↓
READY
```

If upload fails:

```text
FAILED
```

---

# 50. Photo Indexes

Gallery listing:

```javascript
{
  weddingId: 1,
  createdAt: -1
}
```

Album:

```javascript
{
  weddingId: 1,
  albumId: 1,
  createdAt: -1
}
```

Event gallery:

```javascript
{
  weddingId: 1,
  eventId: 1,
  createdAt: -1
}
```

Public gallery:

```javascript
{
  weddingId: 1,
  visibility: 1,
  createdAt: -1
}
```

---

# 51. Wedding Website Collection

Collection:

```text
weddingWebsites
```

One document per wedding.

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  slug: "rahul-priya",

  isPublished: true,

  heroPhotoId: ObjectId,

  story: "...",

  visibleEventIds: [
    ObjectId,
    ObjectId
  ],

  publicAlbumIds: [
    ObjectId
  ],

  showGallery: true,

  themeKey: "classic",

  createdAt: Date,
  updatedAt: Date,

  updatedBy: ObjectId
}
```

---

# 52. Wedding Website Indexes

```javascript
{ weddingId: 1 }
```

Unique.

Also:

```javascript
{ slug: 1 }
```

Unique.

Public requests can therefore quickly find:

```text
/w/rahul-priya
```

---

# 53. Public Website Data Boundary

The public website should not expose the entire `weddings` document.

Instead:

```text
WeddingWebsite
      ↓
Explicit references
      ↓
Public Events / Public Photos
```

This reduces the risk of accidentally exposing:

- Vendor data
- Private guests
- Internal notes
- Family tasks

---

# 54. Notifications Collection

Collection:

```text
notifications
```

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  userId: ObjectId,

  type: "TASK_ASSIGNED",

  title: "New task assigned",

  message: "Finalize photographer",

  entityType: "TASK",

  entityId: ObjectId,

  readAt: null,

  createdAt: Date
}
```

---

# 55. Notification Types

Possible values:

```text
TASK_ASSIGNED

TASK_DUE

TASK_OVERDUE

RSVP_RECEIVED

VENDOR_FOLLOWUP

EVENT_REMINDER

FAMILY_MEMBER_JOINED
```

---

# 56. Notification Indexes

Main user notification query:

```javascript
{
  userId: 1,
  readAt: 1,
  createdAt: -1
}
```

---

# 57. Activity Logs Collection

Collection:

```text
activityLogs
```

Used for family collaboration history.

Example:

```javascript
{
  _id: ObjectId,

  weddingId: ObjectId,

  actorUserId: ObjectId,

  action: "VENDOR_CREATED",

  entityType: "VENDOR",

  entityId: ObjectId,

  summary: "Rahul added Royal Catering",

  createdAt: Date
}
```

---

# 58. Activity Index

```javascript
{
  weddingId: 1,
  createdAt: -1
}
```

Allows:

```text
Recent Activity
```

on the wedding dashboard.

---

# 59. Soft Delete Strategy

Important user-created records can include:

```text
deletedAt
```

rather than being immediately removed.

Recommended for:

- Weddings
- Events
- Tasks
- Guests
- Guest Groups
- Vendors
- Albums
- Photos

Example:

```javascript
{
  deletedAt: null
}
```

Deletion:

```javascript
{
  deletedAt: Date
}
```

Application queries should normally exclude deleted records.

---

# 60. Hard Delete Candidates

Temporary/security records can be permanently deleted.

Examples:

```text
Expired sessions

Expired password-reset tokens

Abandoned upload metadata

Old temporary data
```

---

# 61. Dashboard Data Strategy

For V1 we should not create a separate dashboard statistics collection.

Values such as:

```text
Total Tasks

Completed Tasks

Total Guests

Confirmed RSVPs

Total Vendors

Upcoming Events
```

can initially be calculated using indexed MongoDB queries and aggregation.

Example:

```text
Dashboard
   ↓
Events count
Tasks aggregation
Guest count
Invitation aggregation
Vendor count
```

If usage later shows performance issues, summary counters can be introduced.

---

# 62. Avoid Premature Counters

Avoid initially storing:

```text
wedding.totalGuests

wedding.completedTasks

wedding.totalVendors
```

because these create synchronization problems.

For V1:

```text
source collections
→ calculate statistics
```

is simpler and safer.

---

# 63. Pagination

Potentially large collections must use pagination.

Especially:

```text
Guests

Tasks

Photos

Notifications

Activity Logs
```

Recommended approach:

**Cursor-based pagination**

using fields such as:

```text
createdAt + _id
```

rather than large `skip()` values.

---

# 64. Search

V1 does not require a separate search engine.

Simple MongoDB queries/indexes should handle:

### Guests

Search by:

- Name
- Phone

### Vendors

Search by:

- Name
- Category

### Tasks

Search/filter by:

- Status
- Event
- Assigned member

If advanced full-text search becomes necessary later, MongoDB Atlas Search can be considered.

---

# 65. Data Ownership Rule

Every business query should include the wedding boundary.

Avoid:

```text
find task where _id = X
```

Prefer logically:

```text
find task where:

_id = X

AND

weddingId = authenticatedWeddingId
```

The same pattern applies to:

- Guest
- Vendor
- Event
- Photo
- Album

---

# 66. Cross-Wedding Access Prevention

Example:

User belongs to:

```text
Wedding A
```

but requests:

```text
Vendor from Wedding B
```

Database access must fail because:

```text
vendor.weddingId != user's wedding membership
```

This is a critical security rule.

---

# 67. Invitation Token Storage

Raw tokens should never be stored for:

```text
Family invitations

Guest invitations

Password reset
```

Use:

```text
randomToken
   ↓
hash
   ↓
MongoDB
```

The raw token exists only in the URL sent to the user.

---

# 68. Unique Constraints Summary

Important unique constraints:

```text
users.normalizedEmail
```

```text
sessions.tokenHash
```

```text
passwordResetTokens.tokenHash
```

```text
familyInvitations.tokenHash
```

```text
guestInvitations.tokenHash
```

```text
weddingMembers:
weddingId + userId
```

```text
weddingWebsites.weddingId
```

```text
weddingWebsites.slug
```

---

# 69. Data Model Summary

```text
users
   │
   ├── sessions
   │
   └── weddingMembers
           │
           ▼
        weddings
           │
           ├── familyInvitations
           │
           ├── events
           │      └── embedded timeline
           │
           ├── tasks
           │
           ├── guestGroups
           │      └── guests
           │
           ├── guestInvitations
           │      └── embedded event RSVP
           │
           ├── vendors
           │      └── embedded document metadata
           │
           ├── albums
           │      └── photos
           │
           ├── weddingWebsites
           │
           ├── notifications
           │
           └── activityLogs
```

---

# 70. Embedding Decisions

Embedded in parent documents:

### Event

```text
timeline
```

### Guest Invitation

```text
event-level RSVP
```

### Vendor

```text
document metadata
```

### Wedding

```text
bride/groom basic information
location
```

---

# 71. Referenced Collections

Stored separately:

```text
Users

Sessions

Weddings

Wedding Members

Events

Tasks

Guest Groups

Guests

Guest Invitations

Vendors

Albums

Photos

Wedding Website

Notifications

Activity Logs
```

These entities either grow independently or have independent access patterns.

---

# 72. R2 Data Relationship

MongoDB:

```text
Photo
 └── r2Key
```

Cloudflare R2:

```text
actual image bytes
```

MongoDB:

```text
Vendor Document Metadata
 └── r2Key
```

Cloudflare R2:

```text
quotation.pdf
agreement.pdf
```

R2 URLs should not be treated as permanent database identifiers.

Store:

```text
r2Key
```

instead.

This allows domains/CDN settings to change without modifying database records.

---

# 73. Suggested R2 Object Key Pattern

Public:

```text
public/
weddings/{weddingId}/
photos/{photoId}.{extension}
```

Private:

```text
private/
weddings/{weddingId}/
gallery/{photoId}.{extension}
```

Vendor documents:

```text
private/
weddings/{weddingId}/
vendors/{vendorId}/
documents/{documentId}.{extension}
```

Object names should use generated IDs rather than trusting user filenames.

---

# 74. Data Integrity Rules

Important application-level rules:

### Rule 1

Every Event must reference a valid Wedding.

### Rule 2

Every Task must belong to a Wedding.

### Rule 3

If Task.eventId exists, the event must belong to the same Wedding.

### Rule 4

Every Guest and GuestGroup belongs to exactly one Wedding.

### Rule 5

Guest.groupId must reference a group from the same Wedding.

### Rule 6

GuestInvitation events must belong to the invitation's Wedding.

### Rule 7

Vendor event IDs must belong to the same Wedding.

### Rule 8

Photo album/event references must belong to the same Wedding.

### Rule 9

WeddingMember.userId and weddingId combination must be unique.

### Rule 10

Only explicitly public photos/events may appear on the Wedding Website.

---

# 75. MongoDB Transactions

Most operations do not require transactions.

Examples:

```text
Create Task

Create Vendor

Update Event
```

are single-document or independent operations.

Transactions may be useful for workflows involving multiple dependent writes.

Example:

```text
Accept family invitation

1. Validate invitation
2. Create WeddingMember
3. Mark invitation ACCEPTED
```

This is a good candidate for a transaction to prevent partial completion.

Another candidate:

```text
Delete event

+
update associated references
```

depending on deletion behavior.

Transactions should be used selectively.

---

# 76. Document Size Consideration

MongoDB documents have a maximum size.

Therefore we should never embed potentially unlimited arrays such as:

```text
all guests inside Wedding

all photos inside Wedding

all tasks inside Wedding
```

Bad:

```javascript
{
  wedding: {
    guests: [thousands of guests],
    photos: [thousands of photos]
  }
}
```

Instead:

```text
Wedding
   ↓
Guest collection

Wedding
   ↓
Photo collection
```

---

# 77. Concurrent Family Updates

Several family members may update the same wedding simultaneously.

V1 will primarily rely on:

```text
updatedAt
```

for understanding the latest version.

If concurrent-update conflicts become common, optimistic concurrency can be added later.

The database model does not require distributed locking.

---

# 78. Data Retention

Initial recommendation:

### Keep while wedding exists

- Events
- Tasks
- Guests
- Vendors
- Gallery
- Invitations
- Activity

### Automatically expire

- Sessions
- Password-reset tokens

### Potential later cleanup

- Expired family invitation records
- Failed upload records
- Old notifications

Exact retention periods can be decided later.

---

# 79. Backup

MongoDB Atlas managed backup should eventually be enabled for production.

The backup strategy should cover:

- User accounts
- Weddings
- Guest lists
- Vendors
- Events
- Tasks
- Invitations

R2 files require a separate storage-recovery policy because they are not part of the MongoDB backup.

Detailed disaster recovery can be covered separately.

---

# 80. V1 Database Architecture

```text
                         MongoDB Atlas

                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼

 Authentication          Wedding Domain        Communication

 users                    weddings              notifications
 sessions                 weddingMembers        activityLogs
 passwordResetTokens      events
 familyInvitations        tasks
                          guests
                          guestGroups
                          guestInvitations
                          vendors
                          albums
                          photos
                          weddingWebsites
```

Cloudflare R2 sits outside the database:

```text
MongoDB
   │
   │ r2Key
   ▼
Cloudflare R2
```

---

# 81. Final V1 Database Decisions

For the first version:

**Primary Database**

MongoDB Atlas

**Internal IDs**

MongoDB ObjectId

**Security Boundary**

Wedding ID

**Authentication Sessions**

Separate session documents with hashed tokens

**Password Reset**

Separate short-lived hashed-token collection

**Family Membership**

Separate WeddingMember collection

**Event Timeline**

Embedded inside Event

**Tasks**

Separate collection

**Guests**

Separate collection

**Guest Families**

GuestGroup collection

**Guest Invitations**

Separate collection

**RSVP**

Embedded at event level inside GuestInvitation

**Vendors**

Separate collection

**Vendor Document Metadata**

Embedded inside Vendor

**Actual Vendor Documents**

Cloudflare R2

**Albums**

Separate collection

**Photos**

Separate collection

**Actual Photos**

Cloudflare R2

**Wedding Website**

Separate one-to-one collection

**Notifications**

Separate collection

**Activity History**

Separate collection

**Dashboard Statistics**

Calculated dynamically initially

**Soft Delete**

Used for major user-created entities

**Session/Reset Expiration**

MongoDB TTL indexes

---

# 82. Areas Still Open for Detailed Implementation

The following can be finalized during implementation planning:

- Exact session expiration duration
- Exact invitation expiration duration
- Exact reset-token expiration
- Maximum gallery file size
- Allowed file MIME types
- Detailed MongoDB validation schemas
- ODM choice
- Final enum naming conventions
- Soft-delete retention duration
- Notification retention
- Activity-log retention
- Backup frequency
- Whether certain high-volume data needs archival later

These decisions do not require changing the overall database architecture described above.