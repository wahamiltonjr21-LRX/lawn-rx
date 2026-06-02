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

async function run() {
  const secretKey = await getCredentials();
  const stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });

  // Find the LawnRX Pro product
  const existing = await stripe.products.search({ query: "name:'LawnRX Pro' AND active:'true'" });
  if (existing.data.length === 0) throw new Error("LawnRX Pro product not found in Stripe");

  const productId = existing.data[0].id;
  console.log("Found product:", productId);

  // List existing prices
  const prices = await stripe.prices.list({ product: productId, active: true });
  console.log("Existing active prices:");
  prices.data.forEach(p =>
    console.log(`  ${p.id} — $${(p.unit_amount ?? 0) / 100}/${p.recurring?.interval}`)
  );

  // Archive old prices
  for (const p of prices.data) {
    await stripe.prices.update(p.id, { active: false });
    console.log(`Archived: ${p.id}`);
  }

  // Create $7.99/month price
  const monthly = await stripe.prices.create({
    product: productId,
    unit_amount: 799,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Monthly",
  });
  console.log(`Created monthly: ${monthly.id} — $7.99/month`);

  // Create $59.99/year price
  const annual = await stripe.prices.create({
    product: productId,
    unit_amount: 5999,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Annual",
  });
  console.log(`Created annual: ${annual.id} — $59.99/year`);

  console.log("\n✅ Done! Update these IDs in upgrade-modal.tsx:");
  console.log(`FALLBACK_MONTHLY_ID = "${monthly.id}"`);
  console.log(`FALLBACK_ANNUAL_ID  = "${annual.id}"`);
}

run().catch(console.error);
