import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  logger.warn(
    "STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will be rejected. " +
    "Set this to the signing secret from your Stripe Dashboard webhook endpoint.",
  );
}

async function syncProOverrideEmails() {
  const emails = (process.env.PRO_OVERRIDE_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return;
  try {
    await db
      .update(usersTable)
      .set({ isProOverride: true })
      .where(inArray(usersTable.email, emails));
    logger.info({ emails }, "Synced pro override emails to DB");
  } catch (err) {
    logger.warn({ err }, "Failed to sync pro override emails");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  await syncProOverrideEmails();
});
