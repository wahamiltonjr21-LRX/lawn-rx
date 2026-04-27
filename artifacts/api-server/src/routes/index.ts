import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnosesRouter from "./diagnoses";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diagnosesRouter);

export default router;
