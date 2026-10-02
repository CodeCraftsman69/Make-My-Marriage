import type { Metadata } from "next";
import { RecoveryPage } from "@/modules/auth/recovery-page";
import { PasswordRecoveryForm } from "@/modules/auth/password-recovery-form";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <RecoveryPage title="Let's get you back in." description="Enter the email you use to plan your wedding. We'll send a link to reset your password."><PasswordRecoveryForm/></RecoveryPage>;
}
