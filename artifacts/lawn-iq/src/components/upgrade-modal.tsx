import { useState } from "react";
import { Sparkles, Check, Loader2, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStripeProducts, useStartCheckout } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { EmbeddedCheckoutModal } from "@/components/embedded-checkout-modal";

interface UpgradeModalProps {
  onClose?: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { data: productsData, isLoading } = useStripeProducts();
  const startCheckout = useStartCheckout();
  const { toast } = useToast();
  const [showEmbedded, setShowEmbedded] = useState(false);

  const proProduct = productsData?.products?.find((p: any) =>
    p.name?.toLowerCase().includes("pro"),
  );
  const monthlyPrice = proProduct?.prices?.find(
    (p: any) => p.recurring?.interval === "month",
  );

  const priceDisplay = monthlyPrice
    ? `$${(monthlyPrice.unitAmount / 100).toFixed(2)}`
    : "$9.99";

  const handleRedirectCheckout = async () => {
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

  if (showEmbedded) {
    return (
      <EmbeddedCheckoutModal
        onClose={() => setShowEmbedded(false)}
        onSuccess={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
        <CardContent className="p-6 space-y-5">
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
              You've used all 2 free analyses. Go Pro for unlimited access and full lawn care tools.
            </p>
          </div>

          <div className="bg-primary/5 rounded-2xl p-5 space-y-3">
            <div className="text-center">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              ) : (
                <>
                  <span className="text-4xl font-bold text-foreground">{priceDisplay}</span>
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

          {/* Express Checkout — Apple Pay / Google Pay / Link */}
          <Button
            onClick={() => setShowEmbedded(true)}
            disabled={isLoading || !monthlyPrice}
            className="w-full py-6 text-base rounded-xl bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/90 dark:text-black text-white gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Pay with Apple Pay / Google Pay
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or pay with card</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            onClick={handleRedirectCheckout}
            disabled={startCheckout.isPending || isLoading}
            className="w-full py-5 rounded-xl gap-2"
          >
            {startCheckout.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pay with Card — {priceDisplay}/mo</>
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
