import mongoose,{ Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullName: {
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
        deviceName: { // unique name for the device of the organisation
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            unique: true
            // index: true
        },
        password: {
            type: String,
            required: true
        },
        avatar: {
            type: String,
        },
        organization:{ // organization name or unique id, to get organization details
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            default: null // for individuals
        },
        contactNumber:{
            type: String,
        },
        role: {
            type: String,
            default: "user"
        },
        otp: {
            type: String,
            default: null
        },
        otpTimestamp: {
            type: Date,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next){ 
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
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

export const User = mongoose.model("User", userSchema);
