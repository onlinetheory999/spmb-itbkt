import { useQuery } from "@tanstack/react-query";
import { Megaphone, AlertTriangle } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export default function Pengumuman() {
  const { data } = useQuery({
    queryKey: ["pengumuman-public"],
    queryFn: async () => {
      const { data } = await supabase.from("pengumuman").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <Badge className="bg-primary/10 text-primary border-0">Informasi Resmi</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">Pengumuman</h1>
          <p className="text-muted-foreground mt-2">Update terbaru seputar pendaftaran SPMB 2026-2027.</p>
        </div>
        <div className="space-y-4">
          {(data ?? []).map((p: any) => (
            <Card key={p.id} className="p-6">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {p.penting ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Megaphone className="h-4 w-4 text-primary" />
                )}
                <h3 className="font-semibold">{p.judul}</h3>
                {p.penting && <Badge className="bg-destructive/15 text-destructive border-0">Penting</Badge>}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{p.isi}</p>
              <p className="text-xs text-muted-foreground mt-3">{formatDateTime(p.created_at)}</p>
            </Card>
          ))}
          {(!data || data.length === 0) && (
            <Card className="p-10 text-center text-muted-foreground">Belum ada pengumuman.</Card>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
