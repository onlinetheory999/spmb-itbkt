import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/hero")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ judul: "", subjudul: "", cta_text: "", cta_link: "", image_url: "", urutan: 0, aktif: true });
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["hero"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_slides").select("*").order("urutan");
      return data ?? [];
    },
  });

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
        <div className="sm:col-span-2"><Label>URL Gambar</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
        <div><Label>Urutan</Label><Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} /></div>
        <div className="flex items-end gap-2"><Switch checked={form.aktif} onCheckedChange={(v) => setForm({ ...form, aktif: v })} /><Label>Aktif</Label></div>
        <div className="sm:col-span-2">
          <Button onClick={add} disabled={saving} className="bg-gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Tambah Slide</>}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {(data ?? []).map((s) => (
          <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold">{s.judul}</h4>
              {s.subjudul && <p className="text-sm text-muted-foreground">{s.subjudul}</p>}
              <p className="text-xs text-muted-foreground mt-1">Urutan: {s.urutan}</p>
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
          <Card className="p-10 text-center text-muted-foreground">Belum ada slide.</Card>
        )}
      </div>
    </div>
  );
}
