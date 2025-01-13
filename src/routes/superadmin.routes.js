import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
const router = express.Router();

import {
    // registerSuperAdmin,
    loginSuperadmin,
    logoutSuperadmin,
    getSuperAdminDetails
} from "../controllers/superAdmin.controllers.js";

// router.route("/register").post(upload.fields(
//     [
//         {
//             name: "avatar",
//             maxCount: 1
//         }
//     ]
// ), registerSuperAdmin);

router.route("/login").post(loginSuperadmin);

// secured router
router.route("/logout").post(verifyJWT("superadmin"), logoutSuperadmin);
router.route("/details").get(verifyJWT("superadmin"), getSuperAdminDetails)

export default router