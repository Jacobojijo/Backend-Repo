const express = require('express');
const adminAuthController = require('../../controllers/admin/adminAuthController');
const adminDataController = require('../../controllers/admin/adminDataController');
const createExcelUploadMiddleware = require('../../utils/busboyConfig');

const Router = express.Router();

// Admin Authentication Routes
Router.post('/signin', adminAuthController.adminLogin);
Router.get('/logout', adminAuthController.adminLogout);
Router.patch('/update-password',
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    adminAuthController.adminUpdatePassword
);

// Protected Data Routes
Router.post('/upload',
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    createExcelUploadMiddleware(),
    adminDataController.uploadStudentData
);

Router.get('/validate/:certificateID',
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    adminDataController.validateCertificate
);

module.exports = Router;