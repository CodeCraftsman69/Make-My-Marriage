import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";
import { SetupWeddingForm } from "@/modules/weddings/setup-form";

export default async function WeddingPage() {
  const wedding = await getCurrentWedding(await requireAuth());
  if (!wedding) redirect("/wedding-setup");
  return <main className="wedding-edit-page"><header><p className="auth-eyebrow">Your wedding workspace</p><h1>Edit wedding details</h1><p>A change of plans? Keep your celebration up to date.</p></header><SetupWeddingForm key={JSON.stringify(wedding)} wedding={wedding}/></main>;
}
