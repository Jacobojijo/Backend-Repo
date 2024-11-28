const express = require('express');
const router = express.Router();
const {
    getCertificate,
    downloadCertificate,
    getAllCertificates,
} = require('../../controllers/certificate/certificateController');

// Retrieve all certificates
router.get('/', protect, getAllCertificates);

// Retrieve a single certificate by its ID
router.get('/:certificateID', protect, getCertificate);

router.get('/download/:certificateID', downloadCertificate);

module.exports = router;
