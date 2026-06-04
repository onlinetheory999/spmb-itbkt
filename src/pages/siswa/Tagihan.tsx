import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatIDR, formatDateTime } from "@/lib/format";

export default function Tagihan() {
  const { user } = useAuth();

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: list } = useQuery({
    queryKey: ["tagihan-list", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("tagihan").select("*")
        .eq("siswa_id", siswa!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Riwayat Tagihan</h2>
        <p className="text-sm text-muted-foreground">Seluruh tagihan pendaftaran dan daftar ulang.</p>
      </div>

      {(!list || list.length === 0) ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" /> Belum ada tagihan.
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((t: any) => (
            <Card key={t.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{t.trx_id}</p>
                  <p className="font-semibold capitalize">
                    {t.jenis.replace("_", " ")} — {t.jenjang}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(t.tanggal_tagihan)}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                <Stat label="Tagihan" value={formatIDR(t.nominal_tagihan)} />
                <Stat label="Dibayar" value={formatIDR(t.nominal_dibayar)} />
                <Stat label="No. VA" value={<code className="font-mono">{t.nomor_va}</code>} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    belum_bayar: { label: "Belum Bayar", cls: "bg-destructive/15 text-destructive" },
    menunggu_verifikasi: { label: "Menunggu Verifikasi", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    lunas: { label: "Lunas", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  };
  const s = map[status] ?? map.belum_bayar;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}
