"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LocationFields } from "./location-fields";
import { suggestWeddingTitle } from "./wedding-title";
import type { WeddingView } from "./wedding-types";
import { createWeddingSchema, updateWeddingSchema } from "./wedding-schemas";

export function SetupWeddingForm({ wedding }: { wedding?: WeddingView }) {
  const router = useRouter();
  const editing = Boolean(wedding);
  const [bride, setBride] = useState(wedding?.brideName ?? "");
  const [groom, setGroom] = useState(wedding?.groomName ?? "");
  const [customTitle, setCustomTitle] = useState(wedding?.title ?? "");
  const [automaticTitle, setAutomaticTitle] = useState(!wedding || wedding.title === suggestWeddingTitle(wedding.brideName, wedding.groomName));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const title = automaticTitle ? suggestWeddingTitle(bride, groom) : customTitle;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = (editing ? updateWeddingSchema : createWeddingSchema).safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(" "));
      return;
    }
    setPending(true);
    try {
      const response = await fetch(editing ? `/api/v1/weddings/${wedding!.id}` : "/api/v1/weddings", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(response.status === 401 ? "Your session expired. Sign in again before saving." : json.error?.message ?? "Unable to save your wedding.");
        setPending(false);
        return;
      }
      // Reload the dashboard from the server so its details and countdown are fresh.
      window.location.replace(editing ? "/app/dashboard?updated=1" : "/app/dashboard");
    } catch {
      setError("We couldn't save your wedding. Your entries are still here. Please try again.");
      setPending(false);
    }
  }

  return <form className="auth-form wedding-setup-form" onSubmit={submit} aria-busy={pending}>
    <p className="field-hint">Only the couple&apos;s names and wedding date are required. You can update these details later.</p>
    <fieldset disabled={pending}>
      <legend><span>01</span> The happy couple</legend>
      <div className="setup-grid">
        <label className="auth-field"><span>Bride&apos;s name</span><input name="brideName" placeholder="e.g. Priya Sharma" required minLength={2} maxLength={100} value={bride} onChange={event => setBride(event.target.value)}/></label>
        <label className="auth-field"><span>Groom&apos;s name</span><input name="groomName" placeholder="e.g. Rahul Mehta" required minLength={2} maxLength={100} value={groom} onChange={event => setGroom(event.target.value)}/></label>
      </div>
      {!editing && <label className="auth-field"><span>Your role</span><select name="relationship" defaultValue="BRIDE"><option value="BRIDE">I&apos;m the bride</option><option value="GROOM">I&apos;m the groom</option><option value="OTHER">I&apos;m helping plan the wedding</option></select></label>}
    </fieldset>
    <fieldset disabled={pending}>
      <legend><span>02</span> When & where</legend>
      <label className="auth-field"><span>Wedding date</span><input name="weddingDate" type="date" required defaultValue={wedding?.weddingDate.slice(0, 10)}/>{editing && <small>Changing this date does not move individual event dates.</small>}</label>
      <LocationFields initialCity={wedding?.location.city} initialState={wedding?.location.state}/>
    </fieldset>
    <fieldset disabled={pending}>
      <legend><span>03</span> Make it yours</legend>
      <label className="title-toggle"><input type="checkbox" checked={automaticTitle} onChange={event => { if (!event.target.checked) setCustomTitle(title); setAutomaticTitle(event.target.checked); }}/> Generate our wedding title from our names</label>
      <label className="auth-field"><span>Wedding title</span><input name="title" value={title} readOnly={automaticTitle} onChange={event => setCustomTitle(event.target.value)} required minLength={2} maxLength={150}/><small>{automaticTitle ? "Your title updates as you type the couple's names. Uncheck the option above to personalize it." : "Choose a title that feels like you."}</small></label>
      <label className="auth-field"><span>A few words about your wedding <small>(optional)</small></span><textarea name="description" rows={3} maxLength={2000} defaultValue={wedding?.description ?? ""} placeholder="A celebration with our favourite people..."/></label>
    </fieldset>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="wedding-form-actions"><button className="auth-submit" disabled={pending} type="submit">{pending ? "Saving your wedding..." : editing ? "Save changes" : "Create our wedding workspace"}</button>{editing && <button className="location-search" type="button" disabled={pending} onClick={() => router.push("/app/dashboard")}>Cancel</button>}</div>
    <p className="setup-reassurance">{editing ? "Cancel returns to your dashboard without saving." : "Your wedding details stay within your private workspace."}</p>
  </form>;
}
