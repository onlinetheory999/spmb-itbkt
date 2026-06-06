import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function PasswordDefaultBanner() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["profile-pw", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("harus_ganti_password")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (!data?.harus_ganti_password) return null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-wrap items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">Anda masih menggunakan password default</p>
        <p className="text-xs text-muted-foreground">
          Segera ganti password untuk mengamankan akun pendaftaran Anda.
        </p>
      </div>
      <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0">
        <Link to="/siswa/ganti-password">Ganti Sekarang</Link>
      </Button>
    </div>
  );
}
