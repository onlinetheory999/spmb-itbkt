
-- 1. Enum jenis kelamin
DO $$ BEGIN
  CREATE TYPE public.jenis_kelamin AS ENUM ('L','P');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Siswa: tambah jenis_kelamin
ALTER TABLE public.siswa
  ADD COLUMN IF NOT EXISTS jenis_kelamin public.jenis_kelamin NOT NULL DEFAULT 'L';

-- 3. Jenjang: kuota L/P + kode VA
ALTER TABLE public.jenjang
  ADD COLUMN IF NOT EXISTS kuota_l int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kuota_p int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kode_va text;

-- Seed kode_va default jika kosong
UPDATE public.jenjang SET kode_va = '201' WHERE kode = 'SD' AND (kode_va IS NULL OR kode_va = '');
UPDATE public.jenjang SET kode_va = '202' WHERE kode = 'SMP' AND (kode_va IS NULL OR kode_va = '');
UPDATE public.jenjang SET kode_va = '203' WHERE kode = 'SMA' AND (kode_va IS NULL OR kode_va = '');

-- Migrasi kuota lama: bagi rata ke L/P kalau kuota_l + kuota_p masih 0
UPDATE public.jenjang
  SET kuota_l = GREATEST(kuota/2, 0),
      kuota_p = GREATEST(kuota - kuota/2, 0)
  WHERE (kuota_l + kuota_p) = 0 AND kuota > 0;

-- 4. Jadwal: tambah tanggal_selesai
ALTER TABLE public.jadwal
  ADD COLUMN IF NOT EXISTS tanggal_selesai date;

-- 5. Fungsi cek kuota
CREATE OR REPLACE FUNCTION public.cek_kuota(_jenjang text, _jk text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kuota int;
  _terisi int;
BEGIN
  SELECT CASE WHEN _jk = 'L' THEN kuota_l ELSE kuota_p END
    INTO _kuota
  FROM public.jenjang WHERE kode::text = _jenjang;

  IF _kuota IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'jenjang_tidak_ditemukan');
  END IF;

  SELECT COUNT(*) INTO _terisi
  FROM public.siswa
  WHERE jenjang::text = _jenjang
    AND jenis_kelamin::text = _jk
    AND status_akun <> 'nonaktif';

  RETURN jsonb_build_object(
    'ok', _terisi < _kuota,
    'kuota', _kuota,
    'terisi', _terisi,
    'sisa', GREATEST(_kuota - _terisi, 0)
  );
END $$;

GRANT EXECUTE ON FUNCTION public.cek_kuota(text, text) TO anon, authenticated;

-- 6. Trigger enforcement kuota di insert siswa
CREATE OR REPLACE FUNCTION public.enforce_kuota_siswa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kuota int;
  _terisi int;
BEGIN
  SELECT CASE WHEN NEW.jenis_kelamin = 'L' THEN kuota_l ELSE kuota_p END
    INTO _kuota
  FROM public.jenjang WHERE kode = NEW.jenjang;

  IF _kuota IS NULL OR _kuota = 0 THEN
    -- kalau kuota tidak diset, biarkan lewat (admin belum konfigurasi)
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO _terisi
  FROM public.siswa
  WHERE jenjang = NEW.jenjang
    AND jenis_kelamin = NEW.jenis_kelamin
    AND status_akun <> 'nonaktif';

  IF _terisi >= _kuota THEN
    RAISE EXCEPTION 'kuota_penuh:%', NEW.jenis_kelamin
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_kuota_siswa ON public.siswa;
CREATE TRIGGER trg_enforce_kuota_siswa
  BEFORE INSERT ON public.siswa
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kuota_siswa();

-- 7. Trigger auto-fill nomor_va pada pembayaran
CREATE OR REPLACE FUNCTION public.auto_fill_va()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kode_va text;
  _no_hp text;
  _jenjang_kode text;
BEGIN
  IF NEW.nomor_va IS NOT NULL AND NEW.nomor_va <> '' THEN
    RETURN NEW;
  END IF;

  SELECT s.no_hp, s.jenjang::text INTO _no_hp, _jenjang_kode
    FROM public.siswa s WHERE s.id = NEW.siswa_id;

  SELECT kode_va INTO _kode_va FROM public.jenjang WHERE kode::text = _jenjang_kode;

  NEW.nomor_va := COALESCE(_kode_va, '200') ||
    LPAD(regexp_replace(COALESCE(_no_hp, '0000000000'), '\D', '', 'g'), 10, '0');

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_fill_va ON public.pembayaran;
CREATE TRIGGER trg_auto_fill_va
  BEFORE INSERT ON public.pembayaran
  FOR EACH ROW EXECUTE FUNCTION public.auto_fill_va();

-- 8. Storage policies untuk admin upload hero ke website-public
DROP POLICY IF EXISTS "Admin can upload to website-public" ON storage.objects;
CREATE POLICY "Admin can upload to website-public"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'website-public' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update website-public" ON storage.objects;
CREATE POLICY "Admin can update website-public"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'website-public' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete website-public" ON storage.objects;
CREATE POLICY "Admin can delete website-public"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'website-public' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read website-public" ON storage.objects;
CREATE POLICY "Public read website-public"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'website-public');
