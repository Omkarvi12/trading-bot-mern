const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // TRADE DETAILS
    // ==========================================

    symbol: {
      type: String,
      required: true,
    },

    strategy: {
      type: String,
      required: true,
    },

    side: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    type: {
      type: String,
      enum: ["MARKET", "LIMIT"],
      default: "MARKET",
    },

    quantity: {
      type: Number,
      required: true,
    },

    entryPrice: {
      type: Number,
      required: true,
    },

    exitPrice: {
      type: Number,
      default: null,
    },

    stopLoss: {
      type: Number,
      default: null,
    },

    takeProfit: {
      type: Number,
      default: null,
    },

    pnl: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // CLOSE REASON
    // ==========================================

    closeReason: {
      type: String,
      enum: [
        "MANUAL",
        "STOP_LOSS",
        "TAKE_PROFIT",
        "BOT_SIGNAL",
        "RISK_LIMIT",
      ],
      default: null,
    },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "CANCELLED"],
      default: "OPEN",
    },

    mode: {
      type: String,
      enum: ["DRY_RUN", "LIVE"],
      default: "DRY_RUN",
    },

    openedAt: {
      type: Date,
      default: Date.now,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trade", tradeSchema);