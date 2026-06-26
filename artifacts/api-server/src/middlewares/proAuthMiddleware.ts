import { type Request, type Response, type NextFunction } from "express";
import type { Professional } from "@workspace/db";
import { getProSessionId, getProSession } from "../lib/proAuth";

declare global {
  namespace Express {
    interface Request {
      professional?: Professional;
      isProAuthenticated(): this is ProAuthedRequest;
    }
    export interface ProAuthedRequest extends Request {
      professional: Professional;
    }
  }
}

export async function proAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.isProAuthenticated = function (this: Request) {
    return this.professional != null;
  } as Request["isProAuthenticated"];

  const sid = getProSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getProSession(sid);
  if (!session) {
    next();
    return;
  }

  const { db, professionalsTable } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const [pro] = await db
    .select()
    .from(professionalsTable)
    .where(eq(professionalsTable.id, session.professionalId))
    .limit(1);

  if (!pro) {
    next();
    return;
  }

  req.professional = pro;
  next();
}
