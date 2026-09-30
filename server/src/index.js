require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const marketRoutes = require("./routes/marketRoutes");

const riskRoutes = require("./routes/riskRoutes");
const authRoutes = require("./routes/authRoutes");

// ==========================================
// CONFIG & DATABASE
// ==========================================

const connectDB = require("./config/db");
const config = require("./config/config");

// ==========================================
// MARKET DATA
// ==========================================

const {
  fetchAndStoreCandles,
} = require("./data/fetcher");

// ==========================================
// MODELS
// ==========================================

const Candle = require("./models/Candle");

// ==========================================
// INDICATORS
// ==========================================

const {
  calculateIndicators,
} = require("./indicators/indicatorService");

// ==========================================
// STRATEGY
// ==========================================

const {
  createStrategy,
} = require("./strategy/strategyFactory");

// ==========================================
// BACKTESTING
// ==========================================

const {
  runBacktest,
} = require("./backtest/backtestEngine");

// ==========================================
// EXECUTION
// ==========================================

const OrderManager = require("./execution/orderManager");

// ==========================================
// BOT ENGINE
// ==========================================

const BotEngine = require("./bot/botEngine");

// ==========================================
// SCHEDULER
// ==========================================

const {
  startTradeMonitor,
} = require("./scheduler/cronJobs");

// ==========================================
// ROUTES
// ==========================================

const tradeRoutes =
  require("./routes/tradeRoutes");

const dashboardRoutes =
  require("./routes/dashboardRoutes");

const botControlRoutes =
  require("./routes/botControlRoutes");

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// BOT ENGINE INSTANCE
// ==========================================

const botEngine = new BotEngine();

// ==========================================
// ORDER MANAGER INSTANCE
// ==========================================

const orderManager = new OrderManager();

// ==========================================
// MONGODB CONNECTION
// ==========================================

connectDB();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),


  
);

app.use(morgan("dev"));

// ==========================================
// TRADE ROUTES
// ==========================================

app.use(
  "/api/trades",
  tradeRoutes
);

// ==========================================
// DASHBOARD ROUTES
// ==========================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ==========================================
// BOT CONTROL ROUTES
// ==========================================

app.use(
  "/api/bot",
  botControlRoutes
);

app.use("/api/market", marketRoutes);

app.use(
  "/api/auth",
  authRoutes
);

// ==========================================
// RISK ROUTES
// ==========================================

app.use(
  "/api/risk",
  riskRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    message:
      "TRADINGBOT API is running 🚀",

    mode:
      config.tradingMode,
  });
});

// =====================================================
// MARKET DATA
// =====================================================

