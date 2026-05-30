import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/informasi", label: "Informasi" },
  { to: "/jadwal", label: "Jadwal" },
  { to: "/pengumuman", label: "Pengumuman" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">SPMB PKBM</span>
            <span className="text-[10px] text-muted-foreground">Ibnu Taimiyah</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="bg-gradient-primary shadow-elegant">
              <Link to={isAdmin ? "/admin" : "/siswa"}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary shadow-elegant">
                <Link to="/register"><UserPlus className="mr-2 h-4 w-4" />Daftar</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-lg hover:bg-accent"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background animate-fade-in">
          <div className="container mx-auto flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent">
                {l.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {user ? (
                <Button asChild className="col-span-2 bg-gradient-primary">
                  <Link to={isAdmin ? "/admin" : "/siswa"} onClick={() => setOpen(false)}>Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/register" onClick={() => setOpen(false)}>Daftar</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
