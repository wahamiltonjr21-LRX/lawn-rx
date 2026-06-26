import { db, professionalsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function findMatchingProfessionalIds(zipCode: string): Promise<string[]> {
  const rows = await db
    .select({ id: professionalsTable.id })
    .from(professionalsTable)
    .where(
      sql`${professionalsTable.approved} = true
        AND ${professionalsTable.serviceZipCodes} @> ARRAY[${zipCode}]::text[]`,
    );

  return rows.map((r) => r.id);
}
