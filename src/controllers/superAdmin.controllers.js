import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
// import { User } from "../models/user.models.js";
import { Superadmin } from "../models/superAdmin.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Vulnerabilities } from "../models/vuln.models.js"

const generateAccessAndRefereshTokens = async(organisationId) =>{
    try {
        const superadmin = await Superadmin.findById(organisationId)
        const accessToken = superadmin.generateAccessToken()
        const refreshToken = superadmin.generateRefreshToken()

        superadmin.refreshToken = refreshToken
        
        await superadmin.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerSuperAdmin = asyncHandler(async (req, res) =>{
    const { name, email, password, contactNumber } = req.body
    
    if(
        [name, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are requried");
    }

    const existedSuperAdmin = await Superadmin.findOne({email})

    if(existedSuperAdmin){
        throw new ApiError(409, "Superadmin with this email already exists");
    }
    let avatar;
    try {
        const avatarLocalPath = req.files?.avatar[0]?.path;
    
        if(avatarLocalPath !== null || avatarLocalPath !== undefined){
            avatar = await uploadOnCloudinary(avatarLocalPath); 
        }
    } catch (error) {
        console.log(error);
    }

    const superAdmin = await Superadmin.create({
        name,
        email,
        password,
        avatar: avatar?.url || "",
        contactNumber: contactNumber || ""
    })

    const createdSuperadmin = await Superadmin.findById(superAdmin._id).select(
        "-password -refreshToken"
    )

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createdSuperadmin,
            "superadmin created successfully"
        )
    );
})


const loginSuperadmin = asyncHandler(async (req, res) => {

// try {
        const {email, password} = req.body; // can take orgn name too
        // console.log(email, password);
        
        if(!email || !password){
            throw new ApiError(400, "email and password is required");
        }
    
        const superadmin = await Superadmin.findOne({email}); 
    
        if(!superadmin){
            throw new ApiError(404, "superadmin doesn't exsist");
        }
    
        const isPasswordValid = await superadmin.isPasswordCorrect(password);
    
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid superadmin credentails");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(superadmin?._id);
        
        const loggedInsuperadmin = await Superadmin.findById(superadmin._id).select("-password -refreshToken");
    
        const options = {
            httpOnly: true,
            secure: true
        };
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    superadmin: loggedInsuperadmin, 
                    accessToken, 
                    refreshToken
                },
                "superadmin logged In Successfully"
            )
        );
// } catch (error) {
//     res
//         .status(500)
//         .json({ success: false, message: "Error logging in organization", error })
// }
})

const logoutSuperadmin = asyncHandler(async (req, res) => {
    await Superadmin.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "superadmin logged out successfully"));
})

const getSuperAdminDetails = asyncHandler(async (req, res) => {
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "SuperAdmin details fetched successfully"
        )
    )
})

const getVulnerabilities = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.body;
    
    // Validate limit
    if (!Number.isInteger(Number(limit)) || limit <= 0) {
        throw new ApiError(400, "Please provide a valid positive number for limit");
    }

    // Fetch vulnerabilities with limit
    const vulnerabilities = await Vulnerabilities.find()
        .limit(limit)
        .sort({ createdAt: -1 });

    // Check if any data was found
    if (!vulnerabilities.length) {
        throw new ApiError(404, "No vulnerabilities found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                count: vulnerabilities.length,
                vulnerabilities
            },
            `Successfully fetched ${vulnerabilities.length} vulnerabilities`
        )
    );
});

export {
    registerSuperAdmin,
    loginSuperadmin,
    logoutSuperadmin,
    getSuperAdminDetails,
    getVulnerabilities
}