import type { Metadata } from "next";

import { LandingPage } from "@/modules/wedding-website/landing-page";

export const metadata: Metadata = {
  title: "Plan your wedding together",
  description:
    "Bring ceremonies, guests, RSVPs, vendors, tasks, and family into one calm wedding-planning workspace.",
};

export default function HomePage() {
  return <LandingPage />;
}
