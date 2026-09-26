import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";
import { SetupWeddingForm } from "@/modules/weddings/setup-form";

export default async function WeddingSetup() {
  const user = await requireAuth().catch(() => redirect("/login"));
  if (await getCurrentWedding(user)) redirect("/app/dashboard");
  return <main className="setup-experience"><aside className="setup-story"><p className="banner-eyebrow">MAKE MY MARRIAGE</p><div><span className="story-mark" aria-hidden="true">&</span><h1>A beautiful beginning.<br/><em>Made together.</em></h1><p>One shared space for the celebrations, the details, and the people who make it all special.</p></div><ol className="setup-steps"><li><span>01</span><div><strong>Start with your story</strong><p>The two of you, the date, the place.</p></div></li><li><span>02</span><div><strong>Make room for every moment</strong><p>Your wedding workspace is the beginning.</p></div></li><li><span>03</span><div><strong>Keep everyone close</strong><p>Family planning tools are coming next.</p></div></li></ol></aside><section className="setup-content"><header><p className="auth-eyebrow">Welcome, {user.name}</p><h2>Let’s make it yours.</h2><p>Tell us a little about your wedding. The best part is still ahead.</p></header><SetupWeddingForm/></section></main>;
}
