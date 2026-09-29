const mongoose = require("mongoose");

const strategyConfigSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["EMA_CROSSOVER", "RSI_MEAN_REVERSION"],
      required: true,
    },

    symbol: {
      type: String,
      default: "BTC/USDT",
      uppercase: true,
    },

    timeframe: {
      type: String,
      default: "5m",
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    parameters: {
      emaFast: {
        type: Number,
        default: 20,
      },

      emaSlow: {
        type: Number,
        default: 50,
      },

      rsiPeriod: {
        type: Number,
        default: 14,
      },

      rsiOversold: {
        type: Number,
        default: 30,
      },

      rsiOverbought: {
        type: Number,
        default: 70,
      },
    },

    risk: {
      riskPerTrade: {
        type: Number,
        default: 1,
      },

      stopLossPercent: {
        type: Number,
        default: 2,
      },

      takeProfitPercent: {
        type: Number,
        default: 4,
      },

      maxDailyLoss: {
        type: Number,
        default: 5,
      },

      maxOpenTrades: {
        type: Number,
        default: 3,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StrategyConfig",
  strategyConfigSchema
);