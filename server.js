const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());

const morganFormat = process.env.NODE_ENV === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
    : 'dev';

app.use(morgan(morganFormat, {
    skip: (req, res) => process.env.NODE_ENV === 'production' && res.statusCode < 400
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
    maxAge: 86400,
    preflightContinue: false,
    exposedHeaders: ['Content-Length', 'Content-Type']
}));

// connect db
mongoose
    .connect('mongodb+srv://hoangvanluong:hvl123456@ecommerce.ko8pa.mongodb.net/sample_airbnb?retryWrites=true&w=majority')
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));

// routes
app.use('/api/transactions', require('./routes/transactions'));

app.listen(5000, () => console.log('Server running on port 5000'));
