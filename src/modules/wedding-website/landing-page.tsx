import Image from "next/image";
import Link from "next/link";

import styles from "./landing-page.module.css";

type IconName =
  | "arrow"
  | "calendar"
  | "camera"
  | "check"
  | "chevron"
  | "clock"
  | "family"
  | "file"
  | "globe"
  | "guest"
  | "heart"
  | "lock"
  | "message"
  | "money"
  | "pin"
  | "play"
  | "shield"
  | "spark"
  | "task"
  | "user"
  | "vendor";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    camera: <><path d="M14.5 5 13 3H9L7.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><circle cx="11" cy="12.5" r="3.5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    family: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6M15 15c3.5 0 5.5 1.7 6 5"/></>,
    file: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    guest: <><circle cx="12" cy="8" r="4"/><path d="M5 21c.5-5 2.8-7 7-7s6.5 2 7 7"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
    money: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 15h6"/><circle cx="17" cy="15" r="1"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    play: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></>,
    shield: <><path d="M12 3 4 6v6c0 5 3.4 8.2 8 10 4.6-1.8 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>,
    task: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M14 9h3M8 15l1.5 1.5L12 14M14 15h3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M5 21c.6-4.7 2.8-7 7-7s6.4 2.3 7 7"/></>,
    vendor: <><path d="M4 10h16v11H4Z"/><path d="m3 10 2-6h14l2 6M8 10v11M16 10v11"/></>,
  };

  return (
    <svg aria-hidden="true" className={styles.icon} fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">{paths[name]}</g>
    </svg>
  );
}

const features: Array<{ icon: IconName; title: string; text: string; detail?: string }> = [
  { icon: "calendar", title: "Multi-Event Architecture", text: "Dedicated schedules, guest lists, and vendors for every ceremony." },
  { icon: "task", title: "Assignable Tasks & Milestones", text: "Give family clear responsibilities with timely milestone reminders." },
  { icon: "guest", title: "Smart Family RSVP", text: "Invite guests to exact events without awkward cross-invitations.", detail: "Mehendi: No · Sangeet: Yes · Wedding: Yes" },
  { icon: "money", title: "Vendor & Payment Hub", text: "Track advances, contracts, balances, and family leads in one hub." },
  { icon: "lock", title: "Family Privacy Layers", text: "Show budgets to parents while cousins focus on Sangeet playlists." },
  { icon: "globe", title: "Editorial Guest Website", text: "A refined guest portal with attire guides, venue pins, and one-tap RSVPs." },
  { icon: "camera", title: "Shared Event Photo Vault", text: "Full-resolution guest uploads organized by ceremony, without compression." },
];

const ceremonies = [
  ["01", "Engagement & Ring Ceremony", "The Oberoi, Nariman Point · Mumbai", "Nov 18"],
  ["02", "Mehendi & Poolside High Tea", "Fateh Garh Palace Courtyard · Udaipur", "Nov 19"],
  ["03", "Haldi & Phoolon Ki Holi", "Amet Haveli Lakefront · Udaipur", "Nov 20"],
  ["04", "Sangeet & Cocktail Gala", "Zenana Mahal · City Palace Udaipur", "Nov 20"],
  ["05", "Traditional Muhurtham & Pheras", "Jagmandir Island Palace · Lake Pichola", "Nov 21"],
  ["06", "The Grand Mumbai Reception", "Taj Lands End, Bandra · Mumbai", "Nov 24"],
];

const security = [
  ["lock", "Private Family Workspace", "Only explicitly invited family members can access your tasks and addresses."],
  ["shield", "Granular Visibility", "Control who sees vendor financials and who manages guest logistics."],
  ["guest", "Zero Guest Passwords", "Encrypted one-tap links mean elders never need another password."],
  ["file", "Complete Data Ownership", "Zero ads and no data sales. Export guests and budgets whenever you need."],
] as const;

