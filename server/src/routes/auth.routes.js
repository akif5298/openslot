import { Router } from "express";
import { login, logout, updateProfile } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.patch("/profile/:userId", updateProfile);

export default router;
