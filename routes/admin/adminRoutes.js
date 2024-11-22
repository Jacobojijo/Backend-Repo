const express = require('express');
const multer = require('multer');
const adminAuthController = require('../../controllers/admin/adminAuthController');

const Router = express.Router();

// Existing admin authentication routes
Router.post('/signin', adminAuthController.adminLogin);
Router.get('/logout', adminAuthController.adminLogout);
Router.patch('/update-password', 
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    adminAuthController.adminUpdatePassword
);


module.exports = Router;