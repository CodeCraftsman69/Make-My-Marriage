"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StudioBrand } from "@/shared/ui/studio-brand";
import { SessionControls } from "./session-controls";

export function StudioHeader({ userId, userName, setup = false }: { userId: string; userName: string; setup?: boolean }) {
  const path = usePathname();
  const initials = userName.trim().split(/\s+/).map(word => word[0]).slice(0, 2).join("");
  return <header className="studio-header"><div className="studio-header-inner"><StudioBrand/>
    <nav className="studio-nav" aria-label="Workspace navigation">{setup ? <span className="studio-nav-current">Wedding setup</span> : <><Link href="/app/dashboard" aria-current={path === "/app/dashboard" ? "page" : undefined}>Overview</Link><Link href="/app/wedding" aria-current={path === "/app/wedding" ? "page" : undefined}>Wedding details</Link>{["Timeline", "Guests & RSVP", "Vendors", "Checklist"].map(label => <span key={label} className="studio-nav-soon" title={`${label} — coming soon`}>{label}<span className="sr-only"> — coming soon</span></span>)}</>}</nav>
    <div className="studio-account"><span className="studio-avatar" aria-hidden="true">{initials || "M"}</span><span className="studio-account-name">{userName}<small>Wedding workspace</small></span><SessionControls userId={userId} embedded/></div>
  </div></header>;
}
