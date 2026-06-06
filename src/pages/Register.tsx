import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Loader2, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_PASSWORD = "STQ1tbkt";

const schema = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  email: z.string().trim().email("Email orang tua tidak valid").max(255),
  jenjang: z.enum(["TK", "SD", "SMP"]),
  jenis_kelamin: z.enum(["L", "P"]),
  tempat_lahir: z.string().trim().min(2, "Tempat lahir wajib diisi").max(100),
  tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  no_hp_ortu: z.string().trim().min(9, "Nomor HP minimal 9 digit").max(20),
  provinsi: z.string().trim().min(2, "Provinsi wajib diisi").max(100),
  kabupaten: z.string().trim().min(2, "Kabupaten/Kota wajib diisi").max(100),
  alamat: z.string().trim().min(5, "Alamat wajib diisi").max(500),
  asal_sekolah: z.string().trim().max(150).optional().or(z.literal("")),
  tahun_lulus: z.string().trim().max(4).optional().or(z.literal("")),
  jenis_sekolah_asal: z.string().trim().max(50).optional().or(z.literal("")),
  nama_ayah: z.string().trim().min(2, "Nama ayah wajib diisi").max(100),
  nama_ibu: z.string().trim().min(2, "Nama ibu wajib diisi").max(100),
});

type FormState = z.infer<typeof schema>;

const initial: FormState = {
  nama: "", email: "", jenjang: "SD", jenis_kelamin: "L",
  tempat_lahir: "", tanggal_lahir: "", no_hp_ortu: "",
  provinsi: "", kabupaten: "", alamat: "",
  asal_sekolah: "", tahun_lulus: "", jenis_sekolah_asal: "",
  nama_ayah: "", nama_ibu: "",
};

