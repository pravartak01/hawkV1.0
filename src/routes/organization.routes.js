import express from "express";
const router = express.Router();

import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { initiateAdminRegistration, registerAdmin, resendAdminOTP, verifyAdminOTP } from "../controllers/admin.controllers.js";
import { initiateOrganizationRegistration,
         verifyOrganizationOTP,
         completeOrganizationRegistration,
         resendOrganizationOTP,
         loginOrganization,
         logoutOrganization,
         getOrganizationDetails,
         addUsersInOrganization,
         updateAccountDetails,
         updatePassword
        } from "../controllers/organization.controllers.js"; 

import { upload } from "../middlewares/multer.middlewares.js";

router.route("/").get((req, res) => {
    res.send("hello organizations");
})

// router.route("/register-organization").post(upload.fields(
//     [
//         {
//             name: "avatar",
//             maxCount: 1
//         },
//         {
//             name: "coverImage",
//             maxCount: 1
//         }
//     ]
// ) , registerOrganization )


// organization secured registration

router.route("/register-organization/initiate").post(initiateOrganizationRegistration);
router.route("/register-organization/verify-otp").post(verifyOrganizationOTP);
router.route("/register-organization/complete").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    completeOrganizationRegistration
);
router.route("/register-organization/resend-otp").post(resendOrganizationOTP);

// organization registration ends here

// admin secured registration

router.route("/register-admin/initiate").post(initiateAdminRegistration);
router.route("/register-admin/verify-otp").post(verifyAdminOTP);
router.route("/register-admin/complete").post(
    verifyJWT("organization"),
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerAdmin
);
router.post("/register-admin/resend-otp", resendAdminOTP);

// admin registration completed

router.route("/login").post(loginOrganization)
// secured routes
router.route("/register-admin").post(verifyJWT("organization"), upload.single("avatar"), registerAdmin);
router.route("/logout").post(verifyJWT("organization"), logoutOrganization);
router.route("/details").get(verifyJWT("organization"), getOrganizationDetails);
router.route("/add-users").post(verifyJWT("organization"), addUsersInOrganization);
router.route("/update-details").post(verifyJWT("admin"), updateAccountDetails);
router.route("/update-pass").post(verifyJWT("admin"), updatePassword);
router.route("/update-details").post(verifyJWT("organization"), updateAccountDetails);
router.route("/update-pass").post(verifyJWT("organization"), updatePassword);

export default router
