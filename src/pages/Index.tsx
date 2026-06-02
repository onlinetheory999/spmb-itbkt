import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  GraduationCap, Sparkles, ShieldCheck, Clock, Users, Trophy,
  ArrowRight, CheckCircle2, FileText, CreditCard, BookOpen, ChevronRight,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDate } from "@/lib/format";

export default function Index() {
  return (
    <PublicLayout>
      <Hero />
      <Stats />
      <JenjangSection />
      <Alur />
      <PengumumanSection />
      <CTA />
    </PublicLayout>
  );
}

function Hero() {
  const { data: slides } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_slides").select("*").eq("aktif", true).order("urutan");
      return data ?? [];
    },
  });
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!slides || slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides]);
  const slide = slides?.[idx];

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="container relative mx-auto px-4 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-slide-up">
          <Badge className="bg-gold/95 text-gold-foreground hover:bg-gold border-0 shadow-gold">
            <Sparkles className="mr-1 h-3 w-3" /> Tahun Ajaran 2026-2027 Dibuka
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            {slide?.judul ?? "Wujudkan Masa Depan Cemerlang"}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/85 max-w-xl">
            {slide?.subjudul ?? "Sistem Penerimaan Murid Baru PKBM Ibnu Taimiyah — pendaftaran online cepat, modern, dan terpercaya untuk jenjang SD, SMP, dan SMA."}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold font-semibold">
              <Link to="/register">Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/30 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
              <Link to="/informasi">Lihat Informasi</Link>
            </Button>
          </div>
          {slides && slides.length > 1 && (
            <div className="flex gap-2 pt-4">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-10 bg-gold" : "w-4 bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block animate-fade-in">
          <div className="relative">
            <div className="glass-strong rounded-3xl p-6 shadow-elegant">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, label: "Terakreditasi", value: "A" },
                  { icon: Users, label: "Alumni", value: "5.000+" },
                  { icon: Trophy, label: "Prestasi", value: "120+" },
                  { icon: Clock, label: "Berdiri Sejak", value: "1998" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/10 p-4 border border-white/20">
                    <s.icon className="h-6 w-6 text-gold mb-2" />
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-primary-foreground/80">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 grid h-24 w-24 place-items-center rounded-2xl bg-gradient-gold shadow-gold animate-float">
              <GraduationCap className="h-12 w-12 text-gold-foreground" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { count: total } = await supabase.from("siswa").select("*", { count: "exact", head: true });
      const { count: aktif } = await supabase.from("siswa").select("*", { count: "exact", head: true }).eq("status_akun", "aktif");
      const { count: jenjang } = await supabase.from("jenjang").select("*", { count: "exact", head: true });
      return { total: total ?? 0, aktif: aktif ?? 0, jenjang: jenjang ?? 0 };
    },
  });
  const stats = [
    { label: "Total Pendaftar", value: data?.total ?? 0, icon: Users },
    { label: "Sudah Diverifikasi", value: data?.aktif ?? 0, icon: CheckCircle2 },
    { label: "Jenjang Tersedia", value: data?.jenjang ?? 3, icon: BookOpen },
    { label: "Tahun Ajaran", value: "26/27", icon: Sparkles },
  ];
  return (
    <section className="container mx-auto px-4 -mt-12 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass-strong p-5 border-border/60 shadow-elegant">
            <s.icon className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl md:text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function JenjangSection() {
  const { data: jenjang } = useQuery({
    queryKey: ["jenjang"],
    queryFn: async () => {
      const { data } = await supabase.from("jenjang").select("*").order("kode");
      return data ?? [];
    },
  });
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge variant="outline" className="border-primary/30 text-primary mb-3">Program Pendidikan</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Pilih Jenjang Pendidikan</h2>
        <p className="text-muted-foreground">Tiga jenjang pendidikan dengan kurikulum terpadu dan biaya yang terjangkau.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {jenjang?.map((j: any, i: number) => (
          <Card key={j.id} className="group relative overflow-hidden p-6 border-border/60 hover:shadow-elegant transition-all hover:-translate-y-1">
            <div className={`absolute top-0 left-0 right-0 h-1 ${i === 0 ? "bg-gradient-primary" : i === 1 ? "bg-gradient-gold" : "bg-gradient-to-r from-primary to-gold"}`} />
            <div className="flex items-start justify-between mb-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <GraduationCap className="h-7 w-7" />
              </div>
              <Badge className={j.status === "dibuka" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                {j.status === "dibuka" ? "Dibuka" : "Ditutup"}
              </Badge>
            </div>
            <h3 className="text-xl font-bold mb-1">{j.nama}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{j.deskripsi}</p>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between"><span className="text-muted-foreground">Biaya</span><span className="font-semibold text-primary">{formatIDR(j.biaya)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kuota L/P</span><span className="font-semibold">{j.kuota_l ?? 0} / {j.kuota_p ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Seleksi</span><span className="font-semibold">{formatDate(j.jadwal_seleksi)}</span></div>
            </div>
            <Button asChild className="w-full bg-gradient-primary group-hover:shadow-glow">
              <Link to="/register">Daftar {j.kode} <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Alur() {
  const steps = [
    { icon: FileText, title: "Daftar Akun", desc: "Buat akun dengan email aktif dan lengkapi data diri awal." },
    { icon: CreditCard, title: "Pembayaran", desc: "Bayar biaya pendaftaran melalui Virtual Account otomatis." },
    { icon: CheckCircle2, title: "Verifikasi", desc: "Akun aktif setelah pembayaran terverifikasi admin." },
    { icon: GraduationCap, title: "Seleksi", desc: "Cetak kartu peserta dan ikuti seleksi sesuai jadwal." },
  ];
  return (
    <section className="bg-secondary/40 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-primary/30 text-primary mb-3">Alur Pendaftaran</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Empat Langkah Mudah</h2>
          <p className="text-muted-foreground">Proses pendaftaran yang sederhana — selesai dalam hitungan menit.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <Card className="p-6 h-full border-border/60 hover:shadow-elegant transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-bold text-gold/40">0{i + 1}</span>
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PengumumanSection() {
  const { data: items } = useQuery({
    queryKey: ["pengumuman-home"],
    queryFn: async () => {
      const { data } = await supabase.from("pengumuman").select("*").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <Badge variant="outline" className="border-primary/30 text-primary mb-3">Terbaru</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Pengumuman</h2>
        </div>
        <Button asChild variant="ghost" className="hidden md:inline-flex">
          <Link to="/pengumuman">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {(items ?? []).map((p: any) => (
          <Card key={p.id} className="p-6 border-border/60 hover:shadow-elegant transition-all">
            {p.penting && <Badge className="bg-gold text-gold-foreground mb-3">Penting</Badge>}
            <h3 className="font-bold text-lg mb-2 line-clamp-2">{p.judul}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{p.isi}</p>
            <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
          </Card>
        ))}
        {!items?.length && (
          <Card className="md:col-span-3 p-10 text-center text-muted-foreground">Belum ada pengumuman.</Card>
        )}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto px-4 pb-20">
      <Card className="relative overflow-hidden bg-gradient-hero p-10 md:p-16 text-center text-primary-foreground border-0 shadow-elegant">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="relative space-y-5 max-w-2xl mx-auto">
          <Sparkles className="h-10 w-10 text-gold mx-auto" />
          <h2 className="text-3xl md:text-5xl font-bold">Siap Bergabung?</h2>
          <p className="text-lg text-primary-foreground/90">
            Amankan kursi Anda untuk tahun ajaran 2026-2027. Pendaftaran dibuka sekarang.
          </p>
          <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold font-semibold">
            <Link to="/register">Mulai Pendaftaran <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
