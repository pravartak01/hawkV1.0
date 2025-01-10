import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const router = express.Router();

app.use(cors({
    origin: process.env.CORS_ORIGIN
}));
app.use(cookieParser());

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true, limit: "16kb"}))
app.use(express.static("../public"));

import userRouter from "./routes/user.routes.js"

// routes
app.get("/", (req, res) =>{
    res.send("hello its working");
})
app.use("/api/v1/user", userRouter)

// routes ends 

export { app };