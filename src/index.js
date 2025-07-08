import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import pkg from 'body-parser';
const { json } = pkg;
import dotenv from 'dotenv';
import connectDB from './Config/db.js';
import authRoute from './Route/AuthRoute/AuthRoute.js'
import cors from 'cors';
dotenv.config();

const app = express();

// Connect to the database
await connectDB();

app.use(cors());
// Body parser middleware
app.use(json());

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.get('/', (req, res) => {
    res.send('Welcome to the Dancer Booking API');
});
// Example route with express-validator
app.use('/api/v1/auth', authRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});