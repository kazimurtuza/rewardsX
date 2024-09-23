import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  resetCodeSend,
  resetCodeVerify,
  passwordUpdate,
  update,
  userProfileInfo,
} from "../controllers/vendor.auth.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/reset-code-send").post(resetCodeSend);
router.route("/reset-code-verify").post(resetCodeVerify);
router.route("/change-password").post(passwordUpdate);
router.route("/update").post(update);
// secured route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/user-profile").get(verifyJWT, userProfileInfo);

export default router;
