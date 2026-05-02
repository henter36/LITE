import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspacesRouter from "./workspaces";
import brandProfilesRouter from "./brandProfiles";
import campaignsRouter from "./campaigns";
import assetsRouter from "./assets";
import approvalsRouter from "./approvals";
import connectionsRouter from "./connections";
import trackingLinksRouter from "./trackingLinks";
import metricsRouter from "./metrics";
import recommendationsRouter from "./recommendations";
import auditLogsRouter from "./auditLogs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspacesRouter);
router.use(brandProfilesRouter);
router.use(campaignsRouter);
router.use(assetsRouter);
router.use(approvalsRouter);
router.use(connectionsRouter);
router.use(trackingLinksRouter);
router.use(metricsRouter);
router.use(recommendationsRouter);
router.use(auditLogsRouter);

export default router;
