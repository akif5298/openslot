import { Router } from "express";
import { login, logout, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.patch("/profile/:userId", requireAuth, updateProfile);

export default router;
