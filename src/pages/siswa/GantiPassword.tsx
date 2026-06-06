import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function GantiPassword() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw1.length < 8) return toast.error("Password minimal 8 karakter");
    if (pw1 !== pw2) return toast.error("Konfirmasi password tidak cocok");
    if (pw1 === "STQ1tbkt") return toast.error("Tidak boleh sama dengan password default");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (user) {
      await supabase.from("profiles").update({ harus_ganti_password: false }).eq("id", user.id);
    }
    setLoading(false);
    toast.success("Password berhasil diubah");
    nav("/siswa");
  }

  return (
    <Card className="max-w-md p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold">Ganti Password</h2>
          <p className="text-xs text-muted-foreground">Demi keamanan akun Anda</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw1">Password Baru</Label>
          <Input id="pw1" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} minLength={8} required />
          <p className="text-[11px] text-muted-foreground">Minimal 8 karakter.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw2">Konfirmasi Password</Label>
          <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan Password Baru
        </Button>
      </form>
    </Card>
  );
}
