import type { Metadata } from "next";
import Link from "next/link";
import { resetTokenSchema } from "@/modules/auth/auth-schemas";
import { RecoveryPage } from "@/modules/auth/recovery-page";
import { PasswordRecoveryForm } from "@/modules/auth/password-recovery-form";

export const metadata: Metadata = { title: "Reset password", referrer: "no-referrer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResetTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const result = resetTokenSchema.safeParse((await params).token);
  return <RecoveryPage title="A new password. A fresh start." description="Choose a unique password for your account. You'll sign in again afterwards.">{result.success ? <PasswordRecoveryForm token={result.data}/> : <><p className="auth-error" role="alert">This reset link is invalid. Please request a new one.</p><Link className="recovery-link" href="/forgot-password">Request a new link</Link></>}</RecoveryPage>;
}
