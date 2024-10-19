import { Router } from "express";
import {
  checkAuth,
  getUserInfo,
  isUserVerified,
  login,
  signup,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/check-auth", checkAuth);
authRoutes.get("/isverified", isUserVerified);
authRoutes.get("/user-info", verifyToken, getUserInfo);
authRoutes.get("/verify-email/:token", verifyEmail);

export default authRoutes;
