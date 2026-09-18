export default function PrivateAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="private-shell">{children}</div>;
}
