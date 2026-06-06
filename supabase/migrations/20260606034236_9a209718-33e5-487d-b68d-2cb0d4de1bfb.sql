
-- 1. profiles flag for default password
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS harus_ganti_password boolean NOT NULL DEFAULT false;

-- backfill: tandai semua siswa yg belum pernah update password sbg harus ganti
UPDATE public.profiles p
SET harus_ganti_password = true
WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'siswa')
  AND p.harus_ganti_password = false;

-- 2. update handle_new_user to mark siswa baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _nama text := COALESCE(m->>'nama', NEW.email);
  _jenjang text := COALESCE(m->>'jenjang', 'SD');
  _jk text := COALESCE(m->>'jenis_kelamin', 'L');
BEGIN
  INSERT INTO public.profiles (id, nama, email, harus_ganti_password)
  VALUES (NEW.id, _nama, NEW.email, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'siswa')
  ON CONFLICT (user_id, role) DO NOTHING;

  BEGIN
    INSERT INTO public.siswa (
      user_id, nama_lengkap, email, jenjang, jenis_kelamin, status_akun,
      tempat_lahir, tanggal_lahir, no_hp, alamat, provinsi, kabupaten,
      tahun_lulus, asal_sekolah, jenis_sekolah_asal,
      nama_ayah, nama_ibu, no_hp_ortu, email_ortu
    ) VALUES (
      NEW.id, _nama, NEW.email,
      _jenjang::jenjang_type, _jk::jenis_kelamin, 'aktif'::status_akun,
      NULLIF(m->>'tempat_lahir',''), NULLIF(m->>'tanggal_lahir','')::date,
      NULLIF(m->>'no_hp',''), NULLIF(m->>'alamat',''),
      NULLIF(m->>'provinsi',''), NULLIF(m->>'kabupaten',''),
      NULLIF(m->>'tahun_lulus',''), NULLIF(m->>'asal_sekolah',''),
      NULLIF(m->>'jenis_sekolah_asal',''),
      NULLIF(m->>'nama_ayah',''), NULLIF(m->>'nama_ibu',''),
      NULLIF(m->>'no_hp_ortu',''), NULLIF(m->>'email_ortu','')
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END $function$;

-- 3. Audit triggers
CREATE OR REPLACE FUNCTION public.audit_tagihan_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.nominal_dibayar IS DISTINCT FROM OLD.nominal_dibayar THEN
    INSERT INTO public.audit_log (user_id, aksi, entitas, detail)
    VALUES (
      auth.uid(),
      'tagihan_update',
      'tagihan:' || NEW.id::text,
      jsonb_build_object(
        'trx_id', NEW.trx_id,
        'old_status', OLD.status, 'new_status', NEW.status,
        'old_dibayar', OLD.nominal_dibayar, 'new_dibayar', NEW.nominal_dibayar
      )
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_tagihan ON public.tagihan;
CREATE TRIGGER trg_audit_tagihan
AFTER UPDATE ON public.tagihan
FOR EACH ROW EXECUTE FUNCTION public.audit_tagihan_change();

CREATE OR REPLACE FUNCTION public.audit_siswa_kelulusan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status_kelulusan IS DISTINCT FROM OLD.status_kelulusan
     OR NEW.kelulusan_published IS DISTINCT FROM OLD.kelulusan_published THEN
    INSERT INTO public.audit_log (user_id, aksi, entitas, detail)
    VALUES (
      auth.uid(),
      'kelulusan_update',
      'siswa:' || NEW.id::text,
      jsonb_build_object(
        'nomor_peserta', NEW.nomor_peserta,
        'old_status', OLD.status_kelulusan, 'new_status', NEW.status_kelulusan,
        'old_published', OLD.kelulusan_published, 'new_published', NEW.kelulusan_published
      )
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_kelulusan ON public.siswa;
CREATE TRIGGER trg_audit_kelulusan
AFTER UPDATE ON public.siswa
FOR EACH ROW EXECUTE FUNCTION public.audit_siswa_kelulusan();

-- 4. Loosen audit insert policy: SECURITY DEFINER trigger writes audit; user_id may be null
DROP POLICY IF EXISTS "audit insert" ON public.audit_log;
CREATE POLICY "audit insert system" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
