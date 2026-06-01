import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnosesRouter from "./diagnoses";
import authRouter from "./auth";
import upgradeRequestRouter from "./upgrade-request";
import stripeRouter from "./stripe";
import communityRouter from "./community";
import tipRouter from "./tip";
import userRouter from "./user";
import treatmentsRouter from "./treatments";

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

export default router;
