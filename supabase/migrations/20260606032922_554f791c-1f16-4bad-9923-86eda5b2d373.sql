CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _nama text := COALESCE(m->>'nama', NEW.email);
  _jenjang text := COALESCE(m->>'jenjang', 'SD');
  _jk text := COALESCE(m->>'jenis_kelamin', 'L');
BEGIN
  INSERT INTO public.profiles (id, nama, email)
  VALUES (NEW.id, _nama, NEW.email)
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