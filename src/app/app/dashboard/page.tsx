import Link from "next/link";
import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";
import { StudioIcon } from "@/shared/ui/studio-icon";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { updated } = await searchParams;
  const user = await requireAuth();
  const wedding = await getCurrentWedding(user);
  if (!wedding) return null;
  const date = new Date(wedding.weddingDate);
  // Calendar-day countdown in the wedding's timezone.
  // eslint-disable-next-line react-hooks/purity
  const todayParts = new Intl.DateTimeFormat("en", { timeZone: wedding.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(Date.now());
  const part = (type: string) => todayParts.find(value => value.type === type)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const days = Math.round((Date.parse(wedding.weddingDate.slice(0, 10)) - Date.parse(today)) / 86_400_000);
  const location = [wedding.location.city, wedding.location.state].filter(Boolean).join(", ") || "Location to be decided";
  const areas = [
    { icon: "calendar" as const, label: "Events", title: "Your celebrations", text: "From the first ceremony to the last dance. Your events will live here.", next: "Event planning" },
    { icon: "task" as const, label: "Tasks", title: "Every little detail", text: "A shared place for to-dos, family responsibilities, and due dates.", next: "Shared checklists" },
    { icon: "guests" as const, label: "Guests & RSVP", title: "Your favourite people", text: "Guest lists, attendance, and invitations, one celebration at a time.", next: "Guest management" },
    { icon: "vendor" as const, label: "Vendors", title: "The team behind it all", text: "Your contacts, shortlisted teams, notes, and follow-ups in one place.", next: "Vendor organization" },
  ];
  return <main className="workspace-dashboard studio-dashboard">
    {updated === "1" && <p className="wedding-saved" role="status">Your wedding details have been saved.</p>}
    <header className="workspace-welcome"><div><p className="auth-eyebrow"><span className="gold-dot"/> Your wedding, together</p><h1>Welcome back, {user.name}.</h1><p>A little planning today. Beautiful memories tomorrow.</p></div><div className="welcome-actions"><span className="workspace-badge"><StudioIcon name="lock"/> Your private workspace</span><Link href="/app/wedding"><StudioIcon name="edit"/> Edit wedding details</Link></div></header>
    <section className="wedding-banner" aria-label="Wedding overview"><div className="banner-story"><p className="banner-eyebrow"><StudioIcon name="spark"/> The next chapter</p><h2>{wedding.brideName}<span> & </span>{wedding.groomName}</h2><p className="banner-wedding-title">{wedding.title}</p><div className="banner-details"><span><StudioIcon name="calendar"/>{date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: wedding.timezone })}</span><i aria-hidden="true"/><span><StudioIcon name="pin"/>{location}</span></div></div><div className="banner-side"><div className="countdown"><span className="countdown-number">{days > 0 ? days : days === 0 ? "Today" : "Celebrated"}</span><span>{days > 0 ? "Days until your forever" : days === 0 ? "Your celebration is here" : "Here's to your next chapter"}</span></div><span className="banner-private-note"><StudioIcon name="lock"/> Made for your inner circle</span></div></section>
    <div className="section-heading"><div><p className="auth-eyebrow">One place for everything</p><h2>Your planning overview</h2></div><p>A shared space for your wedding journey.<br/>More planning tools are on the way.</p></div>
    <section className="planning-cards" aria-label="Planning summaries">{areas.map(area => <article className="planning-card" key={area.label}><div className="planning-card-top"><span className="card-number"><StudioIcon name={area.icon}/></span><span className="coming-label">Coming soon</span></div><p className="card-category">{area.label}</p><h3>{area.title}</h3><p>{area.text}</p><div className="card-empty"><span>{area.next}</span><small>Not available yet</small></div></article>)}</section>
    <div className="dashboard-bottom">
      <section className="workspace-panel"><div className="panel-heading"><div><p className="auth-eyebrow">Looking ahead</p><h2>Upcoming activities</h2></div><span className="panel-icon"><StudioIcon name="calendar"/></span></div><div className="studio-empty"><span className="empty-marker"/><h3>Space for every little moment.</h3><p>Events, due dates, and follow-ups will appear here when planning tools are available.</p></div><div className="panel-footnote">Your schedule, all in one place.</div></section>
      <section className="workspace-panel"><div className="panel-heading"><div><p className="auth-eyebrow">Planning together</p><h2>Recent activity</h2></div><span className="panel-icon"><StudioIcon name="guests"/></span></div><div className="studio-empty"><span className="empty-marker"/><h3>Your shared story starts here.</h3><p>Family updates and planning milestones will appear here when activity history is available.</p></div><div className="panel-footnote">Good plans happen together.</div></section>
      <aside className="workspace-panel"><div className="panel-heading"><div><p className="auth-eyebrow">The essentials</p><h2>Wedding details</h2></div><Link href="/app/wedding">Edit</Link></div><dl><dt>Wedding name</dt><dd>{wedding.title}</dd><dt>Location</dt><dd>{location}</dd><dt>Timezone</dt><dd>{wedding.timezone}</dd><dt>Signed in as</dt><dd>{user.name}</dd></dl><div className="panel-footnote"><StudioIcon name="lock"/> Private wedding workspace</div></aside>
    </div>
  </main>;
}
