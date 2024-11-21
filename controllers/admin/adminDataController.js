const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Certificate = require('../../models/certificateModel');
const xlsx = require('xlsx');
const mongoose = require('mongoose');

// Endpoint 1: Admin Data Upload
exports.uploadStudentData = catchAsync(async (req, res, next) => {
    // Check if file exists
    if (!req.file) {
        return next(new AppError('Please upload an Excel file', 400));
    }

    // Read the uploaded Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert Excel sheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validate data structure
    const requiredFields = [
        'certificateID', 
        'studentName', 
        'internshipDomain', 
        'startDate', 
        'endDate'
    ];

    const invalidRows = data.filter(row => 
        !requiredFields.every(field => row[field])
    );

    if (invalidRows.length > 0) {
        return next(new AppError(`Invalid data in rows: ${JSON.stringify(invalidRows)}`, 400));
    }

    // Start a MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Bulk insert certificates
        const certificates = await Certificate.insertMany(
            data.map(row => ({
                certificateID: row.certificateID,
                studentName: row.studentName,
                internshipDomain: row.internshipDomain,
                startDate: new Date(row.startDate),
                endDate: new Date(row.endDate)
            })),
            { session }
        );

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            status: 'success',
            message: 'Student data uploaded successfully',
            data: {
                totalRecords: certificates.length,
                uploadedRecords: certificates
            }
        });
    } catch (error) {
        // Abort the transaction
        await session.abortTransaction();
        session.endSession();

        return next(new AppError(`Error uploading data: ${error.message}`, 500));
    }
});

// Endpoint 2: Data Validation & Retrieval
exports.validateCertificate = catchAsync(async (req, res, next) => {
    const { certificateID } = req.params;

    // Find the certificate
    const certificate = await Certificate.findOne({ certificateID });

    // Check if certificate exists
    if (!certificate) {
        return next(new AppError('No certificate found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            certificate
        }
    });
});