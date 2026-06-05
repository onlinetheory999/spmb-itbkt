import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle, Eye, EyeOff, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export default function PengumumanKelulusan() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fJenjang, setFJenjang] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["kelulusan-siswa"],
    queryFn: async () => (await supabase.from("siswa").select("id, nama_lengkap, nomor_peserta, jenjang, status_verifikasi, status_kelulusan, kelulusan_published")
      .order("nomor_peserta", { ascending: true })).data ?? [],
  });

  const filtered = (data ?? []).filter((s: any) => {
    if (fJenjang !== "all" && s.jenjang !== fJenjang) return false;
    if (fStatus !== "all" && s.status_kelulusan !== fStatus) return false;
    return `${s.nama_lengkap} ${s.nomor_peserta}`.toLowerCase().includes(q.toLowerCase());
  });

  async function setKelulusan(id: string, status: "lulus" | "tidak_lulus" | "belum") {
    const { error } = await supabase.from("siswa").update({ status_kelulusan: status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Kelulusan diperbarui");
    qc.invalidateQueries({ queryKey: ["kelulusan-siswa"] });
  }

  async function togglePublish(id: string, kelulusan_published: boolean) {
    const { error } = await supabase.from("siswa").update({ kelulusan_published }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["kelulusan-siswa"] });
  }

  async function publishAll(published: boolean) {
    if (!confirm(published ? "Publish kelulusan untuk SEMUA siswa yang sudah ditentukan?" : "Sembunyikan publish kelulusan untuk semua?")) return;
    const { error } = await supabase.from("siswa").update({ kelulusan_published: published }).in("status_kelulusan", ["lulus", "tidak_lulus"]);
    if (error) return toast.error(error.message);
    toast.success(published ? "Semua hasil dipublish" : "Semua hasil disembunyikan");
    qc.invalidateQueries({ queryKey: ["kelulusan-siswa"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Pengumuman Kelulusan</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} siswa</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => publishAll(false)}>
            <EyeOff className="mr-2 h-4 w-4" /> Sembunyikan Semua
          </Button>
          <Button size="sm" className="bg-gradient-primary" onClick={() => publishAll(true)}>
            <Send className="mr-2 h-4 w-4" /> Publish Semua
          </Button>
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama / nomor peserta" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={fJenjang} onValueChange={setFJenjang}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenjang</SelectItem>
            <SelectItem value="TK">TK</SelectItem>
            <SelectItem value="SD">SD</SelectItem>
            <SelectItem value="SMP">SMP</SelectItem>
            <SelectItem value="SMA">SMA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="belum">Belum Ditentukan</SelectItem>
            <SelectItem value="lulus">Lulus</SelectItem>
            <SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Peserta</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Kelulusan</TableHead>
                <TableHead>Publish</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Tidak ada siswa</TableCell></TableRow>
              ) : filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.nomor_peserta ?? "-"}</TableCell>
                  <TableCell className="font-medium">{s.nama_lengkap}</TableCell>
                  <TableCell><Badge variant="outline">{s.jenjang}</Badge></TableCell>
                  <TableCell><KelulusanBadge status={s.status_kelulusan} /></TableCell>
                  <TableCell>
                    {s.kelulusan_published
                      ? <Badge className="bg-emerald-500/15 text-emerald-700 border-0"><Eye className="h-3 w-3 mr-1" /> Tampil</Badge>
                      : <Badge variant="outline"><EyeOff className="h-3 w-3 mr-1" /> Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <Button size="sm" variant="outline" title="Lulus" onClick={() => setKelulusan(s.id, "lulus")}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="outline" title="Tidak Lulus" onClick={() => setKelulusan(s.id, "tidak_lulus")}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => togglePublish(s.id, !s.kelulusan_published)}>
                        {s.kelulusan_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
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

function KelulusanBadge({ status }: { status: string }) {
  if (status === "lulus") return <Badge className="bg-emerald-500/15 text-emerald-700 border-0">Lulus</Badge>;
  if (status === "tidak_lulus") return <Badge className="bg-destructive/15 text-destructive border-0">Tidak Lulus</Badge>;
  return <Badge variant="outline">Belum</Badge>;
}
