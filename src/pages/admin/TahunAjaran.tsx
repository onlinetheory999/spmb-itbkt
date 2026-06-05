import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export default function TahunAjaran() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ kode: "", label: "" });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tahun-ajaran"],
    queryFn: async () => {
      const { data } = await supabase.from("tahun_ajaran").select("*").order("kode", { ascending: false });
      return data ?? [];
    },
  });

  async function add() {
    if (!/^\d{4}$/.test(form.kode)) return toast.error("Kode harus 4 digit, contoh 2627");
    if (!form.label) return toast.error("Isi label, contoh 2026/2027");
    setSaving(true);
    const { error } = await supabase.from("tahun_ajaran").insert(form);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tahun ajaran ditambahkan");
    setForm({ kode: "", label: "" });
    qc.invalidateQueries({ queryKey: ["tahun-ajaran"] });
  }

  async function aktifkan(id: string) {
    await supabase.from("tahun_ajaran").update({ aktif: false }).neq("id", id);
    const { error } = await supabase.from("tahun_ajaran").update({ aktif: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tahun ajaran diaktifkan");
    qc.invalidateQueries({ queryKey: ["tahun-ajaran"] });
  }

  async function remove(id: string) {
    if (!confirm("Hapus tahun ajaran? Pastikan tidak ada tagihan/biaya yang terkait.")) return;
    const { error } = await supabase.from("tahun_ajaran").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    qc.invalidateQueries({ queryKey: ["tahun-ajaran"] });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Tahun Ajaran</h2>
        <p className="text-sm text-muted-foreground">Hanya satu tahun ajaran yang aktif pada satu waktu.</p>
      </div>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Tambah Tahun Ajaran</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><Label>Kode (4 digit)</Label><Input value={form.kode} maxLength={4} placeholder="2627" onChange={(e) => setForm({ ...form, kode: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Label</Label><Input value={form.label} placeholder="2026/2027" onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
        </div>
        <Button onClick={add} disabled={saving} className="bg-gradient-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Tambah</>}
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Belum ada tahun ajaran</TableCell></TableRow>
            ) : (data ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono">{t.kode}</TableCell>
                <TableCell>{t.label}</TableCell>
                <TableCell>
                  {t.aktif
                    ? <Badge className="bg-emerald-500/15 text-emerald-700 border-0">Aktif</Badge>
                    : <Badge variant="outline">Nonaktif</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {!t.aktif && (
                      <Button size="sm" variant="outline" onClick={() => aktifkan(t.id)} title="Aktifkan">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => remove(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
