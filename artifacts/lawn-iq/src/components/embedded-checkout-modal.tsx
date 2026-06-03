import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, Elements } from "@stripe/react-stripe-js";
import { X, Loader2 } from "lucide-react";

const BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? "").replace(/\/$/, "");

interface EmbeddedCheckoutModalProps {
  priceId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmbeddedCheckoutModal({ priceId, onClose }: EmbeddedCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const configRes = await fetch(`${BASE}/api/stripe/config`, { credentials: "include" });
        const { publishableKey: pk } = await configRes.json();
        setPublishableKey(pk);

        const checkoutRes = await fetch(`${BASE}/api/stripe/embedded-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ priceId }),
        });
        const data = await checkoutRes.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error ?? "Failed to start checkout.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    }
    init();
  }, [priceId]);

  const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-bold text-lg leading-tight">Upgrade to LawnRX Pro</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Unlimited diagnoses · Cancel anytime</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {error && (
            <div className="p-6 text-center text-sm text-destructive">{error}</div>
          )}

          {!error && (!clientSecret || !stripePromise) && (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading secure checkout…</span>
            </div>
          )}

          {!error && clientSecret && stripePromise && (
            <div className="p-1">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </Elements>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
