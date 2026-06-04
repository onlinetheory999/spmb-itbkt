import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, CheckCircle2, Loader2, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSiswaProgress } from "@/hooks/use-siswa-progress";
import { formatIDR, formatDateTime, generateVA } from "@/lib/format";

export default function DaftarUlang() {
  const { siswa, daftarUlang } = useSiswaProgress();
  const qc = useQueryClient();
  const [bayar, setBayar] = useState("");
  const [loading, setLoading] = useState(false);

  // Ambil biaya daftar ulang aktif untuk jenjang siswa
  const { data: biaya } = useQuery({
    queryKey: ["biaya-daftar-ulang", siswa?.jenjang],
    enabled: !!siswa?.jenjang,
    queryFn: async () => {
      const { data: ta } = await supabase.from("tahun_ajaran").select("id,kode").eq("aktif", true).maybeSingle();
      if (!ta) return null;
      const { data } = await supabase.from("biaya_daftar_ulang").select("*")
        .eq("jenjang", siswa!.jenjang).eq("tahun_ajaran_id", ta.id).eq("aktif", true).maybeSingle();
      return data ? { ...data, ta_kode: ta.kode } : null;
    },
  });

  async function buatTagihan() {
    if (!siswa || !biaya) return;
    setLoading(true);
    try {
      const { data: trxData, error: trxErr } = await supabase.rpc("generate_trx_id");
      if (trxErr) throw trxErr;
      const { data: j } = await supabase.from("jenjang").select("kode_va").eq("kode", siswa.jenjang).maybeSingle();
      const va = generateVA(j?.kode_va ?? "200", siswa.no_hp_ortu ?? siswa.no_hp ?? "0000000000");
      const { error } = await supabase.from("tagihan").insert({
        trx_id: trxData as any,
        siswa_id: siswa.id,
        jenis: "daftar_ulang",
        jenjang: siswa.jenjang,
        tahun_ajaran_kode: biaya.ta_kode,
        nominal_tagihan: biaya.nominal,
        nomor_va: va,
        tanggal_tempo: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      } as any);
      if (error) throw error;
      toast.success("Tagihan daftar ulang dibuat");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function simulasiBayar(full: boolean) {
    if (!daftarUlang) return;
    setLoading(true);
    try {
      const nominal = full ? Number(daftarUlang.nominal_tagihan) : Number(bayar || 0);
      if (!full && nominal <= 0) return toast.error("Masukkan nominal");
      const { error } = await supabase.from("tagihan")
        .update({ nominal_dibayar: nominal }).eq("id", daftarUlang.id);
      if (error) throw error;
      toast.success("Pembayaran tercatat");
      setBayar("");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!daftarUlang) {
    return (
      <Card className="p-8 max-w-xl">
        <div className="flex items-center gap-3 mb-3">
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-bold">Daftar Ulang</h2>
            <p className="text-xs text-muted-foreground">
              Selamat! Anda lulus. Lanjutkan dengan menerbitkan tagihan daftar ulang.
            </p>
          </div>
        </div>
        {biaya ? (
          <>
            <div className="rounded-lg border bg-muted/30 p-4 my-3">
              <p className="text-xs text-muted-foreground">Biaya Daftar Ulang {siswa?.jenjang}</p>
              <p className="text-2xl font-bold mt-1">{formatIDR(biaya.nominal)}</p>
            </div>
            <Button onClick={buatTagihan} disabled={loading} className="bg-gradient-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terbitkan Tagihan Daftar Ulang"}
            </Button>
          </>
        ) : (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Biaya daftar ulang belum dikonfigurasi admin.
          </div>
        )}
      </Card>
    );
  }

  const lunas = daftarUlang.status === "lunas";

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Daftar Ulang</h2>
        <p className="text-sm text-muted-foreground">Selesaikan pembayaran untuk mengkonfirmasi penerimaan.</p>
      </div>

      <Card className="overflow-hidden shadow-elegant">
        <div className="bg-gradient-primary p-5 text-primary-foreground flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">{daftarUlang.trx_id}</p>
            <p className="font-bold">Daftar Ulang {daftarUlang.jenjang}</p>
          </div>
          <StatusBadge status={daftarUlang.status} />
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <Field label="Nominal">{formatIDR(daftarUlang.nominal_tagihan)}</Field>
          <Field label="Dibayar">{formatIDR(daftarUlang.nominal_dibayar)}</Field>
          <Field label="Jatuh Tempo">{daftarUlang.tanggal_tempo ?? "-"}</Field>
          <Field label="Tanggal Bayar">{daftarUlang.tanggal_bayar ? formatDateTime(daftarUlang.tanggal_bayar) : "-"}</Field>
          <Field label="No. VA">
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold">{daftarUlang.nomor_va}</code>
              <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(daftarUlang.nomor_va); toast.success("Disalin"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Field>
          <Field label="Metode">{daftarUlang.metode}</Field>
        </div>
      </Card>

      {!lunas && (
        <Card className="p-5 border-dashed">
          <p className="font-semibold text-sm mb-3">Simulasi Pembayaran</p>
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
            <div>
              <Label className="text-xs">Nominal</Label>
              <Input type="number" value={bayar} onChange={(e) => setBayar(e.target.value)}
                placeholder={String(daftarUlang.nominal_tagihan)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" disabled={loading} onClick={() => simulasiBayar(false)}>Bayar</Button>
            </div>
            <div className="flex items-end">
              <Button disabled={loading} className="bg-gradient-primary" onClick={() => simulasiBayar(true)}>
                Bayar Lunas
              </Button>
            </div>
          </div>
        </Card>
      )}

      {lunas && (
        <Card className="p-5 border-primary/30 bg-primary/5 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold">Daftar Ulang Lunas</p>
            <p className="text-sm text-muted-foreground">Selamat bergabung di PKBM Ibnu Taimiyah!</p>
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
      <div className="mt-0.5 font-medium">{children}</div>
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
