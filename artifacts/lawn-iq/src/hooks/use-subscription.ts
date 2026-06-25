import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export function useSubscription() {
  return useQuery({
    queryKey: ["stripe-subscription"],
    queryFn: () => customFetch<{ subscription: unknown; isPro: boolean }>("/api/stripe/subscription"),
    staleTime: 0,
    gcTime: 0,
  });
}

interface StripePrice {
  id: string;
  recurring?: { interval: string };
  unit_amount?: number;
  unitAmount?: number;
}

interface StripeProduct {
  id: string;
  name: string;
  prices?: StripePrice[];
}

interface StripeProductsResponse {
  products?: StripeProduct[];
}

export function useStripeProducts() {
  return useQuery({
    queryKey: ["stripe-products"],
    queryFn: () => customFetch<StripeProductsResponse>("/api/stripe/products"),
    staleTime: 5 * 60_000,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: (priceId: string) =>
      customFetch<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      }),
  });
}

export function useOpenPortal() {
  return useMutation({
    mutationFn: () =>
      customFetch<{ url: string }>("/api/stripe/portal", { method: "POST" }),
  });
}
