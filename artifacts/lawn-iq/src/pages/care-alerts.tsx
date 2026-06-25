import { Bell, Droplets, Sun, Leaf, Calendar, Loader2, Sparkles, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription, useStartCheckout, useStripeProducts } from "@/hooks/use-subscription";
import { useGetDiagnosisUsage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

const ALERTS = [
  {
    icon: Droplets,
    color: "blue",
    title: "Watering Schedule",
    description: "Water deeply 2–3 times per week in the morning to prevent fungal issues. Reduce during rain periods.",
    badge: "This Week",
  },
  {
    icon: Leaf,
    color: "green",
    title: "Fertilizer Application",
    description: "Apply a balanced slow-release fertilizer (10-10-10) this month. Avoid fertilizing during drought stress.",
    badge: "Due Soon",
  },
  {
    icon: Sun,
    color: "amber",
    title: "Mowing Height",
    description: "Raise mowing height to 3.5\" for summer heat stress. Never remove more than 1/3 of the blade at once.",
    badge: "Ongoing",
  },
  {
    icon: Bell,
    color: "rose",
    title: "Pre-emergent Weed Control",
    description: "Apply pre-emergent herbicide before soil temperatures reach 55°F to prevent crabgrass germination.",
    badge: "Next Month",
  },
  {
    icon: Calendar,
    color: "purple",
    title: "Aeration & Overseeding",
    description: "Schedule core aeration and overseeding for early fall when temperatures cool to 60–75°F.",
    badge: "Fall",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400",
  green: "bg-primary/5 border-primary/10 text-primary",
  amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400",
  rose: "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400",
  purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400",
};

const badgeMap: Record<string, string> = {
  blue: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  green: "bg-primary/10 text-primary",
  amber: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
  purple: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
};

export default function CareAlerts() {
  const { data: subData, isLoading } = useSubscription();
  const { data: usage } = useGetDiagnosisUsage();
  const isPro = usage?.isPro === true || subData?.isPro === true;
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Care Alerts
          {isPro && (
            <span className="text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              Pro
            </span>
          )}
        </h1>
        <p className="text-muted-foreground text-lg">
          Seasonal lawn care reminders tailored to your grass type and region.
        </p>
      </div>

      {!isPro ? (
        <Card className="border-2 border-primary/20 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-amber-50/50 dark:from-primary/10 dark:to-amber-950/20 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pro Feature</h2>
              <p className="text-muted-foreground mt-1 max-w-xs mx-auto text-sm">
                Upgrade to LawnRX Pro to unlock personalized fertilizing & care alerts.
              </p>
            </div>
            <Button onClick={() => setShowUpgrade(true)} className="rounded-xl px-6">
              <Sparkles className="w-4 h-4 mr-2" /> Upgrade for $7.99/month
            </Button>
          </div>

          <CardContent className="p-6 space-y-3 opacity-40 pointer-events-none select-none">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Preview</p>
            {ALERTS.slice(0, 2).map((alert) => (
              <div key={alert.title} className="h-16 rounded-xl bg-muted/50 border border-border/50 blur-[2px]" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ALERTS.map((alert) => {
            const Icon = alert.icon;
            const colors = colorMap[alert.color];
            const badgeColors = badgeMap[alert.color];
            return (
              <Card key={alert.title} className={`border overflow-hidden ${colors}`}>
                <CardContent className="p-5 flex gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${colors}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{alert.title}</h3>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColors}`}>
                        {alert.badge}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
