import express from "express";
const router = express.Router();

import { 
    loginAdmin,
    logoutAdmin

} from "../controllers/admin.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

router.route("/").get((req, res) => {
    res.send("hello admin");
})

// secured routes
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyJWT("admin"), logoutAdmin);

export default router