import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Trash2, CalendarDays, Leaf } from "lucide-react";
import { useGetDiagnosis, useDeleteDiagnosis, getListDiagnosesQueryKey, getGetDiagnosesSummaryQueryKey, getGetDiagnosisQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DiagnosisResult } from "@/components/diagnosis-result";

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
    } catch {
      toast({ title: "Failed to delete", description: "Please try again later.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-full h-56 rounded-3xl" />
        <Skeleton className="w-full h-80 rounded-2xl" />
        <Skeleton className="w-full h-48 rounded-2xl" />
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Leaf className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Plan not found</h2>
        <Button onClick={() => setLocation("/plans")} variant="outline" className="rounded-xl">
          Back to Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Nav header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="-ml-4 text-muted-foreground hover:text-foreground rounded-xl"
          onClick={() => setLocation("/plans")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Plans
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleteDiagnosis.isPending}
          className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleteDiagnosis.isPending ? "Deleting…" : "Delete"}
        </Button>
      </div>

      {/* Photo */}
      {diagnosis.photoDataUrl && (
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-muted shadow-lg border border-border">
          <img src={diagnosis.photoDataUrl} alt={diagnosis.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          {format(new Date(diagnosis.createdAt), "MMMM d, yyyy")}
        </span>
        {diagnosis.grassType && diagnosis.grassType !== "Unknown" && (
          <span className="px-3 py-1.5 rounded-full bg-primary/8 text-primary border border-primary/15 text-xs font-medium">
            {diagnosis.grassType}
          </span>
        )}
        {diagnosis.issueAppearance && (
          <span className="px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-muted-foreground text-xs">
            {diagnosis.issueAppearance}
          </span>
        )}
        {diagnosis.description && (
          <span className="text-xs text-muted-foreground italic px-2">"{diagnosis.description}"</span>
        )}
      </div>

      {/* Full diagnosis detail */}
      <DiagnosisResult diagnosis={diagnosis} showSaveButton={false} />
    </div>
  );
}
