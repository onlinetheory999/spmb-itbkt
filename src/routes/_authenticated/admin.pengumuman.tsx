import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/pengumuman")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ judul: "", isi: "", penting: false });
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["pengumuman"],
    queryFn: async () => {
      const { data } = await supabase.from("pengumuman").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function add() {
    if (!form.judul || !form.isi) return toast.error("Lengkapi judul dan isi");
    setSaving(true);
    const { error } = await supabase.from("pengumuman").insert(form);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pengumuman ditambahkan");
    setForm({ judul: "", isi: "", penting: false });
    qc.invalidateQueries({ queryKey: ["pengumuman"] });
  }

  async function remove(id: string) {
    if (!confirm("Hapus pengumuman?")) return;
    const { error } = await supabase.from("pengumuman").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    qc.invalidateQueries({ queryKey: ["pengumuman"] });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Pengumuman</h2>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Tambah Pengumuman</h3>
        <div><Label>Judul</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
        <div><Label>Isi</Label><Textarea rows={3} value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} /></div>
        <div className="flex items-center gap-2">
          <Switch checked={form.penting} onCheckedChange={(v) => setForm({ ...form, penting: v })} />
          <Label>Tandai sebagai penting</Label>
        </div>
        <Button onClick={add} disabled={saving} className="bg-gradient-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Tambah</>}
        </Button>
      </Card>

      <div className="space-y-3">
        {(data ?? []).map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">{p.judul}</h4>
                  {p.penting && <Badge className="bg-destructive/15 text-destructive border-0">Penting</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{p.isi}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDateTime(p.created_at)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => remove(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
        {(!data || data.length === 0) && (
          <Card className="p-10 text-center text-muted-foreground">Belum ada pengumuman.</Card>
        )}
      </div>
    </div>
  );
}
