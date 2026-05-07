import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Users, Clock, BookOpen, Music, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Bible Lumière" }] }),
  component: AdminPage,
});

type UserRow = {
  user_id: string;
  email: string;
  total_minutes: number;
  chapters_read: number;
  avg_completion: number;
  last_active: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  book_name: string;
  chapter: number;
  duration_seconds: number;
  completion_percent: number;
  created_at: string;
};

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [u, s] = await Promise.all([
        supabase.rpc("admin_user_stats"),
        supabase.from("reading_sessions").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      if (u.error) toast.error("Erreur chargement utilisateurs");
      setUsers((u.data ?? []) as UserRow[]);
      setSessions((s.data ?? []) as SessionRow[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return <MobileShell><div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div></MobileShell>;
  }

  if (!user) {
    return (
      <MobileShell>
        <PageHeader title="Admin" />
        <div className="px-5 pt-10 text-center">
          <p className="text-sm text-muted-foreground">Connexion requise.</p>
          <Link to="/auth" className="mt-4 inline-block rounded-xl bg-gradient-gold px-4 py-2 text-sm text-gold-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }

  if (!isAdmin) {
    return (
      <MobileShell>
        <PageHeader title="Admin" />
        <div className="px-5 pt-10 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Accès réservé aux administrateurs.</p>
        </div>
      </MobileShell>
    );
  }

  const totalUsers = users.length;
  const totalMinutes = users.reduce((a, u) => a + Number(u.total_minutes || 0), 0);
  const totalChapters = users.reduce((a, u) => a + Number(u.chapters_read || 0), 0);

  return (
    <MobileShell>
      <PageHeader title="Dashboard Admin" subtitle="Suivi des utilisateurs" />
      <div className="px-5 pt-6 pb-4 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <Kpi icon={<Users className="h-4 w-4" />} value={totalUsers} label="Utilisateurs" />
          <Kpi icon={<Clock className="h-4 w-4" />} value={totalMinutes} label="Minutes lues" />
          <Kpi icon={<BookOpen className="h-4 w-4" />} value={totalChapters} label="Chapitres" />
        </div>

        {/* Users */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gold">Utilisateurs</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
          ) : (
            <ul className="space-y-2">
              {users.map((u) => (
                <li key={u.user_id} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{u.email}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {u.last_active ? `Actif ${new Date(u.last_active).toLocaleDateString("fr-FR")}` : "Jamais lu"}
                      </p>
                    </div>
                    <div className="text-right text-[11px]">
                      <p><span className="text-gold font-semibold">{u.total_minutes}</span> min</p>
                      <p className="text-muted-foreground">{u.chapters_read} ch · {u.avg_completion}%</p>
                    </div>
                  </div>
                </li>
              ))}
              {users.length === 0 && <p className="text-center text-xs text-muted-foreground">Aucun utilisateur.</p>}
            </ul>
          )}
        </section>

        {/* Sessions récentes */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gold">Activité récente</h2>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-card p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm">{s.book_name} {s.chapter}</span>
                  <span className="text-muted-foreground">{Math.round(s.duration_seconds / 60)} min · {s.completion_percent}%</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  user: {s.user_id.slice(0, 8)}… · {new Date(s.created_at).toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
            {sessions.length === 0 && <p className="text-center text-xs text-muted-foreground">Aucune séance.</p>}
          </ul>
        </section>
      </div>
    </MobileShell>
  );
}

function Kpi({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-aurora">{icon}</div>
      <p className="font-display text-lg leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
