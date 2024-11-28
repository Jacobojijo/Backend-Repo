const express = require('express');
const router = express.Router();
const { protect } = require('../../controllers/student/studentAuthController');
const {
    getCertificate,
    downloadCertificate,
    getAllCertificates,
} = require('../../controllers/certificate/certificateController');

router.get('/', protect, getAllCertificates);

router.get('/:certificateID', getCertificate);

router.get('/download/:certificateID', downloadCertificate);

module.exports = router;
