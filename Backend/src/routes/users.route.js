import { Router } from "express";
import { login, register, googleLogin, getUserHistory, addToHistory } from "../controllers/usercontroller.js";

const router = Router();

// Auth routes
router.route("/login").post(login);
router.route("/register").post(register);
router.route("/google-login").post(googleLogin);    // ← NEW

// Activity routes
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);

export default router;