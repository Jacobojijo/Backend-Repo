const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const studentSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'please enter your first name'],
        trim: true,
        maxLength: [100, 'Your first name can not be more than 100 characters!']
    },
    lastName: {
        type: String,
        required: [true, 'please enter your last name'],
        trim: true,
        maxLength: [100, 'Your last name can not be more than 100 characters!']
    },
    email: {
        type: String,
        required: [true, 'Enter your email address'],
        unique: [true, 'This email address already exists on our server!'],
        lowercase: true,
        validate: [validator.isEmail, 'Enter a valid Email address!'],
        index: true,
    },
    role: {
        type: String,
        default: 'student',
    },
    password: {
        type: String,
        required: [true, 'Please enter a password!'],
        trim: true,
        minlength: [8, 'Your password cannot be less than 8 characters!'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        trim: true,
        minlength: [8, 'Your password cannot be less than 8 characters!'],
        validate: {
            validator: function (el) {
            return el === this.password;
            },
            message: 'Password do not match',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    isBanned: {
        type: Boolean,
        default: false,
        select: false,
    },
    isSuspendedPermanently: {
        type: Boolean,
        default: false,
        select: false,
        index: true,
    },
    suspendedUntil: {
        type: Date,
        default: null,
        index: true,
    },
    confirmationToken: {
        type: String,
        index: true,
    },
    confirmationTokenExpiration: {
        type: Date,
        index: true,
    },
    createdAt: {
        type: Date
    },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

studentSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
  });

studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hashSync(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

studentSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

studentSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

studentSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
    );
    return JWTTimestamp < changedTimestamp;
    }
    return false;
};

studentSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');


    this.passwordResetExpires = Date.now() + 1 * 60 * 1000;

    return resetToken;
};

const Student =  mongoose.model('Student', studentSchema);

module.exports = Student;
