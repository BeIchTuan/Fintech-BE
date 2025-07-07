const express = require('express');
const axios = require('axios');
const router = express.Router();
const Transaction = require('../models/transactions');

// Tính phí
function calculateFee(amount) {
  if (amount >= 100 && amount <= 10000) return 100;
  if (amount > 10000 && amount <= 50000) return 400;
  if (amount > 50000 && amount <= 100000) return 700;
  return 1000;
}

// Tạo giao dịch mới
router.post('/create', async (req, res) => {
  try {
    const { senderAmountJPY, expectedReceiverAmountVND } = req.body;

    if (!senderAmountJPY || !expectedReceiverAmountVND) {
      return res.status(400).json({
        message: "Missing senderAmountJPY or expectedReceiverAmountVND"
      });
    }

    // Lấy tỷ giá JPY -> VND
    const exchangeRes = await axios.get(`https://open.er-api.com/v6/latest/JPY`);
    const rate = exchangeRes.data.rates.VND;

    // Tính phí
    const feeJPY = calculateFee(senderAmountJPY);

    // Số JPY còn lại sau khi trừ phí
    const amountAfterFeeJPY = senderAmountJPY - feeJPY;

    // Quy đổi sang VND
    const receiverAmountVND = amountAfterFeeJPY * rate;

    // So sánh với số người nhận mong muốn
    let isAchievable = receiverAmountVND >= expectedReceiverAmountVND;

    // Lưu DB
    const newTransaction = await Transaction.create({
      senderAmountJPY,
      receiverAmountVND,
      exchangeRate: rate,
      feeJPY,
    });

    res.json({
      transaction: newTransaction,
      expectedReceiverAmountVND,
      isAchievable,
      receiverAmountVND,
      message: isAchievable
        ? "Recipient will receive enough as expected"
        : "Recipient will NOT receive enough as expected"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Lấy toàn bộ lịch sử
router.get('/history', async (req, res) => {
  const data = await Transaction.find().sort({createdAt: -1});
  res.json(data);
});

module.exports = router;
