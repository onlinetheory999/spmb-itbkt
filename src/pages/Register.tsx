import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Mail, Lock, User as UserIcon, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const schema = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  jenjang: z.enum(["SD", "SMP", "SMA"]),
  jenis_kelamin: z.enum(["L", "P"]),
});

export default function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    nama: string; email: string; password: string;
    jenjang: "SD" | "SMP" | "SMA"; jenis_kelamin: "L" | "P";
  }>({ nama: "", email: "", password: "", jenjang: "SD", jenis_kelamin: "L" });

  // Tampilkan sisa kuota
  const { data: kuota } = useQuery({
    queryKey: ["kuota-register", form.jenjang, form.jenis_kelamin],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cek_kuota", {
        _jenjang: form.jenjang, _jk: form.jenis_kelamin,
      });
      if (error) return null;
      return data as { ok: boolean; kuota: number; terisi: number; sisa: number } | null;
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    // Cek kuota dulu
    const { data: ck, error: ckErr } = await supabase.rpc("cek_kuota", {
      _jenjang: parsed.data.jenjang, _jk: parsed.data.jenis_kelamin,
    });
    if (!ckErr && ck && !(ck as any).ok) {
      const label = parsed.data.jenis_kelamin === "L" ? "laki-laki" : "perempuan";
      toast.error(`Maaf, kuota untuk siswa ${label} jenjang ${parsed.data.jenjang} sudah penuh.`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/siswa`,
        data: {
          nama: parsed.data.nama,
          jenjang: parsed.data.jenjang,
          jenis_kelamin: parsed.data.jenis_kelamin,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pendaftaran berhasil! Silakan cek email atau login.");
    nav("/login");
  }

  const sisaText = kuota
    ? kuota.ok
      ? `Sisa kuota: ${kuota.sisa} / ${kuota.kuota}`
      : `Kuota penuh (${kuota.terisi}/${kuota.kuota})`
    : "Mengecek kuota...";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
        <Card className="w-full max-w-md p-8 shadow-elegant">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold">SPMB PKBM Ibnu Taimiyah</span>
          </div>
          <h1 className="text-2xl font-bold">Daftar Akun Baru</h1>
          <p className="text-sm text-muted-foreground mt-1">Buat akun untuk memulai pendaftaran</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="nama" required maxLength={100} className="pl-9"
                  placeholder="Nama sesuai akta" value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required autoComplete="email"
                  className="pl-9" placeholder="nama@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Jenjang</Label>
                <Select value={form.jenjang} onValueChange={(v) => setForm({ ...form, jenjang: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <RadioGroup
                  value={form.jenis_kelamin}
                  onValueChange={(v) => setForm({ ...form, jenis_kelamin: v as "L" | "P" })}
                  className="flex gap-3 h-9 items-center"
                >
                  <label className="flex items-center gap-1.5 text-sm">
                    <RadioGroupItem value="L" id="jk-l" /> Laki
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <RadioGroupItem value="P" id="jk-p" /> Perempuan
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className={`text-xs rounded-lg px-3 py-2 border ${
              kuota && !kuota.ok ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-primary/5 text-primary border-primary/20"
            }`}>
              {sisaText}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required autoComplete="new-password"
                  className="pl-9" placeholder="Minimal 8 karakter" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={loading || (kuota && !kuota.ok) || false}
              className="w-full bg-gradient-primary shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Daftar Sekarang</>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Login di sini</Link>
          </p>
        </Card>
      </div>

      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-primary text-primary-foreground relative overflow-hidden order-1 lg:order-2">
        <Link to="/" className="flex items-center gap-2 z-10 ml-auto">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-bold">SPMB PKBM Ibnu Taimiyah</span>
        </Link>
        <div className="z-10">
          <h2 className="text-4xl font-bold leading-tight">Bergabung dengan kami</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md">
            Daftar online dalam hitungan menit. Lengkapi biodata, unggah berkas, dan
            lacak status verifikasi langsung dari dashboard Anda.
          </p>
        </div>
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>
    </div>
  );
}
