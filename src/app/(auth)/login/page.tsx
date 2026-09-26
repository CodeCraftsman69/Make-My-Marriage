import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/modules/auth/auth-form";
import { getCurrentUser } from "@/modules/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/app/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-brand">Make My Marriage</p>
        <div className="auth-heading">
          <p className="auth-eyebrow">Your wedding workspace</p>
          <h1>Welcome back</h1>
          <p>Sign in to continue planning with your family.</p>
        </div>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
