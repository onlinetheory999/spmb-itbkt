import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const TONE_CLS: Record<Tone, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-primary/15 text-primary border-primary/30",
  muted: "bg-muted text-muted-foreground border-border",
};

/** Map status string → tone + indonesian label */
const STATUS_MAP: Record<string, { tone: Tone; label: string }> = {
  // tagihan
  belum_bayar: { tone: "danger", label: "Belum Bayar" },
  menunggu_verifikasi: { tone: "warning", label: "Menunggu Verifikasi" },
  lunas: { tone: "success", label: "Lunas" },
  // kelulusan
  belum: { tone: "muted", label: "Belum Diumumkan" },
  lulus: { tone: "success", label: "Lulus" },
  tidak_lulus: { tone: "danger", label: "Tidak Lulus" },
  // berkas
  belum_upload: { tone: "muted", label: "Belum Upload" },
  menunggu: { tone: "warning", label: "Menunggu" },
  diverifikasi: { tone: "success", label: "Disetujui" },
  ditolak: { tone: "danger", label: "Ditolak" },
  // akun
  aktif: { tone: "success", label: "Aktif" },
  nonaktif: { tone: "muted", label: "Nonaktif" },
};

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status?: string | null;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const meta = (status && STATUS_MAP[status]) || { tone: tone ?? "muted", label: label ?? status ?? "-" };
  const t = tone ?? meta.tone;
  return (
    <Badge variant="outline" className={cn(TONE_CLS[t], "border font-medium", className)}>
      {label ?? meta.label}
    </Badge>
  );
}
