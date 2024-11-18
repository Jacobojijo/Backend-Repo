const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../../utils/appError');
const Admin = require('../../models/admin/adminModel');
const catchAsync = require('../../utils/catchAsync');
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) * 24 * 60 * 60 * 1000
    ), 
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// admin login logic
exports.adminLogin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(admin, 200, res);
})

// admin logout logic
exports.adminLogout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
        status: 'success',
        message: "Logged out successfully",
    })
};

// admin protect middleware
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('Please log in to get access', 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    let currentUser;

    currentUser = await Admin.findById(decoded.id);
  
    if (!currentUser) {
        return next(new AppError('The token does not exist!', 401));
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
        new AppError('User recently changed password! Please log in again', 401)
        );
    }

    req.user = currentUser;
    next();
});

// admin check if logged in middleware
exports.isLoggedIn = async (req, res, next) => {
    req.locals = req.locals || {};
  
    if (req.cookies.jwt) {
      try {
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECRET
        );
  
        const currentUser = await Admin.findById(decoded.id);
  
        if (!currentUser) {
          return next();
        }
  
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }
  
        req.locals.user = currentUser;
        next();
      } catch (err) {
        return next();
      }
    }
    next();
};

// admin restrict to middlware
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action'),
        403
      );
    }
    next();
};

// admin update password logic
exports.adminUpdatePassword = catchAsync(async (req, res, next) => {
    const admin = await Admin.findById(req.user.id).select('+password');
  
    if (!(await admin.correctPassword(req.body.passwordCurrent, admin.password))) {
      return next(new AppError('Your current password is wrong', 401));
    }
  
    admin.password = req.body.password;
    admin.passwordConfirm = req.body.passwordConfirm;
    await admin.save();
  
    createSendToken(admin, 200, res);
});
