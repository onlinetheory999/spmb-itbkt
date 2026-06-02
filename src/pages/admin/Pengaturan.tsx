import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function Pengaturan() {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  if (!form) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("settings").update(form).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pengaturan tersimpan");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold">Pengaturan Sekolah</h2>
      <Card className="p-6 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label>Nama Sekolah</Label><Input value={form.nama_sekolah ?? ""} onChange={(e) => setForm({ ...form, nama_sekolah: e.target.value })} /></div>
        <div><Label>Tahun Ajaran</Label><Input value={form.tahun_ajaran ?? ""} onChange={(e) => setForm({ ...form, tahun_ajaran: e.target.value })} /></div>
        <div><Label>Kode Sekolah (VA prefix)</Label><Input value={form.kode_sekolah ?? ""} onChange={(e) => setForm({ ...form, kode_sekolah: e.target.value })} /></div>
        <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>No. Telp</Label><Input value={form.no_telp ?? ""} onChange={(e) => setForm({ ...form, no_telp: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Alamat</Label><Textarea rows={2} value={form.alamat ?? ""} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>URL Logo</Label><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
        <div>
          <Label>Status Pendaftaran</Label>
          <Select value={form.status_pendaftaran} onValueChange={(v) => setForm({ ...form, status_pendaftaran: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dibuka">Dibuka</SelectItem>
              <SelectItem value="ditutup">Ditutup</SelectItem>
              <SelectItem value="segera">Segera</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Button onClick={save} disabled={saving} className="bg-gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
