import Link from "next/link";
import { RecoveryPage } from "@/modules/auth/recovery-page";

export default function ResetPasswordPage() {
  return <RecoveryPage title="Need a fresh start?" description="Open the reset link from your email, or request a new one below."><Link className="recovery-link" href="/forgot-password">Request a password reset link</Link></RecoveryPage>;
}
