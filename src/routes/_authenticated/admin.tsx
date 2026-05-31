import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, LayoutDashboard, Users, CreditCard, FileCheck, Megaphone, CalendarDays, Settings as SettingsIcon, Image } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/siswa", label: "Data Siswa", icon: Users },
  { to: "/admin/pembayaran", label: "Verifikasi Bayar", icon: CreditCard },
  { to: "/admin/jenjang", label: "Jenjang & Biaya", icon: FileCheck },
  { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/admin/hero", label: "Hero Slides", icon: Image },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: SettingsIcon },
];

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
});

function AdminShell() {
  const { isAdmin, loading, role } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/siswa" });
  }, [loading, isAdmin, nav]);

  if (loading || !role) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) return null;

  return (
    <DashboardLayout items={items} title="Admin Panel">
      <Outlet />
    </DashboardLayout>
  );
}
