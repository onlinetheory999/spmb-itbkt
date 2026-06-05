import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDateTime } from "@/lib/format";

export default function PembayaranAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fJenis, setFJenis] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tagihan"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tagihan")
        .select("*, siswa:siswa_id(nama_lengkap, nomor_peserta, nomor_registrasi, jenjang)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((t: any) => {
    if (fStatus !== "all" && t.status !== fStatus) return false;
    if (fJenis !== "all" && t.jenis !== fJenis) return false;
    const s = `${t.trx_id} ${t.nomor_va} ${t.siswa?.nama_lengkap ?? ""} ${t.siswa?.nomor_peserta ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  async function setLunas(id: string, nominal: number) {
    const { error } = await supabase.from("tagihan").update({ nominal_dibayar: nominal }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tagihan dilunasi");
    qc.invalidateQueries({ queryKey: ["admin-tagihan"] });
  }
  async function resetBayar(id: string) {
    if (!confirm("Reset pembayaran tagihan ini ke 0?")) return;
    const { error } = await supabase.from("tagihan").update({ nominal_dibayar: 0 }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-tagihan"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Verifikasi Tagihan</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} tagihan</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari TRX / VA / nama" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-3">
        <Select value={fJenis} onValueChange={setFJenis}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Jenis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="pendaftaran">Pendaftaran</SelectItem>
            <SelectItem value="daftar_ulang">Daftar Ulang</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
            <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
            <SelectItem value="lunas">Lunas</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TRX</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tagihan</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Tidak ada tagihan</TableCell></TableRow>
              ) : filtered.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-mono text-xs">{t.trx_id}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">VA {t.nomor_va}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{t.siswa?.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{t.siswa?.nomor_peserta ?? t.siswa?.nomor_registrasi}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t.jenis === "pendaftaran" ? "Pendaftaran" : "Daftar Ulang"}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{formatIDR(t.nominal_tagihan)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatIDR(t.nominal_dibayar)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-xs">{formatDateTime(t.tanggal_bayar ?? t.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {t.status !== "lunas" && (
                        <Button size="sm" variant="outline" title="Tandai Lunas" onClick={() => setLunas(t.id, Number(t.nominal_tagihan))}>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      {t.nominal_dibayar > 0 && (
                        <Button size="sm" variant="outline" title="Reset" onClick={() => resetBayar(t.id)}>
                          <RotateCcw className="h-4 w-4 text-amber-600" />
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    belum_bayar: "bg-destructive/15 text-destructive",
    menunggu_verifikasi: "bg-amber-500/15 text-amber-700",
    lunas: "bg-emerald-500/15 text-emerald-700",
  };
  const label: Record<string, string> = {
    belum_bayar: "Belum Bayar",
    menunggu_verifikasi: "Menunggu",
    lunas: "Lunas",
  };
  return <Badge className={`${map[status] ?? map.belum_bayar} border-0`}>{label[status] ?? status}</Badge>;
}
