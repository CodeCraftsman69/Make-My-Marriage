import { z } from "zod";
import { requireAuth } from "@/modules/auth";
import { searchCities } from "@/infrastructure/location/search-cities";
import { handleApiError, successResponse } from "@/shared/http";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const query = z.string().trim().min(3).max(100).parse(new URL(request.url).searchParams.get("query"));
    const places = await searchCities(query);
    if (places === null) return Response.json({ error: { code: "LOCATION_UNAVAILABLE", message: "Please enter your location manually." } }, { status: 503 });
    return successResponse({ places }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
