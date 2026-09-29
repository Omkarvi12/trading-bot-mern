const express = require("express");

const {
  createTrade,
  getTrades,
  getOpenTrades,
  getClosedTrades,
  closeTrade,
  getTradeById,
} = require("../controllers/tradeController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// AUTHENTICATION
// ==========================================

// Ab /api/trades ki saari APIs login ke baad
// hi access hongi.

router.use(protect);

// ==========================================
// CREATE TRADE
// POST /api/trades
// ==========================================

router.post("/", createTrade);

// ==========================================
// GET ALL TRADES
// GET /api/trades
// ==========================================

router.get("/", getTrades);

// ==========================================
// GET OPEN TRADES
// GET /api/trades/open
// ==========================================

router.get("/open", getOpenTrades);

// ==========================================
// GET CLOSED TRADES
// GET /api/trades/closed
// ==========================================

router.get("/closed", getClosedTrades);

// ==========================================
// GET SINGLE TRADE
// GET /api/trades/:tradeId
// ==========================================

router.get("/:tradeId", getTradeById);

// ==========================================
// CLOSE TRADE
// POST /api/trades/:tradeId/close
// ==========================================

router.post("/:tradeId/close", closeTrade);

module.exports = router;