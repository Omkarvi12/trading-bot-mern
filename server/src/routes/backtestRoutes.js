const express = require("express");

const router = express.Router();

const {
  runBacktestController,
} = require("../controllers/backtestController");

// ==========================================
// RUN BACKTEST
// ==========================================

router.post(
  "/run",
  runBacktestController
);

module.exports = router;