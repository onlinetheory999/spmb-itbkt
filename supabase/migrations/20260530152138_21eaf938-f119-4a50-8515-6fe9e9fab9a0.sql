
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'siswa');
CREATE TYPE public.jenjang_type AS ENUM ('SD', 'SMP', 'SMA');
CREATE TYPE public.status_bayar AS ENUM ('pending', 'lunas', 'gagal');
CREATE TYPE public.status_akun AS ENUM ('nonaktif', 'aktif');
CREATE TYPE public.status_verifikasi AS ENUM ('belum', 'diverifikasi', 'ditolak');
CREATE TYPE public.status_pendaftaran AS ENUM ('dibuka', 'ditutup');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER ROLES + has_role()
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin')
  )
$$;

-- =========================================================
-- JENJANG
-- =========================================================
CREATE TABLE public.jenjang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode jenjang_type NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  biaya NUMERIC(12,2) NOT NULL DEFAULT 0,
  kuota INTEGER NOT NULL DEFAULT 0,
  jadwal_seleksi DATE,
  status status_pendaftaran NOT NULL DEFAULT 'dibuka',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jenjang TO anon, authenticated;
GRANT ALL ON public.jenjang TO service_role;
ALTER TABLE public.jenjang ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- SISWA
-- =========================================================
CREATE TABLE public.siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  no_hp TEXT,
  alamat TEXT,
  provinsi TEXT,
  kabupaten TEXT,
  tahun_lulus TEXT,
  asal_sekolah TEXT,
  jenjang jenjang_type NOT NULL,
  status_akun status_akun NOT NULL DEFAULT 'nonaktif',
  status_verifikasi status_verifikasi NOT NULL DEFAULT 'belum',
  nomor_peserta TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.siswa TO authenticated;
GRANT ALL ON public.siswa TO service_role;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PEMBAYARAN
-- =========================================================
CREATE TABLE public.pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  nomor_va TEXT NOT NULL,
  biaya NUMERIC(12,2) NOT NULL,
  status status_bayar NOT NULL DEFAULT 'pending',
  metode TEXT DEFAULT 'Virtual Account',
  tanggal_bayar TIMESTAMPTZ,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pembayaran TO authenticated;
GRANT ALL ON public.pembayaran TO service_role;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- UPLOAD BERKAS
-- =========================================================
CREATE TABLE public.upload_berkas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL UNIQUE REFERENCES public.siswa(id) ON DELETE CASCADE,
  foto TEXT,
  kk TEXT,
  akta TEXT,
  raport TEXT,
  ijazah TEXT,
  pas_foto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.upload_berkas TO authenticated;
GRANT ALL ON public.upload_berkas TO service_role;
ALTER TABLE public.upload_berkas ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PENGUMUMAN
-- =========================================================
CREATE TABLE public.pengumuman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  penting BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pengumuman TO anon, authenticated;
GRANT ALL ON public.pengumuman TO service_role;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- JADWAL
-- =========================================================
CREATE TABLE public.jadwal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  tanggal DATE NOT NULL,
  waktu TEXT,
  deskripsi TEXT,
  jenjang jenjang_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jadwal TO anon, authenticated;
GRANT ALL ON public.jadwal TO service_role;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- HERO SLIDES
-- =========================================================
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  subjudul TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- SETTINGS (single-row)
-- =========================================================
CREATE TABLE public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nama_sekolah TEXT NOT NULL DEFAULT 'PKBM Ibnu Taimiyah',
  logo_url TEXT,
  hero_image TEXT,
  warna_tema TEXT DEFAULT 'emerald',
  tahun_ajaran TEXT NOT NULL DEFAULT '2026-2027',
  kode_sekolah TEXT NOT NULL DEFAULT '2026',
  alamat TEXT,
  no_telp TEXT,
  email TEXT,
  status_pendaftaran status_pendaftaran NOT NULL DEFAULT 'dibuka',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- AUDIT LOG
-- =========================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aksi TEXT NOT NULL,
  entitas TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- jenjang
