import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireAdmin } from "@/components/guards/RequireAdmin";

// Public pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Informasi from "@/pages/Informasi";
import Jadwal from "@/pages/Jadwal";
import Pengumuman from "@/pages/Pengumuman";
import NotFound from "@/pages/NotFound";

// Siswa pages
import SiswaLayout from "@/pages/siswa/SiswaLayout";
import SiswaIndex from "@/pages/siswa/SiswaIndex";
import SiswaBiodata from "@/pages/siswa/Biodata";
import SiswaPembayaran from "@/pages/siswa/Pembayaran";
import SiswaInvoice from "@/pages/siswa/Invoice";
import SiswaBerkas from "@/pages/siswa/Berkas";
import SiswaKartu from "@/pages/siswa/Kartu";
import SiswaTagihan from "@/pages/siswa/Tagihan";
import SiswaKelulusan from "@/pages/siswa/Kelulusan";
import SiswaDaftarUlang from "@/pages/siswa/DaftarUlang";
import { RequireStep } from "@/components/guards/RequireStep";

// Admin pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminIndex from "@/pages/admin/AdminIndex";
import AdminSiswa from "@/pages/admin/SiswaAdmin";
import AdminJenjang from "@/pages/admin/Jenjang";
import AdminPembayaran from "@/pages/admin/PembayaranAdmin";
import AdminPengumuman from "@/pages/admin/PengumumanAdmin";
import AdminJadwal from "@/pages/admin/JadwalAdmin";
import AdminHero from "@/pages/admin/Hero";
import AdminPengaturan from "@/pages/admin/Pengaturan";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function AuthListener() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [qc]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthListener />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/informasi" element={<Informasi />} />
          <Route path="/jadwal" element={<Jadwal />} />
          <Route path="/pengumuman" element={<Pengumuman />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Siswa */}
          <Route
            path="/siswa"
            element={
              <RequireAuth>
                <SiswaLayout />
              </RequireAuth>
            }
          >
            <Route index element={<SiswaIndex />} />
            <Route path="invoice" element={<SiswaInvoice />} />
            <Route path="pembayaran" element={<SiswaPembayaran />} />
            <Route path="tagihan" element={<SiswaTagihan />} />
            <Route path="biodata" element={
              <RequireStep requires={["pembayaran"]}><SiswaBiodata /></RequireStep>
            } />
            <Route path="berkas" element={
              <RequireStep requires={["biodata"]}><SiswaBerkas /></RequireStep>
            } />
            <Route path="kartu" element={
              <RequireStep requires={["verifikasi"]}><SiswaKartu /></RequireStep>
            } />
            <Route path="kelulusan" element={
              <RequireStep requires={["kartu"]}><SiswaKelulusan /></RequireStep>
            } />
            <Route path="daftar-ulang" element={
              <RequireStep requires={["kelulusan"]}><SiswaDaftarUlang /></RequireStep>
            } />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              </RequireAuth>
            }
          >
            <Route index element={<AdminIndex />} />
            <Route path="siswa" element={<AdminSiswa />} />
            <Route path="jenjang" element={<AdminJenjang />} />
            <Route path="pembayaran" element={<AdminPembayaran />} />
            <Route path="pengumuman" element={<AdminPengumuman />} />
            <Route path="jadwal" element={<AdminJadwal />} />
            <Route path="hero" element={<AdminHero />} />
            <Route path="pengaturan" element={<AdminPengaturan />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
