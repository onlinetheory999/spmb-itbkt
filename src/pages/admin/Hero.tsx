import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export default function Hero() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ judul: "", subjudul: "", cta_text: "", cta_link: "", image_url: "", urutan: 0, aktif: true });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["hero"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_slides").select("*").order("urutan");
      return data ?? [];
    },
  });

  async function uploadImage(file: File): Promise<string | null> {
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Hanya file JPG, JPEG, atau PNG yang diizinkan");
      return null;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file maks 3MB");
      return null;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `hero/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("website-public").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("website-public").getPublicUrl(path);
      return pub.publicUrl;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadImage(f);
    if (url) {
      setForm({ ...form, image_url: url });
      toast.success("Gambar terupload");
    }
  }

  async function add() {
    if (!form.judul) return toast.error("Judul wajib diisi");
    setSaving(true);
    const { error } = await supabase.from("hero_slides").insert({ ...form, urutan: Number(form.urutan) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Slide ditambahkan");
    setForm({ judul: "", subjudul: "", cta_text: "", cta_link: "", image_url: "", urutan: 0, aktif: true });
    qc.invalidateQueries({ queryKey: ["hero"] });
  }

  async function toggle(id: string, aktif: boolean) {
    await supabase.from("hero_slides").update({ aktif }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["hero"] });
  }

  async function remove(id: string) {
    if (!confirm("Hapus slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["hero"] });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Hero Slides</h2>

      <Card className="p-5 grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label>Judul</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Subjudul</Label><Input value={form.subjudul} onChange={(e) => setForm({ ...form, subjudul: e.target.value })} /></div>
        <div><Label>CTA Text</Label><Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></div>
        <div><Label>CTA Link</Label><Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} /></div>

        <div className="sm:col-span-2 space-y-2">
          <Label>Gambar (JPG/PNG, maks 3MB)</Label>
          <div className="flex items-center gap-3">
            <Input type="file" accept="image/jpeg,image/jpg,image/png" onChange={onFile} disabled={uploading}
              className="cursor-pointer file:cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1 file:text-xs" />
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          {form.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border w-40 h-24 bg-muted">
              <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
          <Input placeholder="Atau tempel URL langsung" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>

        <div><Label>Urutan</Label><Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} /></div>
        <div className="flex items-end gap-2"><Switch checked={form.aktif} onCheckedChange={(v) => setForm({ ...form, aktif: v })} /><Label>Aktif</Label></div>
        <div className="sm:col-span-2">
          <Button onClick={add} disabled={saving || uploading} className="bg-gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Tambah Slide</>}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {(data ?? []).map((s: any) => (
          <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {s.image_url ? (
                <img src={s.image_url} alt="" className="w-16 h-12 rounded object-cover border shrink-0" />
              ) : (
                <div className="w-16 h-12 rounded bg-muted grid place-items-center shrink-0">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold truncate">{s.judul}</h4>
                {s.subjudul && <p className="text-sm text-muted-foreground truncate">{s.subjudul}</p>}
                <p className="text-xs text-muted-foreground">Urutan: {s.urutan}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={s.aktif} onCheckedChange={(v) => toggle(s.id, v)} />
              <Button size="sm" variant="outline" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
        {(!data || data.length === 0) && (
          <Card className="p-10 text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            Belum ada slide.
          </Card>
        )}
      </div>
    </div>
  );
}
