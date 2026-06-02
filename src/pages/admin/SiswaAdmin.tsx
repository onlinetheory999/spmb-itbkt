import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, CheckCircle2, XCircle, Loader2, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime } from "@/lib/format";

export default function SiswaAdmin() {
  const { role } = useAuth();
  const isSuper = role === "super_admin";
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fJenjang, setFJenjang] = useState<string>("all");
  const [fJK, setFJK] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-siswa"],
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((s: any) => {
    if (fJenjang !== "all" && s.jenjang !== fJenjang) return false;
    if (fJK !== "all" && s.jenis_kelamin !== fJK) return false;
    if (fStatus !== "all" && s.status_verifikasi !== fStatus) return false;
    return [s.nama_lengkap, s.nomor_peserta, s.email].join(" ").toLowerCase().includes(q.toLowerCase());
  });

  async function setStatus(id: string, status: "diverifikasi" | "ditolak") {
    const { error } = await supabase.from("siswa").update({ status_verifikasi: status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status diperbarui");
    qc.invalidateQueries({ queryKey: ["admin-siswa"] });
  }

  async function toggleAkun(id: string, current: string) {
    const baru = current === "nonaktif" ? "aktif" : "nonaktif";
    const { error } = await supabase.from("siswa").update({ status_akun: baru }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(baru === "aktif" ? "Akun diaktifkan" : "Akun dinonaktifkan");
    qc.invalidateQueries({ queryKey: ["admin-siswa"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Data Siswa</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} pendaftar</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama / nomor / email"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-3">
        <Select value={fJenjang} onValueChange={setFJenjang}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Jenjang" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenjang</SelectItem>
            <SelectItem value="SD">SD</SelectItem>
            <SelectItem value="SMP">SMP</SelectItem>
            <SelectItem value="SMA">SMA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fJK} onValueChange={setFJK}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Jenis Kelamin" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="L">Laki-laki</SelectItem>
            <SelectItem value="P">Perempuan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="belum">Belum</SelectItem>
            <SelectItem value="diverifikasi">Diverifikasi</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Tidak ada data</TableCell></TableRow>
              ) : filtered.map((s: any) => (
                <TableRow key={s.id} className={s.status_akun === "nonaktif" ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs">{s.nomor_peserta}</TableCell>
                  <TableCell>
                    <div className="font-medium">{s.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.jenis_kelamin === "P" ? "P" : "L"}</Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.jenjang}</Badge></TableCell>
                  <TableCell><StatusBadge status={s.status_verifikasi} /></TableCell>
                  <TableCell>
                    <Badge className={s.status_akun === "nonaktif" ? "bg-destructive/15 text-destructive border-0" : "bg-emerald-500/15 text-emerald-700 border-0"}>
                      {s.status_akun}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" title="Verifikasi"
                        onClick={() => setStatus(s.id, "diverifikasi")}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="outline" title="Tolak"
                        onClick={() => setStatus(s.id, "ditolak")}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                      {isSuper && (
                        <Button size="sm" variant="outline"
                          title={s.status_akun === "nonaktif" ? "Aktifkan" : "Nonaktifkan"}
                          onClick={() => toggleAkun(s.id, s.status_akun)}>
                          {s.status_akun === "nonaktif"
                            ? <Power className="h-4 w-4 text-emerald-600" />
                            : <PowerOff className="h-4 w-4 text-amber-600" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      {isSuper && (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Trash2 className="h-3 w-3" /> Super admin dapat menonaktifkan akun siswa (soft delete). Data tidak terhapus, hanya disembunyikan dari kuota & pendaftaran aktif.
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    belum: "bg-muted text-muted-foreground",
    diverifikasi: "bg-primary/15 text-primary",
    ditolak: "bg-destructive/15 text-destructive",
  };
  return <Badge className={`${map[status] ?? map.belum} border-0`}>{status}</Badge>;
}
