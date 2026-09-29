const express = require("express");

const router = express.Router();

const {
  startBot,
  stopBot,
  getBotStatus,
} = require("../scheduler/cronJobs");

// ==========================================
// GET BOT STATUS
// ==========================================

router.get("/status", (req, res) => {
  try {
    const status = getBotStatus();

    res.json({
      success: true,

      data: {
        running: status.running,

        status: status.running
          ? "RUNNING"
          : "STOPPED",
      },
    });
  } catch (error) {
    console.error(
      "❌ Bot status error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to get bot status",
      error: error.message,
    });
  }
});

// ==========================================
// START BOT
// ==========================================

router.post("/start", (req, res) => {
  try {
    const result = startBot();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,

      message:
        "Trading bot started successfully",

      data: {
        running: true,
        status: "RUNNING",
      },
    });
  } catch (error) {
    console.error(
      "❌ Start bot error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to start trading bot",
      error: error.message,
    });
  }
});

// ==========================================
// STOP BOT
// ==========================================

router.post("/stop", (req, res) => {
  try {
    const result = stopBot();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,

      message:
        "Trading bot stopped successfully",

      data: {
        running: false,
        status: "STOPPED",
      },
    });
  } catch (error) {
    console.error(
      "❌ Stop bot error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to stop trading bot",
      error: error.message,
    });
  }
});

module.exports = router;