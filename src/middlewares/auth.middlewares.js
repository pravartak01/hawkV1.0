import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, _, next) =>{
    try{
        console.log("Access Token from Cookies:", req.cookies?.accessToken);
        console.log("Access Token from Header:", req.header("Authorization"));

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        console.log(token);
        
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if(!user){
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next()
    }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})

export { verifyJWT }