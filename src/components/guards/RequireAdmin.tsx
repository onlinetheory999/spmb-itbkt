import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, role } = useAuth();

  if (loading || (!role && !isAdmin)) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/siswa" replace />;
  return <>{children}</>;
}
