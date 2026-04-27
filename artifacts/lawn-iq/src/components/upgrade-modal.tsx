import { Sparkles, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStripeProducts, useStartCheckout } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  onClose?: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { data: productsData, isLoading } = useStripeProducts();
  const startCheckout = useStartCheckout();
  const { toast } = useToast();

  const proProduct = productsData?.products?.find((p: any) =>
    p.name?.toLowerCase().includes("pro"),
  );
  const monthlyPrice = proProduct?.prices?.find(
    (p: any) => p.recurring?.interval === "month",
  );

  const handleUpgrade = async () => {
    if (!monthlyPrice?.id) {
      toast({ title: "Price not found", description: "Please try again later.", variant: "destructive" });
      return;
    }
    try {
      const { url } = await startCheckout.mutateAsync(monthlyPrice.id);
      if (url) window.location.href = url;
    } catch {
      toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
        <CardContent className="p-6 space-y-6">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Upgrade to LawnRX Pro</h2>
            <p className="text-muted-foreground text-sm">
              You've used all 5 free analyses. Go Pro for unlimited access and full lawn care tools.
            </p>
          </div>

          <div className="bg-primary/5 rounded-2xl p-5 space-y-3">
            <div className="text-center">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              ) : (
                <>
                  <span className="text-4xl font-bold text-foreground">
                    ${monthlyPrice ? (monthlyPrice.unitAmount / 100).toFixed(2) : "19.99"}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </>
              )}
            </div>

            <ul className="space-y-2.5 text-sm">
              {[
                "Unlimited AI lawn diagnoses",
                "Personalized recovery plans",
                "Fertilizing & care alerts",
                "Seasonal treatment schedules",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </span>
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={startCheckout.isPending || isLoading}
            className="w-full py-6 text-base rounded-xl"
          >
            {startCheckout.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Start Pro — $19.99/month</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime · Secure payment via Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
