import { LayoutDashboard, Users, CreditCard, FileCheck, Megaphone, CalendarDays, Settings as SettingsIcon, Image as ImageIcon } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/siswa", label: "Data Siswa", icon: Users },
  { to: "/admin/pembayaran", label: "Verifikasi Bayar", icon: CreditCard },
  { to: "/admin/jenjang", label: "Jenjang & Biaya", icon: FileCheck },
  { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/admin/hero", label: "Hero Slides", icon: ImageIcon },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: SettingsIcon },
];

export default function AdminLayout() {
  return <DashboardLayout items={items} title="Admin Panel" />;
}