export function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <Link aria-label="Make My Marriage home" className={styles.brand} href="/">
            <Image alt="Make My Marriage" height={40} priority src="/brand/make-my-marriage.svg" width={260} />
          </Link>
          <nav aria-label="Primary navigation" className={styles.navLinks}>
            <a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#for-couples">For couples</a>
          </nav>
          <div className={styles.navActions}>
            <Link className={styles.signIn} href="/login">Sign in</Link>
            <Link className={styles.smallButton} href="/register">Start planning</Link>
            <span aria-hidden="true" className={styles.avatar}><Icon name="user" size={17} /></span>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span />A shared workspace for Indian wedding planning</div>
          <h1>Plan the celebration. <em>Keep the people you love in rhythm.</em></h1>
          <p>Manage ceremonies, multi-event guest lists, RSVPs, and vendors in one shared workspace.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/register">Start Planning Free <Icon name="arrow" /></Link>
            <a className={styles.secondaryButton} href="#how-it-works"><Icon name="play" /> See How It Works</a>
          </div>
          <div className={styles.trust}><span className={styles.people}><b>PK</b><b>RM</b><b>SK</b></span><span>Joined by 1,400+ couples & multi-gen hosting families this season</span></div>
        </div>
        <WorkspacePreview />
      </section>

      <section className={styles.problem} id="how-it-works">
        <div className={styles.sectionHeading}><span>Built for the real celebration</span><h2>Wedding planning shouldn&apos;t live across 12 WhatsApp groups.</h2><p>Indian weddings involve multiple days, hundreds of guests, and layered family responsibilities. When coordination splits across chats, details slip.</p></div>
        <div className={styles.beforeAfter}>
          <article className={styles.problemCard}><div className={styles.cardLabel}>Before</div><ul><li><Icon name="message" />Out-of-date room allocations and missing dietary notes.</li><li><Icon name="message" />Flight arrivals lost in meme and blessing spam.</li><li><Icon name="message" />Undocumented advances with no milestone proof.</li></ul></article>
          <div className={styles.flowArrow}><Icon name="arrow" size={24} /></div>
          <article className={styles.solutionCard}><div className={styles.cardLabel}>With Make My Marriage</div><ul><li><Icon name="check" />Ceremony RSVPs, rooms, and dietary preferences connected.</li><li><Icon name="check" />Every micro-event deliverable tied to a family lead.</li><li><Icon name="check" />Schedules, sign-offs, and receipts organized by vendor.</li></ul></article>
        </div>
      </section>

      <section className={styles.features} id="features">
        <div className={styles.sectionHeading}><span>One calm command centre</span><h2>Everything your wedding needs, in one place.</h2><p>Calibrated for precision, quiet elegance, and multi-generational family collaboration.</p></div>
        <div className={styles.featureGrid}>{features.map((feature, index) => <article className={index === 0 ? styles.featureLead : styles.featureCard} key={feature.title}><div className={styles.featureIcon}><Icon name={feature.icon} size={22} /></div><h3>{feature.title}</h3><p>{feature.text}</p>{feature.detail && <div className={styles.featureDetail}>{feature.detail}</div>}<span className={styles.learn}>Explore feature <Icon name="arrow" size={16} /></span></article>)}</div>
      </section>

      <section className={styles.workspaceSection}>
        <div className={styles.sectionHeading}><span>Clarity at every turn</span><h2>See the whole wedding at a glance.</h2><p>A single high-density workspace engineered to track timelines, RSVPs, and pending decisions in real time.</p></div>
        <div className={styles.tabBar}><button className={styles.activeTab}>Tasks & Action Items</button><button>Ceremony Schedules</button><button>RSVP Matrix</button><button>Vendor Financials</button></div>
        <TaskBoard />
      </section>

      <section className={styles.ceremonySection} id="for-couples">
        <div className={styles.splitHeading}><div><span>Multi-event by design</span><h2>One wedding.<br/><em>Many moments.</em></h2></div><p>Plan every ceremony separately—each with its own schedule, guest list, tasks, vendors, and venue details.</p></div>
        <div className={styles.ceremonyList}>{ceremonies.map(([number,title,venue,date], index) => <article className={index === 1 ? styles.ceremonyActive : ""} key={number}><span className={styles.ceremonyNumber}>{number}</span><div className={styles.ceremonyMark}><Icon name={index % 2 ? "spark" : "heart"} /></div><div><h3>{title}</h3><p><Icon name="pin" size={15}/>{venue}</p></div><time>{date}</time><Icon name="chevron" size={18}/></article>)}</div>
      </section>

      <section className={styles.rsvpSection}>
        <div className={styles.rsvpCopy}><span className={styles.kicker}>Effortless for every guest</span><h2>Invite the right people to the right events.</h2><p>Assign family groups to specific ceremonies with precision. Guests can RSVP in seconds without creating an account or downloading an app.</p><ul><li><Icon name="check" />Personalised event access</li><li><Icon name="check" />Family-level attendance</li><li><Icon name="check" />Dietary and travel preferences</li></ul></div>
        <RsvpCard />
      </section>

      <section className={styles.familySection}>
        <div className={styles.sectionHeading}><span>Shared responsibility, clear ownership</span><h2>Planning a wedding is a family effort. Your workspace should be too.</h2><p>Give parents, siblings, and coordinators dedicated roles without overwhelming group chats.</p></div>
        <div className={styles.roleGrid}><Role initials="PR" title="Couple & Owners" text="Full workspace authority, budgets, vendor signing, and final permissions."/><Role initials="RK" title="Parents & Hosts" text="Manage ceremony schedules, oversee tastings, and assign family tasks."/><Role initials="AK" title="Siblings & Coordinators" text="Coordinate song cuts, pick-up logistics, and airport transfers."/><Role initials="GF" title="Guests & Family" text="Read-only itinerary, locations, and dress-code reference guides."/></div>
        <ActivityStream />
      </section>

      <section className={styles.vendorSection}>
        <div className={styles.vendorIntro}><span>Every promise, documented</span><h2>Keep every vendor conversation organized.</h2><p>Track contracts, payment milestones, call logs, and deliverables. Never ask “who spoke to the decorator last?” again.</p><Link className={styles.textLink} href="/register">Explore vendor management <Icon name="arrow" size={17}/></Link></div>
        <div className={styles.vendorStack}><Vendor name="Studio Pixels" category="Photography & film" lead="Rohan (Groom)" paid="₹4,20,000" due="₹2,80,000" progress="60%"/><Vendor name="Royal Heritage Catering" category="Catering · 520 guests" lead="Rajesh (Father)" paid="₹8,50,000" due="₹3,50,000" progress="71%"/><Vendor name="Floral Alchemy" category="Décor & floral design" lead="Priya (Bride)" paid="₹3,00,000" due="₹4,50,000" progress="40%"/></div>
      </section>

      <section className={styles.websiteSection}>
        <div className={styles.sectionHeading}><span>Your celebration, beautifully shared</span><h2>When you&apos;re ready, share the celebration.</h2><p>Publish an exquisite guest website with schedules, attire guides, venue maps, and instant RSVPs.</p></div>
        <div className={styles.websiteMock}><div className={styles.websiteArt}><div className={styles.arch}/><span>18—21 · XI · 2025</span><h3>Priya <i>&</i> Rohan</h3><p>“We cannot wait to celebrate under the stars with our nearest and dearest.”</p><small>Udaipur, Rajasthan</small></div><div className={styles.websiteDetails}><article><Icon name="spark"/><div><b>Modern Festive / Pastel Formal</b><p>Light sherwanis, flowy lehengas, pastel tones welcomed.</p></div></article><article><Icon name="pin"/><div><b>Fateh Garh & Jagmandir</b><p>Boat transfers depart every 20 minutes from Jetty 2.</p></div></article><article><Icon name="check"/><div><b>Instant Confirmation</b><p>Zero passwords or logins. Just tap your personalised link.</p></div></article></div></div>
      </section>

      <section className={styles.securitySection}>
        <div className={styles.securityIntro}><div className={styles.shield}><Icon name="shield" size={30}/></div><span>Privacy by architecture</span><h2>Your wedding stays yours.</h2><p>We treat modern Indian celebrations with banking-grade security and complete advertising neutrality.</p></div>
        <div className={styles.securityGrid}>{security.map(([icon,title,text])=><article key={title}><Icon name={icon}/><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.ctaSection}><div className={styles.ctaPattern}/><span>Begin with calm</span><h2>Less coordination.<br/><em>More celebrating.</em></h2><p>Bring your events, guests, tasks, vendors, and family together in one quietly powerful workspace.</p><div><Link className={styles.lightButton} href="/register">Start Planning Your Wedding <Icon name="arrow"/></Link><Link className={styles.ghostButton} href="/login">Sign In to Existing Workspace</Link></div></section>

      <footer className={styles.footer}><div className={styles.footerTop}><div><Image alt="Make My Marriage" height={40} src="/brand/make-my-marriage.svg" width={260}/><p>The collaborative wedding planning workspace for couples and families. Structural clarity, quiet luxury, and operational calm.</p></div><nav><b>Product</b><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#for-couples">For couples</a></nav><nav><b>Company</b><a href="#privacy">Privacy</a><a href="mailto:hello@makemymarriage.com">Contact</a><Link href="/login">Sign in</Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} Make My Marriage. All rights reserved.</span><span><Icon name="heart" size={14}/> Engineered for joyful celebrations</span></div></footer>
    </main>
  );
}

