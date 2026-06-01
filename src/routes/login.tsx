import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Mail, Lock, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s): { redirect?: string } => ({ redirect: (s.redirect as string) || undefined }),
  head: () => ({ meta: [{ title: "Login | SPMB PKBM Ibnu Taimiyah" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Login berhasil");
    // Role-based redirect
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin");
    nav({ to: redirectTo !== "/" ? redirectTo : isAdmin ? "/admin" : "/siswa" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-primary text-primary-foreground relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 z-10">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-bold">SPMB PKBM Ibnu Taimiyah</span>
        </Link>
        <div className="z-10">
          <h2 className="text-4xl font-bold leading-tight">Selamat datang kembali</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md">
            Masuk untuk melanjutkan proses pendaftaran, melengkapi berkas, dan
            memantau status verifikasi Anda.
          </p>
        </div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-elegant">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold">SPMB PKBM Ibnu Taimiyah</span>
          </div>
          <h1 className="text-2xl font-bold">Login Akun</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Masukkan email & password Anda
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email" type="email" required autoComplete="email"
                  className="pl-9" placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password" type="password" required autoComplete="current-password"
                  className="pl-9" placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Masuk</>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Daftar di sini</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