app.get(
  "/api/test/market-data",
  async (req, res) => {
    try {
      const symbol =
        req.query.symbol ||
        "BTC/USDT";

      const timeframe =
        req.query.timeframe ||
        "5m";

      const limit =
        Number(req.query.limit) ||
        200;

      const candles =
        await fetchAndStoreCandles(
          symbol,
          timeframe,
          limit
        );

      res.json({
        success: true,

        message:
          "Market data fetched successfully",

        symbol,

        timeframe,

        count:
          candles.length,

        data:
          candles,
      });
    } catch (error) {
      console.error(
        "❌ Market data error:",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch market data",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// INDICATORS TEST
// =====================================================

app.get(
  "/api/test/indicators",
  async (req, res) => {
    try {
      const symbol =
        req.query.symbol ||
        "BTC/USDT";

      const timeframe =
        req.query.timeframe ||
        "5m";

      const candles =
        await Candle.find({
          symbol,
          timeframe,
        })
          .sort({
            timestamp: 1,
          })
          .limit(200);

      if (candles.length === 0) {
        return res.status(404).json({
          success: false,

          message:
            "No candle data found",
        });
      }

      const indicators =
        calculateIndicators(
          candles
        );

      res.json({
        success: true,

        symbol,

        timeframe,

        candleCount:
          candles.length,

        data:
          indicators,
      });
    } catch (error) {
      console.error(
        "❌ Indicator error:",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to calculate indicators",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// STRATEGY TEST
// =====================================================

app.get(
  "/api/test/strategy",
  async (req, res) => {
    try {
      const strategyName =
        req.query.strategy ||
        "EMA_CROSSOVER";

      const symbol =
        req.query.symbol ||
        "BTC/USDT";

      const timeframe =
        req.query.timeframe ||
        "5m";

      const candles =
        await Candle.find({
          symbol,
          timeframe,
        })
          .sort({
            timestamp: 1,
          })
          .limit(200);

      if (candles.length < 50) {
        return res.status(400).json({
          success: false,

          message:
            "Not enough candle data",
        });
      }

      const indicators =
        calculateIndicators(
          candles
        );

      const strategy =
        createStrategy(
          strategyName
        );

      const signal =
        strategy.generateSignal(
          indicators
        );

      res.json({
        success: true,

        strategy:
          strategyName,

        symbol,

        timeframe,

        signal,
      });
    } catch (error) {
      console.error(
        "❌ Strategy error:",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to generate strategy signal",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// BOT MANUAL RUN
// =====================================================

app.post(
  "/api/bot/run",
  async (req, res) => {
    try {
      const result =
        await botEngine.runCycle();

      res.json(result);
    } catch (error) {
      console.error(
        "❌ Bot run error:",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to run trading bot",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// TRADE MONITOR MANUAL RUN
// =====================================================

app.post(
  "/api/bot/monitor",
  async (req, res) => {
    try {
      const result =
        await orderManager.monitorOpenTrades();

      res.json({
        success: true,

        message:
          "Trade monitoring completed",

        data:
          result,
      });
    } catch (error) {
      console.error(
        "❌ Monitor error:",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to monitor trades",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// BACKTEST
// =====================================================

app.post(
  "/api/backtest",
  async (req, res) => {
    try {
      const {
        symbol =
          "BTC/USDT",

        timeframe =
          "5m",

        strategy:
          strategyName =
            "EMA_CROSSOVER",

        initialBalance =
          10000,

        tradeSizePercent =
          10,

        limit =
          500,
      } = req.body;

      // ========================================
      // FETCH HISTORICAL CANDLES
      // ========================================

      const candles =
        await Candle.find({
          symbol,
          timeframe,
        })
          .sort({
            timestamp: 1,
          })
          .limit(
            Number(limit)
          );

      // ========================================
      // VALIDATE CANDLE DATA
      // ========================================

      if (
        !candles ||
        candles.length < 50
      ) {
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

            candlesRequired:
              50,
          },
        });
      }

      // ========================================
      // CREATE STRATEGY
      // ========================================

      const strategy =
        createStrategy(
          strategyName
        );

      // ========================================
      // RUN BACKTEST
      // ========================================

      const result =
        runBacktest({
          candles,

          strategy,

          initialBalance:
            Number(
              initialBalance
            ),

          tradeSizePercent:
            Number(
              tradeSizePercent
            ),
        });

      // ========================================
      // RESPONSE
      // ========================================

      res.json({
        success: true,

        message:
          "Backtest completed successfully",

        data: {
          symbol,

          timeframe,

          strategy:
            strategyName,

          candlesUsed:
            candles.length,

          ...result,
        },
      });
    } catch (error) {
      console.error(
        "❌ Backtest error:",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Backtest failed",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "❌ Global error:",
      err.message
    );

    res.status(
      err.status || 500
    ).json({
      success: false,

      message:
        err.message ||
        "Internal server error",

      error:
        config.nodeEnv ===
        "development"
          ? err.stack
          : undefined,
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT ||
  5000;

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 TRADINGBOT server running on http://localhost:${PORT}`
    );

    console.log(
      `🤖 Trading mode: ${config.tradingMode}`
    );

    // ========================================
    // START AUTOMATIC SCHEDULER
    // ========================================

    startTradeMonitor();
  }
);