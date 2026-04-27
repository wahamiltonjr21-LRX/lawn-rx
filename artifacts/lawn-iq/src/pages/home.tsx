import { useState, useRef } from "react";
import { Camera, Upload, Sparkles, AlertTriangle, Droplets, Sun, Activity, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAnalyzeLawn, useSaveDiagnosis, useGetDiagnosisUsage, getListDiagnosesQueryKey, getGetDiagnosesSummaryQueryKey, getGetDiagnosisUsageQueryKey, IssueAppearance, GrassType, type Diagnosis } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeModal } from "@/components/upgrade-modal";

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

      {currentDiagnosis && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-6">
          <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
            <div className="bg-primary/5 p-6 border-b border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
                    ${currentDiagnosis.severity === 'High' ? 'bg-destructive/10 text-destructive' : 
                      currentDiagnosis.severity === 'Medium' ? 'bg-orange-500/10 text-orange-600' : 
                      'bg-primary/10 text-primary'}`}
                  >
                    {currentDiagnosis.severity} Severity
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> {currentDiagnosis.confidence}% Confident
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">{currentDiagnosis.title}</h2>
              </div>
              
              <div className="flex items-center gap-4 bg-background px-4 py-3 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Health</span>
                  <span className="text-2xl font-bold leading-none text-foreground">{currentDiagnosis.healthScore}<span className="text-sm text-muted-foreground font-normal">/100</span></span>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                     style={{ background: `conic-gradient(hsl(var(--primary)) ${currentDiagnosis.healthScore}%, hsl(var(--muted)) 0)` }}>
                  <div className="w-9 h-9 bg-background rounded-full" />
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="prose prose-sm md:prose-base prose-green max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed text-foreground/90 font-medium">{currentDiagnosis.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                    <Droplets className="w-5 h-5" /> Water
                  </div>
                  <p className="text-sm text-blue-900/80 dark:text-blue-200/80">{currentDiagnosis.waterAdvice}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                    <Sun className="w-5 h-5" /> Light & Care
                  </div>
                  <p className="text-sm text-amber-900/80 dark:text-amber-200/80">{currentDiagnosis.lightAdvice}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-2">
                    <AlertTriangle className="w-5 h-5" /> Risk
                  </div>
                  <p className="text-sm text-rose-900/80 dark:text-rose-200/80">{currentDiagnosis.riskAdvice}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Recovery Plan</h3>
                <div className="space-y-3">
                  {currentDiagnosis.steps.map((step, index) => (
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

              <Button 
                onClick={handleSave} 
                disabled={saveDiagnosis.isPending}
                size="lg"
                className="w-full rounded-xl"
              >
                <Save className="w-5 h-5 mr-2" />
                {saveDiagnosis.isPending ? "Saving..." : "Save Plan to Dashboard"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}