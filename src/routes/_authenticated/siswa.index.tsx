import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { User, CreditCard, FileText, IdCard, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatIDR, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/siswa/")({
  component: SiswaHome,
});

function SiswaHome() {
  const { user } = useAuth();

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: bayar } = useQuery({
    queryKey: ["bayar-me", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("pembayaran").select("*").eq("siswa_id", siswa!.id).maybeSingle();
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

  const steps = [
    { label: "Biodata", done: !!siswa?.nama_lengkap, link: "/siswa/biodata" },
    { label: "Pembayaran", done: bayar?.status === "lunas", link: "/siswa/pembayaran" },
    { label: "Upload Berkas", done: !!(berkas?.pas_foto && berkas?.kk && berkas?.akta), link: "/siswa/berkas" },
    { label: "Verifikasi", done: siswa?.status_verifikasi === "diverifikasi", link: "/siswa" },
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
          <Link key={s.label} to={s.link}>
            <Card className="p-5 hover:shadow-elegant transition-all hover:-translate-y-0.5 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">LANGKAH {i + 1}</span>
                {s.done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <p className="mt-2 font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {s.done ? "Selesai" : "Belum lengkap"}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Status Pendaftaran</h3>
            <StatusBadge status={siswa?.status_verifikasi} />
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Nomor Peserta" value={siswa?.nomor_peserta || "-"} />
            <Row label="Jenjang" value={siswa?.jenjang ?? "-"} />
            <Row label="Asal Sekolah" value={siswa?.asal_sekolah || "-"} />
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
            <h3 className="font-semibold">Pembayaran</h3>
            <PayBadge status={bayar?.status} />
          </div>
          {bayar ? (
            <dl className="space-y-3 text-sm">
              <Row label="Nomor VA" value={bayar.nomor_va} mono />
              <Row label="Biaya" value={formatIDR(bayar.biaya)} />
              <Row label="Metode" value={bayar.metode ?? "Virtual Account"} />
              <Row label="Dibayar" value={bayar.tanggal_bayar ? formatDateTime(bayar.tanggal_bayar) : "-"} />
            </dl>
          ) : (
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              VA akan dibuat otomatis setelah biodata terisi.
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
    pending: { label: "Menunggu", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    lunas: { label: "Lunas", cls: "bg-primary/15 text-primary" },
    gagal: { label: "Gagal", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status ?? "pending"] ?? map.pending;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}
