import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Lock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useSiswaProgress, STEP_LABELS, STEP_ROUTES, StepKey } from "@/hooks/use-siswa-progress";
import { formatIDR, formatDateTime } from "@/lib/format";

const ORDER: StepKey[] = [
  "registrasi", "pembayaran", "biodata", "berkas",
  "verifikasi", "kartu", "kelulusan", "daftar_ulang",
];

export default function SiswaIndex() {
  const { user } = useAuth();
  const { siswa, tagihan, steps, currentStep } = useSiswaProgress();

  const completed = ORDER.filter((k) => steps[k]).length;
  const progress = (completed / ORDER.length) * 100;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-primary p-6 md:p-8 text-primary-foreground shadow-elegant relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <Badge className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0">
          SPMB {siswa?.tahun_ajaran_kode ?? "2026-2027"}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold mt-3">
          Halo, {siswa?.nama_lengkap || user?.email}!
        </h2>
        <p className="text-primary-foreground/80 mt-1">
          Tahapan pendaftaran berjalan berurutan — selesaikan setiap langkah untuk membuka langkah berikutnya.
        </p>
        <div className="mt-5 max-w-md">
          <div className="flex justify-between text-xs mb-1.5">
            <span>Progres pendaftaran</span>
            <span className="font-semibold">{completed}/{ORDER.length}</span>
          </div>
          <Progress value={progress} className="bg-white/20" />
        </div>
        {currentStep !== "daftar_ulang" || !steps.daftar_ulang ? (
          <Button asChild size="sm" variant="secondary" className="mt-4">
            <Link to={STEP_ROUTES[currentStep]}>
              Lanjut: {STEP_LABELS[currentStep]} <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Step grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ORDER.map((k, i) => {
          const done = steps[k];
          const isCurrent = currentStep === k && !done;
          const locked = !done && !isCurrent && i > 0 && !steps[ORDER[i - 1]];
          return (
            <Card key={k}
              className={`p-5 h-full transition ${
                done ? "border-emerald-500/40 bg-emerald-500/5"
                : isCurrent ? "border-primary/50 bg-primary/5 shadow-md"
                : ""
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">LANGKAH {i + 1}</span>
                {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : locked ? <Lock className="h-4 w-4 text-muted-foreground" />
                  : <Clock className="h-5 w-5 text-amber-500" />}
              </div>
              <p className="mt-2 font-semibold">{STEP_LABELS[k]}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {done ? "Selesai" : locked ? "Terkunci" : isCurrent ? "Saat ini" : "Menunggu"}
              </p>
              {!locked && (
                <Button asChild size="sm" variant={isCurrent ? "default" : "ghost"}
                  className={`mt-3 w-full ${isCurrent ? "bg-gradient-primary" : ""}`}>
                  <Link to={STEP_ROUTES[k]}>{done ? "Lihat" : "Buka"}</Link>
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Detail cards */}
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
            <Row label="Jenis Kelamin" value={(siswa as any)?.jenis_kelamin === "P" ? "Perempuan" : "Laki-laki"} />
            <Row label="Tahun Ajaran" value={siswa?.tahun_ajaran_kode || "-"} />
            <Row label="Terdaftar" value={siswa?.created_at ? formatDateTime(siswa.created_at) : "-"} />
          </dl>
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
              <Row label="Tanggal Bayar" value={tagihan.tanggal_bayar ? formatDateTime(tagihan.tanggal_bayar) : "-"} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada tagihan.</p>
          )}
          <Button asChild className="mt-4 w-full bg-gradient-primary">
            <Link to="/siswa/invoice">Buka Invoice & Bayar</Link>
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
    diverifikasi: { label: "Terverifikasi", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    ditolak: { label: "Ditolak", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status ?? "belum"] ?? map.belum;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}

function PayBadge({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    belum_bayar: { label: "Belum Bayar", cls: "bg-destructive/15 text-destructive" },
    menunggu_verifikasi: { label: "Menunggu Verifikasi", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    lunas: { label: "Lunas", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  };
  const s = map[status ?? "belum_bayar"] ?? map.belum_bayar;
  return <Badge className={`${s.cls} border-0`}>{s.label}</Badge>;
}
