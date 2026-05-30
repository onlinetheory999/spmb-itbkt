export const formatIDR = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? Number(n) : (n ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0);
};

export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const generateVA = (kodeSekolah: string, noHp: string) => {
  const cleanHp = (noHp || "").replace(/\D/g, "").slice(-10).padStart(10, "0");
  return `${kodeSekolah}${cleanHp}`;
};

export const generateNomorPeserta = (jenjang: string, tahun: string) => {
  const prefix = { SD: "1", SMP: "2", SMA: "3" }[jenjang] ?? "0";
  const year = tahun.replace(/\D/g, "").slice(0, 4) || new Date().getFullYear().toString();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${year}${prefix}${rnd}`;
};