function WorkspacePreview() {
  return <div className={styles.workspace}><div className={styles.browserBar}><span className={styles.dots}><i/><i/><i/></span><code>app.makemymarriage.com / priya-rohan</code><b><i/>Live Multi-User Sync</b></div><div className={styles.workspaceHeader}><div className={styles.coupleMark}>P&amp;R</div><div><strong>Priya & Rohan&apos;s Wedding Weekend</strong><p>Udaipur & Mumbai · 6 Sacred Ceremonies · 520 Beloved Guests</p></div><span>83 Days To Go</span><button><Icon name="family" size={17}/> Invite Family</button></div><div className={styles.workspaceBody}><aside><button className={styles.asideActive}><Icon name="globe"/>Overview</button><button><Icon name="calendar"/>Ceremonies <b>6</b></button><button><Icon name="guest"/>Guest Directory <b>520</b></button><button><Icon name="money"/>Vendor Ledgers</button><button><Icon name="shield"/>Permissions</button></aside><div className={styles.dashboard}><div className={styles.metricRow}><Metric label="Guests confirmed" value="418 / 520" note="80.4% response"/><Metric label="Open decisions" value="17" note="5 need you"/><Metric label="Budget committed" value="₹42.8L" note="of ₹58L planned"/></div><div className={styles.dashboardGrid}><article><div className={styles.panelTitle}><b>Today&apos;s family focus</b><span>4 items</span></div><Task name="Confirm Udaipur airport pick-up roster" person="Aditi" due="Today"/><Task name="Approve Sangeet stage layout v3" person="Priya" due="6:30 PM"/><Task name="Review 28 dietary preferences" person="Mum" due="Tomorrow"/></article><article><div className={styles.panelTitle}><b>Wedding weekend</b><span>6 events</span></div><Event day="19" month="NOV" name="Mehendi & High Tea" status="83% ready"/><Event day="20" month="NOV" name="Sangeet Gala" status="11 tasks"/><Event day="21" month="NOV" name="Muhurtham & Pheras" status="418 RSVPs"/></article></div><div className={styles.dashboardNotice}><Icon name="spark"/><span><b>Next: Mehendi & High Tea setup at Fateh Garh</b><small>Venue walkthrough · Oct 24, 4:00 PM</small></span><Icon name="arrow"/></div></div></div></div>;
}

