import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/jadwal")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ judul: string; tanggal: string; waktu: string; jenjang: "SD"|"SMP"|"SMA"|""; deskripsi: string }>({
    judul: "", tanggal: "", waktu: "", jenjang: "", deskripsi: "",
  });
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["jadwal"],
    queryFn: async () => {
      const { data } = await supabase.from("jadwal").select("*").order("tanggal");
      return data ?? [];
    },
  });

  async function add() {
    if (!form.judul || !form.tanggal) return toast.error("Lengkapi judul dan tanggal");
    setSaving(true);
    const { error } = await supabase.from("jadwal").insert({
      ...form, jenjang: form.jenjang || null,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Jadwal ditambahkan");
    setForm({ judul: "", tanggal: "", waktu: "", jenjang: "", deskripsi: "" });
    qc.invalidateQueries({ queryKey: ["jadwal"] });
  }

  async function remove(id: string) {
    if (!confirm("Hapus jadwal?")) return;
    const { error } = await supabase.from("jadwal").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["jadwal"] });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Jadwal SPMB</h2>

      <Card className="p-5 grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label>Judul</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
        <div><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></div>
        <div><Label>Waktu</Label><Input placeholder="08.00 - 12.00" value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} /></div>
        <div>
          <Label>Jenjang (opsional)</Label>
          <Select value={form.jenjang} onValueChange={(v) => setForm({ ...form, jenjang: v as any })}>
            <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SD">SD</SelectItem>
              <SelectItem value="SMP">SMP</SelectItem>
              <SelectItem value="SMA">SMA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2"><Label>Deskripsi</Label><Textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
        <div className="sm:col-span-2">
          <Button onClick={add} disabled={saving} className="bg-gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Tambah Jadwal</>}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {(data ?? []).map((j) => (
          <Card key={j.id} className="p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{j.judul}</h4>
                {j.jenjang && <Badge variant="outline">{j.jenjang}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(j.tanggal)} {j.waktu ? `• ${j.waktu}` : ""}</p>
              {j.deskripsi && <p className="text-sm mt-1">{j.deskripsi}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(j.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </Card>
        ))}
        {(!data || data.length === 0) && (
          <Card className="p-10 text-center text-muted-foreground">Belum ada jadwal.</Card>
        )}
      </div>
    </div>
  );
}
