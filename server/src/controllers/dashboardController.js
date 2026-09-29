const Trade = require("../models/Trade");
const CCXTExecutor = require("../execution/ccxtExecutor");

const broker = new CCXTExecutor();

// ==========================================
// GET DASHBOARD SUMMARY
// ==========================================

const getDashboardSummary = async (req, res) => {
  try {
    // --------------------------------------
    // Total trades
    // --------------------------------------

    const totalTrades =
      await Trade.countDocuments();

    // --------------------------------------
    // Open trades
    // --------------------------------------

    const openTrades =
      await Trade.countDocuments({
        status: "OPEN",
      });

    // --------------------------------------
    // Closed trades
    // --------------------------------------

    const closedTrades =
      await Trade.countDocuments({
        status: "CLOSED",
      });

    // --------------------------------------
    // Cancelled trades
    // --------------------------------------

    const cancelledTrades =
      await Trade.countDocuments({
        status: "CANCELLED",
      });

    // --------------------------------------
    // All closed trades for PnL
    // --------------------------------------

    const pnlData =
      await Trade.find({
        status: "CLOSED",
      }).select("pnl");

    const totalPnL =
      pnlData.reduce(
        (total, trade) =>
          total + (trade.pnl || 0),
        0
      );

    // --------------------------------------
    // Winning trades
    // --------------------------------------

    const winningTrades =
      pnlData.filter(
        (trade) => trade.pnl > 0
      ).length;

    // --------------------------------------
    // Losing trades
    // --------------------------------------

    const losingTrades =
      pnlData.filter(
        (trade) => trade.pnl < 0
      ).length;

    // --------------------------------------
    // Win rate
    // --------------------------------------

    const winRate =
      closedTrades > 0
        ? Number(
            (
              (winningTrades /
                closedTrades) *
              100
            ).toFixed(2)
          )
        : 0;

    // --------------------------------------
    // Current BTC price
    // --------------------------------------

    let currentPrice = null;

    try {
      currentPrice =
        await broker.getCurrentPrice(
          "BTC/USDT"
        );
    } catch (error) {
      console.error(
        "⚠️ Price fetch failed:",
        error.message
      );
    }

    // --------------------------------------
    // Response
    // --------------------------------------

    res.json({
      success: true,

      data: {
        balance: 10000,

        currentPrice,

        totalTrades,

        openTrades,

        closedTrades,

        cancelledTrades,

        totalPnL:
          Number(totalPnL.toFixed(2)),

        winningTrades,

        losingTrades,

        winRate,

        tradingMode:
          process.env.TRADING_MODE ||
          "DRY_RUN",
      },
    });
  } catch (error) {
    console.error(
      "❌ Dashboard summary error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

// ==========================================
// GET RECENT TRADES
// ==========================================

const getRecentTrades = async (req, res) => {
  try {
    const limit =
      Number(req.query.limit) || 10;

    const trades =
      await Trade.find()
        .sort({
          createdAt: -1,
        })
        .limit(limit);

    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (error) {
    console.error(
      "❌ Recent trades error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch recent trades",
      error: error.message,
    });
  }
};

// ==========================================
// GET OPEN TRADES
// ==========================================

const getOpenTrades = async (req, res) => {
  try {
    const trades =
      await Trade.find({
        status: "OPEN",
      }).sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (error) {
    console.error(
      "❌ Open trades error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch open trades",
      error: error.message,
    });
  }
};

// ==========================================
// GET PNL HISTORY
// ==========================================

const getPnLHistory = async (req, res) => {
  try {
    const trades =
      await Trade.find({
        status: "CLOSED",
      })
        .select(
          "symbol side pnl entryPrice exitPrice closedAt strategy"
        )
        .sort({
          closedAt: 1,
        });

    res.json({
      success: true,
      count: trades.length,
      data: trades,
    });
  } catch (error) {
    console.error(
      "❌ PnL history error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch PnL history",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
  getRecentTrades,
  getOpenTrades,
  getPnLHistory,
};