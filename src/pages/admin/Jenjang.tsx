import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Loader2, Trash2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR } from "@/lib/format";

export default function Jenjang() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-jenjang"],
    queryFn: async () => {
      const { data } = await supabase.from("jenjang").select("*").order("kode");
      return data ?? [];
    },
  });

  // Hitung terisi per jenjang × jenis_kelamin
  const { data: terisi } = useQuery({
    queryKey: ["jenjang-terisi"],
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("jenjang, jenis_kelamin, status_akun");
      const map: Record<string, { L: number; P: number }> = {};
      (data ?? []).forEach((s: any) => {
        if (s.status_akun === "nonaktif") return;
        const k = s.jenjang;
        if (!map[k]) map[k] = { L: 0, P: 0 };
        if (s.jenis_kelamin === "P") map[k].P++; else map[k].L++;
      });
      return map;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Jenjang & Biaya</h2>
          <p className="text-sm text-muted-foreground">Kelola kuota terpisah laki-laki & perempuan, biaya, kode VA, dan jadwal seleksi.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(data ?? []).map((j: any) => (
          <JenjangCard key={j.id} jenjang={j} terisi={terisi?.[j.kode] ?? { L: 0, P: 0 }}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["admin-jenjang"] });
              qc.invalidateQueries({ queryKey: ["jenjang-terisi"] });
            }} />
        ))}
        {(!data || data.length === 0) && (
          <Card className="p-10 text-center md:col-span-3 text-muted-foreground">Belum ada jenjang.</Card>
        )}
      </div>
    </div>
  );
}

function JenjangCard({ jenjang, terisi, onChanged }: { jenjang: any; terisi: { L: number; P: number }; onChanged: () => void }) {
  const [form, setForm] = useState({
    nama: jenjang.nama, biaya: jenjang.biaya, kuota_l: jenjang.kuota_l ?? 0, kuota_p: jenjang.kuota_p ?? 0,
    kode_va: jenjang.kode_va ?? "", jadwal_seleksi: jenjang.jadwal_seleksi ?? "",
    deskripsi: jenjang.deskripsi ?? "", status: jenjang.status,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("jenjang").update({
      ...form,
      biaya: Number(form.biaya), kuota_l: Number(form.kuota_l), kuota_p: Number(form.kuota_p),
      kuota: Number(form.kuota_l) + Number(form.kuota_p),
      jadwal_seleksi: form.jadwal_seleksi || null,
    }).eq("id", jenjang.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan");
    onChanged();
  }

  async function remove() {
    if (!confirm(`Hapus jenjang ${jenjang.kode}? Pastikan tidak ada siswa terdaftar.`)) return;
    setDeleting(true);
    const { error } = await supabase.from("jenjang").delete().eq("id", jenjang.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Jenjang dihapus");
    onChanged();
  }

  const pctL = form.kuota_l > 0 ? Math.min((terisi.L / form.kuota_l) * 100, 100) : 0;
  const pctP = form.kuota_p > 0 ? Math.min((terisi.P / form.kuota_p) * 100, 100) : 0;

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{jenjang.kode}</h3>
          <span className="text-xs text-muted-foreground">{formatIDR(form.biaya)}</span>
        </div>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dibuka">Dibuka</SelectItem>
            <SelectItem value="ditutup">Ditutup</SelectItem>
            <SelectItem value="segera">Segera</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <div className="flex justify-between mb-1">
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Laki-laki</span>
            <span className="font-mono">{terisi.L} / {form.kuota_l}</span>
          </div>
          <Progress value={pctL} />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Perempuan</span>
            <span className="font-mono">{terisi.P} / {form.kuota_p}</span>
          </div>
          <Progress value={pctP} />
        </div>
      </div>

      <div className="space-y-2"><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Biaya</Label><Input type="number" value={form.biaya} onChange={(e) => setForm({ ...form, biaya: e.target.value as any })} /></div>
        <div><Label>Kode VA</Label><Input value={form.kode_va} maxLength={5} placeholder="201" onChange={(e) => setForm({ ...form, kode_va: e.target.value })} /></div>
        <div><Label>Kuota L</Label><Input type="number" value={form.kuota_l} onChange={(e) => setForm({ ...form, kuota_l: e.target.value as any })} /></div>
        <div><Label>Kuota P</Label><Input type="number" value={form.kuota_p} onChange={(e) => setForm({ ...form, kuota_p: e.target.value as any })} /></div>
      </div>
      <div><Label>Jadwal Seleksi</Label><Input type="date" value={form.jadwal_seleksi ?? ""} onChange={(e) => setForm({ ...form, jadwal_seleksi: e.target.value })} /></div>
      <div><Label>Deskripsi</Label><Textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} size="sm" className="flex-1 bg-gradient-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
        </Button>
        <Button onClick={remove} disabled={deleting} size="sm" variant="outline">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
