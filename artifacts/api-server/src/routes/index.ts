import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnosesRouter from "./diagnoses";
import authRouter from "./auth";
import upgradeRequestRouter from "./upgrade-request";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(diagnosesRouter);
router.use(upgradeRequestRouter);

export default router;
