import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnosesRouter from "./diagnoses";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(diagnosesRouter);

export default router;
