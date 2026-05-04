import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifie ton email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error("Échec de la connexion Google"); return; }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch {
      toast.error("Connexion Google indisponible");
    }
  };

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-glow">
            <Sparkles className="h-7 w-7 text-gold-foreground" />
          </div>
          <h1 className="font-display text-3xl">Bible Lumière</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Heureux de te revoir" : "Crée ton compte"}</p>
        </div>

        <form onSubmit={submit} className="w-full space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe"
            className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none" />
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50">
            {loading ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <div className="my-4 flex w-full items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>

        <button onClick={google} className="w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium hover:border-gold/50">
          Continuer avec Google
        </button>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-6 text-xs text-muted-foreground">
          {mode === "signin" ? "Pas de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
        </button>
      </div>
    </MobileShell>
  );
}
