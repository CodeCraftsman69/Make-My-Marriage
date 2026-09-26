import { requireAuth } from "@/modules/auth";
import { getCurrentWedding } from "@/modules/weddings/wedding-service.server";

export default async function DashboardPage() {
  const user = await requireAuth();
  const wedding = await getCurrentWedding(user);
  if (!wedding) return null;
  const date = new Date(wedding.weddingDate);
  // The countdown intentionally reflects request time and is not persisted.
  // eslint-disable-next-line react-hooks/purity
  const todayParts = new Intl.DateTimeFormat("en", { timeZone: wedding.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(Date.now());
  const part = (type: string) => todayParts.find(value => value.type === type)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const days = Math.round((Date.parse(wedding.weddingDate.slice(0, 10)) - Date.parse(today)) / 86_400_000);
  const location = [wedding.location.city, wedding.location.state].filter(Boolean).join(", ") || "Location to be decided";
  const areas = [
    { label: "Events", title: "Your celebrations", text: "From the first ceremony to the last dance. Your events will live here." },
    { label: "Tasks", title: "Every little detail", text: "A shared place for to-dos, responsibilities, and due dates." },
    { label: "Guests & RSVP", title: "Your favourite people", text: "Guest lists and attendance, celebration by celebration." },
    { label: "Vendors", title: "The team behind it all", text: "Your contacts, shortlists, and follow-ups in one place." },
  ];
  return <main className="workspace-dashboard">
    <header className="workspace-welcome"><div><p className="auth-eyebrow">Your wedding, together</p><h1>Welcome back, {user.name}.</h1><p>A little planning today. Beautiful memories tomorrow.</p></div><span className="workspace-badge">Your private workspace</span></header>
    <section className="wedding-banner" aria-label="Wedding overview"><div><p className="banner-eyebrow">THE NEXT CHAPTER</p><h2>{wedding.brideName}<span> & </span>{wedding.groomName}</h2><p>{wedding.title}</p><div className="banner-details"><span>{date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: wedding.timezone })}</span><span>{location}</span></div></div><div className="countdown"><span className="countdown-number">{days > 0 ? days : days === 0 ? "Today" : "Married"}</span><span>{days > 0 ? "days until your forever" : days === 0 ? "Your celebration is here" : "Here’s to your next chapter"}</span></div></section>
    <div className="section-heading"><div><p className="auth-eyebrow">One place for everything</p><h2>Your planning overview</h2></div><p>Your workspace is ready. More planning tools are on the way.</p></div>
    <section className="planning-cards" aria-label="Planning summaries">{areas.map((area, index) => <article className="planning-card" key={area.label}><div className="planning-card-top"><span className="card-number">0{index + 1}</span><span className="coming-label">Coming soon</span></div><p className="card-category">{area.label}</p><h3>{area.title}</h3><p>{area.text}</p><div className="card-empty">Your {area.label.toLowerCase()} will appear here</div></article>)}</section>
    <div className="dashboard-bottom"><section className="workspace-panel"><p className="auth-eyebrow">Looking ahead</p><h2>Upcoming activities</h2><div className="calm-empty"><span aria-hidden="true">✧</span><h3>A little breathing room.</h3><p>Upcoming events, tasks, and follow-ups will appear here as planning tools become available.</p></div></section><section className="workspace-panel"><p className="auth-eyebrow">Planning together</p><h2>Recent activity</h2><div className="calm-empty"><span aria-hidden="true">◎</span><h3>Your shared story starts here.</h3><p>Family updates will appear here when activity history becomes available.</p></div></section><aside className="workspace-panel"><p className="auth-eyebrow">The essentials</p><h2>Wedding details</h2><dl><dt>Wedding name</dt><dd>{wedding.title}</dd><dt>Location</dt><dd>{location}</dd><dt>Timezone</dt><dd>{wedding.timezone}</dd><dt>Signed in as</dt><dd>{user.name}</dd></dl></aside></div>
  </main>;
}
