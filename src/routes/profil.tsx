import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Mail, KeyRound, ChevronRight, ShieldCheck, Shield } from "lucide-react";

export const Route = createFileRoute("/profil")({
  component: Profil,
});

function Profil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // 2FA
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find((f) => f.status === "verified");
      setMfaEnabled(!!totp);
      setMfaFactorId(totp?.id ?? null);
    });
  }, [user]);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setPendingFactorId(data.id);
    } catch (e: any) {
      toast.error(e.message ?? "Impossible d'activer la 2FA");
      setEnrolling(false);
    }
  };

  const verifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFactorId) return;
    try {
      const { data: ch, error: ce } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId });
      if (ce) throw ce;
      const { error: ve } = await supabase.auth.mfa.verify({
        factorId: pendingFactorId, challengeId: ch.id, code: otpCode,
      });
      if (ve) throw ve;
      toast.success("Double authentification activée");
      setMfaEnabled(true);
      setMfaFactorId(pendingFactorId);
      setQr(null); setSecret(null); setOtpCode(""); setPendingFactorId(null); setEnrolling(false);
    } catch (e: any) {
      toast.error(e.message ?? "Code incorrect");
    }
  };

  const disableMfa = async () => {
    if (!mfaFactorId) return;
    if (!confirm) {/* unused, just to silence */}
    const ok = window.confirm("Désactiver la double authentification ?");
    if (!ok) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    if (error) { toast.error(error.message); return; }
    setMfaEnabled(false);
    setMfaFactorId(null);
    toast.success("2FA désactivée");
  };

  if (loading) return <MobileShell><div /></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <PageHeader title="Profil" />
        <div className="flex flex-col items-center px-5 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-aurora shadow-glow">
            <UserIcon className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl">Bienvenue</h2>
          <p className="mt-1 text-sm text-muted-foreground">Connecte-toi pour synchroniser tes notes et favoris.</p>
          <Link to="/auth" className="mt-6 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-medium text-gold-foreground">
            Se connecter / S'inscrire
          </Link>
        </div>
      </MobileShell>
    );
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) { toast.error("6 caractères minimum"); return; }
    if (pwd !== confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      setPwd(""); setConfirm(""); setShowPwd(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally { setSaving(false); }
  };

  return (
    <MobileShell>
      <PageHeader title="Profil" />
      <div className="px-5 pt-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aurora">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base">{user.user_metadata?.full_name ?? "Disciple"}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{user.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowPwd(!showPwd)}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Changer le mot de passe</p>
              <p className="text-[11px] text-muted-foreground">Mets à jour ton mot de passe</p>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showPwd ? "rotate-90" : ""}`} />
        </button>

        {showPwd && (
          <form onSubmit={changePassword} className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <input
              type="password" minLength={6} required value={pwd} onChange={(e) => setPwd(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <input
              type="password" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-gold py-2.5 text-sm font-medium text-gold-foreground disabled:opacity-50">
              {saving ? "…" : "Mettre à jour"}
            </button>
          </form>
        )}

        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </MobileShell>
  );
}
