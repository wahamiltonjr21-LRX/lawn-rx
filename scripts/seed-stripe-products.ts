import Stripe from "stripe";

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;
  if (!hostname || !xReplitToken) throw new Error("Missing Replit env vars. Is Stripe connected?");
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", "development");
  const resp = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
  });
  const data = await resp.json();
  const settings = data.items?.[0]?.settings;
  if (!settings?.secret) throw new Error("Stripe not connected");
  return settings.secret as string;
}

async function seed() {
  const secretKey = await getCredentials();
  const stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });

  const existing = await stripe.products.search({ query: "name:'LawnRX Pro' AND active:'true'" });
  if (existing.data.length > 0) {
    console.log("LawnRX Pro already exists:", existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    prices.data.forEach(p => console.log(`  price: ${p.id} — $${(p.unit_amount ?? 0) / 100}/${p.recurring?.interval}`));
    return;
  }

  const product = await stripe.products.create({
    name: "LawnRX Pro",
    description: "Unlimited AI lawn analyses + fertilizing & care alerts",
  });
  console.log("Created product:", product.id);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1999,
    currency: "usd",
    recurring: { interval: "month" },
  });
  console.log(`Created price: ${price.id} — $19.99/month`);
}

seed().catch(console.error);
