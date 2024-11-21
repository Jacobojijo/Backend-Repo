const express = require('express');
const multer = require('multer');
const adminAuthController = require('../../controllers/admin/adminAuthController');
const adminDataController = require('../../controllers/admin/adminDataController');

const Router = express.Router();
const upload = multer(); // For handling file uploads

// Existing admin authentication routes
Router.post('/signin', adminAuthController.adminLogin);
Router.get('/logout', adminAuthController.adminLogout);
Router.patch('/update-password', 
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    adminAuthController.adminUpdatePassword
);

// New data upload endpoint
Router.post('/upload', 
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    upload.single('file'), // Expects a file with field name 'file'
    adminDataController.uploadStudentData
);

// Certificate validation endpoint
Router.get('/validate/:certificateID', 
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    adminDataController.validateCertificate
);

module.exports = Router;