import { Link, useLocation } from "@tanstack/react-router";
import { Book, Home, Sparkles, Music, History } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/bible", label: "Bible", icon: Book },
  { to: "/assistant", label: "Assistant", icon: Sparkles },
  { to: "/meditation", label: "Prière", icon: Music },
  { to: "/historique", label: "Historique", icon: History },
] as const;

export function MobileShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border glass">
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                    active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_oklch(0.82_0.13_85_/_0.6)]" : ""}`} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border glass px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
