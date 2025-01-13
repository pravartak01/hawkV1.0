import mongoose,{ Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const superAdminSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        avatar: {
            type: String,
        },
        role:{
            type: String,
            default: "superAdmin"
        },
        refreshToken: {
            type: String
        },
        // otp: {
        //     type: String,
        //     default: null
        // },
        // otpTimestamp: {
        //     type: Date,
        //     default: null
        // },
        isVerified: {
            type: Boolean,
            default: true
        },
        contactNumber: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

superAdminSchema.pre("save", async function (next){ 
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

superAdminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

superAdminSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

superAdminSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const Superadmin = mongoose.model("Superadmin", superAdminSchema);
