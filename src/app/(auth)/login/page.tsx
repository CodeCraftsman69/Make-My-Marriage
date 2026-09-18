import type { Metadata } from "next";

import { AuthForm } from "@/modules/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
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
