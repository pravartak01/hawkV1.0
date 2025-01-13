import express from "express"
const router = express.Router()
import {
    getVulnerabilities
} from "../controllers/superAdmin.controllers.js"


router.route("/vuln").post(getVulnerabilities);

export default router