function Metric({label,value,note}:{label:string;value:string;note:string}) { return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{note}</small></article> }
function Task({name,person,due}:{name:string;person:string;due:string}) { return <div className={styles.task}><span className={styles.checkbox}/><div><b>{name}</b><small>{person}</small></div><time>{due}</time></div> }
function Event({day,month,name,status}:{day:string;month:string;name:string;status:string}) { return <div className={styles.event}><time><b>{day}</b><small>{month}</small></time><div><b>{name}</b><small>{status}</small></div><Icon name="chevron" size={16}/></div> }

function TaskBoard() { const rows=[["Approve floral moodboard for Sangeet","Priya","Today","High"],["Confirm 14 airport pick-up slots","Aditi","Today","High"],["Review photographer shot list","Rohan","Tomorrow","Medium"],["Share final rooming list with palace","Rajesh","Oct 26","Medium"],["Approve welcome hamper note","Priya","Oct 28","Low"]]; return <div className={styles.taskBoard}><div className={styles.boardHeader}><div><b>Action Items</b><span>42 total · 17 open</span></div><button>+ Add task</button></div><div className={styles.boardFilters}><span className={styles.filterActive}>All tasks</span><span>Mine</span><span>Due this week</span><span>Completed</span></div><div className={styles.boardTable}><div className={styles.tableHead}><span>Task</span><span>Owner</span><span>Due</span><span>Priority</span></div>{rows.map(([name,owner,due,priority])=><div className={styles.tableRow} key={name}><span><i/><b>{name}</b></span><span><i>{owner[0]}</i>{owner}</span><span>{due}</span><span><em data-priority={priority}>{priority}</em></span></div>)}</div></div> }

