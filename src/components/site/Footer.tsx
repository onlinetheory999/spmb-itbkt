import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <p className="font-bold">PKBM Ibnu Taimiyah</p>
              <p className="text-xs text-muted-foreground">SPMB 2026-2027</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Membentuk generasi cerdas, mandiri, dan berakhlak mulia.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Navigasi</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Beranda</Link></li>
            <li><Link to="/informasi" className="hover:text-primary">Informasi</Link></li>
            <li><Link to="/jadwal" className="hover:text-primary">Jadwal</Link></li>
            <li><Link to="/pengumuman" className="hover:text-primary">Pengumuman</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Pendaftaran</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/register" className="hover:text-primary">Daftar Siswa Baru</Link></li>
            <li><Link to="/login" className="hover:text-primary">Login Pendaftar</Link></li>
            <li><Link to="/informasi" className="hover:text-primary">Alur Pendaftaran</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Kontak</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Bukittinggi, Sumatera Barat</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> 0752-12345</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> info@pkbm-ibnutaimiyah.sch.id</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PKBM Ibnu Taimiyah · Dibuat dengan ❤ untuk pendidikan Indonesia
      </div>
    </footer>
  );
}
