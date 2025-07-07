const express = require('express');
const axios = require('axios');
const router = express.Router();
const Transaction = require('../models/transactions');

// Tính phí
function calculateFee(amount) {
  if (amount >= 100 && amount <= 10000) return 100;
  if (amount > 10000 && amount <= 50000) return 400;
  if (amount > 50000 && amount <= 100000) return 700;
  if (amount > 100000) return 1000;
  return 0; 
}

// Tạo giao dịch mới
router.post('/create', async (req, res) => {
  try {
    const { senderAmountJPY, expectedReceiverAmountVND } = req.body;

    if (!senderAmountJPY && !expectedReceiverAmountVND) {
      return res.status(400).json({
        message: "Must provide either senderAmountJPY or expectedReceiverAmountVND"
      });
    }

    // Lấy tỷ giá real-time
    const baseCurrency = senderAmountJPY ? 'JPY' : 'VND';
    const exchangeRes = await axios.get(`https://v6.exchangerate-api.com/v6/1107d998b8150692263e96fc/latest/${baseCurrency}`);
    const rate = baseCurrency === 'JPY' ? exchangeRes.data.conversion_rates.VND : exchangeRes.data.conversion_rates.JPY;

    let result = {};

    if (senderAmountJPY) {
      const feeJPY = Number(calculateFee(senderAmountJPY)) || 0;
      const amountAfterFeeJPY = senderAmountJPY - feeJPY;
      const receiverAmountVND = amountAfterFeeJPY * rate;

      result = {
        mode: "JPY_to_VND",
        senderAmountJPY: Number(senderAmountJPY),
        feeJPY: Number(feeJPY),
        amountAfterFeeJPY: Number(amountAfterFeeJPY),
        receiverAmountVND: Number(receiverAmountVND),
        exchangeRate: Number(rate),
        expectedReceiverAmountVND: expectedReceiverAmountVND ? Number(expectedReceiverAmountVND) : undefined
      };
    } else if (expectedReceiverAmountVND) {
      let estimatedJPY;
      if (baseCurrency === 'VND') {
        estimatedJPY = expectedReceiverAmountVND * rate;
      } else {
        estimatedJPY = expectedReceiverAmountVND / rate;
      }
      const feeJPY = Number(calculateFee(estimatedJPY)) || 0;
      const totalJPY = estimatedJPY + feeJPY;

      result = {
        mode: "VND_to_JPY",
        expectedReceiverAmountVND: Number(expectedReceiverAmountVND),
        estimatedJPY: Number(estimatedJPY),
        feeJPY: Number(feeJPY),
        totalJPYToSend: Number(totalJPY),
        exchangeRate: Number(rate)
      };
    }

    // Lưu giao dịch vào DB chỉ với các trường phù hợp với schema
    const transactionData = {};
    if (result.mode === "JPY_to_VND") {
      transactionData.senderAmountJPY = result.senderAmountJPY;
      transactionData.receiverAmountVND = result.receiverAmountVND;
      transactionData.exchangeRate = result.exchangeRate;
      transactionData.feeJPY = result.feeJPY;
      transactionData.expectedReceiverAmountVND = result.expectedReceiverAmountVND;
      transactionData.mode = result.mode;
    } else if (result.mode === "VND_to_JPY") {
      transactionData.senderAmountJPY = result.totalJPYToSend;
      transactionData.receiverAmountVND = result.expectedReceiverAmountVND;
      transactionData.exchangeRate = result.exchangeRate;
      transactionData.feeJPY = result.feeJPY;
      transactionData.expectedReceiverAmountVND = result.expectedReceiverAmountVND;
      transactionData.mode = result.mode;
    }
    const transaction = new Transaction(transactionData);
    await transaction.save();
    // Trả về kết quả
    res.json(result);

  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

// Lấy toàn bộ lịch sử
router.get('/history', async (req, res) => {
  const data = await Transaction.find().sort({createdAt: -1});
  res.json(data);
});

module.exports = router;
