const express = require('express');
const router = express.Router();
const { verifyStudentToken } = require('../../controllers/student/studentAuthController');
const {
    getCertificate,
    downloadCertificate,
} = require('../../controllers/certificate/certificateController');

router.get('/:certificateID', verifyStudentToken, getCertificate);

router.get('/download/:certificateID', verifyStudentToken, downloadCertificate);

module.exports = router;
