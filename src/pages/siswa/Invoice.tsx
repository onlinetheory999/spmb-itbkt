import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Copy, CheckCircle2, AlertCircle, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatIDR, formatDateTime } from "@/lib/format";

/**
 * Halaman Invoice & Pembayaran Pendaftaran.
 * - Tampilkan VA + nominal
 * - Simulasi pembayaran (untuk dev / sebelum integrasi VA Nagari)
 */
export default function Invoice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [bayar, setBayar] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: tagihan, refetch } = useQuery({
    queryKey: ["tagihan-pendaftaran", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("tagihan").select("*")
        .eq("siswa_id", siswa!.id).eq("jenis", "pendaftaran").maybeSingle();
      return data;
    },
  });

  const lunas = tagihan?.status === "lunas";

  function copyVA() {
    if (!tagihan) return;
    navigator.clipboard.writeText(tagihan.nomor_va);
    toast.success("Nomor VA disalin");
  }

  async function simulasiBayar(full: boolean) {
    if (!tagihan) return;
    setLoading(true);
    try {
      const nominal = full ? Number(tagihan.nominal_tagihan) : Number(bayar || 0);
      if (!full && (!nominal || nominal <= 0)) {
        toast.error("Masukkan nominal pembayaran");
        return;
      }
      const { error } = await supabase
        .from("tagihan")
        .update({ nominal_dibayar: nominal })
        .eq("id", tagihan.id);
      if (error) throw error;
      toast.success(full ? "Pembayaran lunas tercatat" : "Pembayaran tercatat");
      setBayar("");
      await refetch();
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Invoice Pendaftaran</h2>
        <p className="text-sm text-muted-foreground">
          Lakukan pembayaran ke nomor Virtual Account di bawah untuk melanjutkan ke tahap biodata.
        </p>
      </div>

      <Card className="overflow-hidden shadow-elegant">
        <div className="bg-gradient-primary p-5 text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs opacity-80">{tagihan.trx_id}</p>
              <p className="font-bold">Biaya Pendaftaran {tagihan.jenjang}</p>
            </div>
          </div>
          <StatusBadge status={tagihan.status} />
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-6">
          <Field label="Nominal Tagihan">
            <p className="text-2xl font-bold">{formatIDR(tagihan.nominal_tagihan)}</p>
          </Field>
          <Field label="Sudah Dibayar">
            <p className="text-xl font-semibold">{formatIDR(tagihan.nominal_dibayar)}</p>
          </Field>
          <Field label="Metode Pembayaran">{tagihan.metode}</Field>
          <Field label="Jatuh Tempo">{tagihan.tanggal_tempo ?? "-"}</Field>
          <Field label="Tanggal Bayar">
            {tagihan.tanggal_bayar ? formatDateTime(tagihan.tanggal_bayar) : "-"}
          </Field>
          <Field label="Nama Peserta">{siswa?.nama_lengkap}</Field>
        </div>

        <div className="border-t bg-muted/30 p-6 space-y-4">
          <Field label="Nomor Virtual Account">
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 font-mono text-lg font-bold tracking-wider rounded-lg border bg-background px-4 py-3">
                {tagihan.nomor_va}
              </code>
              <Button variant="outline" size="icon" onClick={copyVA} type="button">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Bayar via Bank Nagari Syariah / m-Banking / ATM ke nomor di atas.
            </p>
          </Field>
        </div>
      </Card>

      {!lunas && (
        <Card className="p-6 border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Simulasi Pembayaran (Sementara)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Integrasi otomatis dengan VA Nagari sedang disiapkan. Untuk sementara,
                Anda dapat mensimulasikan pembayaran di sini.
              </p>
              <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 mt-4">
                <div>
                  <Label className="text-xs">Nominal Bayar</Label>
                  <Input type="number" inputMode="numeric" min={1} value={bayar}
                    onChange={(e) => setBayar(e.target.value)}
                    placeholder={String(tagihan.nominal_tagihan)} />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" disabled={loading} onClick={() => simulasiBayar(false)}>
                    <Wallet className="h-4 w-4 mr-1.5" /> Bayar
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button disabled={loading} onClick={() => simulasiBayar(true)} className="bg-gradient-primary">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Bayar Lunas</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {lunas && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Pembayaran Lunas</p>
              <p className="text-sm text-muted-foreground">
                Silakan lanjutkan ke tahap <strong>Lengkapi Biodata</strong>.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    belum_bayar: { label: "Belum Bayar", cls: "bg-destructive text-destructive-foreground" },
    menunggu_verifikasi: { label: "Menunggu Verifikasi", cls: "bg-amber-500 text-white" },
    lunas: { label: "Lunas", cls: "bg-emerald-500 text-white" },
  };
  const s = map[status] ?? map.belum_bayar;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}
