import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

const DOCS = [
  { key: "pas_foto", label: "Pas Foto" },
  { key: "akta", label: "Akta Lahir" },
  { key: "kk", label: "Kartu Keluarga" },
  { key: "skl", label: "SKL / Ijazah" },
  { key: "ktp_ortu", label: "KTP Orang Tua" },
] as const;

export default function VerifikasiBerkas() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-berkas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("upload_berkas")
        .select("*, siswa:siswa_id(id, nama_lengkap, nomor_peserta, nomor_registrasi, jenjang, status_verifikasi)")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((b: any) => {
    const s = `${b.siswa?.nama_lengkap ?? ""} ${b.siswa?.nomor_peserta ?? ""} ${b.siswa?.nomor_registrasi ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const current = filtered.find((b: any) => b.id === openId);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Verifikasi Berkas</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} siswa</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama / nomor" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Jenjang</TableHead>
                {DOCS.map((d) => <TableHead key={d.key}>{d.label}</TableHead>)}
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={DOCS.length + 3}><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={DOCS.length + 3} className="text-center text-muted-foreground py-10">Belum ada berkas terupload</TableCell></TableRow>
              ) : filtered.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">{b.siswa?.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{b.siswa?.nomor_peserta ?? b.siswa?.nomor_registrasi}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{b.siswa?.jenjang}</Badge></TableCell>
                  {DOCS.map((d) => (
                    <TableCell key={d.key}><DokBadge status={(b as any)[`status_${d.key}`]} hasFile={!!(b as any)[d.key]} /></TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setOpenId(b.id)}>
                      <FileText className="h-4 w-4 mr-1" /> Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verifikasi Berkas — {current?.siswa?.nama_lengkap}</DialogTitle>
          </DialogHeader>
          {current && <BerkasDetail berkas={current} onChanged={() => qc.invalidateQueries({ queryKey: ["admin-berkas"] })} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BerkasDetail({ berkas, onChanged }: { berkas: any; onChanged: () => void }) {
  const [catatan, setCatatan] = useState<string>(berkas.catatan_revisi ?? "");

  async function setStatus(dok: string, status: "diverifikasi" | "ditolak" | "menunggu") {
    const { error } = await supabase.from("upload_berkas").update({ [`status_${dok}`]: status, catatan_revisi: catatan || null }).eq("id", berkas.id);
    if (error) return toast.error(error.message);
    toast.success("Status diperbarui");
    onChanged();
  }

  async function setSiswaVerif(status: "diverifikasi" | "ditolak") {
    const { error } = await supabase.from("siswa").update({ status_verifikasi: status }).eq("id", berkas.siswa_id);
    if (error) return toast.error(error.message);
    toast.success("Status siswa diperbarui");
    onChanged();
  }

  async function openFile(path: string | null) {
    if (!path) return;
    const { data } = await supabase.storage.from("berkas-siswa").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      {DOCS.map((d) => {
        const path = (berkas as any)[d.key];
        const status = (berkas as any)[`status_${d.key}`];
        return (
          <Card key={d.key} className="p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{d.label}</span>
                <DokBadge status={status} hasFile={!!path} />
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={!path} onClick={() => openFile(path)}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Buka
                </Button>
                <Button size="sm" variant="outline" disabled={!path} onClick={() => setStatus(d.key, "diverifikasi")}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </Button>
                <Button size="sm" variant="outline" disabled={!path} onClick={() => setStatus(d.key, "ditolak")}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
      <div>
        <label className="text-sm font-medium">Catatan Revisi</label>
        <Textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan untuk siswa jika ditolak..." />
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button variant="outline" onClick={() => setSiswaVerif("ditolak")}>
          <XCircle className="h-4 w-4 mr-1 text-destructive" /> Tolak Semua
        </Button>
        <Button className="bg-gradient-primary" onClick={() => setSiswaVerif("diverifikasi")}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Verifikasi Siswa
        </Button>
      </div>
    </div>
  );
}

function DokBadge({ status, hasFile }: { status: string; hasFile: boolean }) {
  if (!hasFile) return <Badge variant="outline" className="text-muted-foreground">-</Badge>;
  if (status === "diverifikasi") return <Badge className="bg-emerald-500/15 text-emerald-700 border-0">OK</Badge>;
  if (status === "ditolak") return <Badge className="bg-destructive/15 text-destructive border-0">Tolak</Badge>;
  return <Badge className="bg-amber-500/15 text-amber-700 border-0">Tunggu</Badge>;
}
