const express = require('express');
const adminAuthController = require('../../controllers/admin/adminAuthController');

const Router = express.Router();

// admin login endpoint
Router.post('/signin', adminAuthController.adminLogin);

// admin logout endpoint
Router.get('/logout', adminAuthController.adminLogout);

// admin update password endpoint
Router.patch('/update-password', 
    adminAuthController.protect,
    adminAuthController.restrictTo('admin'),
    adminAuthController.adminUpdatePassword
);

//////////////////////////////// GENERIC ROUTES ////////////////////////////////

module.exports = Router;
