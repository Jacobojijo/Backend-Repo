const express = require('express');
const router = express.Router();
const { protect } = require('../../controllers/student/studentAuthController');
const {
    getCertificate,
    downloadCertificate,
    getAllCertificates,
} = require('../../controllers/certificate/certificateController');

// Retrieve all certificates
router.get('/', protect, getAllCertificates);

// Retrieve a single certificate by its ID
router.get('/:certificateID', protect, getCertificate);

// Download a certificate as a PDF
router.get('/download/:certificateID', protect, downloadCertificate);

module.exports = router;
