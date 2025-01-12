import mongoose,{ Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const organizationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  admins: {
    type: [
      {
          type: Schema.Types.ObjectId,
          ref: "Video"
      }
  ]
  },
  users: {
    type: [
      {
          type: Schema.Types.ObjectId,
          ref: "Video"
      }
  ]
  },
  password: {
    type: String,
    required: true
  },
  logo: {
    type: String,
  },
  coverImage: {
    type: String
  },
  refreshToken: {
    type: String
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

organizationSchema.pre("save", async function (next){ 
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

organizationSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

organizationSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
            // can store admins too... umm think on it
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

organizationSchema.methods.generateRefreshToken = function(){
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

export const Organization = mongoose.model("Organization", organizationSchema);