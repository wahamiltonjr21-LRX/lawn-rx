import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";

export class StripeStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  }

  async updateUserStripeInfo(
    userId: string,
    info: { stripeCustomerId?: string; stripeSubscriptionId?: string },
  ) {
    const [user] = await db
      .update(usersTable)
      .set(info)
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  async getActiveSubscriptionForCustomer(customerId: string) {
    const stripe = await getUncachableStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    return subscriptions.data[0] ?? null;
  }

  async listProductsWithPrices() {
    const stripe = await getUncachableStripeClient();
    const [productsResp, pricesResp] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);
    const rows: any[] = [];
    for (const product of productsResp.data) {
      const prices = pricesResp.data.filter((p) => p.product === product.id);
      if (prices.length === 0) {
        rows.push({
          product_id: product.id,
          product_name: product.name,
          product_description: product.description,
          product_active: product.active,
          price_id: null,
          unit_amount: null,
          currency: null,
          recurring: null,
          price_active: null,
        });
      } else {
        for (const price of prices) {
          rows.push({
            product_id: product.id,
            product_name: product.name,
            product_description: product.description,
            product_active: product.active,
            price_id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
            price_active: price.active,
          });
        }
      }
    }
    rows.sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0));
    return rows;
  }
}

export const stripeStorage = new StripeStorage();
