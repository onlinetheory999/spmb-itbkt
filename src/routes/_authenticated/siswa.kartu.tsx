import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { GraduationCap, Printer, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/siswa/kartu")({
  component: KartuPage,
});

function KartuPage() {
  const { user } = useAuth();

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  if (!siswa) {
    return (
      <Card className="p-10 text-center max-w-xl">
        <p className="text-muted-foreground">Lengkapi biodata terlebih dahulu untuk menerbitkan kartu peserta.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kartu Peserta</h2>
          <p className="text-sm text-muted-foreground">Cetak kartu untuk dibawa saat seleksi.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" /> Cetak
        </Button>
      </div>

      <Card className="overflow-hidden shadow-elegant">
        <div className="bg-gradient-primary p-5 text-primary-foreground flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs opacity-80">KARTU PESERTA SPMB 2026-2027</p>
            <p className="font-bold">PKBM IBNU TAIMIYAH</p>
          </div>
        </div>
        <div className="p-6 grid sm:grid-cols-[1fr_auto] gap-6">
          <div className="space-y-3 text-sm">
            <Row label="No. Peserta" value={<span className="font-mono font-bold text-base">{siswa.nomor_peserta}</span>} />
            <Row label="Nama Lengkap" value={<span className="font-semibold">{siswa.nama_lengkap}</span>} />
            <Row label="Jenjang" value={siswa.jenjang} />
            <Row label="Tempat, Tgl Lahir" value={`${siswa.tempat_lahir || "-"}, ${siswa.tanggal_lahir ? formatDate(siswa.tanggal_lahir) : "-"}`} />
            <Row label="Asal Sekolah" value={siswa.asal_sekolah || "-"} />
            <Row label="No. HP" value={siswa.no_hp || "-"} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white rounded-lg border">
              <QRCodeSVG value={siswa.nomor_peserta ?? siswa.id} size={120} />
            </div>
            <p className="text-[10px] text-muted-foreground">Scan untuk verifikasi</p>
          </div>
        </div>
        <div className="bg-muted/50 p-4 text-xs text-center text-muted-foreground border-t">
          Kartu ini sah tanpa tanda tangan basah. Tunjukkan saat hari seleksi.
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
