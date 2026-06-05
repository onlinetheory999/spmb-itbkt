import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export default function Gelombang() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nama: "", tahun_ajaran_id: "", tanggal_mulai: "", tanggal_selesai: "", kuota: 0, aktif: true });
  const [saving, setSaving] = useState(false);

  const { data: tahuns } = useQuery({
    queryKey: ["tahun-ajaran-list"],
    queryFn: async () => (await supabase.from("tahun_ajaran").select("*").order("kode", { ascending: false })).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["gelombang"],
    queryFn: async () => (await supabase.from("gelombang").select("*, tahun_ajaran(kode,label)").order("tanggal_mulai", { ascending: false })).data ?? [],
  });

  async function add() {
    if (!form.nama || !form.tahun_ajaran_id || !form.tanggal_mulai || !form.tanggal_selesai)
      return toast.error("Lengkapi semua field");
    setSaving(true);
    const { error } = await supabase.from("gelombang").insert({ ...form, kuota: Number(form.kuota) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Gelombang ditambahkan");
    setForm({ nama: "", tahun_ajaran_id: form.tahun_ajaran_id, tanggal_mulai: "", tanggal_selesai: "", kuota: 0, aktif: true });
    qc.invalidateQueries({ queryKey: ["gelombang"] });
  }

  async function toggle(id: string, aktif: boolean) {
    await supabase.from("gelombang").update({ aktif }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["gelombang"] });
  }
  async function remove(id: string) {
    if (!confirm("Hapus gelombang?")) return;
    const { error } = await supabase.from("gelombang").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["gelombang"] });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Gelombang Pendaftaran</h2>
        <p className="text-sm text-muted-foreground">Atur periode & kuota gelombang per tahun ajaran.</p>
      </div>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Tambah Gelombang</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label>Tahun Ajaran</Label>
            <Select value={form.tahun_ajaran_id} onValueChange={(v) => setForm({ ...form, tahun_ajaran_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {(tahuns ?? []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}{t.aktif ? " (aktif)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nama</Label><Input placeholder="Gelombang 1" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
          <div><Label>Kuota (0 = tanpa batas)</Label><Input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: Number(e.target.value) })} /></div>
          <div><Label>Tanggal Mulai</Label><Input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} /></div>
          <div><Label>Tanggal Selesai</Label><Input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} /></div>
        </div>
        <Button onClick={add} disabled={saving} className="bg-gradient-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Tambah</>}
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : (data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Belum ada gelombang</TableCell></TableRow>
              ) : (data ?? []).map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.nama}</TableCell>
                  <TableCell><Badge variant="outline">{g.tahun_ajaran?.label}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(g.tanggal_mulai)} – {formatDate(g.tanggal_selesai)}</TableCell>
                  <TableCell>{g.kuota || "∞"}</TableCell>
                  <TableCell><Switch checked={g.aktif} onCheckedChange={(v) => toggle(g.id, v)} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => remove(g.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
