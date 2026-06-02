import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, CreditCard, CheckCircle2, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatIDR, formatDateTime } from "@/lib/format";

export default function Pembayaran() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: bayar, isLoading } = useQuery({
    queryKey: ["bayar-me", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("pembayaran").select("*").eq("siswa_id", siswa!.id).maybeSingle();
      return data;
    },
  });

  async function simulasiBayar() {
    if (!bayar) return;
    const { error } = await supabase.from("pembayaran").update({
      status: "lunas", tanggal_bayar: new Date().toISOString(),
      metode: "VA Nagari (Simulasi)",
    }).eq("id", bayar.id);
    if (error) return toast.error(error.message);
    toast.success("Pembayaran berhasil disimulasikan");
    qc.invalidateQueries();
  }

  function copy(t: string) {
    navigator.clipboard.writeText(t);
    toast.success("Disalin ke clipboard");
  }

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  if (!bayar) {
    return (
      <Card className="p-10 text-center max-w-xl">
        <CreditCard className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="mt-3 font-semibold">Belum ada tagihan</h3>
        <p className="text-sm text-muted-foreground mt-1">Lengkapi biodata terlebih dahulu untuk menerbitkan Virtual Account.</p>
      </Card>
    );
  }

  const lunas = bayar.status === "lunas";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pembayaran Pendaftaran</h2>
        <p className="text-sm text-muted-foreground">Lakukan pembayaran melalui Virtual Account Bank Nagari.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">VA Bank Nagari</span>
            </div>
            <Badge className={lunas ? "bg-white/30" : "bg-amber-500/30"}>
              {lunas ? "LUNAS" : "MENUNGGU"}
            </Badge>
          </div>
          <p className="text-xs mt-4 text-primary-foreground/80">Nomor Virtual Account</p>
          <div className="flex items-center justify-between gap-3 mt-1">
            <span className="text-2xl md:text-3xl font-mono font-bold tracking-wider">{bayar.nomor_va}</span>
            <Button size="sm" variant="secondary" onClick={() => copy(bayar.nomor_va)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <Row label="Total Tagihan" value={<span className="font-bold text-lg">{formatIDR(bayar.biaya)}</span>} />
          <Row label="Status" value={lunas ? <span className="text-primary font-semibold">Lunas</span> : "Menunggu pembayaran"} />
          <Row label="Metode" value={bayar.metode ?? "Virtual Account"} />
          {bayar.tanggal_bayar && (
            <Row label="Tanggal Bayar" value={formatDateTime(bayar.tanggal_bayar)} />
          )}
        </div>
      </Card>

      {!lunas && (
        <Card className="p-6 border-amber-500/30 bg-amber-500/5">
          <h3 className="font-semibold mb-2">Simulasi Pembayaran (Mode Demo)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pada implementasi produksi, status pembayaran akan otomatis diperbarui oleh webhook VA Bank Nagari.
            Untuk keperluan demo, klik tombol di bawah untuk menandai pembayaran sebagai lunas.
          </p>
          <Button onClick={simulasiBayar} className="bg-gradient-primary">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Simulasikan Pembayaran VA Nagari
          </Button>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
