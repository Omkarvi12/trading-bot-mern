const Candle = require("../models/Candle");

const {
  runBacktest,
} = require("../backtest/backtestEngine");

const {
  createStrategy,
} = require("../strategies/strategyFactory");

// ==========================================
// RUN BACKTEST
// ==========================================

const runBacktestController = async (req, res) => {
  try {
    const {
      symbol = "BTC/USDT",
      timeframe = "5m",
      strategy = "EMA_CROSSOVER",
      initialBalance = 10000,
      tradeSizePercent = 10,
      limit = 500,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Symbol is required",
      });
    }

    if (!timeframe) {
      return res.status(400).json({
        success: false,
        message: "Timeframe is required",
      });
    }

    if (!strategy) {
      return res.status(400).json({
        success: false,
        message: "Strategy is required",
      });
    }

    // ========================================
    // FETCH CANDLES
    // ========================================

    const candles = await Candle.find({
      symbol,
      timeframe,
    })
      .sort({
        timestamp: 1,
      })
      .limit(Number(limit))
      .lean();

    // ========================================
    // CHECK CANDLE DATA
    // ========================================

    if (!candles || candles.length < 50) {
      return res.status(400).json({
        success: false,
        message:
          "At least 50 candles are required for backtesting",
        data: {
          symbol,
          timeframe,
          candlesAvailable:
            candles
              ? candles.length
              : 0,
          candlesRequired: 50,
        },
      });
    }

    // ========================================
    // CREATE STRATEGY
    // ========================================

    const strategyInstance =
      createStrategy(strategy);

    if (!strategyInstance) {
      return res.status(400).json({
        success: false,
        message:
          `Unsupported strategy: ${strategy}`,
      });
    }

    // ========================================
    // RUN BACKTEST
    // ========================================

    const result = runBacktest({
      candles,

      strategy:
        strategyInstance,

      initialBalance:
        Number(initialBalance),

      tradeSizePercent:
        Number(tradeSizePercent),
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.json({
      success: true,

      message:
        "Backtest completed successfully",

      data: {
        symbol,

        timeframe,

        strategy,

        candlesUsed:
          candles.length,

        ...result,
      },
    });
  } catch (error) {
    console.error(
      "❌ Backtest controller error:",
      error.message
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to run backtest",

      error: error.message,
    });
  }
};

module.exports = {
  runBacktestController,
};