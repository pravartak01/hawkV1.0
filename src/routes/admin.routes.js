import express from "express";
const router = express.Router();

import { 
    loginAdmin,
    logoutAdmin,
    getAdminDetails,
    updateAccountDetails,
    updatePassword

} from "../controllers/admin.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

router.route("/").get((req, res) => {
    res.send("hello admin");
})

router.route("/login").post(loginAdmin);
// secured routes
router.route("/logout").post(verifyJWT("admin"), logoutAdmin);
router.route("/details").get(verifyJWT("admin"), getAdminDetails);
router.route("/update-details").post(verifyJWT("admin"), updateAccountDetails);
router.route("/update-pass").post(verifyJWT("admin"), updatePassword);

export default router