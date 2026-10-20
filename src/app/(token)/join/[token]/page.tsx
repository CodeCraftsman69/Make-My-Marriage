import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/modules/auth";
import { previewFamilyInvite } from "@/modules/family/family-service.server";
import { JoinInvitation } from "@/modules/family/join-invitation";
import { StudioBrand } from "@/shared/ui/studio-brand";
export const metadata: Metadata = { title: "Join your family", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default async function FamilyInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  const invite = await previewFamilyInvite(token, user);
  return <main className="auth-page family-join"><section className="auth-card"><StudioBrand/><div className="auth-heading"><p className="auth-eyebrow">A wedding is better together</p><h1>{invite ? "You’re part of the celebration" : "This invitation is unavailable"}</h1>{invite ? <><p>{invite.inviter} invited you to help plan</p><h2>{invite.wedding}</h2><span className="family-badge family-relationship">{invite.relationship.toLowerCase().replaceAll("_", " ")}</span></> : <p>The link may have expired, been cancelled, or been replaced. Ask the wedding owner to send a new invitation.</p>}</div>{invite ? <JoinInvitation token={token} email={user?.email ?? null} accepted={invite.status === "ACCEPTED"} wrongAccount={invite.wrongAccount} role={invite.role}/> : <Link href={user ? "/app/dashboard" : "/login"}>Back to {user ? "your workspace" : "sign in"}</Link>}</section></main>;
}
