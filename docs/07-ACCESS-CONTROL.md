# Wedding access control

Relationship and access role are separate. Selecting Bride or Groom never grants permissions. The creator starts as the primary Owner; changing that control requires an explicit transfer.

| Action | Owner | Co-owner | Planner | Viewer |
| --- | --- | --- | --- | --- |
| Read private wedding details and member names | Yes | Yes | Yes | Yes |
| Edit core wedding details | Yes | Yes | No | No |
| Edit planning resources when implemented | Yes | Yes | Yes | No |
| Send/resend/revoke Viewer or Planner invitations | Yes | Yes | No | No |
| See member emails and invitation history | Yes | Yes | No | No |
| Change Planner/Viewer roles | Yes | Yes | No | No |
| Grant/demote Co-owner | Password confirmation | No | No | No |
| Transfer primary ownership | Password confirmation | No | No | No |

Planning resource editing is a central permission for upcoming event/task/vendor modules; those modules remain unavailable in this checkout. Their write adapters must use the shared transactional authorization helper with `editPlanning`. Core wedding editing uses `editWedding`.

## Member protection

- No self-role changes or self-removal through membership management.
- No removal of the primary Owner or Co-owners.
- Only the primary Owner can change co-ownership, after confirming their current password. A Co-owner cannot promote someone else to Co-owner or manage peers.
- Bride/Groom memberships cannot be removed, regardless of access role. They must be explicitly granted Co-owner access to edit core wedding details; protection alone is not a permission grant.
- Correcting a mistaken protected-couple relationship requires a separately reviewed recovery flow. This slice does not expose an unprotect-and-delete shortcut.
- Removal ends only that wedding membership, not the user's account or their other wedding memberships.

## Invitations and existing data

New invitations default to Viewer and can grant only Viewer or Planner. Legacy `FAMILY_MEMBER` memberships resolve to Viewer without rewriting live data. Missing roles on old invitations also resolve to Viewer. Unknown roles fail closed. Existing owners retain ownership; the application never guesses the couple's identities or automatically promotes a person based on name/email/relationship.

For a helper who created the wedding: invite the bride/groom, grant Co-owner using Change access and password confirmation, then use Transfer ownership if the helper should become a Planner. Ordinary role PATCH requests cannot set Owner.

Invitation acceptance requires an active inviting Owner/Co-owner as well as the intended recipient's authenticated email. Demotion/removal of an invitation manager cancels their pending invitations. Removing a member also revokes pending invitations addressed to that person. Rejoining cannot replay an accepted or revoked link to restore earlier roles. An active membership cannot be overwritten through invitation acceptance.

## Transaction and audit boundary

Core wedding edits, role changes, removals, ownership transfer, invitation creation/cancellation, and acceptance all acquire the same wedding-document write lock (`accessVersion`) inside MongoDB transactions. The actor's current active membership is rechecked inside that transaction; concurrent revocation causes a write conflict/retry rather than committing under an obsolete role.

Ownership transfer requires a different active Co-owner with an active account, verifies the current single-owner invariant, and changes both memberships atomically. The former Owner becomes Planner. Their pending invitations are revoked. There is no committed intermediate state with zero owners. Both concurrent transfers and competing demotions must recheck access under the lock.

Co-ownership changes and ownership transfers require current-password verification, limited to five confirmation attempts per user per 15-minute fixed window. Passwords are never persisted or logged by this flow. Membership removal, role changes, and transfers write an audit record in the same transaction, containing actor/member IDs and the role transition, not tokens or passwords.

Server authorization is authoritative on every request. UI controls reflect permissions, and the Family page refreshes on focus/visibility and periodically. An already-rendered page can remain visible while offline; it cannot authorize writes after the user's permissions are revoked.

## Verification boundary

Automated tests exercise the production use cases with isolated MongoDB/email adapters, including real authorization and password-confirmation orchestration. These tests verify the service contract and simulated rollback/serialization; they do not replace MongoDB Atlas concurrency testing or authenticated browser verification.
