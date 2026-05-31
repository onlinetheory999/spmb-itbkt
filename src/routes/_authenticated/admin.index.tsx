import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, CheckCircle2, Clock, TrendingUp, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [siswa, bayar, verif, recent] = await Promise.all([
        supabase.from("siswa").select("id, jenjang", { count: "exact" }),
        supabase.from("pembayaran").select("biaya, status").eq("status", "lunas"),
        supabase.from("siswa").select("id", { count: "exact" }).eq("status_verifikasi", "diverifikasi"),
        supabase.from("siswa").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      const total = siswa.count ?? 0;
      const totalBayar = (bayar.data ?? []).reduce((s, r) => s + Number(r.biaya ?? 0), 0);
      const terverifikasi = verif.count ?? 0;
      const byJenjang = (siswa.data ?? []).reduce<Record<string, number>>((acc, r) => {
        acc[r.jenjang] = (acc[r.jenjang] ?? 0) + 1;
        return acc;
      }, {});
      return { total, totalBayar, terverifikasi, byJenjang, recent: recent.data ?? [] };
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
      <div>
        <h2 className="text-2xl font-bold">Dashboard Admin</h2>
        <p className="text-sm text-muted-foreground">Ringkasan pendaftaran SPMB 2026-2027</p>
      </div>

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
            {(stats?.recent ?? []).map((s) => (
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
