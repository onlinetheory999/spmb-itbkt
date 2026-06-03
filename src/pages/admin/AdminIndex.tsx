import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, CheckCircle2, Clock, TrendingUp, GraduationCap, ShieldCheck, Activity, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatIDR, formatDateTime } from "@/lib/format";

export default function AdminIndex() {
  const { role, user } = useAuth();
  const isSuper = role === "super_admin";

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [siswa, bayar, verif, recent] = await Promise.all([
        supabase.from("siswa").select("id, jenjang", { count: "exact" }),
        supabase.from("tagihan").select("nominal_dibayar, status").eq("status", "lunas"),
        supabase.from("siswa").select("id", { count: "exact" }).eq("status_verifikasi", "diverifikasi"),
        supabase.from("siswa").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      const total = siswa.count ?? 0;
      const totalBayar = (bayar.data ?? []).reduce((s, r) => s + Number(r.nominal_dibayar ?? 0), 0);
      const terverifikasi = verif.count ?? 0;
      const byJenjang = (siswa.data ?? []).reduce<Record<string, number>>((acc, r) => {
        acc[r.jenjang] = (acc[r.jenjang] ?? 0) + 1;
        return acc;
      }, {});
      return { total, totalBayar, terverifikasi, byJenjang, recent: recent.data ?? [] };
    },
  });

  const { data: sysStats } = useQuery({
    queryKey: ["super-admin-stats"],
    enabled: isSuper,
    queryFn: async () => {
      const [roles, profiles, jenjang, pengumuman] = await Promise.all([
        supabase.from("user_roles").select("role"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("jenjang").select("id", { count: "exact", head: true }),
        supabase.from("pengumuman").select("id", { count: "exact", head: true }),
      ]);
      const r = roles.data ?? [];
      return {
        totalUser: profiles.count ?? 0,
        totalAdmin: r.filter((x) => x.role === "admin").length,
        totalSuper: r.filter((x) => x.role === "super_admin").length,
        totalSiswa: r.filter((x) => x.role === "siswa").length,
        totalJenjang: jenjang.count ?? 0,
        totalPengumuman: pengumuman.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Total Pendaftar", value: stats?.total ?? 0, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Terverifikasi", value: stats?.terverifikasi ?? 0, icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Belum Verifikasi", value: (stats?.total ?? 0) - (stats?.terverifikasi ?? 0), icon: Clock, tone: "bg-amber-500/10 text-amber-600" },
    { label: "Pendapatan", value: formatIDR(stats?.totalBayar ?? 0), icon: CreditCard, tone: "bg-violet-500/10 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      {isSuper ? (
        <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-gold/80 p-6 md:p-8 text-primary-foreground shadow-elegant relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <Badge className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0">
            <ShieldCheck className="mr-1 h-3 w-3" /> Super Admin
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">Panel Kendali Sistem</h2>
          <p className="text-primary-foreground/85 mt-1 text-sm">
            Selamat datang, {user?.email}. Anda memiliki akses penuh terhadap sistem SPMB.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold">Dashboard Admin</h2>
          <p className="text-sm text-muted-foreground">Ringkasan pendaftaran SPMB 2026-2027</p>
        </div>
      )}

      {isSuper && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Pengguna", value: sysStats?.totalUser ?? 0, icon: Users, tone: "bg-primary/10 text-primary" },
            { label: "Super Admin", value: sysStats?.totalSuper ?? 0, icon: ShieldCheck, tone: "bg-gold/15 text-gold" },
            { label: "Admin", value: sysStats?.totalAdmin ?? 0, icon: Activity, tone: "bg-violet-500/10 text-violet-600" },
            { label: "Akun Siswa", value: sysStats?.totalSiswa ?? 0, icon: GraduationCap, tone: "bg-emerald-500/10 text-emerald-600" },
          ].map((c) => (
            <Card key={c.label} className="p-5 border-primary/20 hover:shadow-elegant transition-all">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
              <p className="mt-1 text-2xl font-bold">{c.value}</p>
            </Card>
          ))}
        </div>
      )}

      {isSuper && (
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ringkasan SPMB</h3>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 hover:shadow-elegant transition-all">
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${c.tone}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Per Jenjang</h3>
          </div>
          <div className="space-y-3">
            {(["SD", "SMP", "SMA"] as const).map((j) => {
              const v = stats?.byJenjang?.[j] ?? 0;
              const pct = stats?.total ? (v / stats.total) * 100 : 0;
              return (
                <div key={j}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{j}</span>
                    <span className="text-muted-foreground">{v} pendaftar</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Pendaftar Terbaru</h3>
          </div>
          <div className="divide-y">
            {(stats?.recent ?? []).map((s: any) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.nomor_peserta} • {formatDateTime(s.created_at)}
                  </p>
                </div>
                <Badge variant="outline">{s.jenjang}</Badge>
              </div>
            ))}
            {(stats?.recent ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Belum ada pendaftar.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
