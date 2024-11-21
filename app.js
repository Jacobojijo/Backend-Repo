const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const globalErrorHandler = require('./controllers/errorHandler/errorController');

// ---------------- route modules go here -------------------------------------

const adminRouter = require('./routes/admin/adminRoutes.js');
const certificateRouter = require('./routes/certificate/certificateRoutes.js');

// ---------------------------------------------------------------------------

const app = express();

app.use(cors())

app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.set('trust proxy', 1);

app.use(express.static(`${__dirname}/public}`));

app.use(express.json());

const limiter = rateLimit({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};

//-------------- Routes should go here ---------------------------

// admin routes
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/certificates', certificateRouter);

//----------------------------------------------------------------

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server 🚨!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