export default function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initial);

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { data: kuota } = useQuery({
    queryKey: ["kuota-register", form.jenjang, form.jenis_kelamin],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cek_kuota", {
        _jenjang: form.jenjang, _jk: form.jenis_kelamin,
      });
      if (error) return null;
      return data as { ok: boolean; kuota: number; terisi: number; sisa: number } | null;
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const { data: ck } = await supabase.rpc("cek_kuota", {
      _jenjang: parsed.data.jenjang, _jk: parsed.data.jenis_kelamin,
    });
    if (ck && !(ck as any).ok) {
      const label = parsed.data.jenis_kelamin === "L" ? "laki-laki" : "perempuan";
      toast.error(`Maaf, kuota untuk siswa ${label} jenjang ${parsed.data.jenjang} sudah penuh.`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: DEFAULT_PASSWORD,
      options: {
        emailRedirectTo: `${window.location.origin}/siswa`,
        data: {
          nama: parsed.data.nama,
          jenjang: parsed.data.jenjang,
          jenis_kelamin: parsed.data.jenis_kelamin,
          tempat_lahir: parsed.data.tempat_lahir,
          tanggal_lahir: parsed.data.tanggal_lahir,
          no_hp: parsed.data.no_hp_ortu,
          no_hp_ortu: parsed.data.no_hp_ortu,
          email_ortu: parsed.data.email,
          provinsi: parsed.data.provinsi,
          kabupaten: parsed.data.kabupaten,
          alamat: parsed.data.alamat,
          asal_sekolah: parsed.data.asal_sekolah ?? "",
          tahun_lulus: parsed.data.tahun_lulus ?? "",
          jenis_sekolah_asal: parsed.data.jenis_sekolah_asal ?? "",
          nama_ayah: parsed.data.nama_ayah,
          nama_ibu: parsed.data.nama_ibu,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Fire-and-forget email konfirmasi (akan diaktifkan saat domain email siap)
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "registrasi-konfirmasi",
          recipientEmail: parsed.data.email,
          idempotencyKey: `reg-${parsed.data.email}-${Date.now()}`,
          templateData: {
            nama: parsed.data.nama,
            email: parsed.data.email,
            password: DEFAULT_PASSWORD,
            jenjang: parsed.data.jenjang,
            loginUrl: `${window.location.origin}/login`,
          },
        },
      });
    } catch {/* email opsional */}
    toast.success("Pendaftaran berhasil! Silakan cek email Anda untuk informasi login.");
    nav("/login");
  }

  const sisaText = kuota
    ? kuota.ok
      ? `Sisa kuota: ${kuota.sisa} / ${kuota.kuota}`
      : `Kuota penuh (${kuota.terisi}/${kuota.kuota})`
    : "Mengecek kuota...";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-start justify-center p-6 sm:p-12 order-2 lg:order-1 overflow-y-auto">
        <Card className="w-full max-w-2xl p-8 shadow-elegant my-6">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold">SPMB PKBM Ibnu Taimiyah</span>
          </div>
          <h1 className="text-2xl font-bold">Pendaftaran Peserta Baru</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lengkapi data berikut. Akun dan invoice pendaftaran akan otomatis dibuat.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              Password awal akun Anda adalah <span className="font-mono font-semibold">{DEFAULT_PASSWORD}</span>.
              Silakan ganti password setelah login pertama.
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <section>
              <h2 className="text-sm font-semibold mb-3">Data Calon Peserta Didik</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Nama Lengkap (sesuai akta)</Label>
                  <Input required maxLength={100} value={form.nama}
                    onChange={(e) => upd("nama", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Jenjang</Label>
                  <Select value={form.jenjang} onValueChange={(v) => upd("jenjang", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TK">TK</SelectItem>
                      <SelectItem value="SD">SD</SelectItem>
                      <SelectItem value="SMP">SMP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Jenis Kelamin</Label>
                  <RadioGroup value={form.jenis_kelamin}
                    onValueChange={(v) => upd("jenis_kelamin", v as any)}
                    className="flex gap-4 h-10 items-center">
                    <label className="flex items-center gap-1.5 text-sm">
                      <RadioGroupItem value="L" /> Laki-laki
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <RadioGroupItem value="P" /> Perempuan
                    </label>
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label>Tempat Lahir</Label>
                  <Input required maxLength={100} value={form.tempat_lahir}
                    onChange={(e) => upd("tempat_lahir", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tanggal Lahir</Label>
                  <Input type="date" required value={form.tanggal_lahir}
                    onChange={(e) => upd("tanggal_lahir", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold mb-3">Asal Sekolah</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Jenis Sekolah Asal</Label>
                  <Select value={form.jenis_sekolah_asal || ""}
                    onValueChange={(v) => upd("jenis_sekolah_asal", v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negeri">Negeri</SelectItem>
                      <SelectItem value="Swasta">Swasta</SelectItem>
                      <SelectItem value="Pesantren">Pesantren</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tahun Lulus</Label>
                  <Input inputMode="numeric" maxLength={4} placeholder="2025"
                    value={form.tahun_lulus || ""}
                    onChange={(e) => upd("tahun_lulus", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Nama Sekolah Asal</Label>
                  <Input maxLength={150} value={form.asal_sekolah || ""}
                    onChange={(e) => upd("asal_sekolah", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold mb-3">Data Orang Tua / Wali</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nama Ayah</Label>
                  <Input required maxLength={100} value={form.nama_ayah}
                    onChange={(e) => upd("nama_ayah", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nama Ibu</Label>
                  <Input required maxLength={100} value={form.nama_ibu}
                    onChange={(e) => upd("nama_ibu", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>No. HP Orang Tua (WhatsApp)</Label>
                  <Input required inputMode="tel" maxLength={20} placeholder="0812xxxx"
                    value={form.no_hp_ortu}
                    onChange={(e) => upd("no_hp_ortu", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Orang Tua (untuk login)</Label>
                  <Input type="email" required maxLength={255} placeholder="orangtua@email.com"
                    value={form.email}
                    onChange={(e) => upd("email", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold mb-3">Alamat Domisili</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Provinsi</Label>
                  <Input required maxLength={100} value={form.provinsi}
                    onChange={(e) => upd("provinsi", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kabupaten / Kota</Label>
                  <Input required maxLength={100} value={form.kabupaten}
                    onChange={(e) => upd("kabupaten", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Alamat Lengkap</Label>
                  <Textarea required maxLength={500} rows={2} value={form.alamat}
                    onChange={(e) => upd("alamat", e.target.value)} />
                </div>
              </div>
            </section>

            <div className={`text-xs rounded-lg px-3 py-2 border ${
              kuota && !kuota.ok ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-primary/5 text-primary border-primary/20"
            }`}>
              {sisaText}
            </div>

            <Button type="submit" disabled={loading || (kuota && !kuota.ok) || false}
              className="w-full bg-gradient-primary shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                <><UserPlus className="mr-2 h-4 w-4" /> Daftar & Buat Invoice</>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Login di sini</Link>
          </p>
        </Card>
      </div>

      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-primary text-primary-foreground relative overflow-hidden order-1 lg:order-2 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 z-10 ml-auto">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-bold">SPMB PKBM Ibnu Taimiyah</span>
        </Link>
        <div className="z-10">
          <h2 className="text-4xl font-bold leading-tight">Mulai pendaftaran<br/>dalam 1 langkah.</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md">
            Setelah pendaftaran, Anda akan langsung menerima invoice biaya pendaftaran.
            Lanjutkan ke pembayaran, lengkapi biodata, unggah berkas, lalu cetak kartu peserta.
          </p>
          <ol className="mt-6 space-y-2 text-sm text-primary-foreground/90">
            <li>1. Daftar akun</li>
            <li>2. Bayar pendaftaran</li>
            <li>3. Lengkapi biodata & berkas</li>
            <li>4. Verifikasi & cetak kartu</li>
          </ol>
        </div>
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>
    </div>
  );
}
