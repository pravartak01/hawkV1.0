import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { Admin } from "../models/admin.models.js";
import { Organization } from "../models/organization.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import EmailService from "../utils/emailVerification.js";

const emailService = new EmailService();

// only orgnzn can create admin after loggin in.. jwt token se ogrzn_id admin ke create krte time dalo
const generateAccessAndRefereshTokens = async(organisationId) =>{
    try {
        const organization = await Organization.findById(organisationId)
        const accessToken = organization.generateAccessToken()
        const refreshToken = organization.generateRefreshToken()

        organization.refreshToken = refreshToken
        
        await organization.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// const registerOrganization = asyncHandler(async (req, res) =>{
//     // try {
//         const { name, email, contactNumber, address, password } = req.body
        
//         if(
//             [name, email, password].some((field) => field?.trim() === "")
//         ){
//             throw new ApiError(400, "Mandatory fields are requried");
//         }
    
//         const existedOrganization = await Organization.findOne({name})
    
//         if(existedOrganization){
//             throw new ApiError(409, "This organization is already registered");
//         }
    
//         const logoLocalPath = req.files?.avatar[0]?.path;
//         const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
//         let logo;
//         if(logoLocalPath !== null || logoLocalPath !== undefined){
//             logo = await uploadOnCloudinary(logoLocalPath); 
//         }
    
//         let coverImage;
//         if(coverImageLocalPath !== null || coverImageLocalPath !== undefined){
//             coverImage = await uploadOnCloudinary(coverImageLocalPath); 
//         }
    
//         const organisation = await Organization.create({
//             name,
//             email,
//             contactNumber,
//             password,
//             address,
//             logo: logo?.url || "",
//             coverImage: coverImage?.url || ""
//         })
    
//         const createdOrganization = await Organization.findById(organisation._id).select(
//             "-password -refreshToken"
//         )
    
//         res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 createdOrganization,
//                 "organization created successfully! please add the organization's admin/s to complete ur organization profile"
//             )
//         );
//     // } catch (error) {
//     //     res
//     //     .status(500)
//     //     .json({ success: false, message: "Error registering organization", error })
//     // }
// });

// Step 1: Initiate Organization Registration
const initiateOrganizationRegistration = asyncHandler(async (req, res) => {
    const { email, name } = req.body;

    if (!email?.trim() || !name?.trim()) {
        throw new ApiError(400, "Email and organization name are required");
    }

    // Check if organization already exists
    const existedOrganization = await Organization.findOne({ 
        $or: [{ email }, { name }] 
    });

    if (existedOrganization) {
        if (existedOrganization.isVerified) {
            throw new ApiError(409, "Organization already registered");
        }
    }

    // Generate OTP
    const { otp, otpTimestamp } = emailService.generateOTP();

    // Create or update organization with initial details
    const organization = await Organization.findOneAndUpdate(
        { email },
        {
            email,
            name,
            otp,
            otpTimestamp,
            isVerified: false
        },
        { upsert: true, new: true }
    );

    // Send OTP
    await emailService.sendOTP(email, otp);

    res.status(200).json(
        new ApiResponse(
            200,
            { email },
            "OTP sent successfully. Please verify your email."
        )
    );
});

// Step 2: Verify OTP
const verifyOrganizationOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const organization = await Organization.findOne({ email });
    
    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    const verificationResult = emailService.verifyOTP(
        organization.otp,
        otp,
        organization.otpTimestamp
    );

    if (!verificationResult.success) {
        throw new ApiError(400, verificationResult.message);
    }

    // Clear OTP after successful verification
    await Organization.findOneAndUpdate(
        { email },
        {
            otp: null,
            otpTimestamp: null,
            isVerified: true
        }
    );

    res.status(200).json(
        new ApiResponse(
            200,
            { email },
            "Email verified successfully. Please complete registration."
        )
    );
});

// Step 3: Complete Organization Registration
const completeOrganizationRegistration = asyncHandler(async (req, res) => {
    const { 
        name,
        email,
        contactNumber,
        address,
        password
    } = req.body;

    if ([name, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Mandatory fields are required");
    }

    const organization = await Organization.findOne({ email });
    
    if (!organization) {
        throw new ApiError(400, "Please initiate registration first");
    }

    if (!organization.isVerified) {
        throw new ApiError(409, "Please verify the Organization first");
    }
    let logo;
    let coverImage;
    try {
        const logoLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
        
        if (logoLocalPath) {
            logo = await uploadOnCloudinary(logoLocalPath);
        }
    
        
        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        }
    } catch (error) {
        console.log(error);
        
    }

    // Update organization with complete details
    const updatedOrganization = await Organization.findOneAndUpdate(
        { email },
        {
            name,
            contactNumber,
            password,
            address,
            logo: logo?.url || "",
            coverImage: coverImage?.url || "",
        },
        { new: true }
    ).select("-password -refreshToken -otp -otpTimestamp");

    res.status(200).json(
        new ApiResponse(
            200,
            updatedOrganization,
            "Organization registered successfully! Please add the organization's admin/s to complete your organization profile"
        )
    );
});

// Resend OTP if expired
const resendOrganizationOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    const organization = await Organization.findOne({ email });
    
    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    if (organization.isVerified) {
        throw new ApiError(400, "Organization already verified");
    }

    const { otp, otpTimestamp } = emailService.generateOTP();

    await Organization.findOneAndUpdate(
        { email },
        {
            otp,
            otpTimestamp
        }
    );

    await emailService.sendOTP(email, otp);

    res.status(200).json(
        new ApiResponse(
            200,
            { email },
            "OTP resent successfully"
        )
    );
});

const loginOrganization = asyncHandler(async (req, res) => {

// try {
        const {email, password} = req.body; // can take orgn name too
        // console.log(email, password);
        
        if(!email || !password){
            throw new ApiError(400, "password and email is required");
        }
    
        const organisation = await Organization.findOne({email}); 
    
        if(!organisation){
            throw new ApiError(404, "organisation doesn't exsist");
        }
    
        const isPasswordValid = organisation.isPasswordCorrect(password);
    
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid organisation credentails");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(organisation?._id);
        
        const loggedInOrganization = await Organization.findById(organisation._id).select("-password -refreshToken");
    
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
                    organisation: loggedInOrganization, 
                    accessToken, 
                    refreshToken
                },
                "organisation logged In Successfully"
            )
        );
// } catch (error) {
//     res
//         .status(500)
//         .json({ success: false, message: "Error logging in organization", error })
// }
})

// const addAdminToOrganization = asyncHandler(async (req, res) => {
//     try {
//         const { adminId, organizationId } = req.body;
//         const organization = await Organization.findById(organizationId);
//         const admin = await Admin.findById(adminId);
//         if (organization && admin) {
//             organization.admins.push(admin._id);
//             await organization.save();

//             admin.organization = organization._id;
//             await admin.save();

//             res.status(200).json({
//                 success: true,
//                 message: "Admin added to organization successfully",
//                 organization,
//                 admin
//             });
//         } else {
//             res.status(404).json({ success: false, message: "Organization or Admin not found" });
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Error adding admin to organization", error });
//     }
// });

const logoutOrganization = asyncHandler(async (req, res) => {
    await Organization.findByIdAndUpdate(
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
    .json(new ApiResponse(200, {}, "Organization logged out successfully"));
})


export { 
    initiateOrganizationRegistration,
    verifyOrganizationOTP,
    completeOrganizationRegistration,
    resendOrganizationOTP,
    loginOrganization,
    logoutOrganization
}