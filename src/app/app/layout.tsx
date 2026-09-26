import {redirect} from "next/navigation";import {requireAuth} from "@/modules/auth";import {getCurrentWedding} from "@/modules/weddings/wedding-service.server";
import { SessionControls } from "@/modules/auth/session-controls";
export default async function PrivateAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user=await requireAuth().catch(()=>redirect("/login"));if(!(await getCurrentWedding(user)))redirect("/wedding-setup");
  return <div className="private-shell"><SessionControls userId={user.id} />{children}</div>;
}
