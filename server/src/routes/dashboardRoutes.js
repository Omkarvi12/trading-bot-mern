const express = require("express");

const {
  getDashboardSummary,
  getRecentTrades,
  getOpenTrades,
  getPnLHistory,
} = require("../controllers/dashboardController");

const router = express.Router();

// ==========================================
// DASHBOARD SUMMARY
// GET /api/dashboard
// ==========================================

router.get(
  "/",
  getDashboardSummary
);

// ==========================================
// RECENT TRADES
// GET /api/dashboard/recent-trades
// ==========================================

router.get(
  "/recent-trades",
  getRecentTrades
);

// ==========================================
// OPEN TRADES
// GET /api/dashboard/open-trades
// ==========================================

router.get(
  "/open-trades",
  getOpenTrades
);

// ==========================================
// PNL HISTORY
// GET /api/dashboard/pnl
// ==========================================

router.get(
  "/pnl",
  getPnLHistory
);

module.exports = router;