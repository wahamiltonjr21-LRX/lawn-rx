import { useQuery, useMutation } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw Object.assign(new Error(await res.text()), { status: res.status });
  return res.json();
}

export function useSubscription() {
  return useQuery({
    queryKey: ["stripe-subscription"],
    queryFn: () => apiFetch("/api/stripe/subscription"),
    staleTime: 60_000,
  });
}

export function useStripeProducts() {
  return useQuery({
    queryKey: ["stripe-products"],
    queryFn: () => apiFetch("/api/stripe/products"),
    staleTime: 5 * 60_000,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: (priceId: string) =>
      apiFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      }),
  });
}

export function useOpenPortal() {
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/stripe/portal", { method: "POST" }),
  });
}
