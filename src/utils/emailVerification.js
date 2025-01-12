import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import dotenv from "dotenv"
dotenv.config();

class SendGridOTPService {
    constructor() {
        // Get all config from environment variables
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY is required in environment variables');
        }
        if (!process.env.SENDER_EMAIL) {
            throw new Error('SENDER_EMAIL is required in environment variables');
        }

        // Initialize properties from env variables
        this.apiKey = process.env.SENDGRID_API_KEY;
        this.senderEmail = process.env.SENDER_EMAIL;
        this.otpLength = process.env.OTP_LENGTH || 6;
        this.otpExpiry = process.env.OTP_EXPIRY_MINUTES || 10;

        sgMail.setApiKey(this.apiKey);
    }

    generateOTP() {
        const min = Math.pow(10, this.otpLength - 1);
        const max = Math.pow(10, this.otpLength) - 1;
        const otp = crypto.randomInt(min, max).toString().padStart(this.otpLength, '0');
        
        return {
            otp,
            otpExpiry: this.otpExpiry,
            otpTimestamp: new Date()
        };
    }

    async sendOTP(recipientEmail, otp, brandName = process.env.BRAND_NAME || 'hawk') {
        const emailContent = {
            subject: 'Verify Your Email',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        .container {
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .otp-box {
                            background-color: #f8f9fa;
                            padding: 15px;
                            border-radius: 5px;
                            font-size: 24px;
                            text-align: center;
                            letter-spacing: 5px;
                            margin: 20px 0;
                        }
                        .expires-text {
                            color: #6c757d;
                            font-size: 14px;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Verify Your Email Address</h2>
                        <p>Hello,</p>
                        <p>Your verification code for ${brandName} is:</p>
                        <div class="otp-box">
                            <strong>${otp}</strong>
                        </div>
                        <p class="expires-text">This code will expire in ${this.otpExpiry} minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                        <p>Best regards,<br>${brandName} Team</p>
                    </div>
                </body>
                </html>
            `
        };

        const msg = {
            to: recipientEmail,
            from: this.senderEmail,
            subject: emailContent.subject,
            html: emailContent.html
        };

        try {
            await sgMail.send(msg);
            return {
                success: true,
                message: 'OTP sent successfully'
            };
        } catch (error) {
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    }

    verifyOTP(storedOTP, providedOTP, timestamp) {
        const now = new Date();
        const otpTime = new Date(timestamp);
        const diffMinutes = (now - otpTime) / (1000 * 60);
        
        if (diffMinutes > this.otpExpiry) {
            return {
                success: false,
                message: 'OTP has expired'
            };
        }

        if (storedOTP === providedOTP) {
            return {
                success: true,
                message: 'OTP verified successfully'
            };
        }

        return {
            success: false,
            message: 'Invalid OTP'
        };
    }
}

export default SendGridOTPService;