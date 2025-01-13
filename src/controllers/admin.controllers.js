import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { Admin } from "../models/admin.models.js";
import { Organization } from "../models/organization.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import SendGridOTPService from '../utils/emailVerification.js'; 

const otpService = new SendGridOTPService();

const generateAccessAndRefereshTokens = async(organisationId) =>{
    try {
        const admin = await Admin.findById(organisationId)
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()

        admin.refreshToken = refreshToken
        
        await admin.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// const registerAdmin = asyncHandler(async (req, res) =>{
//     const { fullName, email, deviceName, password } = req.body
//     if(
//         [fullName, email, password].some((field) => field?.trim() === "")
//     ){
//         throw new ApiError(400, "Mandatory fields are requried");
//     }

//     const existedAdmin = await Admin.findOne({email})

//     if(existedAdmin){
//         throw new ApiError(409, "admin with this email or deviceName already exists");
//     }


//     const avatarLocalPath = req.file?.path;

//     const organisationId = req.user._id;
    
//     let avatar;
//     if(avatarLocalPath !== null || avatarLocalPath !== undefined){
//         avatar = await uploadOnCloudinary(avatarLocalPath); 
//     }
//     const admin = await Admin.create({
//         fullName,
//         email,
//         deviceName: deviceName || "",
//         password,
//         organization: organisationId,
//         avatar: avatar?.url || ""
//     })

//     await Organization.findByIdAndUpdate(
//         req.user?._id,
//         { $push: { admins: admin._id } },
//         { new: true }
//     );
//     const adminsOrganizationDetails = await Admin.aggregate([
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(admin._id)
//             }
//         },
//         {
//             $lookup: {
//                 from: "organizations",
//                 localField: "organization",
//                 foreignField: "_id",
//                 as: "organization",
//                 pipeline: [
//                     {
//                         $project: {
//                             _id: 0,
//                             name: 1,
//                             email: 1,
//                             contactNumber: 1
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $unwind: "$organization"
//         },

//     ]);
//     res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             adminsOrganizationDetails,
//             "admin created successfully"
//         )
//     );
// })

// Step 1: Initiate Registration (Send OTP)
const initiateAdminRegistration = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        throw new ApiError(409, "Admin with this email already exists");
    }

    // Generate OTP
    const { otp, otpTimestamp } = otpService.generateOTP();

    // Store admin with unverified status
    await Admin.findOneAndUpdate(
        { email },
        { email, otp, otpTimestamp, isVerified: false },
        { upsert: true } // Creates admin if it doesn't exist
    );

    // Send OTP to email
    await otpService.sendOTP(email, otp);

    res.status(200).json(
        new ApiResponse(200, { email }, "OTP sent successfully. Please verify your email.")
    );
});

// Step 2: Verify OTP
const verifyAdminOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    const verificationResult = otpService.verifyOTP(admin.otp, otp, admin.otpTimestamp);

    if (!verificationResult.success) {
        throw new ApiError(400, verificationResult.message);
    }

    // Clear OTP after successful verification
    await Admin.findOneAndUpdate(
        { email },
        { otp: null, otpTimestamp: null, isVerified: true }
    );

    res.status(200).json(
        new ApiResponse(200, { email }, "Email verified successfully. Please complete registration.")
    );
});

// Step 3: Complete Admin Registration after OTP Verification
const registerAdmin = asyncHandler(async (req, res) => {
    const { fullName, email, deviceName, password } = req.body;

    if ([fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Mandatory fields are required");
    }

    const existingAdmin = await Admin.findOne({ email });

    if (!existingAdmin) {
        throw new ApiError(400, "Please initiate registration first");
    }

    if (!existingAdmin.isVerified) {
        throw new ApiError(409, "Please verify first!");
    }

    const organizationId = req.user._id;

    // Create new admin record
    const admin = await Admin.findOneAndUpdate(
        {email},
        {
        fullName,
        email,
        deviceName: deviceName || "",
        password,
        organization: organizationId
        }
    );

    // Add admin to the organization
    await Organization.findByIdAndUpdate(
        organizationId,
        { $push: { admins: admin._id } },
        { new: true }
    );

    // Retrieve the admin's organization details
    const adminsOrganizationDetails = await Admin.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(admin._id)
            }
        },
        {
            $lookup: {
                from: "organizations",
                localField: "organization",
                foreignField: "_id",
                as: "organization",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            name: 1,
                            email: 1,
                            contactNumber: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$organization" }
    ]);

    res.status(200).json(
        new ApiResponse(200, adminsOrganizationDetails, "Admin created successfully")
    );
});

// Step 4: Resend OTP if expired
const resendAdminOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (admin.isVerified) {
        throw new ApiError(400, "Admin already verified");
    }

    const { otp, otpTimestamp } = otpService.generateOTP();

    // Update OTP and timestamp
    await Admin.findOneAndUpdate(
        { email },
        { otp, otpTimestamp }
    );

    // Send OTP to the admin's email
    await otpService.sendOTP(email, otp);

    res.status(200).json(
        new ApiResponse(200, { email }, "OTP resent successfully")
    );
});

const loginAdmin = asyncHandler(async (req, res) => {

// try {
        const {email, password} = req.body; // can take orgn name too
        console.log(email, password);
        
        if(!email || !password){
            throw new ApiError(400, "email and password is required");
        }
    
        const admin = await Admin.findOne({email}); 
    
        if(!admin){
            throw new ApiError(404, "admin doesn't exsist");
        }
    
        const isPasswordValid = await admin.isPasswordCorrect(password);
        console.log(isPasswordValid);
        
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid admin credentails");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(admin?._id);
        
        const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken");
    
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
                    admin: loggedInAdmin, 
                    accessToken, 
                    refreshToken
                },
                "admin logged In Successfully"
            )
        );
// } catch (error) {
//     res
//         .status(500)
//         .json({ success: false, message: "Error logging in organization", error })
// }
})

const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
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
    .json(new ApiResponse(200, {}, "Admin logged out successfully"));
})

const getAdminDetails = asyncHandler(async (req, res) => {
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Admin details fetched successfully"
        )
    )
})

// update code
const updateAccountDetails = asyncHandler(async (req, res) => {
    const updateFields = {};
    
    Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
            updateFields[key] = req.body[key];
        }
    });

    const protectedFields = ['_id', 'password' ,'role', 'createdAt', 'updatedAt', 'refreshToken', 'organization', 'isVerified', 'otp', 'otpTimestamp'];
    protectedFields.forEach(field => {
        delete updateFields[field];
    });

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "Please provide at least one field to update");
    }

    console.log(updateFields);
    

    const user = await Admin.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updateFields
        },
        {
            new: true,
            runValidators: true 
        }
    ).select("-password -otp -otpTimestamp -refreshToken -organization");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    );
});

const updatePassword = asyncHandler(async (req, res) => {
        const {password} = req.body;

        const user = await Admin.findById(req.user?._id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        user.password = password;
        await user.save(); 

        res
        .json(
            new ApiResponse(
                200,
                {},
                "password updated successfully"
            )
        )
})

export { 
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    initiateAdminRegistration,
    verifyAdminOTP,
    resendAdminOTP,
    getAdminDetails,
    updateAccountDetails,
    updatePassword
}