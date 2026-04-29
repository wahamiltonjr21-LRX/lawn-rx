import { useState, useRef } from "react";
import { Camera, Upload, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAnalyzeLawn, useSaveDiagnosis, useGetDiagnosisUsage, getListDiagnosesQueryKey, getGetDiagnosesSummaryQueryKey, getGetDiagnosisUsageQueryKey, IssueAppearance, GrassType, type Diagnosis } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeModal } from "@/components/upgrade-modal";
import { DiagnosisResult } from "@/components/diagnosis-result";

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [issueAppearance, setIssueAppearance] = useState<IssueAppearance>(IssueAppearance.Yellow_grass);
  const [grassType, setGrassType] = useState<GrassType>(GrassType.Unknown);
  const [description, setDescription] = useState("");
  const [currentDiagnosis, setCurrentDiagnosis] = useState<Diagnosis | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const analyzeLawn = useAnalyzeLawn();
  const saveDiagnosis = useSaveDiagnosis();
  const { data: usage } = useGetDiagnosisUsage();
  const { data: subData } = useSubscription();
  const isPro = subData?.isPro === true;
  const remaining = usage?.remaining ?? null;
  const limitReached = !isPro && remaining !== null && remaining <= 0;

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
      setCurrentDiagnosis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!photo) {
      toast({
        title: "Photo required",
        description: "Please upload a photo of your lawn first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await analyzeLawn.mutateAsync({
        data: {
          photoDataUrl: photo,
          issueAppearance,
          grassType,
          description: description || undefined,
        },
      });
      setCurrentDiagnosis(result);
      queryClient.invalidateQueries({ queryKey: getGetDiagnosisUsageQueryKey() });

      // Smooth scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);

    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? Number((error as { status?: number }).status)
          : null;
      if (status === 403) {
        queryClient.invalidateQueries({ queryKey: getGetDiagnosisUsageQueryKey() });
        setShowUpgradeModal(true);
      } else {
        toast({
          title: "Analysis failed",
          description: "We couldn't analyze the photo. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!currentDiagnosis) return;

    try {
      await saveDiagnosis.mutateAsync({
        data: {
          diagnosis: currentDiagnosis,
        },
      });
      
      toast({
        title: "Plan saved!",
        description: "Your recovery plan has been saved to My Plans.",
      });
      
      queryClient.invalidateQueries({ queryKey: getListDiagnosesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiagnosesSummaryQueryKey() });
      
      setLocation("/plans");
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save your plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="space-y-2 text-center md:text-left mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Diagnose Your Lawn</h1>
        <p className="text-muted-foreground text-lg">Snap a photo, tell us what's wrong, and get a step-by-step recovery plan.</p>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Lawn Photo
            </h2>
            
            {photo ? (
              <div className="relative group rounded-2xl overflow-hidden border-2 border-primary/50 bg-primary/5">
                <div className="relative aspect-video w-full">
                  <img src={photo} alt="Lawn issue" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 p-3 border-t border-primary/10 bg-primary/5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-1.5" /> Retake
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1.5" /> Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
                <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Add a lawn photo</h3>
                    <p className="text-sm text-muted-foreground max-w-[260px]">
                      Take a new photo or upload one from your device.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="default"
                      className="rounded-xl"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4 mr-2" /> Take Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Upload Image
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <h2 className="text-xl font-semibold">Lawn Details</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">What's the main issue?</label>
                <select
                  value={issueAppearance}
                  onChange={(e) => setIssueAppearance(e.target.value as IssueAppearance)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                >
                  {Object.values(IssueAppearance).map((issue) => (
                    <option key={issue} value={issue}>{issue}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Grass type (if known)</label>
                <select
                  value={grassType}
                  onChange={(e) => setGrassType(e.target.value as GrassType)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                >
                  {Object.values(GrassType).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Additional details (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., The spots appeared after the heavy rain last week..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3">
            {usage && (
              <div
                data-testid="text-usage"
                className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm border ${
                  limitReached
                    ? "bg-destructive/5 border-destructive/30 text-destructive"
                    : remaining !== null && remaining <= 2
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300"
                      : "bg-primary/5 border-primary/20 text-foreground/80"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4" />
                  {limitReached
                    ? "Free analysis limit reached"
                    : `${usage.remaining} of ${usage.limit} free AI analyses left`}
                </span>
                <span className="text-xs opacity-70">{usage.used} used</span>
              </div>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={analyzeLawn.isPending || !photo || limitReached}
              className="w-full py-6 text-lg rounded-xl shadow-md relative overflow-hidden group"
              data-testid="button-analyze"
            >
              {analyzeLawn.isPending ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse" /> Analyzing Lawn...
                </span>
              ) : limitReached ? (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Free Limit Reached
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Get Recovery Plan
                </span>
              )}

              {analyzeLawn.isPending && (
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {limitReached && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-4">
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="rounded-xl px-8"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Upgrade to Pro — $19.99/month
          </Button>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {analyzeLawn.isPending && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-400">
          <Card className="border-2 border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 to-emerald-50/50 dark:from-primary/10 dark:to-emerald-950/20 p-8 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-primary/50 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-foreground">Analyzing Your Lawn…</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Our AI agronomist is examining the photo, identifying patterns, and building your personalized recovery plan.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                {["Examining photo", "Identifying issue", "Building plan"].map((step, i) => (
                  <span
                    key={step}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary/70 font-medium"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {currentDiagnosis && !analyzeLawn.isPending && (
        <DiagnosisResult
          diagnosis={currentDiagnosis}
          onSave={handleSave}
          isSaving={saveDiagnosis.isPending}
        />
      )}
    </div>
  );
}