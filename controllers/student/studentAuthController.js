const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const AppError = require('../../utils/appError');
const Student = require('../../models/student/studentModel');
const Admin = require('../../models/admin/adminModel');
const catchAsync = require('../../utils/catchAsync');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res, jsonResponse) => {
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
    ...jsonResponse,
    token,
    data: {
      user,
    },
  });
};

// student signin logic
exports.studentLogin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
  
    const student = await Student.findOne({ email }).select('+password +isBanned +isSuspendedPermanently +suspendedUntil +active +emailVerify');
  
    if (!student || !(await student.correctPassword(password, student.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
  
    if (student.isBanned === true || student.isSuspendedPermanently === true || (student.suspendedUntil && student.suspendedUntil > new Date())) {
      let errorMessage;
      if (student.isBanned) {
        errorMessage = 'You are banned from Cverify. Please contact Cverify administrator for further information or if you think this is a mistake.';
      } else {
        if (student.suspendedUntil) {
          const suspensionTimeLeft = student.suspendedUntil.getTime() - Date.now();
          const daysLeft = Math.ceil(suspensionTimeLeft / (1000 * 3600 * 24)); 
          errorMessage = `You are temporarily suspended for ${daysLeft} days. Please contact Cverify administrator for further information or if you think this is a mistake.`;
        } else {
          errorMessage = 'You are suspended from Cverify. Please contact Cverify administrator for further information or if you think this is a mistake.';
        }
      }
      return next(new AppError(errorMessage, 403));
    }
  
    if (student.active === false) {
      return next(
        new AppError(
          'This account does not exist. Please contact the administrator if you think this is a mistake.',
          403
        )
      );
    }
  
    const message = `Welcome back ${student.firstName}`;
    
    createSendToken(student, 200, res, {
      status: 'success',
      message
    });
  })


// Student logout
exports.studentLogout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
      status: 'success',
      message: `Logged out! Bye for now.`,
  })
};

// student protect middleware
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

  currentUser = await Student.findById(decoded.id);

  if (!currentUser) {
    currentUser = await Admin.findById(decoded.id);
  }

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

// student isLoggedIn middleware
exports.isLoggedIn = async (req, res, next) => {
  req.locals = req.locals || {};

  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await Student.findById(decoded.id);

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

// student restrict to middleware
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
