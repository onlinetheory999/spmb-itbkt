import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatIDR, formatDateTime } from "@/lib/format";

export default function SiswaIndex() {
  const { user } = useAuth();

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: tagihan } = useQuery({
    queryKey: ["tagihan-pendaftaran", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("tagihan")
        .select("*")
        .eq("siswa_id", siswa!.id)
        .eq("jenis", "pendaftaran")
        .maybeSingle();
      return data;
    },
  });

  const { data: berkas } = useQuery({
    queryKey: ["berkas-me", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("upload_berkas").select("*").eq("siswa_id", siswa!.id).maybeSingle();
      return data;
    },
  });

  const lunas = tagihan?.status === "lunas";
  const steps = [
    { label: "Registrasi", done: !!siswa, link: "/siswa" },
    { label: "Pembayaran", done: lunas, link: "/siswa/pembayaran" },
    { label: "Biodata", done: !!siswa?.nama_lengkap && lunas, link: "/siswa/biodata" },
    { label: "Upload Berkas", done: !!(berkas?.pas_foto && berkas?.kk && berkas?.akta), link: "/siswa/berkas" },
    { label: "Verifikasi", done: siswa?.status_verifikasi === "diverifikasi", link: "/siswa" },
    { label: "Cetak Kartu", done: false, link: "/siswa/kartu" },
    { label: "Hasil Kelulusan", done: siswa?.status_kelulusan === "lulus", link: "/siswa" },
    { label: "Daftar Ulang", done: false, link: "/siswa" },
  ];
  const completed = steps.filter((s) => s.done).length;
  const progress = (completed / steps.length) * 100;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="rounded-2xl bg-gradient-primary p-6 md:p-8 text-primary-foreground shadow-elegant relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <Badge className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0">SPMB 2026-2027</Badge>
        <h2 className="text-2xl md:text-3xl font-bold mt-3">Halo, {siswa?.nama_lengkap || user?.email}!</h2>
        <p className="text-primary-foreground/80 mt-1">Lengkapi tahapan di bawah untuk menyelesaikan pendaftaran.</p>
        <div className="mt-5 max-w-md">
          <div className="flex justify-between text-xs mb-1.5">
            <span>Progres pendaftaran</span>
            <span className="font-semibold">{completed}/{steps.length}</span>
          </div>
          <Progress value={progress} className="bg-white/20" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <Card key={s.label} className="p-5 h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">LANGKAH {i + 1}</span>
              {s.done ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <p className="mt-2 font-semibold">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.done ? "Selesai" : "Belum"}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Status Pendaftaran</h3>
            <StatusBadge status={siswa?.status_verifikasi} />
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Nomor Registrasi" value={siswa?.nomor_registrasi || "-"} mono />
            <Row label="Nomor Peserta" value={siswa?.nomor_peserta || "-"} mono />
            <Row label="Jenjang" value={siswa?.jenjang ?? "-"} />
            <Row label="Tahun Ajaran" value={siswa?.tahun_ajaran_kode || "-"} />
            <Row label="Terdaftar" value={siswa?.created_at ? formatDateTime(siswa.created_at) : "-"} />
          </dl>
          {!siswa && (
            <Button asChild className="mt-4 w-full bg-gradient-primary">
              <Link to="/siswa/biodata">Isi Biodata <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Tagihan Pendaftaran</h3>
            <PayBadge status={tagihan?.status} />
          </div>
          {tagihan ? (
            <dl className="space-y-3 text-sm">
              <Row label="TRX ID" value={tagihan.trx_id} mono />
              <Row label="Nomor VA" value={tagihan.nomor_va} mono />
              <Row label="Nominal" value={formatIDR(tagihan.nominal_tagihan)} />
              <Row label="Dibayar" value={formatIDR(tagihan.nominal_dibayar)} />
              <Row label="Metode" value={tagihan.metode ?? "Virtual Account"} />
              <Row label="Tanggal Bayar" value={tagihan.tanggal_bayar ? formatDateTime(tagihan.tanggal_bayar) : "-"} />
            </dl>
          ) : (
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Tagihan akan dibuat otomatis setelah registrasi tersimpan.
            </div>
          )}
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/siswa/pembayaran">Detail Pembayaran</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    belum: { label: "Belum Verifikasi", cls: "bg-muted text-muted-foreground" },
    diverifikasi: { label: "Terverifikasi", cls: "bg-primary/15 text-primary" },
    ditolak: { label: "Ditolak", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status ?? "belum"] ?? map.belum;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}

function PayBadge({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    belum_bayar: { label: "Belum Bayar", cls: "bg-destructive/15 text-destructive" },
    menunggu_verifikasi: { label: "Menunggu Verifikasi", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    lunas: { label: "Lunas", cls: "bg-primary/15 text-primary" },
  };
  const s = map[status ?? "belum_bayar"] ?? map.belum_bayar;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}
