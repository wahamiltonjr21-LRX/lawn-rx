import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";
import { logger } from "./lib/logger";

async function findUserByCustomerId(customerId: string) {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);
  return user ?? null;
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const user = await findUserByCustomerId(customerId);
  if (!user) {
    logger.warn({ customerId }, "Webhook: no user found for Stripe customer");
    return;
  }
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  await db
    .update(usersTable)
    .set({ stripeSubscriptionId: isActive ? subscription.id : null })
    .where(eq(usersTable.id, user.id));
  logger.info(
    { userId: user.id, subscriptionId: subscription.id, status: subscription.status },
    "Webhook: updated subscription status",
  );
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) return;

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    logger.warn({ customerId }, "Webhook checkout.session.completed: no user found");
    return;
  }
  await db
    .update(usersTable)
    .set({ stripeSubscriptionId: subscriptionId })
    .where(eq(usersTable.id, user.id));
  logger.info(
    { userId: user.id, subscriptionId },
    "Webhook: subscription set from checkout session",
  );
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "This usually means express.json() parsed the body before reaching this handler. " +
          "FIX: Ensure webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET environment variable is not set. " +
          "Set it to the webhook signing secret from the Stripe Dashboard.",
      );
    }

    const stripe = await getUncachableStripeClient();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);

    logger.info({ type: event.type }, "Stripe webhook event received");

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        logger.info({ type: event.type }, "Stripe webhook: unhandled event type");
    }
  }
}
