import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SiswaPembayaran() {
  return (
    <Card className="p-10 text-center max-w-2xl">
      <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
      <h2 className="mt-4 text-lg font-semibold">Halaman Pembayaran sedang diperbarui</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Sistem tagihan baru sedang disiapkan. Silakan kembali sebentar lagi.
      </p>
    </Card>
  );
}
