import { LayoutDashboard, User, CreditCard, FileText, IdCard } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const items = [
  { to: "/siswa", label: "Dashboard", icon: LayoutDashboard },
  { to: "/siswa/biodata", label: "Biodata", icon: User },
  { to: "/siswa/pembayaran", label: "Pembayaran", icon: CreditCard },
  { to: "/siswa/berkas", label: "Upload Berkas", icon: FileText },
  { to: "/siswa/kartu", label: "Kartu Peserta", icon: IdCard },
];

export default function SiswaLayout() {
  return <DashboardLayout items={items} title="Dashboard Siswa" />;
}
