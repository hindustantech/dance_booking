// src/Modle/Dancers/Dancers.modle.js
import { Schema, model } from 'mongoose';

const DancerSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    dancerName: {
        type: String,
        required: true,
        trim: true
    },
    danceSpeciality: {
        type: String,
        required: true,
        trim: true
    },
    ratePerPerformance: {
        type: Number,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    experience: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booked: {
        type: Boolean,
        default: false
    },
    dancerImage: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDocuments: {
        idProof: {
            type: String, // URL to the uploaded file
            default: null
        },
        idNumber: {
            type: String,
            default: null
        },
        idType: {
            type: String,
            enum: ['Aadhar', 'Passport', 'Driver License', 'PAN', null],
            default: null
        }
    }
}, {
    timestamps: true
});

const DancerVerificationSchema = new Schema({
    dancerId: {
        type: Schema.Types.ObjectId,
        ref: 'Dancer',
        required: true
    },
    idProofFile: {
        type: String,
        required: true
    },
    idProofNumber: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const DancerVerification = model('DancerVerification', DancerVerificationSchema);

export default model('Dancer', DancerSchema);