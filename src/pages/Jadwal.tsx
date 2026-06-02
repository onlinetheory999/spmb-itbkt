import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export default function Jadwal() {
  const { data } = useQuery({
    queryKey: ["jadwal-public"],
    queryFn: async () => {
      const { data } = await supabase.from("jadwal").select("*").order("tanggal");
      return data ?? [];
    },
  });

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <Badge className="bg-primary/10 text-primary border-0">Timeline Penting</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">Jadwal SPMB 2026-2027</h1>
        </div>
        <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
          {(data ?? []).map((j: any) => (
            <div key={j.id} className="relative">
              <span className="absolute -left-[31px] top-2 grid h-5 w-5 place-items-center rounded-full bg-gradient-primary shadow-glow">
                <CalendarDays className="h-3 w-3 text-primary-foreground" />
              </span>
              <Card className="p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{j.judul}</h3>
                  {j.jenjang && <Badge variant="outline">{j.jenjang}</Badge>}
                </div>
                <p className="text-sm text-primary font-medium mt-1">
                  {formatDate(j.tanggal)}
                  {j.tanggal_selesai && j.tanggal_selesai !== j.tanggal ? ` – ${formatDate(j.tanggal_selesai)}` : ""}
                  {j.waktu ? ` • ${j.waktu}` : ""}
                </p>
                {j.deskripsi && <p className="text-sm text-muted-foreground mt-2">{j.deskripsi}</p>}
              </Card>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <Card className="p-10 text-center text-muted-foreground">Jadwal akan segera diumumkan.</Card>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