function RsvpCard() { return <div className={styles.rsvpCard}><div className={styles.rsvpOrnament}>P <i>&</i> R</div><span>You&apos;re invited</span><h3>Priya & Rohan</h3><p>look forward to celebrating with you</p><div className={styles.guestFamily}><Icon name="family"/><div><b>Kapoor Family (Delhi)</b><small>4 members · Personal invitation</small></div></div><div className={styles.rsvpEvents}><RsvpEvent name="Mehendi & High Tea" date="Nov 19" yes={false}/><RsvpEvent name="Sangeet & Cocktail Gala" date="Nov 20" yes/><RsvpEvent name="Muhurtham & Pheras" date="Nov 21" yes/></div><button>Confirm for 4 Guests <Icon name="arrow"/></button><small><Icon name="lock" size={12}/> Zero download required · Direct encrypted confirmation</small></div> }
function RsvpEvent({name,date,yes}:{name:string;date:string;yes:boolean}) { return <div><span className={yes?styles.rsvpYes:styles.rsvpNo}><Icon name={yes?"check":"clock"} size={15}/></span><div><b>{name}</b><small>{date}</small></div><em>{yes?"Attending":"Not attending"}</em></div> }
function Role({initials,title,text}:{initials:string;title:string;text:string}) { return <article><span>{initials}</span><h3>{title}</h3><p>{text}</p></article> }

function ActivityStream() { const items=[["check","Checked off milestone","Finalize Sangeet DJ song order","2 min ago"],["guest","Added 14 college friends","Mehendi guest list with verified airport transfers","18 min ago"],["file","Locked in catering contract","Authentic Rajasthani tasting for family elders","1 hr ago"],["heart","Welcome hampers dispatched","Silver coins and handwritten cards for Udaipur suites","3 hrs ago"]] as const; return <div className={styles.activity}><div className={styles.activityHeader}><div><i/><span><b>Live Family Activity Stream</b><small>Real-time collaboration across Rajasthan & Mumbai</small></span></div><span>12 family members online</span></div><div className={styles.activityList}>{items.map(([icon,title,text,time])=><article key={title}><span><Icon name={icon}/></span><div><b>{title}</b><p>{text}</p></div><time>{time}</time></article>)}</div></div> }

function Vendor({name,category,lead,paid,due,progress}:{name:string;category:string;lead:string;paid:string;due:string;progress:string}) { return <article className={styles.vendorCard}><div className={styles.vendorCardHead}><span><Icon name="vendor"/></span><div><h3>{name}</h3><p>{category}</p></div><em>On track</em></div><div className={styles.vendorLead}><span>Lead coordinator</span><b>{lead}</b></div><div className={styles.vendorMoney}><div><span>Paid</span><b>{paid}</b></div><div><span>Remaining</span><b>{due}</b></div></div><div className={styles.progress}><i style={{width:progress}}/></div><div className={styles.vendorFooter}><span><Icon name="file" size={15}/> Contract signed</span><span><Icon name="message" size={15}/> 8 notes</span><Icon name="chevron" size={16}/></div></article> }
