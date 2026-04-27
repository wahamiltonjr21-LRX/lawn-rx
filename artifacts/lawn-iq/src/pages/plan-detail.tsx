import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { Activity, Droplets, Sun, AlertTriangle, ArrowLeft, Trash2, CalendarDays } from "lucide-react";
import { useGetDiagnosis, useDeleteDiagnosis, getListDiagnosesQueryKey, getGetDiagnosesSummaryQueryKey, getGetDiagnosisQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function PlanDetail() {
  const [, params] = useRoute("/plans/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: diagnosis, isLoading } = useGetDiagnosis(id, {
    query: { enabled: !!id, queryKey: getGetDiagnosisQueryKey(id) },
  });

  const deleteDiagnosis = useDeleteDiagnosis();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recovery plan?")) return;

    try {
      await deleteDiagnosis.mutateAsync({ id });
      toast({ title: "Plan deleted" });
      queryClient.invalidateQueries({ queryKey: getListDiagnosesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiagnosesSummaryQueryKey() });
      setLocation("/plans");
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-full h-64 rounded-2xl" />
        <Skeleton className="w-full h-32 rounded-2xl" />
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Plan not found</h2>
        <Button onClick={() => setLocation("/plans")} variant="outline">Back to Plans</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <Button 
        variant="ghost" 
        className="mb-2 -ml-4 text-muted-foreground hover:text-foreground"
        onClick={() => setLocation("/plans")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Plans
      </Button>

      {diagnosis.photoDataUrl && (
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-muted shadow-md border border-border">
          <img src={diagnosis.photoDataUrl} alt={diagnosis.title} className="w-full h-full object-cover" />
        </div>
      )}

      <Card className="overflow-hidden border-2 border-border shadow-lg">
        <div className="bg-muted/30 p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
                ${diagnosis.severity === 'High' ? 'bg-destructive/10 text-destructive' : 
                  diagnosis.severity === 'Medium' ? 'bg-orange-500/10 text-orange-600' : 
                  'bg-primary/10 text-primary'}`}
              >
                {diagnosis.severity} Severity
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> {format(new Date(diagnosis.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{diagnosis.title}</h1>
            
            <div className="flex gap-3 mt-3 text-sm text-muted-foreground">
              {diagnosis.grassType && diagnosis.grassType !== "Unknown" && (
                <span className="bg-background px-2 py-1 rounded-md border shadow-sm">Grass: {diagnosis.grassType.replace("_", " ")}</span>
              )}
              {diagnosis.issueAppearance && (
                <span className="bg-background px-2 py-1 rounded-md border shadow-sm">Issue: {diagnosis.issueAppearance.replace(/_/g, " ")}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-background px-4 py-3 rounded-2xl border border-border shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Health</span>
              <span className="text-2xl font-bold leading-none text-foreground">{diagnosis.healthScore}<span className="text-sm text-muted-foreground font-normal">/100</span></span>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                 style={{ background: `conic-gradient(hsl(var(--primary)) ${diagnosis.healthScore}%, hsl(var(--muted)) 0)` }}>
              <div className="w-9 h-9 bg-background rounded-full" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="prose prose-sm md:prose-base prose-green max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed text-foreground/90 font-medium">{diagnosis.summary}</p>
            {diagnosis.description && (
              <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border/50 text-sm">
                <strong className="text-foreground">Your notes:</strong> {diagnosis.description}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                <Droplets className="w-5 h-5" /> Water
              </div>
              <p className="text-sm text-blue-900/80 dark:text-blue-200/80">{diagnosis.waterAdvice}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                <Sun className="w-5 h-5" /> Light & Care
              </div>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80">{diagnosis.lightAdvice}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-2">
                <AlertTriangle className="w-5 h-5" /> Risk
              </div>
              <p className="text-sm text-rose-900/80 dark:text-rose-200/80">{diagnosis.riskAdvice}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">Recovery Plan</h3>
            <div className="space-y-3">
              {diagnosis.steps.map((step, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                    {step.timing && (
                      <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/5 px-2.5 py-1 rounded-md">
                        ⏱ {step.timing}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteDiagnosis.isPending}
              className="rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteDiagnosis.isPending ? "Deleting..." : "Delete Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}