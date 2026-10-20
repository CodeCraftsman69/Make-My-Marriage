"use client";
import Link from "next/link";
import { useState } from "react";
export function JoinInvitation({ token, email, accepted, wrongAccount = false, role = "VIEWER" }: { token: string; email: string | null; accepted: boolean; wrongAccount?: boolean; role?: "VIEWER" | "PLANNER" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = encodeURIComponent(`/join/${token}`);
  async function accept() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/v1/invitations/family/${token}/accept`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to join this wedding.");
      window.location.replace("/app/family?joined=1");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Unable to reach the server."); setBusy(false); }
  }
  async function switchAccount() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      try { localStorage.setItem("mmm:logout", crypto.randomUUID()); } catch { /* Optional cross-tab transport. */ }
      window.location.replace(`/login?next=${next}`);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Unable to sign out."); setBusy(false); }
  }
  return <div className="auth-form">{email ? <><p>Signed in as <strong>{email}</strong></p>{wrongAccount ? <p className="auth-error" role="alert">This invitation was sent to a different email address. Switch to the account that received it.</p> : <><p className="field-hint">You’ll join as a {role === "PLANNER" ? "Planner" : "Viewer"}. {role === "PLANNER" ? "You can help with planning, but cannot change core wedding details or manage access." : "Your wedding access is read-only."}</p><button className="family-primary" disabled={busy} onClick={accept}>{busy ? "Please wait…" : accepted ? "Open wedding workspace" : "Accept invitation"}</button></>}<button className="family-switch" disabled={busy} onClick={switchAccount}>Use a different account</button></> : <><Link className="family-primary" href={`/register?next=${next}`}>Create account to join</Link><Link className="recovery-link" href={`/login?next=${next}`}>Already have an account? Sign in</Link><p className="field-hint">Register with the email address that received the invitation.</p></>}{error && <p className="auth-error" role="alert">{error}</p>}</div>;
}
