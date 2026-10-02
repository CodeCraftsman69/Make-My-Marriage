import Link from "next/link";

export function StudioBrand() {
  return <Link href="/" className="studio-brand" aria-label="Make My Marriage home"><span className="studio-monogram" aria-hidden="true">M</span><span>Make My Marriage<small>THE WEDDING STUDIO</small></span></Link>;
}

export function StudioFooter() {
  return <footer className="studio-footer"><p><span>Make My Marriage</span> · A shared home for your celebration.</p><Link href="/">Explore Make My Marriage</Link></footer>;
}
