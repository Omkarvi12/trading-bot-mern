const mongoose = require("mongoose");

const candleSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    timeframe: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      required: true,
    },

    open: {
      type: Number,
      required: true,
    },

    high: {
      type: Number,
      required: true,
    },

    low: {
      type: Number,
      required: true,
    },

    close: {
      type: Number,
      required: true,
    },

    volume: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate candles
candleSchema.index(
  {
    symbol: 1,
    timeframe: 1,
    timestamp: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Candle", candleSchema);