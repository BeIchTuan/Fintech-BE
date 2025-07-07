const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  senderAmountJPY: Number,
  receiverAmountVND: Number,
  exchangeRate: Number,
  feeJPY: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
