import express from "express";
const router = express.Router();



import { 
    registerUser,
    loginUser,
    logoutUser,
    initiateRegistration,
    verifyOTP,
    resendOTP,
    getUserDetails,
    updateAccountDetails,
    updatePassword

} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

router.route("/").get((req, res) => {
    res.send("hello world");
})

// router.route("/register").post(upload.fields(
//     [
//         {
//             name: "avatar",
//             maxCount: 1
//         }
//     ]
// ) , registerUser)

// verified registration
router.post("/register/initiate", initiateRegistration);
router.post("/register/verify-otp", verifyOTP);
router.post(
    "/register/complete", 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
);
router.post("/register/resend-otp", resendOTP);
// registration completed

// secured routes
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT("user"), logoutUser);
router.route("/details").get(verifyJWT("user"), getUserDetails)
router.route("/update-details").post(verifyJWT("user"), updateAccountDetails);
router.route("/update-pass").post(verifyJWT("user"), updatePassword);

export default router