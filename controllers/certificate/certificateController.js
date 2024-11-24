const Certificate = require('../../models/admin/certificateModel');
const PDFDocument = require('pdfkit');

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

exports.downloadCertificate = async (req, res) => {
    try {
        const { certificateID } = req.params;
        const certificate = await Certificate.findOne({ certificateID });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        // Generate PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${certificateID}_certificate.pdf`
        );

        doc.pipe(res);
        doc.fontSize(16).text(`Certificate ID: ${certificateID}`);
        doc.text(`Name: ${certificate.name}`);
        doc.text(`Course: ${certificate.course}`);
        doc.text(`Grade: ${certificate.grade}`);
        doc.text(`Issue Date: ${certificate.issueDate.toDateString()}`);
        if (certificate.expiryDate) {
            doc.text(`Expiry Date: ${certificate.expiryDate.toDateString()}`);
        }
        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
