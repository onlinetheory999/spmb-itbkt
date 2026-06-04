import { Link } from "react-router-dom";
import { Trophy, XCircle, Clock, Printer, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSiswaProgress } from "@/hooks/use-siswa-progress";
import { formatDateTime } from "@/lib/format";

export default function Kelulusan() {
  const { siswa } = useSiswaProgress();
  if (!siswa) return null;

  const published = siswa.kelulusan_published;
  const status = siswa.status_kelulusan as "belum" | "lulus" | "tidak_lulus";

  if (!published || status === "belum") {
    return (
      <Card className="p-10 text-center max-w-xl">
        <Clock className="h-10 w-10 mx-auto text-amber-500" />
        <h3 className="mt-3 text-lg font-semibold">Pengumuman Belum Tersedia</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Hasil kelulusan akan diumumkan sesuai jadwal. Mohon menunggu informasi resmi dari panitia.
        </p>
      </Card>
    );
  }

  if (status === "tidak_lulus") {
    return (
      <Card className="max-w-xl p-10 text-center border-destructive/30">
        <XCircle className="h-12 w-12 mx-auto text-destructive" />
        <Badge className="mt-3 bg-destructive text-destructive-foreground border-0">Tidak Lulus</Badge>
        <h3 className="mt-3 text-xl font-bold">Mohon maaf, Anda dinyatakan belum diterima</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Terima kasih sudah mengikuti proses seleksi SPMB. Semoga sukses di langkah berikutnya.
        </p>
      </Card>
    );
  }

  // Lulus
  return (
    <div className="max-w-2xl space-y-4">
      <Card className="p-10 text-center overflow-hidden relative shadow-elegant">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <Trophy className="h-14 w-14 mx-auto text-emerald-500" />
        <Badge className="mt-3 bg-emerald-500 text-white border-0">Selamat, Anda Lulus!</Badge>
        <h3 className="mt-3 text-2xl font-bold">{siswa.nama_lengkap}</h3>
        <p className="text-sm text-muted-foreground">No. Peserta {siswa.nomor_peserta} · {siswa.jenjang}</p>
        <p className="mt-4 text-sm">
          Anda dinyatakan <strong className="text-emerald-600">LULUS</strong> seleksi SPMB
          {siswa.tahun_ajaran_kode ? ` Tahun Ajaran ${siswa.tahun_ajaran_kode}` : ""}.
          Silakan lanjutkan ke tahap <strong>Daftar Ulang</strong>.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Diumumkan: {formatDateTime(siswa.updated_at)}
        </p>

        <div className="flex flex-wrap gap-2 justify-center mt-6 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Cetak Surat Kelulusan
          </Button>
          <Button asChild className="bg-gradient-primary">
            <Link to="/siswa/daftar-ulang">Lanjut Daftar Ulang <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
