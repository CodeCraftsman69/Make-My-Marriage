"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function PasswordRecoveryForm({ token }: { token?: string }) {
  const resetting = Boolean(token);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const form = new FormData(event.currentTarget);
    if (resetting && form.get("password") !== form.get("confirmPassword")) { setError("Your passwords don't match. Please check both fields."); return; }
    setPending(true);
    try {
      const response = await fetch(`/api/v1/auth/${resetting ? "reset-password" : "forgot-password"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetting ? { token, password: form.get("password") } : { email: form.get("email") }),
      });
      const body = await response.json();
      if (!response.ok) { setError(body.error?.message ?? "Unable to complete your request. Please try again."); return; }
      setSuccess(body.data.message);
      if (resetting) {
        try { const channel = new BroadcastChannel("mmm:logout"); channel.postMessage("logout"); channel.close(); } catch { /* Optional notification. */ }
        try { localStorage.setItem("mmm:logout", crypto.randomUUID()); } catch { /* Session checks remain authoritative. */ }
      }
    } catch { setError("We couldn't reach the server. Please check your connection and try again."); }
    finally { setPending(false); }
  }
  if (success) return <div className="auth-form"><p className="wedding-saved" role="status">{success}</p>{!resetting && <p className="field-hint">The link expires in 30 minutes. Only your most recently requested link will work. Please wait a few minutes before requesting another.</p>}<Link className="recovery-link" href="/login">Back to sign in</Link>{!resetting && <button className="location-search" type="button" onClick={() => setSuccess("")}>Try another email</button>}</div>;
  return <form className="auth-form" onSubmit={submit} aria-busy={pending}>
    {resetting ? <><label className="auth-field"><span>New password</span><input type={visible ? "text" : "password"} name="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={pending} aria-describedby="password-hint"/></label><p id="password-hint" className="field-hint">Use 12–128 characters. A long, unique passphrase is a good choice.</p><label className="auth-field"><span>Confirm new password</span><input type={visible ? "text" : "password"} name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required disabled={pending}/></label><label className="title-toggle"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)}/>Show passwords</label></> : <label className="auth-field"><span>Email address</span><input type="email" name="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required disabled={pending}/></label>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Please wait…" : resetting ? "Save new password" : "Send reset link"}</button>
    <Link className="recovery-link" href={resetting ? "/forgot-password" : "/login"}>{resetting ? "Need a new reset link?" : "Back to sign in"}</Link>
  </form>;
}
