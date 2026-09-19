import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { Header } from "../components/Header";
import { useAuth } from "../state/AuthContext";
import { devleStorage } from "../storage/persistence";

export function AuthScreen() {
  const { ready, user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasLocalProgress = devleStorage.hasLocalProgress();

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-text-dim">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <Header />

      <div className="mt-6 mb-8 text-center">
        <h1 className="font-mono text-3xl font-extrabold tracking-tight text-text">DEVLE</h1>
        <p className="mt-1 text-sm text-text-dim">Think. Guess. Learn.</p>
      </div>

      {hasLocalProgress && (
        <p className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-text">
          Sign in to save your Devle progress.
        </p>
      )}

      <div className="mb-6 flex rounded-lg border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-accent text-accent-contrast" : "text-text-dim"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "register" ? "bg-accent text-accent-contrast" : "text-text-dim"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "register" && (
          <label className="flex flex-col gap-1.5 text-sm text-text-dim">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-text outline-none focus:border-accent"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm text-text-dim">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-text outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-text-dim">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-text outline-none focus:border-accent"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-accent py-3 text-sm font-bold text-accent-contrast transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
        </button>
      </form>
    </div>
  );
}
