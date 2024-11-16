const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception 🚨:', err.name, err.message);
    process.exit(1);
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// mongoose.set('debug', true);

mongoose.connect(DB, {
    maxIdleTimeMS: 30000,
}).then(() => console.log('DB connection successful 🚀'));

const app = require('./app');

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port} 🏃`);
});
process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection 🚩:', err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
