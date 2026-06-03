
-- ============ TABEL MASTER ============

CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text NOT NULL UNIQUE,
  label text NOT NULL UNIQUE,
  aktif boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tahun_ajaran TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tahun_ajaran TO authenticated;
GRANT ALL ON public.tahun_ajaran TO service_role;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tahun_ajaran read" ON public.tahun_ajaran FOR SELECT USING (true);
CREATE POLICY "tahun_ajaran admin write" ON public.tahun_ajaran FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.gelombang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_ajaran_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  nama text NOT NULL,
  tanggal_mulai date NOT NULL,
  tanggal_selesai date NOT NULL,
  kuota integer NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gelombang TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gelombang TO authenticated;
GRANT ALL ON public.gelombang TO service_role;
ALTER TABLE public.gelombang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gelombang read" ON public.gelombang FOR SELECT USING (true);
CREATE POLICY "gelombang admin write" ON public.gelombang FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.biaya_pendaftaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_ajaran_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  jenjang jenjang_type NOT NULL,
  nominal numeric NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tahun_ajaran_id, jenjang)
);
GRANT SELECT ON public.biaya_pendaftaran TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.biaya_pendaftaran TO authenticated;
GRANT ALL ON public.biaya_pendaftaran TO service_role;
ALTER TABLE public.biaya_pendaftaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biaya_pendaftaran read" ON public.biaya_pendaftaran FOR SELECT USING (true);
CREATE POLICY "biaya_pendaftaran admin write" ON public.biaya_pendaftaran FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.biaya_daftar_ulang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_ajaran_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  jenjang jenjang_type NOT NULL,
  nominal numeric NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tahun_ajaran_id, jenjang)
);
GRANT SELECT ON public.biaya_daftar_ulang TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.biaya_daftar_ulang TO authenticated;
GRANT ALL ON public.biaya_daftar_ulang TO service_role;
ALTER TABLE public.biaya_daftar_ulang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biaya_daftar_ulang read" ON public.biaya_daftar_ulang FOR SELECT USING (true);
CREATE POLICY "biaya_daftar_ulang admin write" ON public.biaya_daftar_ulang FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============ SISWA: KOLOM TAMBAHAN ============
ALTER TABLE public.siswa
  ADD COLUMN IF NOT EXISTS nomor_registrasi text UNIQUE,
  ADD COLUMN IF NOT EXISTS nik text UNIQUE,
  ADD COLUMN IF NOT EXISTS nisn text,
  ADD COLUMN IF NOT EXISTS agama text,
  ADD COLUMN IF NOT EXISTS jumlah_saudara integer,
  ADD COLUMN IF NOT EXISTS anak_ke integer,
  ADD COLUMN IF NOT EXISTS kecamatan text,
  ADD COLUMN IF NOT EXISTS kelurahan text,
  ADD COLUMN IF NOT EXISTS provinsi_sekolah text,
  ADD COLUMN IF NOT EXISTS kabupaten_sekolah text,
  ADD COLUMN IF NOT EXISTS kewarganegaraan text DEFAULT 'Indonesia',
  ADD COLUMN IF NOT EXISTS no_kk text,
  ADD COLUMN IF NOT EXISTS nama_ayah text,
  ADD COLUMN IF NOT EXISTS nik_ayah text,
  ADD COLUMN IF NOT EXISTS pekerjaan_ayah text,
  ADD COLUMN IF NOT EXISTS nama_ibu text,
  ADD COLUMN IF NOT EXISTS nik_ibu text,
  ADD COLUMN IF NOT EXISTS pekerjaan_ibu text,
  ADD COLUMN IF NOT EXISTS no_hp_ortu text,
  ADD COLUMN IF NOT EXISTS email_ortu text,
  ADD COLUMN IF NOT EXISTS jenis_sekolah_asal text,
  ADD COLUMN IF NOT EXISTS tahun_ajaran_kode text,
  ADD COLUMN IF NOT EXISTS status_kelulusan status_kelulusan NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS kelulusan_published boolean NOT NULL DEFAULT false;