CREATE POLICY "jenjang public read" ON public.jenjang FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "jenjang admin write" ON public.jenjang FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- siswa
CREATE POLICY "siswa self read" ON public.siswa FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "siswa self insert" ON public.siswa FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "siswa self update" ON public.siswa FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- pembayaran
CREATE POLICY "pembayaran read own" ON public.pembayaran FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.siswa s WHERE s.id = pembayaran.siswa_id AND s.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "pembayaran insert own" ON public.pembayaran FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.siswa s WHERE s.id = pembayaran.siswa_id AND s.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "pembayaran admin update" ON public.pembayaran FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- upload_berkas
CREATE POLICY "berkas read own" ON public.upload_berkas FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.siswa s WHERE s.id = upload_berkas.siswa_id AND s.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "berkas write own" ON public.upload_berkas FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.siswa s WHERE s.id = upload_berkas.siswa_id AND s.user_id = auth.uid())
);
CREATE POLICY "berkas update own" ON public.upload_berkas FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.siswa s WHERE s.id = upload_berkas.siswa_id AND s.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

-- pengumuman
CREATE POLICY "pengumuman public read" ON public.pengumuman FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pengumuman admin write" ON public.pengumuman FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- jadwal
CREATE POLICY "jadwal public read" ON public.jadwal FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "jadwal admin write" ON public.jadwal FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- hero slides
CREATE POLICY "slides public read" ON public.hero_slides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "slides admin write" ON public.hero_slides FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- settings
CREATE POLICY "settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- audit log
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "audit insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- TRIGGERS: updated_at + handle_new_user
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_siswa_updated BEFORE UPDATE ON public.siswa FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_pembayaran_updated BEFORE UPDATE ON public.pembayaran FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_berkas_updated BEFORE UPDATE ON public.upload_berkas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_jenjang_updated BEFORE UPDATE ON public.jenjang FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'siswa')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- STORAGE BUCKET
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('berkas-siswa', 'berkas-siswa', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('website-public', 'website-public', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "berkas read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'berkas-siswa' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));
CREATE POLICY "berkas insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'berkas-siswa' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "berkas update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'berkas-siswa' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));
CREATE POLICY "berkas delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'berkas-siswa' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

CREATE POLICY "website public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'website-public');
CREATE POLICY "website admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'website-public' AND public.is_admin(auth.uid()));
CREATE POLICY "website admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'website-public' AND public.is_admin(auth.uid()));
CREATE POLICY "website admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'website-public' AND public.is_admin(auth.uid()));

-- =========================================================
-- SEED DATA
-- =========================================================
INSERT INTO public.settings (id, nama_sekolah, tahun_ajaran, kode_sekolah, alamat, no_telp, email)
VALUES (1, 'PKBM Ibnu Taimiyah', '2026-2027', '2026', 'Jl. Pendidikan No. 1', '021-12345678', 'info@pkbm-ibnutaimiyah.sch.id')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.jenjang (kode, nama, deskripsi, biaya, kuota, jadwal_seleksi) VALUES
  ('SD', 'Sekolah Dasar', 'Program SD Paket A setara dengan jenjang SD formal', 350000, 60, '2026-06-15'),
  ('SMP', 'Sekolah Menengah Pertama', 'Program SMP Paket B setara dengan jenjang SMP formal', 450000, 80, '2026-06-20'),
  ('SMA', 'Sekolah Menengah Atas', 'Program SMA Paket C setara dengan jenjang SMA formal', 550000, 100, '2026-06-25')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.pengumuman (judul, isi, penting) VALUES
  ('Pendaftaran Resmi Dibuka', 'Pendaftaran tahun ajaran 2026-2027 resmi dibuka mulai 1 Januari 2026.', true),
  ('Jadwal Seleksi', 'Jadwal seleksi akan diumumkan secara bertahap di halaman jadwal.', false);

INSERT INTO public.jadwal (judul, tanggal, waktu, deskripsi) VALUES
  ('Pembukaan Pendaftaran', '2026-01-01', '08:00', 'Pendaftaran online dibuka serentak.'),
  ('Penutupan Pendaftaran', '2026-05-31', '23:59', 'Batas akhir pendaftaran calon peserta didik baru.'),
  ('Ujian Seleksi', '2026-06-15', '08:00', 'Pelaksanaan ujian seleksi.');

INSERT INTO public.hero_slides (judul, subjudul, image_url, cta_text, cta_link, urutan) VALUES
  ('Wujudkan Masa Depan Cemerlang', 'Pendaftaran Peserta Didik Baru PKBM Ibnu Taimiyah 2026-2027', NULL, 'Daftar Sekarang', '/register', 1),
  ('Pendidikan Berkualitas untuk Semua', 'Program SD, SMP, dan SMA dengan kurikulum terpadu', NULL, 'Lihat Informasi', '/informasi', 2);
