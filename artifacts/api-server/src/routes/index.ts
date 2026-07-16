import { Router, type IRouter } from "express";
import healthRouter from "./health";
import netlifyRouter from "./netlify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(netlifyRouter);

export default router;
