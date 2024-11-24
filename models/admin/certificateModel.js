const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
    certificateID: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    studentName: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    internshipDomain: {
        type: String,
        required: [true, 'Internship domain is required'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Internship start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'Internship end date is required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware to generate a unique certificate ID before saving
certificateSchema.pre('save', function(next) {
    if (!this.certificateID) {
        const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
        const uniqueID = uuidv4().split('-')[0].toUpperCase(); // Short UUID
        this.certificateID = `CERT-${timestamp}-${uniqueID}`; // Format: CERT-<timestamp>-<short-uuid>
    }
    next();
});

certificateSchema.virtual('internshipDuration').get(function() {
    const duration = this.endDate - this.startDate;
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    return `${days} days`;
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
