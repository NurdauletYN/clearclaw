"use client";

import { useState } from "react";
import { getSupabaseAuthBrowserClient } from "../lib/supabase-auth";

type Mode = "signin" | "signup";
type State = "idle" | "loading" | "error" | "signup_done";


type LoginFormProps = {
  initialError?: string;
};

export const LoginForm = ({ initialError }: LoginFormProps): JSX.Element => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>(initialError ? "error" : "idle");
  const [errorMsg, setErrorMsg] = useState(initialError ?? "");

  const setError = (msg: string): void => {
    setErrorMsg(msg);
    setState("error");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const supabase = getSupabaseAuthBrowserClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setState("signup_done");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (state === "signup_done") {
    return (
      <div className="w-full max-w-sm space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-slate-100">Account created</h2>
        <p className="text-sm text-slate-400">
          Check your inbox for a confirmation email, then come back here to sign in.
        </p>
        <button
          onClick={() => { setMode("signin"); setState("idle"); }}
          className="text-sm text-brand-400 underline hover:text-brand-300"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Agent<span className="text-brand-500">Audit</span>
        </h1>
        <p className="text-sm text-slate-400">
          {mode === "signin" ? "Sign in to your dashboard" : "Create your account"}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-lg border border-slate-800 p-1 text-sm">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setState("idle"); setErrorMsg(""); }}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === m
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {/* Email/password form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {(state === "error" || errorMsg) && (
          <p className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "loading"
            ? "Please wait…"
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>
      </form>
    </div>
  );
};
