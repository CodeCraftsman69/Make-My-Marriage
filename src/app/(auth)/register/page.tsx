import type { Metadata } from "next";

import { AuthForm } from "@/modules/auth/auth-form";
import { authReturnPath } from "@/modules/auth/auth-return-path";
import { getCurrentUser } from "@/modules/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account", referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const returnTo = authReturnPath((await searchParams).next);
  if (await getCurrentUser()) redirect(returnTo);
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-brand">Make My Marriage</p>
        <div className="auth-heading">
          <p className="auth-eyebrow">Plan together</p>
          <h1>Create your account</h1>
          <p>Bring your wedding plans and your family into one calm workspace.</p>
        </div>
        <AuthForm mode="register" returnTo={returnTo} />
      </section>
    </main>
  );
}
