"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LOGOUT_EVENT = "mmm:logout";

export function SessionControls({ userId, publicPage = false, embedded = false }: { userId: string | null; publicPage?: boolean; embedded?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let disposed = false;
    let checking = false;
    const controller = new AbortController();
    const leave = () => publicPage ? window.location.reload() : window.location.replace("/login");
    async function checkSession() {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch("/api/v1/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (disposed) return;
        if (response.status === 401 && userId) leave();
        else if (response.ok) {
          const body = await response.json();
          // Another tab may have signed into a different account.
          if (!disposed && body.data?.user?.id !== userId) window.location.reload();
        }
      } catch {
        // Network failures do not prove that a session has expired.
      } finally {
        checking = false;
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_EVENT && event.newValue) void checkSession();
    };
    try {
      channel.current = new BroadcastChannel(LOGOUT_EVENT);
      channel.current.onmessage = () => void checkSession();
    } catch {
      // Storage events and session checks also work without BroadcastChannel.
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", checkSession);
    window.addEventListener("pageshow", checkSession);
    document.addEventListener("visibilitychange", checkSession);
    const interval = window.setInterval(checkSession, 60_000);
    void checkSession();
    return () => {
      disposed = true;
      controller.abort();
      channel.current?.close();
      channel.current = null;
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", checkSession);
      window.removeEventListener("pageshow", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [userId, publicPage]);

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
    } catch {
      setError("Could not log out. Please try again.");
      setBusy(false);
      return;
    }
    try { channel.current?.postMessage("logout"); } catch { /* Optional transport. */ }
    try { localStorage.setItem(LOGOUT_EVENT, crypto.randomUUID()); } catch { /* Storage may be disabled. */ }
    // A full navigation discards the private client router cache.
    window.location.replace(publicPage ? "/" : "/login");
  }

  return (
    <div className={publicPage ? "public-account-controls" : embedded ? "studio-session-controls" : "session-controls"}>
      {!publicPage && !embedded && <Link className="app-home-link" href="/">Make My Marriage · Home</Link>}
      {publicPage && <Link href={userId ? "/app/dashboard" : "/login"}>{userId ? "Dashboard" : "Sign in"}</Link>}
      {!userId ? <Link className="public-get-started" href="/register">Get started</Link> : <button className="auth-submit" disabled={busy} onClick={logout} type="button">
        {busy ? "Logging out…" : "Log out"}
      </button>}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
    </div>
  );
}
