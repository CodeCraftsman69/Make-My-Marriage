import { StudioBrand } from "@/shared/ui/studio-brand";

export function RecoveryPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="auth-page"><section className="auth-card"><StudioBrand/><div className="auth-heading recovery-heading"><p className="auth-eyebrow">Account recovery</p><h1>{title}</h1><p>{description}</p></div>{children}</section></main>;
}
