
ALTER TYPE public.jenjang_type ADD VALUE IF NOT EXISTS 'TK' BEFORE 'SD';

DO $$ BEGIN
  CREATE TYPE public.jenis_tagihan AS ENUM ('pendaftaran','daftar_ulang');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_tagihan AS ENUM ('belum_bayar','menunggu_verifikasi','lunas');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_kelulusan AS ENUM ('belum','lulus','tidak_lulus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_dokumen AS ENUM ('belum','menunggu','disetujui','ditolak');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
