import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Logo } from "@/components/voltrium/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Voltrium Partner Portal" },
      { name: "description", content: "Private sign-in for the Voltrium partner inquiry portal." },
      { property: "og:title", content: "Sign in — Voltrium Partner Portal" },
      { property: "og:description", content: "Private sign-in for the Voltrium partner inquiry portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const field =
  "w-full border border-border bg-background/60 px-4 py-3 text-base text-foreground outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/portal", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(error.message);
      navigate({ to: "/portal", replace: true });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      setBusy(false);
      setMsg(error ? error.message : "Check your email to confirm your account, then sign in.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 border border-border bg-surface/40 p-8">
        <a href="/" aria-label="Voltrium home"><Logo /></a>
        <div>
          <p className="label-tech-primary">Partner portal</p>
          <h1 className="display-md mt-2">{mode === "in" ? "Sign in" : "Create account"}</h1>
        </div>
        <input className={field} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" required minLength={8} placeholder="Password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="label-tech w-full bg-primary py-4 text-primary-foreground disabled:opacity-50">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        {msg && <p className="text-sm text-muted-foreground" role="status">{msg}</p>}
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="label-tech hover:text-primary">
          {mode === "in" ? "First time? Create account →" : "Have an account? Sign in →"}
        </button>
      </form>
    </main>
  );
}
