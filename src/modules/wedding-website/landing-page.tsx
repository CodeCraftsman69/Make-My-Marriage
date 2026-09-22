import Image from "next/image";
import Link from "next/link";

import styles from "./landing-page.module.css";

type IconName = "activity" | "arrow" | "calendar" | "camera" | "check" | "family" | "globe" | "guest" | "heart" | "lock" | "task" | "vendor";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    activity: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="M2 19h22"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    camera: <><path d="M14.5 5 13 3H9L7.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12.5" r="3.5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    family: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6M15 15c3.5 0 5.5 1.7 6 5"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    guest: <><circle cx="12" cy="8" r="4"/><path d="M5 21c.5-5 2.8-7 7-7s6.5 2 7 7"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    task: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M14 9h3M8 15l1.5 1.5L12 14M14 15h3"/></>,
    vendor: <><path d="M4 10h16v11H4Z"/><path d="m3 10 2-6h14l2 6M8 10v11M16 10v11"/></>,
  };
  return <svg aria-hidden="true" className={styles.icon} fill="none" height={size} viewBox="0 0 24 24" width={size}><g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">{paths[name]}</g></svg>;
}

const capabilities: Array<[IconName, string, string]> = [
  ["calendar", "Every event, properly planned", "Give each ceremony its own date, venue, timeline, guests, tasks, and vendors."],
  ["task", "Clear ownership, fewer follow-ups", "Create practical tasks, assign a family member, set priorities, and see what is due next."],
  ["guest", "One guest list, precise invitations", "Organize guests by family group and choose exactly which events each person is invited to."],
  ["vendor", "Vendor details without the maze", "Keep contacts, quotations, documents, notes, and follow-up dates beside the relevant events."],
  ["family", "One shared family workspace", "Invite parents, siblings, and coordinators to plan from the same dependable source of truth."],
  ["activity", "Updates everyone can follow", "Keep important planning activity visible, from completed tasks to new guest responses."],
  ["globe", "A simple, polished wedding website", "Publish selected events, venue information, location links, your story, and RSVP access."],
  ["camera", "Photos organized by celebration", "Create family albums, group approved photographs by event, and choose what guests can see."],
];

const faqs = [
  ["Is this only for large weddings?", "No. The workspace adapts to a single-day celebration or a multi-city wedding with several events."],
  ["Do guests need an account?", "No. Guests respond through their private invitation link. Accounts are only for the people helping plan."],
  ["Can both families collaborate?", "Yes. Invite the people involved, assign clear responsibilities, and plan together in one shared workspace."],
];

export function LandingPage() {
  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Thoughtful planning for Indian weddings</span>
          <h1>One place for every plan—and everyone you love.</h1>
          <p>Bring your events, guests, family, tasks, and vendors together, so planning feels clear from the first list to the final celebration.</p>
          <div className={styles.heroActions}><Link className={styles.primaryButton} href="/register">Create your workspace <Icon name="arrow" /></Link><a className={styles.textButton} href="#inside">See what&apos;s inside</a></div>
          <div className={styles.heroNote}><Icon name="lock" size={16}/><span>Your plans stay private. Guests only see what you share.</span></div>
        </div>
        <div className={styles.heroVisual}>
          <Image alt="An Indian wedding ceremony beneath a floral mandap" fill priority sizes="(max-width: 800px) 100vw, 52vw" src="/images/indian-wedding-ceremony.jpg" />
          <div className={styles.photoLabel}><span>From the first ritual</span><b>to the last dance</b></div>
          <ProductPeek />
        </div>
      </section>

      <section className={styles.promiseBar} id="privacy" aria-label="Product benefits"><span><Icon name="calendar"/>Built for multi-event weddings</span><span><Icon name="family"/>Made for family collaboration</span><span><Icon name="lock"/>Private by default</span></section>

      <section className={styles.intro} id="inside">
        <div className={styles.sectionHeading}><span>Everything has a place</span><h2>Plan the wedding—not the planning system.</h2><p>No scattered chats, duplicate sheets, or “latest-final-v3” files. Just one shared home for the details that keep the celebration moving.</p></div>
        <div className={styles.capabilityGrid}>{capabilities.map(([icon,title,text])=><article key={title}><span><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.featureStory}>
        <div className={styles.storyPhoto}><Image alt="Family celebrating together during a haldi ceremony" fill sizes="(max-width: 800px) 100vw, 50vw" src="/images/haldi-family.jpg" /></div>
        <div className={styles.storyCopy}><span>Designed around real families</span><h2>Everyone can help.<br/>Nobody has to chase.</h2><p>Give every task a clear owner and keep decisions easy to find—even when both families are planning from different cities.</p><ul><li><Icon name="check"/>Invite parents, siblings, and coordinators</li><li><Icon name="check"/>Assign tasks to the family member handling them</li><li><Icon name="check"/>Keep progress visible instead of buried in chat</li></ul><Link className={styles.inlineLink} href="/register">Start planning together <Icon name="arrow" size={17}/></Link></div>
      </section>

      <section className={styles.productSection}>
        <div className={styles.sectionHeading}><span>A calmer daily view</span><h2>Open it and know what matters next.</h2><p>A practical overview of upcoming events, open tasks, guest responses, and vendor follow-ups—without overwhelming you with numbers.</p></div>
        <PlanningPreview />
      </section>

      <section className={styles.stepsSection} id="how-it-works">
        <div className={styles.stepsIntro}><span>Simple from day one</span><h2>Start with what you know. Build as you go.</h2><p>You don&apos;t need a finished guest list or a locked venue to begin.</p></div>
        <div className={styles.steps}><article><b>01</b><h3>Set up your celebration</h3><p>Add your date, location, and the events you already know about.</p></article><article><b>02</b><h3>Bring in your people</h3><p>Invite the family members helping you plan and give every responsibility a clear owner.</p></article><article><b>03</b><h3>Plan in one shared rhythm</h3><p>Add guests, assign tasks, organize vendors, and publish selected details when you&apos;re ready.</p></article></div>
      </section>

      <section className={styles.websiteStory}>
        <div className={styles.websiteCopy}><span>Beautiful for guests, useful for you</span><h2>Your wedding website is part of the plan.</h2><p>Publish only the celebration details you choose, then keep schedules and venue information current without resending PDFs.</p><div className={styles.websitePoints}><span><Icon name="check"/>Event-specific invitations and RSVPs</span><span><Icon name="check"/>Venue details and location links</span><span><Icon name="check"/>Selected events, story, and approved gallery</span></div></div>
        <div className={styles.websiteVisual}><Image alt="A couple celebrating at their wedding reception" fill sizes="(max-width: 800px) 100vw, 50vw" src="/images/wedding-reception.jpg" /><div className={styles.inviteCard}><small>WE&apos;RE GETTING MARRIED</small><h3>Ananya <i>&</i> Kabir</h3><p>Saturday, 12 December<br/>Jaipur, Rajasthan</p><button>View celebration</button></div></div>
      </section>

      <section className={styles.faqSection}><div><span>Questions, answered</span><h2>Made to feel easy before you even begin.</h2></div><div className={styles.faqList}>{faqs.map(([question,answer])=><details key={question}><summary>{question}<b>+</b></summary><p>{answer}</p></details>)}</div></section>
      <section className={styles.finalCta}><span>Ready when you are</span><h2>Make room for the celebration.</h2><p>Put the planning in one place, and give your family a calmer way to bring it all together.</p><Link className={styles.lightButton} href="/register">Create your workspace <Icon name="arrow"/></Link></section>
      <Footer />
    </main>
  );
}

