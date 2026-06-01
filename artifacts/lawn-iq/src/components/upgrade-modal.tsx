import { useState } from "react";
import { Sparkles, Check, Loader2, X, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeProducts, useStartCheckout } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { EmbeddedCheckoutModal } from "@/components/embedded-checkout-modal";

const FALLBACK_MONTHLY_ID = "price_1TdWF5ERekY96iVD8SuQM7AQ";
const FALLBACK_ANNUAL_ID  = "price_1TdWF6ERekY96iVDBUYJIeEu";

interface UpgradeModalProps {
  onClose?: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { data: productsData, isLoading } = useStripeProducts();
  const startCheckout = useStartCheckout();
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [showEmbedded, setShowEmbedded] = useState(false);

  const proProduct = productsData?.products?.find((p: any) =>
    p.name?.toLowerCase().includes("pro"),
  );

  const monthlyPrice = proProduct?.prices?.find(
    (p: any) => p.recurring?.interval === "month" && p.unitAmount === 799,
  );
  const annualPrice = proProduct?.prices?.find(
    (p: any) => p.recurring?.interval === "year",
  );

  const selectedPriceId =
    billing === "annual"
      ? (annualPrice?.id ?? FALLBACK_ANNUAL_ID)
      : (monthlyPrice?.id ?? FALLBACK_MONTHLY_ID);

  const monthlyAmount = monthlyPrice ? (monthlyPrice.unitAmount / 100).toFixed(2) : "7.99";
  const annualAmount  = annualPrice  ? (annualPrice.unitAmount  / 100).toFixed(2) : "59.99";
  const annualMonthly = (parseFloat(annualAmount) / 12).toFixed(2);
  const savings = Math.round((1 - parseFloat(annualMonthly) / parseFloat(monthlyAmount)) * 100);

  const displayPrice  = billing === "annual" ? annualMonthly : monthlyAmount;
  const displaySuffix = billing === "annual" ? "/mo · billed annually" : "/month";

  const handleRedirectCheckout = async () => {
    try {
      const { url } = await startCheckout.mutateAsync(selectedPriceId);
      if (url) window.location.href = url;
    } catch {
      toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
    }
  };

  if (showEmbedded) {
    return (
      <EmbeddedCheckoutModal
        priceId={selectedPriceId}
        onClose={() => setShowEmbedded(false)}
        onSuccess={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">

        {/* Green header band */}
        <div className="bg-emerald-700 px-6 pt-6 pb-8 text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">LawnRX Pro</h2>
          <p className="text-emerald-200 text-sm mt-1">
            You've used your 3 free diagnoses this month.<br />Upgrade for unlimited access.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-5 -mt-4">

          {/* Billing toggle */}
          <div className="bg-muted rounded-2xl p-1 flex relative">
            <button
              onClick={() => setBilling("monthly")}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                billing === "monthly"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                billing === "annual"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Annual
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                SAVE {savings}%
              </span>
            </button>
          </div>

          {/* Price display */}
          <div className="text-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-foreground">${displayPrice}</span>
                  <span className="text-muted-foreground text-sm">{displaySuffix}</span>
                </div>
                {billing === "annual" && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    ${annualAmount} billed once · save ${(parseFloat(monthlyAmount) * 12 - parseFloat(annualAmount)).toFixed(2)}/year
                  </p>
                )}
              </>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-2 text-sm">
            {[
              "Unlimited AI lawn diagnoses",
              "Full step-by-step recovery plans",
              "Personalised treatment advice",
              "Fertilizing & care alerts",
              "Seasonal treatment schedules",
              "Priority support",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </span>
                <span className="text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Apple/Google Pay */}
          <Button
            onClick={() => setShowEmbedded(true)}
            disabled={isLoading}
            className="w-full py-6 text-base rounded-xl bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/90 dark:text-black text-white gap-2"
          >
            <Zap className="w-4 h-4" />
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
            className="w-full py-5 rounded-xl gap-2 border-emerald-600/40 hover:border-emerald-600"
          >
            {startCheckout.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
            ) : (
              <><CreditCard className="w-4 h-4" />
                {billing === "annual"
                  ? `Pay with Card — $${annualAmount}/year`
                  : `Pay with Card — $${monthlyAmount}/mo`}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime · Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
