import express from "express";
const router = express.Router();

import { test } from "../controllers/auth.controllers.js"
import { upload } from "../middlewares/multer.middlewares.js";

router.route("/").get((req, res) => {
    res.send("hello world");
})

router.route("/test").post(upload.fields(
    [
        {
            name: "avatar",
            maxCount: 1
        }
    ]
) ,test)

export default router