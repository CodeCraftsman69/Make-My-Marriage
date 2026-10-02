import {redirect} from "next/navigation";import {requireAuth} from "@/modules/auth";import {getCurrentWedding} from "@/modules/weddings/wedding-service.server";
import { StudioHeader } from "@/modules/auth/studio-header";
import { StudioFooter } from "@/shared/ui/studio-brand";
export default async function PrivateAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user=await requireAuth().catch(()=>redirect("/login"));if(!(await getCurrentWedding(user)))redirect("/wedding-setup");
  return <div className="private-shell"><StudioHeader userId={user.id} userName={user.name}/>{children}<StudioFooter/></div>;
}
