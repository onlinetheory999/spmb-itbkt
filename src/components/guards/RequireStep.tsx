import { Navigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiswaProgress, StepKey, STEP_LABELS, STEP_ROUTES } from "@/hooks/use-siswa-progress";

/**
 * Block a child route until all listed prerequisite steps are done.
 * If a prerequisite is missing, render a lock screen with CTA.
 */
export function RequireStep({
  requires,
  children,
}: {
  requires: StepKey[];
  children: React.ReactNode;
}) {
  const prog = useSiswaProgress();

  if (prog.loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const missing = requires.find((k) => !prog.steps[k]);
  if (!missing) return <>{children}</>;

  return (
    <Card className="max-w-xl mx-auto p-8 text-center">
      <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-amber-500/10 text-amber-600 mb-4">
        <Lock className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">Tahap ini belum bisa diakses</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Selesaikan tahap <span className="font-medium text-foreground">{STEP_LABELS[missing]}</span> terlebih dahulu untuk melanjutkan.
      </p>
      <Button asChild className="mt-5 bg-gradient-primary">
        <Link to={STEP_ROUTES[missing]}>Ke tahap {STEP_LABELS[missing]}</Link>
      </Button>
    </Card>
  );
}

export function RedirectToCurrentStep() {
  const prog = useSiswaProgress();
  if (prog.loading) return null;
  return <Navigate to={STEP_ROUTES[prog.currentStep]} replace />;
}
