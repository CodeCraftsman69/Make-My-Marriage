"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

type ErrorEnvelope = {
  error?: {
    message?: string;
    fields?: Record<string, string | string[]>;
  };
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistration = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      ...(isRegistration ? { name: formData.get("name") } : {}),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ErrorEnvelope;

      if (!response.ok) {
        setError(body.error?.message ?? "We could not complete your request.");
        return;
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isRegistration ? (
        <label className="auth-field">
          <span>Name</span>
          <input
            autoComplete="name"
            maxLength={100}
            minLength={2}
            name="name"
            placeholder="Priya Sharma"
            required
          />
        </label>
      ) : null}

      <label className="auth-field">
        <span>Email</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>

      <label className="auth-field">
        <span>Password</span>
        <span className="auth-password">
          <input
            autoComplete={isRegistration ? "new-password" : "current-password"}
            maxLength={128}
            minLength={isRegistration ? 12 : 1}
            name="password"
            placeholder={isRegistration ? "At least 12 characters" : "Your password"}
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="auth-password__toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      {!isRegistration ? (
        <Link className="auth-forgot" href="/forgot-password">
          Forgot password?
        </Link>
      ) : null}

      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="auth-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait…" : isRegistration ? "Create account" : "Sign in"}
      </button>

      <p className="auth-switch">
        {isRegistration ? "Already have an account?" : "New to Make My Marriage?"}{" "}
        <Link href={isRegistration ? "/login" : "/register"}>
          {isRegistration ? "Sign in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
