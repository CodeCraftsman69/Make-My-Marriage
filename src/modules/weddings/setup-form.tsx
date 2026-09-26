"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LocationFields } from "./location-fields";

export function SetupWeddingForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!String(body.title).trim()) delete body.title;
    try {
      const response = await fetch("/api/v1/weddings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok) { setError(json.error?.message ?? "Unable to create wedding."); return; }
      router.push("/app/dashboard");
      router.refresh();
    } catch { setError("We couldn’t save your wedding. Please check your connection and try again."); }
    finally { setPending(false); }
  }
  return <form className="auth-form wedding-setup-form" onSubmit={submit}>
    <fieldset disabled={pending}><legend><span>01</span> The happy couple</legend><div className="setup-grid"><label className="auth-field"><span>Bride’s name</span><input name="brideName" placeholder="e.g. Priya Sharma" required minLength={2} maxLength={100}/></label><label className="auth-field"><span>Groom’s name</span><input name="groomName" placeholder="e.g. Rahul Mehta" required minLength={2} maxLength={100}/></label></div><label className="auth-field"><span>Your role</span><select name="relationship" defaultValue="BRIDE"><option value="BRIDE">I’m the bride</option><option value="GROOM">I’m the groom</option><option value="OTHER">I’m helping plan the wedding</option></select></label></fieldset>
    <fieldset disabled={pending}><legend><span>02</span> When & where</legend><label className="auth-field"><span>Wedding date</span><input name="weddingDate" type="date" required/></label><LocationFields/></fieldset>
    <fieldset disabled={pending}><legend><span>03</span> A personal touch</legend><label className="auth-field"><span>Wedding title <small>(optional)</small></span><input name="title" placeholder="e.g. Priya & Rahul’s wedding" minLength={2} maxLength={150}/><small>Leave this blank and we’ll use the couple’s names.</small></label></fieldset>
    {error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="auth-submit" disabled={pending} type="submit">{pending ? "Creating your workspace…" : "Create our wedding workspace →"}</button><p className="setup-reassurance">Your wedding details stay within your private workspace.</p>
  </form>;
}
