import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Save, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  nama_lengkap: z.string().trim().min(3).max(150),
  nik: z.string().trim().length(16, "NIK harus 16 digit"),
  nisn: z.string().trim().max(20).optional().nullable(),
  agama: z.string().max(30).optional().nullable(),
  tempat_lahir: z.string().min(2).max(100),
  tanggal_lahir: z.string().min(1, "Wajib diisi"),
  no_hp: z.string().max(20).optional().nullable(),
  anak_ke: z.coerce.number().int().min(1).optional().nullable(),
  jumlah_saudara: z.coerce.number().int().min(0).optional().nullable(),
  alamat: z.string().min(5).max(500),
  kelurahan: z.string().max(100).optional().nullable(),
  kecamatan: z.string().max(100).optional().nullable(),
  kabupaten: z.string().max(100).optional().nullable(),
  provinsi: z.string().max(100).optional().nullable(),
  asal_sekolah: z.string().max(150).optional().nullable(),
  tahun_lulus: z.string().max(4).optional().nullable(),
  // Orang tua
  nama_ayah: z.string().min(2).max(150),
  nik_ayah: z.string().max(20).optional().nullable(),
  pekerjaan_ayah: z.string().max(100).optional().nullable(),
  nama_ibu: z.string().min(2).max(150),
  nik_ibu: z.string().max(20).optional().nullable(),
  pekerjaan_ibu: z.string().max(100).optional().nullable(),
  no_hp_ortu: z.string().max(20).optional().nullable(),
  email_ortu: z.string().email().or(z.literal("")).optional().nullable(),
});

type FormState = z.infer<typeof schema>;

const emptyForm: FormState = {
  nama_lengkap: "", nik: "", nisn: "", agama: "",
  tempat_lahir: "", tanggal_lahir: "",
  no_hp: "", anak_ke: null, jumlah_saudara: null,
  alamat: "", kelurahan: "", kecamatan: "", kabupaten: "", provinsi: "",
  asal_sekolah: "", tahun_lulus: "",
  nama_ayah: "", nik_ayah: "", pekerjaan_ayah: "",
  nama_ibu: "", nik_ibu: "", pekerjaan_ibu: "",
  no_hp_ortu: "", email_ortu: "",
};

