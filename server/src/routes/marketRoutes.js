const express = require("express");
const router = express.Router();

const CCXTExecutor = require("../execution/ccxtExecutor");

const broker = new CCXTExecutor();

// ==========================================
// GET LIVE MARKET PRICE
// GET /api/market/price?symbol=BTC/USDT
// ==========================================

router.get("/price", async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTC/USDT";

    const price = await broker.getCurrentPrice(symbol);

    if (!price || !Number.isFinite(Number(price))) {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch live market price",
      });
    }

    res.json({
      success: true,
      data: {
        symbol,
        price: Number(price),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "❌ Market price error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch live market price",
      error: error.message,
    });
  }
});

module.exports = router;