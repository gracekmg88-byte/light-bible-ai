import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/favoris")({
  component: Favoris,
});

type Fav = { id: string; book_id: number; book_name: string; chapter: number; verse: number; text: string };

function Favoris() {
  const { user, loading } = useRequireAuth();
  const [favs, setFavs] = useState<Fav[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setFavs((data as Fav[]) ?? []));
  }, [user]);

  const remove = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavs((f) => f.filter((x) => x.id !== id));
  };

  return (
    <MobileShell>
      <PageHeader title="Mes favoris" subtitle="Versets sauvegardés" />
      <div className="px-5 pt-4">
        {loading ? null : !user ? (
          <Empty title="Connecte-toi" desc="Sauvegarde tes versets préférés." cta="Se connecter" to="/auth" />
        ) : favs.length === 0 ? (
          <Empty title="Aucun favori" desc="Touche un verset puis l'étoile pour le sauvegarder." cta="Lire la Bible" to="/bible" />
        ) : (
          <ul className="space-y-3">
            {favs.map((f) => (
              <li key={f.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Link
                    to="/bible/$bookId/$chapter"
                    params={{ bookId: String(f.book_id), chapter: String(f.chapter) }}
                    className="text-[11px] font-semibold uppercase tracking-widest text-gold"
                  >
                    {f.book_name} {f.chapter}:{f.verse}
                  </Link>
                  <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-display italic leading-snug">« {f.text} »</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

function Empty({ title, desc, cta, to }: { title: string; desc: string; cta: string; to: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
        <Star className="h-6 w-6 text-gold" />
      </div>
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Link to={to} className="mt-5 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-medium text-gold-foreground">{cta}</Link>
    </div>
  );
}
