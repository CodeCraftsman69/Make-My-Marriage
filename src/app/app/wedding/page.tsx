import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";
import { SetupWeddingForm } from "@/modules/weddings/setup-form";
import { requireWeddingMember } from "@/modules/family/authorization";
import { permissionsForRole } from "@/modules/family/permissions";

export default async function WeddingPage() {
  const user = await requireAuth();
  const wedding = await getCurrentWedding(user);
  if (!wedding) redirect("/wedding-setup");
  const access = await requireWeddingMember(user.id, wedding.id);
  if (!permissionsForRole(access.role).editWedding) return <main className="wedding-edit-page"><header><p className="auth-eyebrow">Your wedding workspace</p><h1>Wedding details</h1><p>Only the owner and co-owners can change core wedding details. Ask them if something needs updating.</p></header><section className="workspace-panel"><h2>{wedding.title}</h2><dl><dt>Bride</dt><dd>{wedding.brideName}</dd><dt>Groom</dt><dd>{wedding.groomName}</dd><dt>Wedding date</dt><dd>{wedding.weddingDate.slice(0, 10)}</dd><dt>Location</dt><dd>{[wedding.location.city, wedding.location.state].filter(Boolean).join(", ") || "To be decided"}</dd><dt>Description</dt><dd>{wedding.description || "Not added yet"}</dd></dl></section></main>;
  return <main className="wedding-edit-page"><header><p className="auth-eyebrow">Your wedding workspace</p><h1>Edit wedding details</h1><p>A change of plans? Keep your celebration up to date.</p></header><SetupWeddingForm key={JSON.stringify(wedding)} wedding={wedding}/></main>;
}
