export function StudioIcon({ name }: { name: "calendar" | "task" | "guests" | "vendor" | "pin" | "spark" | "lock" | "edit" }) {
  const paths = {
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/></>,
    task: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="m8 12 2 2 5-5M9 3h6"/></>,
    guests: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/></>,
    vendor: <><path d="M3 9h18l-2-5H5L3 9Zm2 0v12h14V9M9 21v-7h6v7"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
    edit: <><path d="m4 16 12-12 4 4L8 20H4v-4Zm10-10 4 4"/></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