-- ============ UPLOAD BERKAS: KOLOM TAMBAHAN ============
ALTER TABLE public.upload_berkas
  ADD COLUMN IF NOT EXISTS skl text,
  ADD COLUMN IF NOT EXISTS ktp_ortu text,
  ADD COLUMN IF NOT EXISTS status_pas_foto status_dokumen NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS status_akta status_dokumen NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS status_kk status_dokumen NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS status_skl status_dokumen NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS status_ktp_ortu status_dokumen NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS catatan_revisi text;

-- ============ DROP PEMBAYARAN LAMA, BUAT TAGIHAN ============
DROP TABLE IF EXISTS public.pembayaran CASCADE;

CREATE TABLE public.tagihan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trx_id text NOT NULL UNIQUE,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  jenis jenis_tagihan NOT NULL,
  jenjang jenjang_type NOT NULL,
  tahun_ajaran_kode text NOT NULL,
  nominal_tagihan numeric NOT NULL,
  nominal_dibayar numeric NOT NULL DEFAULT 0,
  selisih numeric GENERATED ALWAYS AS (nominal_dibayar - nominal_tagihan) STORED,
  tanggal_tagihan timestamptz NOT NULL DEFAULT now(),
  tanggal_tempo date,
  tanggal_bayar timestamptz,
  status status_tagihan NOT NULL DEFAULT 'belum_bayar',
  nomor_va text NOT NULL,
  metode text DEFAULT 'Virtual Account Bank Nagari Syariah',
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tagihan TO authenticated;
GRANT ALL ON public.tagihan TO service_role;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tagihan read own" ON public.tagihan FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM siswa s WHERE s.id = tagihan.siswa_id AND s.user_id = auth.uid())
  OR is_admin(auth.uid())
);
CREATE POLICY "tagihan admin all" ON public.tagihan FOR ALL TO authenticated
USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER tagihan_touch BEFORE UPDATE ON public.tagihan
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ GENERATOR ============
CREATE OR REPLACE FUNCTION public.generate_nomor_registrasi()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _next int; _yr text;
BEGIN
  _yr := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(substring(nomor_registrasi FROM 8)::int), 0) + 1 INTO _next
  FROM public.siswa
  WHERE nomor_registrasi LIKE 'REG' || _yr || '%';
  RETURN 'REG' || _yr || LPAD(_next::text, 5, '0');
END $$;

CREATE OR REPLACE FUNCTION public.generate_trx_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _next int; _yr text;
BEGIN
  _yr := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(substring(trx_id FROM 8)::int), 0) + 1 INTO _next
  FROM public.tagihan
  WHERE trx_id LIKE 'TRX' || _yr || '%';
  RETURN 'TRX' || _yr || LPAD(_next::text, 5, '0');
END $$;

