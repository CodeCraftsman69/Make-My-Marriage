type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <main className="placeholder">
      <section className="placeholder__card">
        <p className="placeholder__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="placeholder__description">{description}</p>
      </section>
    </main>
  );
}
