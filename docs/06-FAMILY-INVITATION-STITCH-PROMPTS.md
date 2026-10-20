# Family invitation UX — Stitch prompts

Use these prompts in the existing **Wedding Family Collaboration Workspace** Stitch project. Attach the approved Make My Marriage dashboard as a reference. Generate designs only; sample data must not be mistaken for real records.

## Prompt 1 — Family workspace and invitation form

```text
Extend the approved Make My Marriage wedding dashboard with the Family workspace (/app/family). Preserve its brand, compact header, ivory canvas, deep burgundy actions (#581825), subtle champagne-gold accents, thin warm borders, Newsreader headings, and Plus Jakarta Sans body text. Keep the interface readable and welcoming for multi-generational Indian families.

Create desktop (1440px) and mobile (390px) screens for Owner, Co-owner, Planner, and Viewer views.

Header: brand links to the public home page; Overview, Wedding details, Family; signed-in user name/avatar and Log out. Family must remain reachable on mobile.

Page title: “Your planning circle”. Subtitle: “Bring your family together to plan every celebration.” Show the wedding title and the current user's access badge.

There are exactly four access roles:
- Owner: one primary owner; edits core wedding details, manages lower access roles, grants/revokes co-ownership with current-password confirmation, and transfers ownership explicitly to an active co-owner.
- Co-owner: edits core wedding details and manages Planner/Viewer access, but cannot change or remove owners/co-owners, promote co-owners, or transfer ownership.
- Planner: can use planning tools as they become available; cannot edit core wedding details or manage family access.
- Viewer: read-only, the default for new invites and legacy Family Members.
Relationship (Mother, Father, Brother, Sister, Relative, Bride, Groom, Other) is descriptive and independent of access role. Bride/Groom memberships are protected from removal, but do not automatically grant ownership. Do not invent custom permissions or Admin roles.

Owner/Co-owner view: Invite family member primary action; joined member cards with initials, name, relationship, access role, and join date. Managers see member emails. Never show Remove for Owner, Co-owner, Bride, Groom, or the current user. Include a removal confirmation explaining that the account stays but wedding access ends. Show protected-couple labels. Role changes use an explicit form and confirmation. Only the primary Owner sees Co-owner as an assignable role and current-password confirmation when changing co-ownership. No self-role changes.

Invitation form: name, email, relationship, and Viewer/Planner selector (default Viewer); Send invitation and Cancel. Explain what each access role allows. Co-ownership is granted only after joining, using password-confirmed role management. Show field validation, sending/disabled state, success, and failure with retained entries. State that links expire in seven days and recipients must sign in with the invited email.

Invitations section is visible to Owners and Co-owners: name, email, relationship, granted access role, Pending/Accepted/Expired/Cancelled state, expiry, and delivery status. Support email sent, sending/unconfirmed, and delivery unconfirmed. Resend replaces the previous link. Add a one-minute resend cooldown message and rate-limit feedback. Cancel invitation requires confirmation. Accepted invitations have no resend/cancel actions.

Primary ownership transfer: available only to the Owner, targeting a different active Co-owner. Require current password and a clear confirmation that the recipient becomes Owner, the initiator becomes Planner, and the initiator's pending invites are cancelled. Do not suggest this is automatically reversible. Show incorrect password and rate-limit states; never prefill or retain passwords after submission.

Design the empty circle (owner only), no invitations, populated views, and Planner/Viewer views without management controls. Show a readable role guide and read-only wedding details for Planner/Viewer. On mobile use stacked cards rather than horizontal tables. Include visible labels, keyboard focus, accessible contrast, and 44px touch targets. Do not add guest RSVP, chat, billing, custom permissions, or fake statistics.
```

## Prompt 2 — Email and invitation acceptance

```text
Design the Make My Marriage family invitation email and /join/{token} acceptance screens. Use the same ivory, burgundy, restrained gold, Newsreader, and Plus Jakarta Sans design language as the approved family workspace.

Email: personal greeting, inviter name, wedding title, assigned Viewer/Planner access with explanation, “Join the family workspace” CTA, seven-day expiry, and instruction to use the invited email. Mention that resending replaces the old link. This is a private planning invitation, not a guest RSVP. Use clear copy suitable for a transactional email; include a readable fallback link.

Join page: focused branded card outside private navigation, inviter name, wedding title, and relationship. Show only minimal invitation details; no private plans, family email list, guest data, or vendor information.

Design these distinct states:
1. Signed out: “Create account to join” and “Already have an account? Sign in”. Explain the invited-email requirement. Preserve the invitation through authentication; do not send new members into wedding creation.
2. Signed in with the correct account: current email, actual Viewer/Planner access explanation, and “Accept invitation”. Acceptance is explicit, never automatic on opening the link. Relationship never silently grants ownership.
3. Wrong account: clear mismatch explanation, no acceptance control, and “Use a different account”. Do not disclose the recipient's full email to the wrong account.
4. Joining: disabled action and progress feedback; prevent duplicate submissions.
5. Accepted/already accepted: “Open wedding workspace”. Open this wedding even if the person belongs to another one.
6. Expired, cancelled, replaced, or invalid link: neutral unavailable state asking the recipient to request a new invite from the owner.
7. Network/server failure: retry while retaining context.
8. Previously accepted but access removed: explain that the owner must send a new invitation; the old link cannot restore access.

Deliver desktop and 390px mobile versions. Match existing authentication forms, use readable text and generous touch targets, and avoid technical token/database language in user-facing copy.
```

## Prompt 3 — Dashboard family card

```text
Add a compact “Planning together” card to the approved Make My Marriage dashboard without redesigning the surrounding page. Use the existing ivory/burgundy/gold style and typography.

Show up to four initials avatars, the real active-member count, and “View family”. Owner and Co-owner see “Invite family member”; Planner and Viewer see only “View family”. Show the current user's role. Edit wedding details appears only for Owner/Co-owner; other users see View wedding details.

Design the owner-only empty circle, a populated circle, and mobile stacking. Use labelled sample names and counts only. Keep the card visually consistent with the dashboard’s existing panels, and avoid invented activity feeds or completion percentages.
```

## Access decisions

The explicitly requested role-based extension supersedes V1's common planning access. Core wedding edits require Owner/Co-owner. Invite clients can request only Viewer/Planner. Existing FAMILY_MEMBER records resolve to Viewer until explicitly reassigned. Co-ownership changes require the primary owner's password. Ownership transfers are transactional and do not infer ownership from names or relationships. No separate email-verification step is added; the private email token and matching account are required together.
