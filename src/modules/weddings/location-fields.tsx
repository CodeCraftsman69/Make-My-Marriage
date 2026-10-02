"use client";

import { useRef, useState } from "react";

type Place = { city: string; state: string };

export function LocationFields({ initialCity = "", initialState = "" }: { initialCity?: string; initialState?: string }) {
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [results, setResults] = useState<Place[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const requestVersion = useRef(0);
  async function search() {
    const version = ++requestVersion.current;
    setPending(true);
    setResults([]);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/locations?query=${encodeURIComponent(city.trim())}`, { cache: "no-store" });
      const body = await response.json();
      if (version !== requestVersion.current) return;
      if (!response.ok) throw new Error("Search unavailable");
      setResults(body.data.places);
      if (!body.data.places.length) setMessage("No suggestions found. You can enter your city and state manually.");
    } catch {
      if (version === requestVersion.current) setMessage("Location search is unavailable. You can still enter your city and state manually.");
    } finally {
      if (version === requestVersion.current) setPending(false);
    }
  }
  return <div className="location-fields"><div className="setup-grid"><label className="auth-field"><span>City <small>(optional)</small></span><input name="city" autoComplete="address-level2" placeholder="Search an Indian city" maxLength={100} value={city} onChange={event => { requestVersion.current++; setPending(false); setCity(event.target.value); setResults([]); setMessage(""); }}/></label><label className="auth-field"><span>State <small>(optional)</small></span><input name="state" autoComplete="address-level1" placeholder="e.g. Karnataka" maxLength={100} value={state} onChange={event => setState(event.target.value)}/></label></div><button className="location-search" type="button" disabled={pending || city.trim().length < 3} onClick={search}>{pending ? "Finding cities…" : "Find city & state"}</button><p className="field-hint">Search using your city name, then select a match to fill both fields. Manual entry works too.</p>{message ? <p role="status" className="field-hint">{message}</p> : null}{results.length ? <ul className="location-results" aria-label="Suggested locations">{results.map(place => <li key={`${place.city}-${place.state}`}><button type="button" onClick={() => { setCity(place.city); setState(place.state); setResults([]); setMessage("Location selected. You can edit either field."); }}>{place.city}<span>{place.state}, India</span></button></li>)}</ul> : null}<small className="location-credit">Search powered by <a href="https://www.geoapify.com/">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></small></div>;
}
