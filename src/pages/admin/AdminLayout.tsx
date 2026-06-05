import { LayoutDashboard, Users, CreditCard, FileCheck, Megaphone, CalendarDays, Settings as SettingsIcon, Image as ImageIcon, GraduationCap, CalendarRange, Wallet, BadgeCheck, FileSearch } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/siswa", label: "Data Siswa", icon: Users },
  { to: "/admin/verifikasi-berkas", label: "Verifikasi Berkas", icon: FileSearch },
  { to: "/admin/pembayaran", label: "Verifikasi Tagihan", icon: CreditCard },
  { to: "/admin/kelulusan", label: "Pengumuman Kelulusan", icon: BadgeCheck },
  { to: "/admin/tahun-ajaran", label: "Tahun Ajaran", icon: GraduationCap },
  { to: "/admin/gelombang", label: "Gelombang", icon: CalendarRange },
  { to: "/admin/biaya-pendaftaran", label: "Biaya Pendaftaran", icon: Wallet },
  { to: "/admin/biaya-daftar-ulang", label: "Biaya Daftar Ulang", icon: Wallet },
  { to: "/admin/jenjang", label: "Jenjang & Kuota", icon: FileCheck },
  { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/admin/hero", label: "Hero Slides", icon: ImageIcon },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: SettingsIcon },
];

export default function AdminLayout() {
  return <DashboardLayout items={items} title="Admin Panel" />;
}
