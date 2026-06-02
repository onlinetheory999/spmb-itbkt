import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Email tidak valid");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Link reset telah dikirim ke email Anda");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </Link>
        <h1 className="text-2xl font-bold">Lupa Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Masukkan email Anda untuk menerima link reset password.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg bg-primary/10 p-4 text-sm">
            Link reset password telah dikirim ke <b>{email}</b>. Silakan cek inbox / folder spam.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required className="pl-9"
                  placeholder="nama@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim Link Reset"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
