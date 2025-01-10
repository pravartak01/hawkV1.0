import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const test = asyncHandler(async (req, res) =>{
    const { fullName, email, deviceName, password } = req.body
    // console.log(fullName,email,password);

    // console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar?.path;
    // console.log("my path",avatarLocalPath);
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);  
    // console.log(avatar);
    
    const user = User.create({
        fullName,
        email,
        deviceName,
        password,
        avatar: avatar?.url || ""
    })

    const createdUser = User.findById(user._id).select(
        "-password"
    )
    res
    .send(200)
    // .json(
    //     new ApiResponse(
    //         200,
    //         createdUser,
    //         "user created successfully"
    //     )
    // )

})


export { test }