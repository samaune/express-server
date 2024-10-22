import express from "express";
import auth_routes from "./auth/index.js";
import rpt_routes from "./reports/index.js";
import storage_routes from "./storage/index.js";

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get("/health-check", (req, res) => res.send("OK"));

router.use("/upload", storage_routes);
router.use("/report", rpt_routes);
router.use("/auth", auth_routes);

//router.use("/db", async(req, res, next) => await resquel.routes(config.mssql));

export default router;
