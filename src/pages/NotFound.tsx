import { Link, useLocation } from "react-router-dom";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto h-20 w-20 grid place-items-center rounded-2xl bg-gradient-primary shadow-glow text-primary-foreground mb-6">
          <Compass className="h-10 w-10" />
        </div>
        <h1 className="text-7xl md:text-8xl font-extrabold bg-gradient-primary bg-clip-text text-transparent leading-none">
          404
        </h1>
        <h2 className="mt-4 text-xl md:text-2xl font-bold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman <code className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">{loc.pathname}</code>{" "}
          tidak tersedia atau Anda tidak memiliki akses.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
          </Button>
          <Button asChild className="bg-gradient-primary">
            <Link to="/"><Home className="h-4 w-4 mr-2" /> Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