CREATE OR REPLACE FUNCTION public.generate_nomor_peserta(_tahun_kode text, _jenjang jenjang_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _kode text; _next int;
BEGIN
  _kode := CASE _jenjang::text
    WHEN 'TK' THEN '01' WHEN 'SD' THEN '02'
    WHEN 'SMP' THEN '03' WHEN 'SMA' THEN '04' END;
  SELECT COALESCE(MAX(substring(nomor_peserta FROM 7)::int), 0) + 1 INTO _next
  FROM public.siswa
  WHERE nomor_peserta LIKE _tahun_kode || _kode || '%';
  RETURN _tahun_kode || _kode || LPAD(_next::text, 3, '0');
END $$;

-- ============ TRIGGER AUTO-TAGIHAN ============
CREATE OR REPLACE FUNCTION public.buat_tagihan_pendaftaran()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ta_id uuid; _ta_kode text; _nominal numeric; _trx text; _va text; _kode_va text;
BEGIN
  SELECT id, kode INTO _ta_id, _ta_kode FROM public.tahun_ajaran WHERE aktif = true LIMIT 1;
  IF _ta_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.tahun_ajaran_kode IS NULL THEN
    UPDATE public.siswa SET tahun_ajaran_kode = _ta_kode WHERE id = NEW.id;
  END IF;
  IF NEW.nomor_registrasi IS NULL THEN
    UPDATE public.siswa SET nomor_registrasi = generate_nomor_registrasi() WHERE id = NEW.id;
  END IF;

  SELECT nominal INTO _nominal
  FROM public.biaya_pendaftaran
  WHERE tahun_ajaran_id = _ta_id AND jenjang = NEW.jenjang AND aktif = true
  LIMIT 1;
  IF _nominal IS NULL THEN _nominal := 0; END IF;

  _trx := generate_trx_id();
  SELECT kode_va INTO _kode_va FROM public.jenjang WHERE kode = NEW.jenjang LIMIT 1;
  _va := COALESCE(_kode_va, '200') ||
         LPAD(regexp_replace(COALESCE(NEW.no_hp_ortu, NEW.no_hp, '0000000000'), '\D', '', 'g'), 10, '0');

  INSERT INTO public.tagihan (
    trx_id, siswa_id, jenis, jenjang, tahun_ajaran_kode,
    nominal_tagihan, nomor_va, tanggal_tempo
  ) VALUES (
    _trx, NEW.id, 'pendaftaran', NEW.jenjang, _ta_kode,
    _nominal, _va, (now() + interval '7 days')::date
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS siswa_buat_tagihan ON public.siswa;
CREATE TRIGGER siswa_buat_tagihan AFTER INSERT ON public.siswa
FOR EACH ROW EXECUTE FUNCTION public.buat_tagihan_pendaftaran();

-- ============ TRIGGER STATUS TAGIHAN ============
CREATE OR REPLACE FUNCTION public.set_status_tagihan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.nominal_dibayar = 0 THEN
    NEW.status := 'belum_bayar';
    NEW.tanggal_bayar := NULL;
  ELSIF NEW.nominal_dibayar = NEW.nominal_tagihan THEN
    NEW.status := 'lunas';
    IF NEW.tanggal_bayar IS NULL THEN NEW.tanggal_bayar := now(); END IF;
  ELSIF NEW.nominal_dibayar > NEW.nominal_tagihan THEN
    NEW.status := 'menunggu_verifikasi';
    IF NEW.tanggal_bayar IS NULL THEN NEW.tanggal_bayar := now(); END IF;
  ELSE
    NEW.status := 'belum_bayar';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tagihan_set_status ON public.tagihan;
CREATE TRIGGER tagihan_set_status BEFORE INSERT OR UPDATE OF nominal_dibayar ON public.tagihan
FOR EACH ROW EXECUTE FUNCTION public.set_status_tagihan();

-- ============ HELPER GATE ============
CREATE OR REPLACE FUNCTION public.is_lunas_pendaftaran(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tagihan t
    JOIN siswa s ON s.id = t.siswa_id
    WHERE s.user_id = _user_id AND t.jenis = 'pendaftaran' AND t.status = 'lunas'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_biodata_lengkap(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM siswa
    WHERE user_id = _user_id
      AND nama_lengkap IS NOT NULL AND nik IS NOT NULL
      AND tempat_lahir IS NOT NULL AND tanggal_lahir IS NOT NULL
      AND alamat IS NOT NULL AND nama_ayah IS NOT NULL AND nama_ibu IS NOT NULL
  );
$$;

-- ============ SEED ============
INSERT INTO public.tahun_ajaran (kode, label, aktif)
VALUES ('2627', '2026/2027', true)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.biaya_pendaftaran (tahun_ajaran_id, jenjang, nominal, aktif)
SELECT t.id, j.jenjang::jenjang_type, j.nominal, true
FROM public.tahun_ajaran t
CROSS JOIN (VALUES
  ('TK', 250000),
  ('SD', 350000),
  ('SMP', 400000)
) AS j(jenjang, nominal)
WHERE t.kode = '2627'
ON CONFLICT (tahun_ajaran_id, jenjang) DO NOTHING;

INSERT INTO public.biaya_daftar_ulang (tahun_ajaran_id, jenjang, nominal, aktif)
SELECT t.id, j.jenjang::jenjang_type, j.nominal, true
FROM public.tahun_ajaran t
CROSS JOIN (VALUES
  ('TK', 1500000),
  ('SD', 2000000),
  ('SMP', 2500000)
) AS j(jenjang, nominal)
WHERE t.kode = '2627'
ON CONFLICT (tahun_ajaran_id, jenjang) DO NOTHING;
