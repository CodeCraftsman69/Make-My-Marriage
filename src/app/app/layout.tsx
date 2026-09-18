import {redirect} from "next/navigation";import {requireAuth} from "@/modules/auth";import {getCurrentWedding} from "@/modules/weddings/wedding-service.server";
export default async function PrivateAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user=await requireAuth().catch(()=>redirect("/login"));if(!(await getCurrentWedding(user)))redirect("/wedding-setup");
  return <div className="private-shell">{children}</div>;
}
