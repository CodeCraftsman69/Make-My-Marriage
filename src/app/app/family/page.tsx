import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";
import { getFamily } from "@/modules/family/family-service.server";
import { FamilyWorkspace } from "@/modules/family/family-workspace";
export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ invite?: string; joined?: string }> }) {
  const query = await searchParams;
  const user = await requireAuth();
  const wedding = await getCurrentWedding(user);
  if (!wedding) return null;
  const family = await getFamily(user, wedding.id);
  return <FamilyWorkspace key={`${family.memberId}:${family.role}`} weddingId={wedding.id} weddingTitle={wedding.title} family={family} initiallyInvite={query.invite === "1"} joined={query.joined === "1"}/>;
}
