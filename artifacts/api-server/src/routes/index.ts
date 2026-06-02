import { Router, type IRouter } from "express";
import path from "path";
import { fileURLToPath } from "url";
import healthRouter from "./health";
import diagnosesRouter from "./diagnoses";
import authRouter from "./auth";
import upgradeRequestRouter from "./upgrade-request";
import stripeRouter from "./stripe";
import communityRouter from "./community";
import tipRouter from "./tip";
import userRouter from "./user";
import treatmentsRouter from "./treatments";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(diagnosesRouter);
router.use(upgradeRequestRouter);
router.use(stripeRouter);
router.use(communityRouter);
router.use(tipRouter);
router.use(userRouter);
router.use(treatmentsRouter);

router.get("/download/android", (_req, res) => {
  const file = path.resolve(__dirname, "../../android-project-v18.zip");
  res.download(file, "android-project-v18.zip");
});

export default router;
