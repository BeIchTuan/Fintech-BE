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
    const exchangeRes = await axios.get(`https://open.er-api.com/v6/latest/JPY`);
    const rate = exchangeRes.data.rates.VND;

    let result = {};

    if (senderAmountJPY) {
      const feeJPY = calculateFee(senderAmountJPY);
      const amountAfterFeeJPY = senderAmountJPY - feeJPY;
      const receiverAmountVND = amountAfterFeeJPY * rate;

      result = {
        mode: "JPY_to_VND",
        senderAmountJPY,
        feeJPY,
        amountAfterFeeJPY,
        receiverAmountVND,
        exchangeRate: rate,
      };
    } else if (expectedReceiverAmountVND) {
      const estimatedJPY = expectedReceiverAmountVND / rate;
      const feeJPY = calculateFee(estimatedJPY);
      const totalJPY = estimatedJPY + feeJPY;

      result = {
        mode: "VND_to_JPY",
        expectedReceiverAmountVND,
        estimatedJPY,
        feeJPY,
        totalJPYToSend: totalJPY,
        exchangeRate: rate,
      };
    }

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
