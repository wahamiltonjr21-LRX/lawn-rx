import { Link } from "wouter";
import { format } from "date-fns";
import { Leaf, Activity, ArrowRight, Trash2, Sparkles } from "lucide-react";
import { useListDiagnoses, useGetDiagnosesSummary, useDeleteDiagnosis, useGetDiagnosisUsage, useGetUpgradeRequest, getListDiagnosesQueryKey, getGetDiagnosesSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import emptyPlansImg from "@/assets/images/empty-plans.png";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Plans() {
  const { data: diagnoses, isLoading: isLoadingDiagnoses } = useListDiagnoses();
  const { data: summary, isLoading: isLoadingSummary } = useGetDiagnosesSummary();
  const { data: usage } = useGetDiagnosisUsage();
  const { data: upgradeRequest } = useGetUpgradeRequest();
  const deleteDiagnosis = useDeleteDiagnosis();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const limitReached = usage !== undefined && usage.remaining <= 0;
  const alreadyRequested = upgradeRequest?.submitted === true;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this recovery plan?")) return;

    try {
      await deleteDiagnosis.mutateAsync({ id });
      toast({ title: "Plan deleted" });
      queryClient.invalidateQueries({ queryKey: getListDiagnosesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiagnosesSummaryQueryKey() });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const isEmpty = !isLoadingDiagnoses && (!diagnoses || diagnoses.length === 0);

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">My Plans</h1>
        <p className="text-muted-foreground text-lg">Track your lawn's journey to perfect health.</p>
      </div>

      {limitReached && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
          alreadyRequested
            ? "bg-primary/5 border-primary/20 text-foreground/80"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
        }`}>
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            {alreadyRequested
              ? "Upgrade request received — we'll unlock more analyses for you soon."
              : "You've used all 2 free AI analyses."}
          </span>
          {!alreadyRequested && (
            <Link href="/">
              <Button size="sm" variant="outline" className="shrink-0 rounded-lg border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                Request more
              </Button>
            </Link>
          )}
        </div>
      )}

      {!isEmpty && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full space-y-1">
              {isLoadingSummary ? <Skeleton className="w-12 h-8" /> : <span className="text-3xl font-bold text-primary">{summary?.totalSaved || 0}</span>}
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Plans</span>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full space-y-1">
              {isLoadingSummary ? <Skeleton className="w-12 h-8" /> : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">{summary?.averageHealthScore ? Math.round(summary.averageHealthScore) : 0}</span>
                  <span className="text-sm text-blue-700/60 dark:text-blue-400/60">/100</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Avg Health</span>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm col-span-2">
            <CardContent className="p-4 flex flex-col justify-center h-full space-y-3">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Severity Breakdown</span>
              {isLoadingSummary ? <Skeleton className="w-full h-8" /> : (
                <div className="flex w-full h-8 rounded-lg overflow-hidden border border-border">
                  {summary?.severityCounts.High ? <div style={{ width: `${(summary.severityCounts.High / summary.totalSaved) * 100}%` }} className="bg-destructive" title={`High: ${summary.severityCounts.High}`} /> : null}
                  {summary?.severityCounts.Medium ? <div style={{ width: `${(summary.severityCounts.Medium / summary.totalSaved) * 100}%` }} className="bg-orange-500" title={`Medium: ${summary.severityCounts.Medium}`} /> : null}
                  {summary?.severityCounts.Low ? <div style={{ width: `${(summary.severityCounts.Low / summary.totalSaved) * 100}%` }} className="bg-primary/60" title={`Low: ${summary.severityCounts.Low}`} /> : null}
                </div>
              )}
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-1">
                <span>{summary?.severityCounts.High || 0} High</span>
                <span>{summary?.severityCounts.Medium || 0} Med</span>
                <span>{summary?.severityCounts.Low || 0} Low</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoadingDiagnoses ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-full h-32 rounded-2xl" />
          ))}
        </div>
      ) : isEmpty ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center text-center p-10">
            <img src={emptyPlansImg} alt="No plans yet" className="w-48 h-48 object-contain mix-blend-multiply dark:mix-blend-screen opacity-80 mb-6" />
            <h3 className="text-xl font-bold mb-2">No recovery plans yet</h3>
            <p className="text-muted-foreground max-w-[300px] mb-6">
              When you diagnose an issue on the home screen, you can save the recovery plan here.
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-xl">
                Diagnose a Problem <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {diagnoses?.map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {plan.photoDataUrl && (
                    <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-muted">
                      <img src={plan.photoDataUrl} alt={plan.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{plan.title}</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-1 -mr-2"
                          onClick={(e) => handleDelete(plan.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{plan.summary}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Activity className="w-3.5 h-3.5" />
                        Score: {plan.healthScore}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${
                        plan.severity === 'High' ? 'bg-destructive/10 text-destructive' : 
                        plan.severity === 'Medium' ? 'bg-orange-500/10 text-orange-600' : 
                        'bg-primary/10 text-primary'
                      }`}>
                        {plan.severity}
                      </span>
                      <span className="text-muted-foreground/60 ml-auto">
                        {format(new Date(plan.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}