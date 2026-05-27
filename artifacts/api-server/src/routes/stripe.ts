import { Router, type IRouter } from "express";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import { stripeStorage } from "../stripeStorage";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const router: IRouter = Router();

router.get("/stripe/config", async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    res.status(500).json({ error: "Stripe not configured" });
  }
});

router.get("/stripe/products", async (_req, res) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();
    const productsMap = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ products: Array.from(productsMap.values()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/stripe/subscription", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await stripeStorage.getUser(req.user.id);
    if (!user?.stripeCustomerId) {
      res.json({ subscription: null, isPro: false });
      return;
    }
    const subscription = await stripeStorage.getActiveSubscriptionForCustomer(
      user.stripeCustomerId,
    );
    res.json({ subscription, isPro: !!subscription });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.post("/stripe/checkout", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { priceId } = req.body;
  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    let user = await stripeStorage.getUser(req.user.id);

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        metadata: { userId: req.user.id },
      });
      await stripeStorage.updateUserStripeInfo(req.user.id, {
        stripeCustomerId: customer.id,
      });
      customerId = customer.id;
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create checkout session" });
  }
});

router.post("/stripe/embedded-checkout", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { priceId } = req.body;
  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    let user = await stripeStorage.getUser(req.user.id);

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        metadata: { userId: req.user.id },
      });
      await stripeStorage.updateUserStripeInfo(req.user.id, {
        stripeCustomerId: customer.id,
      });
      customerId = customer.id;
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded_page" as const,
      return_url: `${baseUrl}/?checkout=success`,
    });

    res.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create embedded checkout session" });
  }
});

router.post("/stripe/portal", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    const user = await stripeStorage.getUser(req.user.id);
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" });
      return;
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/`,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create portal session" });
  }
});

export default router;
