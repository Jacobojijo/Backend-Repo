const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Certificate = require('../../models/admin/certificateModel');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const adminDataController = {
    uploadStudentData: catchAsync(async (req, res, next) => {
        // Check if a file was uploaded
        if (!req.file) {
            return next(new AppError('Please upload an Excel file', 400));
        }

        try {
            // Read the file content
            const fileContent = await fs.readFile(req.file.filepath);
            
            // Read the uploaded Excel file
            const workbook = xlsx.read(fileContent, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert the Excel sheet to JSON
            const data = xlsx.utils.sheet_to_json(worksheet);

            // Check if the file is empty
            if (data.length === 0) {
                return next(new AppError('Excel file is empty', 400));
            }

            // Validate the structure of the data
            const requiredFields = ['studentName', 'internshipDomain', 'startDate', 'endDate'];
            const invalidRows = data.filter(row => !requiredFields.every(field => row[field]));

            if (invalidRows.length > 0) {
                return next(new AppError(`Invalid data in rows: ${JSON.stringify(invalidRows)}`, 400));
            }

            // Start a MongoDB transaction
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Generate certificates and insert them into the database
                const certificates = await Certificate.insertMany(
                    data.map(row => ({
                        certificateID: `CERT-${Date.now().toString(36).toUpperCase()}-${uuidv4().split('-')[0].toUpperCase()}`,
                        studentName: row.studentName,
                        internshipDomain: row.internshipDomain,
                        startDate: new Date(row.startDate),
                        endDate: new Date(row.endDate),
                    })),
                    { session }
                );

                // Commit the transaction
                await session.commitTransaction();
                session.endSession();

                // Clean up: Remove the temporary file
                await fs.unlink(req.file.filepath);

                res.status(201).json({
                    status: 'success',
                    message: 'Student data uploaded successfully',
                    data: {
                        totalRecords: certificates.length,
                        uploadedRecords: certificates
                    }
                });
            } catch (error) {
                // Rollback the transaction on error
                await session.abortTransaction();
                session.endSession();
                
                // Clean up: Remove the temporary file
                await fs.unlink(req.file.filepath).catch(console.error);
                
                return next(new AppError(`Error uploading data: ${error.message}`, 500));
            }
        } catch (error) {
            // Clean up: Remove the temporary file if it exists
            if (req.file && req.file.filepath) {
                await fs.unlink(req.file.filepath).catch(console.error);
            }
            return next(new AppError(`Error processing Excel file: ${error.message}`, 400));
        }
    }),

    validateCertificate: catchAsync(async (req, res, next) => {
        const { certificateID } = req.params;

        // Find the certificate in the database
        const certificate = await Certificate.findOne({ certificateID });

        // Check if the certificate exists
        if (!certificate) {
            return next(new AppError('No certificate found with this ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                certificate
            }
        });
    })
};

module.exports = adminDataController;