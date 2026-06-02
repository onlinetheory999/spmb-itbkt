
# Rencana Pengerjaan (4 Batch)

Skala besar — total ~40 file dirombak dan beberapa migrasi DB. Saya kerjakan **per batch**, minta persetujuan/test setelah tiap batch sebelum lanjut.

## Batch 0 — Migrasi Skema DB (jalankan dulu)

Pondasi untuk semua fitur baru. Satu migrasi tunggal:

- Tambah enum `jenis_kelamin` (`L`, `P`).
- Tabel `siswa`: kolom baru `jenis_kelamin jenis_kelamin NOT NULL DEFAULT 'L'` (siswa lama default L, bisa diedit).
- Tabel `jenjang`: tambah `kuota_l int DEFAULT 0`, `kuota_p int DEFAULT 0`, `kode_va text` (misal "201" SD, "202" SMP, "203" SMA). Kolom `kuota` lama tetap (= kuota_l + kuota_p sebagai info).
- Tabel `jadwal`: tambah `tanggal_selesai date` (rentang).
- Function `public.cek_kuota(jenjang, jenis_kelamin)` SECURITY DEFINER → return boolean (true = masih ada slot).
- Trigger `before insert on siswa` → tolak insert kalau kuota L/P sudah penuh, dengan pesan: `kuota_penuh:L` / `kuota_penuh:P`.
- Trigger `before insert on pembayaran` → otomatis isi `nomor_va` dari `jenjang.kode_va + no_hp` jika kosong.
- Storage policy: bucket `website-public` izinkan admin upload (hero images).

## Batch 1 — Refactor ke React Router DOM SPA

Ganti TanStack Router/Start sepenuhnya. ~30 file rute disentuh.

**Hapus:**
- `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@tanstack/router-devtools`, `nitropack`, `vinxi` (jika ada), `src/start.ts`, `src/server.ts`, `src/router.tsx`, `src/routeTree.gen.ts`, `index.hostinger.html`, `vite.config.hostinger.ts`, semua server-fn middleware Supabase.

**Tambah:**
- `react-router-dom@^6`.
- `vite.config.ts` baru: plain React + Tailwind v4 plugin, output `dist/`.
- `index.html` (root) sebagai entry SPA tunggal.
- `src/main.tsx` mount `<BrowserRouter>` → `<App />`.
- `src/App.tsx` berisi semua `<Routes>` dengan `<Route>` per halaman.
- `src/routes/*` dipindah ke `src/pages/*` sebagai komponen biasa (tanpa `createFileRoute`). Semua `Link`/`useNavigate` dari `@tanstack/react-router` diganti `react-router-dom`.
- `RequireAuth` & `RequireAdmin` wrapper component menggunakan `useAuth()` yang sudah ada.
- `public/.htaccess` SPA fallback sudah ada — dipakai apa adanya.
- Script `package.json`: `"build": "vite build"`, `"dev": "vite"`.

**Hasil:** `npm run build` → `dist/index.html` + assets, langsung upload ke `public_html`.

## Batch 2 — Register + Gender + Auto-tolak Kuota

- Form `/register`: tambah field **Jenis Kelamin** (radio L/P) + sebelum submit panggil `cek_kuota` RPC. Jika penuh, tampilkan toast: *"Maaf, kuota untuk siswa laki-laki/perempuan jenjang X sudah penuh."* dan blokir submit.
- Sisipkan `jenis_kelamin` ke insert `siswa`. Tangani error trigger `kuota_penuh:*` dengan pesan ramah.
- Halaman publik `/jenjang` (jika ada) tampilkan progress L/P real-time dari count siswa.

## Batch 3 — CRUD Lengkap Super Admin

**Data Siswa (`/admin/siswa`):**
- Kolom baru: Jenis Kelamin, Status Akun.
- Aksi per row (super_admin only): Verifikasi, Tolak, **Nonaktifkan** (set `status_akun='nonaktif'`), **Aktifkan kembali**, Edit biodata, Lihat detail.
- Filter: jenjang, status, jenis kelamin. Search nama/email/nomor.

