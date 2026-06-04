import { LayoutDashboard, User, CreditCard, FileText, IdCard, Trophy, Wallet, Receipt } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSiswaProgress } from "@/hooks/use-siswa-progress";

export default function SiswaLayout() {
  const prog = useSiswaProgress();
  const s = prog.steps;

  const items = [
    { to: "/siswa", label: "Dashboard", icon: LayoutDashboard, enabled: true },
    { to: "/siswa/invoice", label: "Pembayaran", icon: CreditCard, enabled: s.registrasi },
    { to: "/siswa/biodata", label: "Biodata", icon: User, enabled: s.pembayaran },
    { to: "/siswa/berkas", label: "Upload Berkas", icon: FileText, enabled: s.biodata },
    { to: "/siswa/kartu", label: "Kartu Peserta", icon: IdCard, enabled: s.verifikasi },
    { to: "/siswa/kelulusan", label: "Hasil Kelulusan", icon: Trophy, enabled: s.kartu },
    { to: "/siswa/daftar-ulang", label: "Daftar Ulang", icon: Wallet, enabled: s.kelulusan },
    { to: "/siswa/tagihan", label: "Riwayat Tagihan", icon: Receipt, enabled: s.registrasi },
  ];

  return <DashboardLayout items={items as any} title="Dashboard Siswa" />;
}
