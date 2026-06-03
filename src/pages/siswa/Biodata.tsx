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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { generateNomorPeserta } from "@/lib/format";

const schema = z.object({
  nama_lengkap: z.string().trim().min(3).max(150),
  email: z.string().email().max(255),
  jenjang: z.enum(["SD", "SMP", "SMA"]),
  jenis_kelamin: z.enum(["L", "P"]),
  tempat_lahir: z.string().max(100).optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  no_hp: z.string().max(20).optional().nullable(),
  alamat: z.string().max(500).optional().nullable(),
  provinsi: z.string().max(100).optional().nullable(),
  kabupaten: z.string().max(100).optional().nullable(),
  asal_sekolah: z.string().max(150).optional().nullable(),
  tahun_lulus: z.string().max(4).optional().nullable(),
});

type FormState = z.infer<typeof schema>;

const empty: FormState = {
  nama_lengkap: "", email: "", jenjang: "SD", jenis_kelamin: "L",
  tempat_lahir: "", tanggal_lahir: "", no_hp: "", alamat: "",
  provinsi: "", kabupaten: "", asal_sekolah: "", tahun_lulus: "",
};

export default function Biodata() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);
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
    if (siswa) {
      setForm({
        nama_lengkap: siswa.nama_lengkap ?? "",
        email: siswa.email ?? user?.email ?? "",
        jenjang: (siswa.jenjang as any) ?? "SD",
        jenis_kelamin: ((siswa as any).jenis_kelamin as any) ?? "L",
        tempat_lahir: siswa.tempat_lahir ?? "",
        tanggal_lahir: siswa.tanggal_lahir ?? "",
        no_hp: siswa.no_hp ?? "",
        alamat: siswa.alamat ?? "",
        provinsi: siswa.provinsi ?? "",
        kabupaten: siswa.kabupaten ?? "",
        asal_sekolah: siswa.asal_sekolah ?? "",
        tahun_lulus: siswa.tahun_lulus ?? "",
      });
    } else if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email! }));
    }
  }, [siswa, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    try {
      if (siswa) {
        const { error } = await supabase.from("siswa").update(parsed.data as any).eq("id", siswa.id);
        if (error) throw error;
      } else {
        const nomor_peserta = generateNomorPeserta(parsed.data.jenjang, "2026");
        const { data: newSiswa, error } = await supabase.from("siswa").insert({
          ...parsed.data, user_id: user!.id, nomor_peserta,
        } as any).select().single();
        if (error) {
          if (error.message.includes("kuota_penuh:L")) {
            toast.error("Maaf, kuota untuk siswa laki-laki jenjang ini sudah penuh.");
          } else if (error.message.includes("kuota_penuh:P")) {
            toast.error("Maaf, kuota untuk siswa perempuan jenjang ini sudah penuh.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Tagihan pendaftaran otomatis dibuat oleh trigger DB.

      }
      toast.success("Biodata tersimpan");
      qc.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Biodata Siswa</h2>
        <p className="text-sm text-muted-foreground">Lengkapi data pribadi dengan benar. Data ini akan diverifikasi.</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="p-6 space-y-6">
          <Section title="Data Pribadi">
            <Field label="Nama Lengkap *">
              <Input required value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} />
            </Field>
            <Field label="Email *">
              <Input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Tempat Lahir">
              <Input value={form.tempat_lahir ?? ""}
                onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} />
            </Field>
            <Field label="Tanggal Lahir">
              <Input type="date" value={form.tanggal_lahir ?? ""}
                onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
            </Field>
            <Field label="No. HP / WhatsApp">
              <Input value={form.no_hp ?? ""}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
            </Field>
            <Field label="Jenjang Pendaftaran *">
              <Select value={form.jenjang} onValueChange={(v) => setForm({ ...form, jenjang: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SD">SD</SelectItem>
                  <SelectItem value="SMP">SMP</SelectItem>
                  <SelectItem value="SMA">SMA</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jenis Kelamin *">
              <RadioGroup
                value={form.jenis_kelamin}
                onValueChange={(v) => setForm({ ...form, jenis_kelamin: v as "L" | "P" })}
                className="flex gap-4 h-9 items-center"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="L" id="b-l" /> Laki-laki
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="P" id="b-p" /> Perempuan
                </label>
              </RadioGroup>
            </Field>
          </Section>

          <Section title="Alamat">
            <Field label="Provinsi">
              <Input value={form.provinsi ?? ""}
                onChange={(e) => setForm({ ...form, provinsi: e.target.value })} />
            </Field>
            <Field label="Kabupaten/Kota">
              <Input value={form.kabupaten ?? ""}
                onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} />
            </Field>
            <Field label="Alamat Lengkap" full>
              <Textarea rows={3} value={form.alamat ?? ""}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
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
