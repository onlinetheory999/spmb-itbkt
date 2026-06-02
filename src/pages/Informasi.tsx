import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDate } from "@/lib/format";

export default function Informasi() {
  const { data: jenjang } = useQuery({
    queryKey: ["jenjang-public"],
    queryFn: async () => {
      const { data } = await supabase.from("jenjang").select("*").order("kode");
      return data ?? [];
    },
  });

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <Badge className="bg-primary/10 text-primary border-0">Informasi Lengkap</Badge>
        <h1 className="text-3xl md:text-4xl font-bold mt-3">Pendaftaran SPMB 2026-2027</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          PKBM Ibnu Taimiyah membuka pendaftaran murid baru untuk jenjang SD, SMP, dan SMA.
          Proses pendaftaran cepat, modern, dan dapat dilakukan secara online.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {(jenjang ?? []).map((j: any) => (
            <Card key={j.id} className="p-6 hover:shadow-elegant transition-all">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-xl font-bold">{j.nama}</h3>
              <p className="text-2xl font-bold text-primary mt-1">{formatIDR(j.biaya)}</p>
              <p className="text-sm text-muted-foreground">Biaya pendaftaran</p>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Kuota Laki-laki" value={`${j.kuota_l ?? 0} siswa`} />
                <Row label="Kuota Perempuan" value={`${j.kuota_p ?? 0} siswa`} />
                <Row label="Seleksi" value={j.jadwal_seleksi ? formatDate(j.jadwal_seleksi) : "TBA"} />
                <Row label="Status" value={<Badge className="bg-primary/15 text-primary border-0 text-xs">{j.status}</Badge>} />
              </div>
              {j.deskripsi && <p className="text-sm text-muted-foreground mt-4">{j.deskripsi}</p>}
            </Card>
          ))}
        </div>

        <Card className="p-8 mt-8 bg-gradient-primary text-primary-foreground">
          <h3 className="text-2xl font-bold">Alur Pendaftaran</h3>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Daftar Akun", "Isi Biodata", "Bayar via VA", "Upload Berkas"].map((s, i) => (
              <div key={s} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs opacity-80">LANGKAH {i + 1}</p>
                  <p className="font-semibold">{s}</p>
                </div>
              </div>
            ))}
          </div>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/register">Mulai Pendaftaran <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      </section>
    </PublicLayout>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
