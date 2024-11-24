const busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AppError = require('../utils/appError');

const createExcelUploadMiddleware = () => {
    return (req, res, next) => {
        // Only process multipart/form-data
        if (!req.is('multipart/form-data')) {
            return next(new AppError('Expected multipart/form-data', 400));
        }

        const bb = busboy({
            headers: req.headers,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
                files: 1 // Allow only 1 file
            }
        });

        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        let filePromise = null;
        let errorOccurred = false;

        bb.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
            // Validate mime type
            if (!allowedMimeTypes.includes(mimeType)) {
                errorOccurred = true;
                return next(new AppError('Only Excel files are allowed', 400));
            }

            // Create temporary file
            const tmpFilePath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
            const writeStream = fs.createWriteStream(tmpFilePath);

            let fileSize = 0;

            file.on('data', (data) => {
                fileSize += data.length;

                // Check file size
                if (fileSize > 10 * 1024 * 1024) { // 10MB
                    errorOccurred = true;
                    writeStream.end();
                    fs.unlink(tmpFilePath, () => {});
                    return next(new AppError('File size too large. Maximum size is 10MB', 400));
                }
            });

            filePromise = new Promise((resolve, reject) => {
                file.pipe(writeStream);

                writeStream.on('finish', () => {
                    resolve({
                        fieldname,
                        originalname: filename,
                        encoding,
                        mimetype: mimeType,
                        filepath: tmpFilePath,
                        size: fileSize
                    });
                });

                writeStream.on('error', (err) => {
                    fs.unlink(tmpFilePath, () => {});
                    reject(err);
                });
            });
        });

        bb.on('error', (err) => {
            if (!errorOccurred) {
                next(new AppError(`Error processing upload: ${err.message}`, 400));
            }
        });

        bb.on('finish', async () => {
            if (!filePromise || errorOccurred) {
                return;
            }

            try {
                const fileInfo = await filePromise;
                req.file = fileInfo;
                next();
            } catch (err) {
                next(new AppError(`Error saving file: ${err.message}`, 500));
            }
        });

        req.pipe(bb);
    };
};

module.exports = createExcelUploadMiddleware;
