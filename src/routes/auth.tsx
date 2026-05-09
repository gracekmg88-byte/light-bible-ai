import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  // 2FA challenge during login
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

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
        // Tentative de connexion immédiate (auto-confirm activé)
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          toast.success("Compte créé ! Connecte-toi.");
          setMode("signin");
        } else {
          toast.success("Bienvenue !");
          navigate({ to: "/" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            toast.error("Email ou mot de passe incorrect");
          } else if (error.message.toLowerCase().includes("not confirmed")) {
            toast.error("Email non confirmé. Vérifie ta boîte mail.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        // Vérifie si 2FA est requis
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp?.find((f) => f.status === "verified");
          if (totp) {
            setMfaFactorId(totp.id);
            return;
          }
        }
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

  const verifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId) return;
    setLoading(true);
    try {
      const { data: ch, error: ce } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (ce) throw ce;
      const { error: ve } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: ch.id, code: mfaCode });
      if (ve) throw ve;
      toast.success("Authentification réussie");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Code incorrect");
    } finally {
      setLoading(false);
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

        {mfaFactorId ? (
          <form onSubmit={verifyMfa} className="w-full space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Entre le code à 6 chiffres de ton application d'authentification
            </p>
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus
              value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-center text-lg tracking-[0.4em] focus:border-gold focus:outline-none"
            />
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50">
              {loading ? "…" : "Vérifier"}
            </button>
            <button type="button" onClick={async () => { await supabase.auth.signOut(); setMfaFactorId(null); setMfaCode(""); }} className="w-full text-center text-xs text-muted-foreground">
              Annuler
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="w-full space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe"
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm focus:border-gold focus:outline-none" />
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-gold py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50">
              {loading ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
        )}

        <div className="my-4 flex w-full items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>

        <button onClick={google} className="w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium hover:border-gold/50">
          Continuer avec Google
        </button>

        <div className="mt-6 flex w-full flex-col items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Pas de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
          </button>
          {mode === "signin" && (
            <Link to="/forgot-password" className="text-gold">Mot de passe oublié ?</Link>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
