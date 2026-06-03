# Rencana Perbaikan SPMB — Alur Berurutan 8 Tahap

Scope sangat besar. Saya bagi jadi **5 batch** agar bisa direview bertahap. Setiap batch berdiri sendiri dan bisa dites sebelum lanjut.

---

## Ringkasan Alur Wajib

```
1. Registrasi Akun
2. Invoice & Bayar Pendaftaran   ← kunci 3-8
3. Lengkapi Biodata              ← kunci 4
4. Upload Berkas                 ← kunci 5
5. Verifikasi Berkas (admin)
6. Cetak Kartu Peserta
7. Hasil Kelulusan
8. Daftar Ulang (jika lulus)     ← invoice baru
```

Gate dipasang di **DB (RLS/trigger)** dan **UI (guard route + disabled menu)**.

---

## Batch A — Skema Database Baru (1 migrasi besar)

**Tabel baru / diubah:**

- `tahun_ajaran` (kode `2627`, label `2026/2027`, aktif) — master
- `gelombang` (nama, mulai, selesai, kuota, tahun_ajaran_id)
- `biaya_pendaftaran` (tahun_ajaran_id, jenjang, nominal, aktif)
- `biaya_daftar_ulang` (tahun_ajaran_id, jenjang, nominal, aktif)
- `siswa`: tambah `nomor_registrasi` (unik), `nik` (unik), `nisn`, `agama`, `jumlah_saudara`, `anak_ke`, `kecamatan`, `kelurahan`, `provinsi_sekolah`, `kabupaten_sekolah`, `kewarganegaraan`, `no_kk`, `nama_ayah`, `nik_ayah`, `pekerjaan_ayah`, `nama_ibu`, `nik_ibu`, `pekerjaan_ibu`, `no_hp_ortu`, `email_ortu`, `tahun_ajaran_kode` (snapshot), `status_kelulusan` enum(`belum`,`lulus`,`tidak_lulus`)
- Enum `jenjang` extend `TK`.
- `pembayaran` → ganti `tagihan`: `trx_id` (`TRX{YYYY}{NNNNN}`), `jenis` enum(`pendaftaran`,`daftar_ulang`), `nominal_tagihan`, `nominal_dibayar`, `selisih`, `tanggal_tagihan`, `tanggal_tempo`, `status` enum(`belum_bayar`,`menunggu_verifikasi`,`lunas`), `nomor_va`. Nominal **snapshot permanen**.
- `upload_berkas`: tambah `ktp_ortu`, `skl`; status per-dok + `catatan_revisi`.

**Function & trigger:**

- `generate_nomor_registrasi()`, `generate_nomor_peserta(tahun, jenjang)`, `generate_trx_id()`
- Trigger AFTER INSERT ON `siswa` → buat tagihan pendaftaran (snapshot nominal aktif + VA)
- Trigger BEFORE UPDATE ON `tagihan` → hitung status dari `nominal_dibayar` vs `nominal_tagihan`
- Helper `cek_dapat_isi_biodata`, `cek_dapat_upload`, `cek_dapat_cetak_kartu` (security definer)

**RLS:** master read publik, tulis admin. Tagihan/berkas read own + admin. GRANT lengkap.

---

## Batch B — Halaman Siswa: Gate berurutan + UI baru

- `SiswaLayout`: hitung progress 8 step dari DB. Menu disabled (lock icon) jika prasyarat belum.
- `RequireStep` guard tiap route (`/siswa/biodata`, `/upload`, `/kartu`, `/kelulusan`, `/daftar-ulang`).
- `/siswa` dashboard: progress bar visual 8 step + badge.
- `/siswa/invoice` (baru): VA, nominal snapshot, batas waktu, tata cara pembayaran.
- `/siswa/biodata`: form lengkap semua field spec. Auto-generate nomor peserta saat simpan pertama.
- `/siswa/berkas`: 5 dokumen (pas_foto, akta, kk, skl, ktp_ortu) — PDF/JPG/PNG max 2MB.
- `/siswa/kartu`: PDF A4 + QR code (`qrcode` lib).
- `/siswa/kelulusan`: status + tombol Cetak Data jika lulus.
- `/siswa/tagihan`: list semua tagihan.
- `/siswa/daftar-ulang`: aktif kalau lulus & ada tagihan daftar_ulang.

---

## Batch C — Registrasi & Email

- `/register` form lengkap (Nama, Email Ortu, TTL, HP Ortu, Provinsi/Kab/Alamat, Tahun Lulus, Jenis Sekolah, Sekolah Asal, Jenjang TK/SD/SMP).
- Password default `STQ1tbkt`. Banner ganti password setelah login pertama.
- Setelah signUp: trigger DB buat profile + siswa + tagihan otomatis.
- Edge function `send-registrasi-email` via Lovable Emails — nama, no registrasi, username, password default, link login, info pembayaran.
- Redirect ke `/siswa/invoice`.

---

## Batch D — Admin Panel (master + kelulusan)

- `/admin/tahun-ajaran` — CRUD + aktivasi
- `/admin/gelombang` — CRUD
- `/admin/biaya-pendaftaran` — CRUD per tahun×jenjang
- `/admin/biaya-daftar-ulang` — CRUD per tahun×jenjang
- `/admin/tagihan` (refactor pembayaran): verifikasi, ubah lunas, simulasi VA, cetak rekap PDF, generate tagihan daftar ulang per siswa lulus
- `/admin/siswa`: aksi Verifikasi Berkas (approve/reject + catatan), Kelola Kelulusan (lulus/tidak/draft/publish)
- `/admin/pengumuman-kelulusan` — draft/publish bulk
- `/admin/jenjang` jadi hanya kuota (biaya pindah ke master baru)

---

## Batch E — Polish & Validasi

- Badge color: hijau (lunas/lulus/disetujui), kuning (menunggu), merah (belum bayar/ditolak/tidak lulus)
- Audit log trigger di tagihan & siswa
- Constraint unik: email, nik, nomor_registrasi, nomor_peserta, trx_id
- Mobile responsive review semua tabel
- Banner ganti password default
- 404 ramah untuk route terkunci

---

## Risiko & Catatan Teknis

- **Migrasi data:** tabel `pembayaran` lama akan di-drop, ganti `tagihan`. Data test akan hilang.
- **Enum `jenjang`** tidak bisa drop SMA; tambah TK saja, SMA tidak ditampilkan di register.
- **Password default `STQ1tbkt`**: Supabase Auth pakai password ini saat signUp; force-reset via UI.
- **Email**: butuh Lovable Email domain. Akan saya minta setup di awal Batch C jika belum ada.

---

## Urutan Eksekusi

1. **Batch A** — migrasi DB besar
2. **Batch B** — halaman siswa + gate
3. **Batch C** — registrasi + email
4. **Batch D** — admin master
5. **Batch E** — polish

Di tiap batch saya konfirmasi singkat sebelum lanjut.

---

## Konfirmasi sebelum mulai

1. **OK drop tabel `pembayaran` lama** dan ganti `tagihan`? (data test akan hilang)
2. **Setup Lovable Email** sekarang atau nanti di Batch C?
3. Mulai **Batch A** sekarang?
