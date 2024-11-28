const express = require('express');
const router = express.Router();
const {
    getCertificate,
    downloadCertificate,
} = require('../../controllers/certificate/certificateController');

router.get('/:certificateID', getCertificate);

router.get('/download/:certificateID', downloadCertificate);

module.exports = router;
