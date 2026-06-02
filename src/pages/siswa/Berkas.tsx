import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Upload, FileCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const FIELDS = [
  { key: "pas_foto", label: "Pas Foto 3x4", required: true },
  { key: "kk", label: "Kartu Keluarga", required: true },
  { key: "akta", label: "Akta Kelahiran", required: true },
  { key: "ijazah", label: "Ijazah / SKL", required: false },
  { key: "raport", label: "Rapor Terakhir", required: false },
] as const;

export default function Berkas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: siswa } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: berkas } = useQuery({
    queryKey: ["berkas-me", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("upload_berkas").select("*").eq("siswa_id", siswa!.id).maybeSingle();
      return data;
    },
  });

  async function handleUpload(field: string, file: File) {
    if (!siswa) return toast.error("Lengkapi biodata terlebih dahulu");
    if (file.size > 5 * 1024 * 1024) return toast.error("File maks 5MB");
    setUploading(field);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${field}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("berkas-siswa").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      if (berkas) {
        const { error } = await supabase.from("upload_berkas").update({ [field]: path } as any).eq("id", berkas.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("upload_berkas").insert({ siswa_id: siswa.id, [field]: path } as any);
        if (error) throw error;
      }
      toast.success("Berkas terupload");
      qc.invalidateQueries({ queryKey: ["berkas-me"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Berkas</h2>
        <p className="text-sm text-muted-foreground">Format: JPG, PNG, atau PDF. Maksimal 5MB per file.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => {
          const value = (berkas as any)?.[f.key] as string | null;
          const isUploading = uploading === f.key;
          return (
            <Card key={f.key} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{f.label}</p>
                  {f.required && <p className="text-xs text-destructive">Wajib</p>}
                </div>
                {value ? (
                  <FileCheck2 className="h-5 w-5 text-primary" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <Label className="block">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  disabled={isUploading || !siswa}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(f.key, file);
                  }}
                  className="cursor-pointer file:cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1 file:text-xs"
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {isUploading ? (
                  <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Mengupload...</span>
                ) : value ? (
                  <span className="text-primary">✓ Terupload</span>
                ) : (
                  "Belum diupload"
                )}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
