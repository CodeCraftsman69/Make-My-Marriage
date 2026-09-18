import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";

export default async function DashboardPage() {
  const wedding = await getCurrentWedding(await requireAuth());
  if (!wedding) return null;
  const date = new Date(wedding.weddingDate);
  // The countdown intentionally reflects request time and is not persisted.
  // eslint-disable-next-line react-hooks/purity
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return <main className="dashboard"><p className="auth-eyebrow">Wedding workspace</p><h1>{wedding.title}</h1><p className="dashboard-lead">{days >= 0 ? `${days} days to go` : "Wedding celebration"} · {date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: wedding.timezone })} · {wedding.location.city}, {wedding.location.state}</p><section className="empty-grid">{["No events added yet.", "No guests added yet.", "No vendors added yet."].map((text) => <article key={text}>{text}</article>)}</section></main>;
}
