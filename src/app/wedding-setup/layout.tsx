import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth";
import { StudioHeader } from "@/modules/auth/studio-header";
import { StudioFooter } from "@/shared/ui/studio-brand";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <><StudioHeader userId={user.id} userName={user.name} setup/>{children}<StudioFooter/></>;
}
