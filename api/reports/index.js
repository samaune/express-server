import express from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import rpt_controller from "./report.controller.js";

const jwt = passport.authenticate("jwt", { session: false });
const local = passport.authenticate("local", { session: false });
const router = express.Router();

router.get("/ip",jwt, rpt_controller.get_ip);

export default router;