**Jenjang & Biaya (`/admin/jenjang`):**
- CRUD penuh: tombol "Tambah Jenjang", edit inline existing, hapus dengan konfirmasi.
- Field per jenjang: Nama, Kode, Biaya, **Kuota L**, **Kuota P**, **Kode VA**, Jadwal Seleksi, Deskripsi, Status (dibuka/ditutup).
- Tampilkan progress: `terisi_l / kuota_l` & `terisi_p / kuota_p` dengan bar.

**Pembayaran (`/admin/pembayaran`):**
- Tombol **"Simulasi Bayar VA Nagari"** per row pending → set `status='lunas'`, `tanggal_bayar=now()`, `metode='VA Nagari (Simulasi)'`. Catatan: *"Simulasi — production akan otomatis dari webhook VA Nagari"*.
- Tombol manual approve/reject tetap ada.

**Jadwal (`/admin/jadwal`):**
- Form: `tanggal_mulai` & `tanggal_selesai` (date range picker). Tampil di publik sebagai "1 Juli – 15 Juli 2026".

## Batch 4 — Hero Slider Upload + Polish UI

- `/admin/hero`: input file (`accept="image/jpeg,image/jpg,image/png"`, max 2MB). Upload ke bucket `website-public/hero/{uuid}.{ext}` via `supabase.storage`, simpan public URL ke `hero_slides.image_url`. Preview thumbnail, hapus file lama saat di-replace.
- Pengaturan akun semua role di `/admin/akun`: tabel `profiles` + `user_roles`, super_admin bisa ubah role (promote admin / demote siswa), reset password (kirim email), nonaktifkan.
- Polish: semua tabel responsif (card view di mobile), gradient header konsisten, badge status berwarna, skeleton loader.

---

## Detail Teknis

**Migrasi trigger kuota (inti Batch 0):**
```sql
create or replace function public.enforce_kuota()
returns trigger language plpgsql security definer set search_path=public as $$
declare terisi int; kuota int;
begin
  select case when new.jenis_kelamin='L' then kuota_l else kuota_p end
    into kuota from jenjang where kode = new.jenjang;
  select count(*) into terisi from siswa
    where jenjang = new.jenjang and jenis_kelamin = new.jenis_kelamin
      and status_akun <> 'nonaktif';
  if terisi >= kuota then
    raise exception 'kuota_penuh:%', new.jenis_kelamin using errcode='P0001';
  end if;
  return new;
end $$;
```

**Routing baru (Batch 1) — `src/App.tsx`:**
```tsx
<BrowserRouter>
  <Routes>
    <Route element={<PublicLayout/>}>
      <Route index element={<Home/>}/>
      <Route path="informasi" element={<Informasi/>}/>
      {/* ... */}
    </Route>
    <Route path="login" element={<Login/>}/>
    <Route path="register" element={<Register/>}/>
    <Route element={<RequireAuth/>}>
      <Route path="siswa/*" element={<SiswaShell/>}/>
      <Route element={<RequireAdmin/>}>
        <Route path="admin/*" element={<AdminShell/>}/>
      </Route>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes>
</BrowserRouter>
```

**Catatan penting:**
- Tabel `user_roles` saat ini tidak punya policy INSERT/UPDATE/DELETE. Batch 3 akan menambah policy yang membolehkan **super_admin** mengelola roles user lain.
- Setelah Batch 1 selesai, struktur folder berubah signifikan (`src/routes/` → `src/pages/`). Iterasi berikutnya akan terasa beda.

---

## Urutan Eksekusi

Saya akan kerjakan **Batch 0 dulu** (migrasi DB) di pesan ini setelah plan disetujui. Selesaikan migrasi → test → lalu lanjut Batch 1, dst. Setiap batch akan minta konfirmasi sebelum lanjut ke batch berikutnya.

Setuju lanjut dengan rencana ini?
