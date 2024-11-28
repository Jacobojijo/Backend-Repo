const Certificate = require('../../models/admin/certificateModel');
const PDFDocument = require('pdfkit');

// Retrieve a single certificate by ID
exports.getCertificate = async (req, res) => {
    try {
        const { certificateID } = req.params;
        const certificate = await Certificate.findOne({ certificateID });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        res.json(certificate);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download a certificate as a PDF
exports.downloadCertificate = async (req, res) => {
    try {
        const { certificateID } = req.params;
        const certificate = await Certificate.findOne({ certificateID });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${certificateID}_certificate.pdf`
        );

        const doc = new PDFDocument();
        doc.pipe(res);

        doc.fontSize(16).text(`Certificate ID: ${certificate.certificateID}`);
        doc.text(`Student Name: ${certificate.studentName}`);
        doc.text(`Internship Domain: ${certificate.internshipDomain}`);
        doc.text(`Start Date: ${new Date(certificate.startDate).toDateString()}`);
        doc.text(`End Date: ${new Date(certificate.endDate).toDateString()}`);
        if (certificate.expiryDate) {
            doc.text(`Expiry Date: ${new Date(certificate.expiryDate).toDateString()}`);
        }

        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Retrieve all certificates
exports.getAllCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find();

        res.status(200).json({
            status: 'success',
            results: certificates.length,
            data: certificates
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
