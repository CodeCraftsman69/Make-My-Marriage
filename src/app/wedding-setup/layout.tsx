import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth";
import { SessionControls } from "@/modules/auth/session-controls";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <><SessionControls userId={user.id} />{children}</>;
}
