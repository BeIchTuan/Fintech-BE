const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    senderAmountJPY: Number,
    receiverAmountVND: Number,
    exchangeRate: Number,
    feeJPY: Number,
    expectedReceiverAmountVND: Number,
    mode: {
        type: String,
        enum: ["JPY_to_VND", "VND_to_JPY"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
