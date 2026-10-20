"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { relationships } from "./wedding-member-types";
import type { FamilyView } from "./invitation-policy";
import { canChangeMemberRole, canRemoveMember, permissionsForRole, type WeddingRole } from "./permissions";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";

type FamilyConfirmation =
  | { kind: "remove" | "cancelInvite" | "resendInvite"; id: string; name: string }
  | { kind: "role"; id: string; name: string; role: Exclude<WeddingRole, "OWNER">; needsPassword: boolean }
  | { kind: "transfer"; id: string; name: string };

const label = (value: string) => value.toLowerCase().replaceAll("_", " ");
const dateLabel = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export function FamilyWorkspace({ weddingId, weddingTitle, family, initiallyInvite = false, joined = false }: { weddingId: string; weddingTitle: string; family: FamilyView; initiallyInvite?: boolean; joined?: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(initiallyInvite);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(joined ? "You’re now part of this wedding’s planning circle. Welcome!" : "");
  const permissions = permissionsForRole(family.role);
  const owner = permissions.manageFamily;
  const [accessTarget, setAccessTarget] = useState<FamilyView["members"][number] | null>(null);
  const [nextRole, setNextRole] = useState<Exclude<WeddingRole, "OWNER">>("VIEWER");
  const [password, setPassword] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [confirmation, setConfirmation] = useState<FamilyConfirmation | null>(null);
  const base = `/api/v1/weddings/${weddingId}`;
  useEffect(() => {
    const refresh = () => { if (!inFlight.current && document.visibilityState === "visible") router.refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); window.clearInterval(interval); };
  }, [router]);
  async function act(path: string, method: string, payload?: unknown) {
    if (inFlight.current) return false;
    inFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to complete this action.");
      setMessage(result.data?.message ?? "Saved."); return true;
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Unable to reach the server. Please try again."); return false;
    } finally { inFlight.current = false; setBusy(false); router.refresh(); }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
    if (await act(`${base}/family-invitations`, "POST", { name: values.get("name"), email: values.get("email"), relationship: values.get("relationship"), role: values.get("role") })) { form.reset(); setShowForm(false); }
  }
  function askConfirmation(action: FamilyConfirmation) {
    if (inFlight.current) return;
    setError(""); setPassword(""); setConfirmation(action);
  }
  async function confirmAction() {
    if (!confirmation || inFlight.current) return;
    const action = confirmation;
    let success = false;
    if (action.kind === "remove") success = await act(`${base}/members/${action.id}`, "DELETE");
    else if (action.kind === "cancelInvite") success = await act(`${base}/family-invitations/${action.id}/revoke`, "POST");
    else if (action.kind === "resendInvite") success = await act(`${base}/family-invitations/${action.id}/resend`, "POST");
    else if (action.kind === "role") {
      const currentPassword = password; setPassword("");
      success = await act(`${base}/members/${action.id}`, "PATCH", { role: action.role, ...(action.needsPassword ? { currentPassword } : {}) });
      if (success) setAccessTarget(null);
    } else if (action.kind === "transfer") {
      const currentPassword = password; setPassword("");
      success = await act(`${base}/transfer-ownership`, "POST", { memberId: action.id, currentPassword, confirmation: "TRANSFER_OWNERSHIP" });
      if (success) { setTransferTarget(""); window.location.reload(); }
    }
    if (success) setConfirmation(null);
  }
  const confirmationCopy = confirmation ? {
    remove: { title: `Remove ${confirmation.name}?`, description: "They’ll lose access to this wedding. Their account and access to other weddings will remain.", confirmLabel: "Remove member", cancelLabel: "Keep member", danger: true },
    cancelInvite: { title: `Cancel ${confirmation.name}’s invitation?`, description: "Their current invitation link will stop working. You can send a new invitation later.", confirmLabel: "Cancel invitation", cancelLabel: "Keep invitation", danger: true },
    resendInvite: { title: `Send ${confirmation.name} a new invitation?`, description: "We’ll send a new email with a fresh seven-day link. The previous invitation link will stop working. If delivery was uncertain, check your inbox first.", confirmLabel: "Send new invitation", cancelLabel: "Not now", danger: false },
    role: { title: `Change ${confirmation.name}’s access?`, description: confirmation.kind === "role" ? `Their access will become ${label(confirmation.role)}. Their relationship stays unchanged. The new permissions apply to subsequent requests.` : "", confirmLabel: "Save access", cancelLabel: "Go back", danger: false },
    transfer: { title: "Transfer primary ownership?", description: `${confirmation.name} will become the primary owner. You’ll become a Planner and lose ownership controls. Your pending invitations will be cancelled. You cannot undo this yourself.`, confirmLabel: "Transfer ownership", cancelLabel: "Keep ownership", danger: true },
  }[confirmation.kind] : null;
  return <main className="workspace-dashboard family-workspace">
    <header className="family-heading"><div><p className="auth-eyebrow">{weddingTitle}</p><h1>Your planning circle</h1><p>Bring your family together to plan every celebration.</p></div>{owner && <button className="family-primary" onClick={() => setShowForm(!showForm)} aria-expanded={showForm} aria-controls="invite-family-form">{showForm ? "Close invitation form" : "+ Invite family member"}</button>}</header>
    <div className="family-access"><span className="family-badge">{label(family.role)}</span><p>{permissions.manageOwnership ? "You control ownership and access. Grant co-ownership explicitly to the bride or groom when they join." : owner ? "You can edit wedding details and manage Planners and Viewers. Only the owner controls ownership." : family.role === "PLANNER" ? "You can help with planning. Core wedding details and family access stay with the owners." : "Your access is read-only. Ask an owner if you need a different role."}</p></div>
    <details className="family-permissions"><summary>Understand access roles</summary><dl><dt>Owner</dt><dd>Core details, family access, co-owner grants, and ownership transfer.</dd><dt>Co-owner</dt><dd>Core details and management of Planners and Viewers. Cannot manage other owners.</dd><dt>Planner</dt><dd>Planning tools as they become available; no core-detail or access changes.</dd><dt>Viewer</dt><dd>Read-only wedding access. This is the default for new invitations and existing family memberships.</dd></dl><p>Bride and Groom are relationships, not automatic ownership. Their memberships cannot be removed. A co-owner must be explicitly reassigned by the owner before removal is possible.</p></details>
    {error && !confirmation && <p className="auth-error" role="alert">{error}</p>}{message && <p className="wedding-saved" role="status">{message}</p>}
    {showForm && owner && <section className="family-form-panel" id="invite-family-form"><div><p className="auth-eyebrow">Make room for your people</p><h2>Invite family member</h2><p>We’ll email a private invitation. They’ll join using the same email address.</p></div><form className="auth-form" onSubmit={invite}>
      <div className="setup-grid"><label className="auth-field"><span>Name</span><input name="name" autoComplete="off" minLength={2} maxLength={100} required placeholder="e.g. Ananya"/></label><label className="auth-field"><span>Email</span><input name="email" type="email" autoComplete="off" maxLength={254} required placeholder="name@example.com"/></label></div>
      <label className="auth-field"><span>Relationship to the couple</span><select name="relationship" defaultValue="OTHER">{relationships.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      <label className="auth-field"><span>Access role</span><select name="role" defaultValue="VIEWER"><option value="VIEWER">Viewer — read-only</option><option value="PLANNER">Planner — planning access</option></select></label>
      <p className="family-form-hint">Invitations expire in seven days. Owners and co-owners manage access. To grant co-ownership, first invite them, then confirm your password when changing their role.</p>
      <div className="family-actions"><button className="family-primary" disabled={busy}>{busy ? "Sending…" : "Send invitation"}</button><button type="button" disabled={busy} onClick={() => setShowForm(false)}>Cancel</button></div>
    </form></section>}
    <section className="family-section"><div className="family-section-title"><h2>Planning together <span className="family-count">{family.members.length}</span></h2><p>Your wedding’s private circle</p></div>
      <div className="family-members">{family.members.map(member => <article className="family-member" key={member.id}><span className="family-avatar" aria-hidden="true">{member.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("")}</span><div className="family-member-info"><h3>{member.name}{member.id === family.memberId ? " (you)" : ""}</h3><p className="family-relationship">{label(member.relationship)}</p>{member.email && <p>{member.email}</p>}<small>Joined {dateLabel(member.joinedAt)}</small></div><span className="family-badge">{label(member.role)}</span><div className="family-actions">{canChangeMemberRole(family.role, member.role, "VIEWER", member.id === family.memberId) && <button disabled={busy} onClick={() => { setAccessTarget(member); setNextRole(member.role === "OWNER" ? "VIEWER" : member.role); setPassword(""); setTransferTarget(""); }}>Change access</button>}{canRemoveMember(family.role, member.role, member.relationship, member.id === family.memberId) && <button className="family-danger" disabled={busy} onClick={() => askConfirmation({ kind: "remove", id: member.id, name: member.name })}>Remove</button>}{permissions.manageOwnership && member.role === "CO_OWNER" && <button disabled={busy} onClick={() => { setTransferTarget(member.id); setAccessTarget(null); setPassword(""); }}>Transfer ownership</button>}</div>{["BRIDE", "GROOM"].includes(member.relationship) && <small className="family-protected">Protected couple membership</small>}</article>)}</div>
      {family.members.length === 1 && <p className="family-empty">{owner ? "A little help makes a beautiful difference. Invite your first family member to start planning together." : "Your planning circle is just getting started."}</p>}
    </section>
    {accessTarget && owner && <section className="family-form-panel"><div><h2>Change access for {accessTarget.name}</h2><p>Relationship stays unchanged. Grant only the access they need.</p></div><form className="auth-form" onSubmit={event => { event.preventDefault(); askConfirmation({ kind: "role", id: accessTarget.id, name: accessTarget.name, role: nextRole, needsPassword: nextRole === "CO_OWNER" || accessTarget.role === "CO_OWNER" }); }}><label className="auth-field"><span>Access role</span><select value={nextRole} onChange={event => setNextRole(event.target.value as Exclude<WeddingRole, "OWNER">)}><option value="VIEWER">Viewer</option><option value="PLANNER">Planner</option>{permissions.manageOwnership && <option value="CO_OWNER">Co-owner</option>}</select></label><div className="family-actions"><button className="family-primary" disabled={busy}>Review access change</button><button type="button" disabled={busy} onClick={() => { setAccessTarget(null); setPassword(""); }}>Cancel</button></div></form></section>}
    {transferTarget && permissions.manageOwnership && <section className="family-form-panel"><div><h2>Transfer primary ownership</h2><p>{family.members.find(member => member.id === transferTarget)?.name} will become the primary owner. You will become a Planner and lose ownership controls. Review the change and confirm with your current password.</p></div><form className="auth-form" onSubmit={event => { event.preventDefault(); askConfirmation({ kind: "transfer", id: transferTarget, name: family.members.find(member => member.id === transferTarget)?.name ?? "This co-owner" }); }}><div className="family-actions"><button className="family-primary" disabled={busy}>Review ownership transfer</button><button type="button" disabled={busy} onClick={() => { setTransferTarget(""); setPassword(""); }}>Cancel</button></div></form></section>}
    {owner && <section className="family-section"><div className="family-section-title"><h2>Invitations</h2><p>Manage pending links and delivery</p></div>{family.invitations.length ? <div className="family-invites">{family.invitations.map(invite => <article className="family-invite-row" key={invite.id}><div><h3>{invite.name}</h3><p>{invite.email}</p><small className="family-relationship">{label(invite.relationship)} · {label(invite.role)}</small></div><div><span className="family-badge">{label(invite.status)}</span>{invite.status === "PENDING" && <p className={invite.deliveryStatus === "FAILED" ? "family-delivery-failed" : ""}>{invite.deliveryStatus === "FAILED" ? (invite.deliveryError ?? "Delivery unconfirmed — try Resend") : invite.deliveryStatus === "SENDING" ? "Sending / delivery unconfirmed" : "Email sent"}</p>}<small>Link expires {dateLabel(invite.expiresAt)}</small></div>{invite.status !== "ACCEPTED" && <div className="family-actions"><button disabled={busy} onClick={() => askConfirmation({ kind: "resendInvite", id: invite.id, name: invite.name })}>Resend</button>{invite.status === "PENDING" && <button className="family-danger" disabled={busy} onClick={() => askConfirmation({ kind: "cancelInvite", id: invite.id, name: invite.name })}>Cancel invitation</button>}</div>}</article>)}</div> : <p className="family-empty">No invitations yet. Your sent invitations and their status will appear here.</p>}</section>}
    {confirmation && confirmationCopy && <ConfirmationDialog open {...confirmationCopy} busy={busy} error={error} onConfirm={confirmAction} onCancel={() => { setConfirmation(null); setPassword(""); setError(""); }}>
      {(confirmation.kind === "transfer" || (confirmation.kind === "role" && confirmation.needsPassword)) && <label className="auth-field"><span>Your current password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={128}/></label>}
    </ConfirmationDialog>}
  </main>;
}
