import type { Metadata } from "next";

import { AuthForm } from "@/modules/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-brand">Make My Marriage</p>
        <div className="auth-heading">
          <p className="auth-eyebrow">Plan together</p>
          <h1>Create your account</h1>
          <p>Bring your wedding plans and your family into one calm workspace.</p>
        </div>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
