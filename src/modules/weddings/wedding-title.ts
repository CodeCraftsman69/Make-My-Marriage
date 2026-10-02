export function suggestWeddingTitle(brideName: string, groomName: string): string {
  const bride = brideName.trim();
  const groom = groomName.trim();
  if (!bride && !groom) return "Our Wedding";
  return `${[bride, groom].filter(Boolean).map(name => name.slice(0, 65)).join(" & ")} Wedding`;
}
