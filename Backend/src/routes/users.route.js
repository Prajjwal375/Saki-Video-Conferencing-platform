import { Router } from "express";
import { login, register } from "../controllers/usercontroller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);


router.route("/add_to_activity").post((req, res) => {
    const { token, meeting_code } = req.body;

    console.log("Token:", token);
    console.log("Meeting Code:", meeting_code);

    res.status(200).json({ message: "Activity added" });
});

router.route("/get_all_activity").get((req, res) => {
    const { token } = req.query;

    console.log("Token:", token);

    res.status(200).json({ data: [] });
});

export default router;