function Header() { return <header className={styles.header}><div className={styles.navbar}><Link aria-label="Make My Marriage home" className={styles.brand} href="/"><Image alt="Make My Marriage" height={40} priority src="/brand/make-my-marriage.svg" width={260}/></Link><nav aria-label="Primary navigation"><a href="#inside">Features</a><a href="#how-it-works">How it works</a></nav><div><Link className={styles.signIn} href="/login">Sign in</Link><Link className={styles.navButton} href="/register">Get started</Link></div></div></header>; }

function ProductPeek() { return <div className={styles.productPeek}><div><span className={styles.peekMark}>M</span><span><small>Next up</small><b>Mehendi planning</b></span><em>4 days</em></div><ul><li><i className={styles.done}><Icon name="check" size={13}/></i><span><b>Confirm artist arrival time</b><small>Completed</small></span></li><li><i/><span><b>Share outfit note with guests</b><small>Assigned to Neha</small></span></li><li><i/><span><b>Finalize welcome drinks</b><small>Due tomorrow</small></span></li></ul></div>; }

function PlanningPreview() { return <div className={styles.planningPreview}><div className={styles.previewRail}><Image alt="Make My Marriage" height={32} src="/brand/make-my-marriage.svg" width={208}/><nav><span className={styles.railActive}><Icon name="heart"/>Overview</span><span><Icon name="calendar"/>Events</span><span><Icon name="task"/>Tasks</span><span><Icon name="guest"/>Guests</span><span><Icon name="vendor"/>Vendors</span><span><Icon name="globe"/>Website</span><span><Icon name="camera"/>Gallery</span></nav><div><Icon name="family"/><span><b>Planning team</b><small>6 members</small></span></div></div><div className={styles.previewMain}><header><div><small>GOOD MORNING</small><h3>Here&apos;s what needs attention</h3></div><button>+ Add task</button></header><div className={styles.previewCards}><article><span>UPCOMING EVENT</span><h4>Mehendi</h4><p>Saturday · Family home</p><div><i style={{width:"72%"}}/><small>Planning in progress</small></div></article><article><span>GUEST RESPONSES</span><h4>RSVPs are coming in</h4><p>Review attendance across invited events.</p><button>Open guest list <Icon name="arrow" size={14}/></button></article></div><section><div className={styles.listHeader}><b>Next to do</b><span>View all</span></div><TaskRow done title="Confirm photographer timing" meta="Wedding day · Completed"/><TaskRow title="Review the family guest group" meta="Guest list · Due today"/><TaskRow title="Send sangeet rehearsal note" meta="Sangeet · Assigned to Aarav"/></section></div></div>; }

function TaskRow({done=false,title,meta}:{done?:boolean;title:string;meta:string}) { return <div className={styles.taskRow}><i className={done?styles.done:""}>{done&&<Icon name="check" size={12}/>}</i><span><b>{title}</b><small>{meta}</small></span><Icon name="arrow" size={15}/></div>; }

function Footer() { return <footer className={styles.footer}><div className={styles.footerMain}><div><Image alt="Make My Marriage" height={40} src="/brand/make-my-marriage.svg" width={260}/><p>A shared planning workspace for weddings with many moments—and many people who care.</p></div><nav><b>Product</b><a href="#inside">Features</a><a href="#how-it-works">How it works</a><Link href="/register">Create workspace</Link></nav><nav><b>Account</b><Link href="/login">Sign in</Link><a href="mailto:hello@makemymarriage.com">Contact</a><a href="#privacy">Privacy</a></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} Make My Marriage</span><span>Planned with care</span></div></footer>; }
