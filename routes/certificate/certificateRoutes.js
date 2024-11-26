const express = require('express');
const router = express.Router();
const { protect } = require('../../controllers/student/studentAuthController');
const {
    getCertificate,
    downloadCertificate,
} = require('../../controllers/certificate/certificateController');

router.get('/:certificateID', protect, getCertificate);

router.get('/download/:certificateID', protect, downloadCertificate);

module.exports = router;
