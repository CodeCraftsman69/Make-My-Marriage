import "server-only";
import { z } from "zod";
import { env } from "@/config/env";

const resultSchema = z.object({ results: z.array(z.object({ city: z.string().optional(), state: z.string().optional() })) });

export async function searchCities(query: string) {
  if (!env.GEOAPIFY_API_KEY) return null;
  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.search = new URLSearchParams({ text: query, type: "city", filter: "countrycode:in", lang: "en", format: "json", limit: "5", apiKey: env.GEOAPIFY_API_KEY }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!response.ok) throw new Error("Location provider unavailable");
  const data = resultSchema.parse(await response.json());
  const places = data.results.flatMap(place => place.city && place.state ? [{ city: place.city, state: place.state }] : []);
  return places.filter((place, index) => places.findIndex(other => other.city === place.city && other.state === place.state) === index);
}
