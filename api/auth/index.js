import express from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
const jwt = passport.authenticate("jwt", { session: false });
const local = passport.authenticate("local", { session: false });

import auth_controller from "./auth.controller.js";
import user_controller from "./user.controller.js";
const router = express.Router();

router.post("/login", local, auth_controller.login);
router.post("/refresh",jwt, auth_controller.refreshToken);
router.get("/authorized", auth_controller.validateToken);

router.get("/me", jwt, asyncHandler(auth_controller.get_current_user));
router.get("/app", jwt, asyncHandler(auth_controller.getUserAppConfig));

// User Controller
router.post("/user", asyncHandler(user_controller.register), auth_controller.login);

export default router;