export default function Biodata() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!siswa) return;
    setForm({
      nama_lengkap: siswa.nama_lengkap ?? "",
      nik: (siswa as any).nik ?? "",
      nisn: (siswa as any).nisn ?? "",
      agama: (siswa as any).agama ?? "",
      tempat_lahir: siswa.tempat_lahir ?? "",
      tanggal_lahir: siswa.tanggal_lahir ?? "",
      no_hp: siswa.no_hp ?? "",
      anak_ke: (siswa as any).anak_ke ?? null,
      jumlah_saudara: (siswa as any).jumlah_saudara ?? null,
      alamat: siswa.alamat ?? "",
      kelurahan: (siswa as any).kelurahan ?? "",
      kecamatan: (siswa as any).kecamatan ?? "",
      kabupaten: siswa.kabupaten ?? "",
      provinsi: siswa.provinsi ?? "",
      asal_sekolah: siswa.asal_sekolah ?? "",
      tahun_lulus: siswa.tahun_lulus ?? "",
      nama_ayah: (siswa as any).nama_ayah ?? "",
      nik_ayah: (siswa as any).nik_ayah ?? "",
      pekerjaan_ayah: (siswa as any).pekerjaan_ayah ?? "",
      nama_ibu: (siswa as any).nama_ibu ?? "",
      nik_ibu: (siswa as any).nik_ibu ?? "",
      pekerjaan_ibu: (siswa as any).pekerjaan_ibu ?? "",
      no_hp_ortu: (siswa as any).no_hp_ortu ?? "",
      email_ortu: (siswa as any).email_ortu ?? "",
    });
  }, [siswa]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!siswa) return toast.error("Akun siswa belum dibuat.");

    setLoading(true);
    try {
      const { error } = await supabase
        .from("siswa")
        .update(parsed.data as any)
        .eq("id", siswa.id);
      if (error) throw error;
      toast.success("Biodata tersimpan");
      qc.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Biodata Siswa</h2>
        <p className="text-sm text-muted-foreground">
          Lengkapi seluruh data dengan benar. Data wajib bertanda <span className="text-destructive">*</span>.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="p-6 space-y-7">
          <Info>
            <strong>Jenjang:</strong> {siswa?.jenjang} ·{" "}
            <strong>Jenis Kelamin:</strong> {(siswa as any)?.jenis_kelamin === "P" ? "Perempuan" : "Laki-laki"}
            <span className="text-muted-foreground"> (diset saat registrasi)</span>
          </Info>

          <Section title="Data Pribadi">
            <Field label="Nama Lengkap *">
              <Input required value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} />
            </Field>
            <Field label="NIK (16 digit) *">
              <Input required inputMode="numeric" maxLength={16} value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="NISN">
              <Input value={form.nisn ?? ""}
                onChange={(e) => setForm({ ...form, nisn: e.target.value })} />
            </Field>
            <Field label="Agama">
              <Input value={form.agama ?? ""} placeholder="Islam / Kristen / dst."
                onChange={(e) => setForm({ ...form, agama: e.target.value })} />
            </Field>
            <Field label="Tempat Lahir *">
              <Input required value={form.tempat_lahir}
                onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} />
            </Field>
            <Field label="Tanggal Lahir *">
              <Input type="date" required value={form.tanggal_lahir}
                onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
            </Field>
            <Field label="No. HP / WhatsApp">
              <Input value={form.no_hp ?? ""}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
            </Field>
            <Field label="Anak Ke">
              <Input type="number" min={1} value={form.anak_ke ?? ""}
                onChange={(e) => setForm({ ...form, anak_ke: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Jumlah Saudara">
              <Input type="number" min={0} value={form.jumlah_saudara ?? ""}
                onChange={(e) => setForm({ ...form, jumlah_saudara: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </Section>

          <Section title="Alamat">
            <Field label="Alamat Lengkap *" full>
              <Textarea required rows={3} value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
            </Field>
            <Field label="Kelurahan / Desa">
              <Input value={form.kelurahan ?? ""}
                onChange={(e) => setForm({ ...form, kelurahan: e.target.value })} />
            </Field>
            <Field label="Kecamatan">
              <Input value={form.kecamatan ?? ""}
                onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} />
            </Field>
            <Field label="Kabupaten / Kota">
              <Input value={form.kabupaten ?? ""}
                onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} />
            </Field>
            <Field label="Provinsi">
              <Input value={form.provinsi ?? ""}
                onChange={(e) => setForm({ ...form, provinsi: e.target.value })} />
            </Field>
          </Section>

          <Section title="Asal Sekolah">
            <Field label="Nama Sekolah Asal">
              <Input value={form.asal_sekolah ?? ""}
                onChange={(e) => setForm({ ...form, asal_sekolah: e.target.value })} />
            </Field>
            <Field label="Tahun Lulus">
              <Input value={form.tahun_lulus ?? ""} maxLength={4}
                onChange={(e) => setForm({ ...form, tahun_lulus: e.target.value })} />
            </Field>
          </Section>

          <Section title="Data Orang Tua / Wali">
            <Field label="Nama Ayah *">
              <Input required value={form.nama_ayah}
                onChange={(e) => setForm({ ...form, nama_ayah: e.target.value })} />
            </Field>
            <Field label="NIK Ayah">
              <Input maxLength={16} value={form.nik_ayah ?? ""}
                onChange={(e) => setForm({ ...form, nik_ayah: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Pekerjaan Ayah">
              <Input value={form.pekerjaan_ayah ?? ""}
                onChange={(e) => setForm({ ...form, pekerjaan_ayah: e.target.value })} />
            </Field>
            <Field label="Nama Ibu *">
              <Input required value={form.nama_ibu}
                onChange={(e) => setForm({ ...form, nama_ibu: e.target.value })} />
            </Field>
            <Field label="NIK Ibu">
              <Input maxLength={16} value={form.nik_ibu ?? ""}
                onChange={(e) => setForm({ ...form, nik_ibu: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Pekerjaan Ibu">
              <Input value={form.pekerjaan_ibu ?? ""}
                onChange={(e) => setForm({ ...form, pekerjaan_ibu: e.target.value })} />
            </Field>
            <Field label="No. HP Orang Tua">
              <Input value={form.no_hp_ortu ?? ""}
                onChange={(e) => setForm({ ...form, no_hp_ortu: e.target.value })} />
            </Field>
            <Field label="Email Orang Tua">
              <Input type="email" value={form.email_ortu ?? ""}
                onChange={(e) => setForm({ ...form, email_ortu: e.target.value })} />
            </Field>
          </Section>

          <div className="flex justify-end pt-2 border-t">
            <Button type="submit" disabled={loading} className="bg-gradient-primary shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan Biodata</>}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">{children}</div>
  );
}
