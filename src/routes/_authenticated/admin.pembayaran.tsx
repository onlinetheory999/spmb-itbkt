import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/pembayaran")({
  component: AdminPembayaran,
});

function AdminPembayaran() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pembayaran"],
    queryFn: async () => {
      const { data } = await supabase.from("pembayaran")
        .select("*, siswa:siswa_id(nama_lengkap, nomor_peserta, jenjang)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function setStatus(id: string, status: "lunas" | "gagal") {
    const patch: any = { status };
    if (status === "lunas") patch.tanggal_bayar = new Date().toISOString();
    const { error } = await supabase.from("pembayaran").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status pembayaran diperbarui");
    qc.invalidateQueries({ queryKey: ["admin-pembayaran"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Verifikasi Pembayaran</h2>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} transaksi</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VA</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Biaya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : (data ?? []).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.nomor_va}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.siswa?.nama_lengkap ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{p.siswa?.nomor_peserta} • {p.siswa?.jenjang}</div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatIDR(p.biaya)}</TableCell>
                  <TableCell><PayBadge status={p.status} /></TableCell>
                  <TableCell className="text-xs">{p.tanggal_bayar ? formatDateTime(p.tanggal_bayar) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "lunas")} disabled={p.status === "lunas"}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "gagal")}>
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

function PayBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700",
    lunas: "bg-primary/15 text-primary",
    gagal: "bg-destructive/15 text-destructive",
  };
  return <Badge className={`${map[status] ?? ""} border-0`}>{status}</Badge>;
}
