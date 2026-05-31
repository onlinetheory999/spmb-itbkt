import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/siswa")({
  component: AdminSiswa,
});

function AdminSiswa() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-siswa"],
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((s) =>
    [s.nama_lengkap, s.nomor_peserta, s.email].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  async function setStatus(id: string, status: "diverifikasi" | "ditolak") {
    const { error } = await supabase.from("siswa").update({ status_verifikasi: status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status diperbarui");
    qc.invalidateQueries({ queryKey: ["admin-siswa"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Tidak ada data</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.nomor_peserta}</TableCell>
                  <TableCell>
                    <div className="font-medium">{s.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.jenjang}</Badge></TableCell>
                  <TableCell><StatusBadge status={s.status_verifikasi} /></TableCell>
                  <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "diverifikasi")}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "ditolak")}>
                        <XCircle className="h-4 w-4 text-destructive" />
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    belum: "bg-muted text-muted-foreground",
    diverifikasi: "bg-primary/15 text-primary",
    ditolak: "bg-destructive/15 text-destructive",
  };
  return <Badge className={`${map[status] ?? map.belum} border-0`}>{status}</Badge>;
}
