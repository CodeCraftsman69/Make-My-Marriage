import type { Metadata } from "next";

import { LandingPage } from "@/modules/wedding-website/landing-page";
import { getCurrentUser } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Plan your wedding together",
  description:
    "Bring ceremonies, guests, RSVPs, vendors, tasks, and family into one calm wedding-planning workspace.",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  return <LandingPage userId={user?.id ?? null} />;
}
