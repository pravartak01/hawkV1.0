import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
    email: String,
    otp: String,              // Store plain OTP
    otpTimestamp: Date,       // Store OTP generation time
    isVerified: Boolean,
    lastOTPRequest: Date      // Optional: for rate limiting
});

export const Email = mongoose.model('Email', emailSchema); // pre save hash