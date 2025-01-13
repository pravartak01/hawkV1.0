import mongoose from 'mongoose';
const { Schema } = mongoose;

const vulnerabilitySchema = new Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    productVersion: {
        type: String,
        required: true,
        trim: true
    },
    oemName: {
        type: String,
        required: true,
        trim: true
    },
    severityLevel: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        trim: true
    },
    vulnerabilityDescription: {
        type: String,
        required: true,
        trim: true
    },
    mitigationStrategy: {
        type: String,
        required: true,
        trim: true
    },
    publishedDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    uniqueID: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    references: [{
        type: String,
        trim: true
    }],
    additionalInfo: {
        cvssScore: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        vector: {
            type: String,
            trim: true,
            required: true
        },
        exploitabilityScore: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        }
    }
}, {
    timestamps: true
});

export const Vulnerabilities = mongoose.model('Vulnerabilities', vulnerabilitySchema);
