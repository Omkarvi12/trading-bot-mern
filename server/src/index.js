require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// ==========================================
// CONFIG & DATABASE
// ==========================================
const connectDB = require("./config/db");
const config = require("./config/config");

// ==========================================
// AUTH MIDDLEWARE
// ⚠️ Apni file ka sahi path aur export naam yahan likho
// (authRoutes.js ya tradeRoutes.js me dekho kaunsa middleware use ho raha hai)
// ==========================================
const { protect } = require("./middleware/authMiddleware");

// ==========================================
// MARKET DATA / MODELS / SERVICES
// ==========================================
const { fetchAndStoreCandles } = require("./data/fetcher");
const Candle = require("./models/Candle");
const { calculateIndicators } = require("./indicators/indicatorService");
const { createStrategy } = require("./strategy/strategyFactory");
const { runBacktest } = require("./backtest/backtestEngine");
const OrderManager = require("./execution/orderManager");
const BotEngine = require("./bot/botEngine");
const { startTradeMonitor } = require("./scheduler/cronJobs");

// ==========================================
// ROUTES
// ==========================================
const marketRoutes = require("./routes/marketRoutes");
const riskRoutes = require("./routes/riskRoutes");
const authRoutes = require("./routes/authRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const botControlRoutes = require("./routes/botControlRoutes");

// ==========================================
// EXPRESS APP
// ==========================================
const app = express();

// Render proxy ke peeche chalta hai
app.set("trust proxy", 1);

const botEngine = new BotEngine();
const orderManager = new OrderManager();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: true, // testing ke liye. Baad me sirf apna Vercel URL allow karna
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ==========================================
// API ROUTES
// ==========================================
app.use("/api/trades", tradeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bot", botControlRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/risk", riskRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TRADINGBOT API is running 🚀",
    mode: config.tradingMode,
  });
});

// =====================================================
// MARKET DATA (public: chart bina token ke data leta hai)
// =====================================================
app.get("/api/test/market-data", async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTC/USDT";
    const timeframe = req.query.timeframe || "5m";
    const limit = Number(req.query.limit) || 200;

    const candles = await fetchAndStoreCandles(symbol, timeframe, limit);

    res.json({
      success: true,
      message: "Market data fetched successfully",
      symbol,
      timeframe,
      count: candles.length,
      data: candles,
    });
  } catch (error) {
    console.error("❌ Market data error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch market data",
      error: error.message,
    });
  }
});

// =====================================================
// INDICATORS TEST (protected)
// =====================================================
app.get("/api/test/indicators", protect, async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTC/USDT";
    const timeframe = req.query.timeframe || "5m";

    const candles = await Candle.find({ symbol, timeframe })
      .sort({ timestamp: 1 })
      .limit(200);

    if (candles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No candle data found",
      });
    }

    const indicators = calculateIndicators(candles);

    res.json({
      success: true,
      symbol,
      timeframe,
      candleCount: candles.length,
      data: indicators,
    });
  } catch (error) {
    console.error("❌ Indicator error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to calculate indicators",
      error: error.message,
    });
  }
});

// =====================================================
// STRATEGY TEST (protected)
// =====================================================
app.get("/api/test/strategy", protect, async (req, res) => {
  try {
    const strategyName = req.query.strategy || "EMA_CROSSOVER";
    const symbol = req.query.symbol || "BTC/USDT";
    const timeframe = req.query.timeframe || "5m";

    const candles = await Candle.find({ symbol, timeframe })
      .sort({ timestamp: 1 })
      .limit(200);

    if (candles.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Not enough candle data",
      });
    }

    const indicators = calculateIndicators(candles);
    const strategy = createStrategy(strategyName);
    const signal = strategy.generateSignal(indicators);

    res.json({
      success: true,
      strategy: strategyName,
      symbol,
      timeframe,
      signal,
    });
  } catch (error) {
    console.error("❌ Strategy error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate strategy signal",
      error: error.message,
    });
  }
});

// =====================================================
// BOT MANUAL RUN (protected)
// =====================================================
app.post("/api/bot/run", protect, async (req, res) => {
  try {
    const result = await botEngine.runCycle();
    res.json(result);
  } catch (error) {
    console.error("❌ Bot run error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to run trading bot",
      error: error.message,
    });
  }
});

// =====================================================
// TRADE MONITOR MANUAL RUN (protected)
// =====================================================
app.post("/api/bot/monitor", protect, async (req, res) => {
  try {
    const result = await orderManager.monitorOpenTrades();

    res.json({
      success: true,
      message: "Trade monitoring completed",
      data: result,
    });
  } catch (error) {
    console.error("❌ Monitor error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to monitor trades",
      error: error.message,
    });
  }
});

// =====================================================
// BACKTEST (protected)
// =====================================================
app.post("/api/backtest", protect, async (req, res) => {
  try {
    const {
      symbol = "BTC/USDT",
      timeframe = "5m",
      strategy: strategyName = "EMA_CROSSOVER",
      initialBalance = 10000,
      tradeSizePercent = 10,
      limit = 500,
    } = req.body;

    const candles = await Candle.find({ symbol, timeframe })
      .sort({ timestamp: 1 })
      .limit(Number(limit));

    if (!candles || candles.length < 50) {
      return res.status(400).json({
        success: false,
        message: "At least 50 candles are required for backtesting",
        data: {
          symbol,
          timeframe,
          candlesAvailable: candles ? candles.length : 0,
          candlesRequired: 50,
        },
      });
    }

    const strategy = createStrategy(strategyName);

    const result = runBacktest({
      candles,
      strategy,
      initialBalance: Number(initialBalance),
      tradeSizePercent: Number(tradeSizePercent),
    });

    res.json({
      success: true,
      message: "Backtest completed successfully",
      data: {
        symbol,
        timeframe,
        strategy: strategyName,
        candlesUsed: candles.length,
        ...result,
      },
    });
  } catch (error) {
    console.error("❌ Backtest error:", error.message);

    res.status(500).json({
      success: false,
      message: "Backtest failed",
      error: error.message,
    });
  }
});

// =====================================================
// 404 HANDLER
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: config.nodeEnv === "development" ? err.stack : undefined,
  });
});

// =====================================================
// START SERVER (DB connect hone ke baad)
// =====================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Chalta hai chahe connectDB Promise return kare ya nahi
    await Promise.resolve(connectDB());
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 TRADINGBOT server running on port ${PORT}`);
    console.log(`🤖 Trading mode: ${config.tradingMode}`);

    startTradeMonitor();
  });
};

startServer();