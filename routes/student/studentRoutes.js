const express = require('express');
const studentAuthController = require('../../controllers/student/studentAuthController');
const Router = express.Router();

// jobseeker signin endpoint
Router.post('/signin', studentAuthController.studentLogin);

// jobseeker logout endpoint
Router.get('/logout', studentAuthController.studentLogout);

module.exports = Router;
