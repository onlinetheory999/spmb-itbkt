import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type StepKey =
  | "registrasi" | "pembayaran" | "biodata" | "berkas"
  | "verifikasi" | "kartu" | "kelulusan" | "daftar_ulang";

export type SiswaProgress = {
  loading: boolean;
  siswa: any | null;
  tagihan: any | null;
  daftarUlang: any | null;
  berkas: any | null;
  steps: Record<StepKey, boolean>;
  currentStep: StepKey;
};

const BIODATA_REQUIRED = [
  "nama_lengkap", "nik", "tempat_lahir", "tanggal_lahir",
  "alamat", "nama_ayah", "nama_ibu",
] as const;

export function useSiswaProgress(): SiswaProgress {
  const { user } = useAuth();

  const { data: siswa, isLoading: l1 } = useQuery({
    queryKey: ["siswa-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("siswa").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: tagihanList, isLoading: l2 } = useQuery({
    queryKey: ["tagihan-list", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("tagihan").select("*")
        .eq("siswa_id", siswa!.id).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: berkas, isLoading: l3 } = useQuery({
    queryKey: ["berkas-me", siswa?.id],
    enabled: !!siswa?.id,
    queryFn: async () => {
      const { data } = await supabase.from("upload_berkas").select("*")
        .eq("siswa_id", siswa!.id).maybeSingle();
      return data;
    },
  });

  const tagihan = tagihanList?.find((t: any) => t.jenis === "pendaftaran") ?? null;
  const daftarUlang = tagihanList?.find((t: any) => t.jenis === "daftar_ulang") ?? null;

  const lunas = tagihan?.status === "lunas";
  const biodataLengkap = !!siswa && BIODATA_REQUIRED.every((k) => !!(siswa as any)[k]);
  const berkasLengkap = !!(berkas?.pas_foto && berkas?.kk && berkas?.akta);
  const diverifikasi = siswa?.status_verifikasi === "diverifikasi";
  const lulus = siswa?.status_kelulusan === "lulus" && siswa?.kelulusan_published;
  const daftarUlangLunas = daftarUlang?.status === "lunas";

  const steps: Record<StepKey, boolean> = {
    registrasi: !!user,
    pembayaran: lunas,
    biodata: biodataLengkap && lunas,
    berkas: berkasLengkap && biodataLengkap,
    verifikasi: diverifikasi,
    kartu: diverifikasi,
    kelulusan: lulus || siswa?.status_kelulusan === "tidak_lulus",
    daftar_ulang: daftarUlangLunas,
  };

  const order: StepKey[] = [
    "registrasi", "pembayaran", "biodata", "berkas",
    "verifikasi", "kartu", "kelulusan", "daftar_ulang",
  ];
  const currentStep = order.find((k) => !steps[k]) ?? "daftar_ulang";

  return {
    loading: l1 || l2 || l3,
    siswa: siswa ?? null,
    tagihan,
    daftarUlang,
    berkas: berkas ?? null,
    steps,
    currentStep,
  };
}

export const STEP_ROUTES: Record<StepKey, string> = {
  registrasi: "/siswa",
  pembayaran: "/siswa/invoice",
  biodata: "/siswa/biodata",
  berkas: "/siswa/berkas",
  verifikasi: "/siswa",
  kartu: "/siswa/kartu",
  kelulusan: "/siswa/kelulusan",
  daftar_ulang: "/siswa/daftar-ulang",
};

export const STEP_LABELS: Record<StepKey, string> = {
  registrasi: "Registrasi Akun",
  pembayaran: "Bayar Pendaftaran",
  biodata: "Lengkapi Biodata",
  berkas: "Upload Berkas",
  verifikasi: "Verifikasi Berkas",
  kartu: "Cetak Kartu",
  kelulusan: "Hasil Kelulusan",
  daftar_ulang: "Daftar Ulang",
};
