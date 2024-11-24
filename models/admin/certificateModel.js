const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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

// Create a unique compound index
certificateSchema.index({ certificateID: 1 }, { unique: true });

// Optional: Add a virtual property for internship duration
certificateSchema.virtual('internshipDuration').get(function() {
    const duration = this.endDate - this.startDate;
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    return `${days} days`;
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;