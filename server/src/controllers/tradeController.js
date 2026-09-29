const mongoose = require("mongoose");

const OrderManager = require("../execution/orderManager");

const orderManager = new OrderManager();

const Trade = require("../models/Trade");

// ==========================================
// CREATE TRADE
// ==========================================
const createTrade = async (req, res) => {
  try {
    const {
      symbol = "BTC/USDT",
      strategy = "MANUAL",
      side,
      quantity,
      stopLoss,
      takeProfit,
    } = req.body;

    // ------------------------------------------
    // Logged-in user
    // ------------------------------------------
    const user = req.user.id;

    // ------------------------------------------
    // Validate side
    // ------------------------------------------
    if (!["BUY", "SELL"].includes(side)) {
      return res.status(400).json({
        success: false,
        message: "Side must be BUY or SELL",
      });
    }

    // ------------------------------------------
    // Validate quantity
    // ------------------------------------------
    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid positive quantity is required",
      });
    }

    // ------------------------------------------
    // Validate Stop Loss
    // ------------------------------------------
    let parsedStopLoss = null;

    if (
      stopLoss !== undefined &&
      stopLoss !== null &&
      stopLoss !== ""
    ) {
      parsedStopLoss = Number(stopLoss);

      if (
        !Number.isFinite(parsedStopLoss) ||
        parsedStopLoss <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid stopLoss",
        });
      }
    }

    // ------------------------------------------
    // Validate Take Profit
    // ------------------------------------------
    let parsedTakeProfit = null;

    if (
      takeProfit !== undefined &&
      takeProfit !== null &&
      takeProfit !== ""
    ) {
      parsedTakeProfit = Number(takeProfit);

      if (
        !Number.isFinite(parsedTakeProfit) ||
        parsedTakeProfit <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid takeProfit",
        });
      }
    }

    // ------------------------------------------
    // Execute trade
    // ------------------------------------------
    const result = await orderManager.openTrade({
      user,
      symbol,
      strategy,
      signal: side,
      quantity: parsedQuantity,
      stopLoss: parsedStopLoss,
      takeProfit: parsedTakeProfit,
    });

    res.status(201).json({
      success: true,
      message: "Trade created successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "❌ Create trade error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create trade",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL TRADES
// ==========================================
const getTrades = async (req, res) => {
  try {
    const trades = await Trade.find({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (error) {
    console.error(
      "❌ Get trades error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch trades",
      error: error.message,
    });
  }
};

// ==========================================
// GET OPEN TRADES
// ==========================================
const getOpenTrades = async (req, res) => {
  try {
    const trades = await Trade.find({
      user: req.user.id,
      status: "OPEN",
    })
      .sort({ openedAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (error) {
    console.error(
      "❌ Get open trades error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch open trades",
      error: error.message,
    });
  }
};

// ==========================================
// GET CLOSED TRADES
// ==========================================
const getClosedTrades = async (req, res) => {
  try {
    const trades = await Trade.find({
      user: req.user.id,
      status: "CLOSED",
    })
      .sort({ closedAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (error) {
    console.error(
      "❌ Get closed trades error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch closed trades",
      error: error.message,
    });
  }
};

// ==========================================
// CLOSE TRADE
// ==========================================
const closeTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { exitPrice } = req.body;

    // ------------------------------------------
    // Validate Trade ID
    // ------------------------------------------
    if (!tradeId) {
      return res.status(400).json({
        success: false,
        message: "Trade ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tradeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Trade ID",
      });
    }

    // ------------------------------------------
    // Validate Exit Price
    // ------------------------------------------
    const parsedExitPrice = Number(exitPrice);

    if (
      !Number.isFinite(parsedExitPrice) ||
      parsedExitPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid positive exitPrice is required",
      });
    }

    // ------------------------------------------
    // Check Trade Ownership
    // ------------------------------------------
    const trade = await Trade.findOne({
      _id: tradeId,
      user: req.user.id,
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found",
      });
    }

    // ------------------------------------------
    // Close Trade
    // ------------------------------------------
    const result = await orderManager.closeTrade(
      tradeId,
      parsedExitPrice
    );

    res.json({
      success: true,
      message: "Trade closed successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "❌ Close trade error:",
      error.message
    );

    if (error.message === "Trade not found") {
      return res.status(404).json({
        success: false,
        message: "Trade not found",
      });
    }

    if (error.message === "Trade is not open") {
      return res.status(400).json({
        success: false,
        message: "Trade is already closed",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to close trade",
      error: error.message,
    });
  }
};

// ==========================================
// GET TRADE BY ID
// ==========================================
const getTradeById = async (req, res) => {
  try {
    const { tradeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tradeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Trade ID",
      });
    }

    // ------------------------------------------
    // Only current user's trade
    // ------------------------------------------
    const trade = await Trade.findOne({
      _id: tradeId,
      user: req.user.id,
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found",
      });
    }

    res.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error(
      "❌ Get trade error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch trade",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  createTrade,
  getTrades,
  getOpenTrades,
  getClosedTrades,
  closeTrade,
  getTradeById,
};