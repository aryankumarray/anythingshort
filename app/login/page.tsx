"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/links";

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    await signIn("resend", { email, callbackUrl });
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Sign in to AnythingShort
        </h1>

        <div className="space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-lg border border-neutral-700 bg-white py-2.5 font-medium text-neutral-900 transition hover:bg-neutral-100"
          >
            Continue with Google
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl })}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2.5 font-medium text-white transition hover:bg-neutral-700"
          >
            Continue with GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-xs text-neutral-500">OR</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        {sent ? (
          <p className="text-center text-sm text-neutral-400">
            Check your inbox — we sent a sign-in link to {email}.
          </p>
        ) : (
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-500"
            >
              Send magic link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}