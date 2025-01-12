import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import SendGridOTPService from "../utils/emailVerification.js";

const otpService = new SendGridOTPService();

const generateAccessAndRefereshTokens = async(organisationId) =>{
    try {
        const user = await User.findById(organisationId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// const registerUser = asyncHandler(async (req, res) =>{
//     const { fullName, email, deviceName, password, contactNumber } = req.body
    
//     if(
//         [fullName, email, password].some((field) => field?.trim() === "")
//     ){
//         throw new ApiError(400, "All fields are requried");
//     }

//     const existedUser = await User.findOne({email})

//     if(existedUser){
//         throw new ApiError(409, "User with this deviceName or email already exists");
//     }
//     let avatar;
//     try {
//         const avatarLocalPath = req.files?.avatar[0]?.path;
    
//         if(avatarLocalPath !== null || avatarLocalPath !== undefined){
//             avatar = await uploadOnCloudinary(avatarLocalPath); 
//         }
//     } catch (error) {
//         console.log(error);
//     }

//     const user = await User.create({
//         fullName,
//         email,
//         deviceName: deviceName || "",
//         password,
//         avatar: avatar?.url || "",
//         contactNumber: contactNumber || ""
//     })

//     const createdUser = await User.findById(user._id).select(
//         "-password"
//     )

//     res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             createdUser,
//             "user created successfully"
//         )
//     );

// })

const initiateRegistration = asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log("Received email:", email); // Debug log
    console.log("Full request body:", req.body); // Debug log

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({ email });
    if (existedUser?.isVerified) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Generate OTP
    const { otp, otpTimestamp } = otpService.generateOTP();

    // Store user with unverified status
    await User.findOneAndUpdate(
        { email },
        {
            email,
            otp,
            otpTimestamp,
            isVerified: false
        },
        { upsert: true } // creates a user if doesnt exist already!.. or already registered un verified user can also use this route
    );

    // Send OTP
    await otpService.sendOTP(email, otp);

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { email },
            "OTP sent successfully. Please verify your email."
        )
    );
});

// Step 2: Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const verificationResult = otpService.verifyOTP(
        user.otp,
        otp,
        user.otpTimestamp
    );

    if (!verificationResult.success) {
        throw new ApiError(400, verificationResult.message);
    }

    // Clear OTP after successful verification
    await User.findOneAndUpdate(
        { email },
        {
            otp: null,
            otpTimestamp: null,
            isVerified: true
        }
    );

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { email },
            "Email verified successfully. Please complete registration."
        )
    );
});

// Step 3: Complete registration after OTP verification
const registerUser = asyncHandler(async (req, res) => {
    const { 
        fullName, 
        email, 
        deviceName, 
        password, 
        contactNumber 
    } = req.body;

    if ([fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email });
    
    if (!existedUser) {
        throw new ApiError(400, "Please initiate registration first");
    }

    if (!existedUser.isVerified) {
        throw new ApiError(409, "Please verify the user first");
    }

    let avatar;
    try {
        const avatarLocalPath = req.files?.avatar[0]?.path;
        
        if (avatarLocalPath !== null || avatarLocalPath !== undefined) {
            avatar = await uploadOnCloudinary(avatarLocalPath);
        }
    } catch (error) {
        console.log(error);
    }

    const user = await User.findOneAndUpdate(
        { email },
        {
            fullName,
            deviceName: deviceName || "",
            password,
            avatar: avatar?.url || "",
            contactNumber: contactNumber || ""
        },
        {
            new: true
        }
    ).select("-password -otp -otpTimestamp");

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User registered successfully"
        )
    );
});

// Resend OTP if expired
const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User already verified");
    }

    const { otp, otpTimestamp } = otpService.generateOTP();

    await User.findOneAndUpdate(
        { email },
        {
            otp,
            otpTimestamp
        }
    );

    await otpService.sendOTP(email, otp);

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { email },
            "OTP resent successfully"
        )
    );
});



const loginUser = asyncHandler(async (req, res) => {

// try {
        const {email, password} = req.body; // can take orgn name too
        // console.log(email, password);
        
        if(!email || !password){
            throw new ApiError(400, "email and password is required");
        }
    
        const user = await User.findOne({email}); 
    
        if(!user){
            throw new ApiError(404, "user doesn't exsist");
        }
    
        const isPasswordValid = user.isPasswordCorrect(password);
    
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid user credentails");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user?._id);
        
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
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
                    user: loggedInUser, 
                    accessToken, 
                    refreshToken
                },
                "user logged In Successfully"
            )
        );
// } catch (error) {
//     res
//         .status(500)
//         .json({ success: false, message: "Error logging in organization", error })
// }
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
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
    .json(new ApiResponse(200, {}, "User logged out successfully"));
})

export {
     registerUser,
     loginUser,
     logoutUser,
     initiateRegistration,
     verifyOTP,
     resendOTP
    
    }