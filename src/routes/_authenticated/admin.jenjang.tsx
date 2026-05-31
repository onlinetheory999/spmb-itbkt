import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/jenjang")({
  component: AdminJenjang,
});

function AdminJenjang() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-jenjang"],
    queryFn: async () => {
      const { data } = await supabase.from("jenjang").select("*").order("kode");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Jenjang & Biaya</h2>
        <p className="text-sm text-muted-foreground">Atur kuota, biaya, dan jadwal seleksi per jenjang.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {(data ?? []).map((j) => (
          <JenjangCard key={j.id} jenjang={j} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-jenjang"] })} />
        ))}
        {(!data || data.length === 0) && (
          <Card className="p-10 text-center md:col-span-3 text-muted-foreground">
            Belum ada jenjang. Tambahkan melalui admin database.
          </Card>
        )}
      </div>
    </div>
  );
}

function JenjangCard({ jenjang, onSaved }: { jenjang: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    nama: jenjang.nama, biaya: jenjang.biaya, kuota: jenjang.kuota,
    jadwal_seleksi: jenjang.jadwal_seleksi ?? "", deskripsi: jenjang.deskripsi ?? "",
    status: jenjang.status,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("jenjang").update({
      ...form, biaya: Number(form.biaya), kuota: Number(form.kuota),
      jadwal_seleksi: form.jadwal_seleksi || null,
    }).eq("id", jenjang.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan");
    onSaved();
  }

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{jenjang.kode}</h3>
        <span className="text-xs text-muted-foreground">{formatIDR(jenjang.biaya)}</span>
      </div>
      <div className="space-y-2"><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Biaya</Label><Input type="number" value={form.biaya} onChange={(e) => setForm({ ...form, biaya: e.target.value as any })} /></div>
        <div><Label>Kuota</Label><Input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: e.target.value as any })} /></div>
      </div>
      <div><Label>Jadwal Seleksi</Label><Input type="date" value={form.jadwal_seleksi} onChange={(e) => setForm({ ...form, jadwal_seleksi: e.target.value })} /></div>
      <div><Label>Deskripsi</Label><Textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
      <Button onClick={save} disabled={saving} size="sm" className="w-full bg-gradient-primary">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
      </Button>
    </Card>
  );
}
