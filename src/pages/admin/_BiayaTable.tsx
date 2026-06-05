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
import { formatIDR } from "@/lib/format";

const JENJANG = ["TK", "SD", "SMP", "SMA"] as const;
type TableName = "biaya_pendaftaran" | "biaya_daftar_ulang";

export default function BiayaTable({ table, title }: { table: TableName; title: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ tahun_ajaran_id: string; jenjang: typeof JENJANG[number]; nominal: number; aktif: boolean }>({
    tahun_ajaran_id: "", jenjang: "SD", nominal: 0, aktif: true,
  });
  const [saving, setSaving] = useState(false);

  const { data: tahuns } = useQuery({
    queryKey: ["tahun-ajaran-list"],
    queryFn: async () => (await supabase.from("tahun_ajaran").select("*").order("kode", { ascending: false })).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: [table],
    queryFn: async () => (await supabase.from(table).select("*, tahun_ajaran(kode,label)").order("created_at", { ascending: false })).data ?? [],
  });

  async function add() {
    if (!form.tahun_ajaran_id) return toast.error("Pilih tahun ajaran");
    if (!form.nominal || form.nominal < 1) return toast.error("Nominal harus > 0");
    setSaving(true);
    const { error } = await (supabase as any).from(table).insert({ ...form, nominal: Number(form.nominal) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Biaya ditambahkan");
    setForm({ ...form, nominal: 0 });
    qc.invalidateQueries({ queryKey: [table] });
  }

  async function toggle(id: string, aktif: boolean) {
    await (supabase as any).from(table).update({ aktif }).eq("id", id);
    qc.invalidateQueries({ queryKey: [table] });
  }

  async function remove(id: string) {
    if (!confirm("Hapus biaya ini? Tagihan lama tidak terpengaruh (nominal disnapshot).")) return;
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: [table] });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">Nominal aktif akan digunakan saat membuat tagihan baru (snapshot).</p>
      </div>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Tambah Biaya</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label>Tahun Ajaran</Label>
            <Select value={form.tahun_ajaran_id} onValueChange={(v) => setForm({ ...form, tahun_ajaran_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {(tahuns ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.label}{t.aktif ? " (aktif)" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Jenjang</Label>
            <Select value={form.jenjang} onValueChange={(v) => setForm({ ...form, jenjang: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JENJANG.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2"><Label>Nominal (Rp)</Label><Input type="number" value={form.nominal} onChange={(e) => setForm({ ...form, nominal: Number(e.target.value) })} /></div>
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
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : (data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Belum ada biaya</TableCell></TableRow>
              ) : (data ?? []).map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell><Badge variant="outline">{b.tahun_ajaran?.label}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{b.jenjang}</Badge></TableCell>
                  <TableCell className="font-mono">{formatIDR(b.nominal)}</TableCell>
                  <TableCell><Switch checked={b.aktif} onCheckedChange={(v) => toggle(b.id, v)} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => remove(b.id)}>
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
