const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// connect db
mongoose
  .connect('mongodb+srv://hoangvanluong:hvl123456@ecommerce.ko8pa.mongodb.net/sample_airbnb?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// routes
app.use('/api/transactions', require('./routes/transactions'));

app.listen(5000, () => console.log('Server running on port 5000'));
