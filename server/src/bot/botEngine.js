const {
  fetchAndStoreCandles,
} = require("../data/fetcher");

const Candle = require("../models/Candle");

const {
  calculateIndicators,
} = require("../indicators/indicatorService");

const {
  createStrategy,
} = require("../strategy/strategyFactory");

const {
  checkRiskRules,
  calculateStopLoss,
  calculateTakeProfit,
} = require("../risk/riskRules");

const {
  calculatePositionSize,
} = require("../risk/positionSizer");

const OrderManager = require("../execution/orderManager");

const Trade = require("../models/Trade");

class BotEngine {
  constructor() {
    this.orderManager = new OrderManager();

    this.isRunning = false;

    this.symbol = "BTC/USDT";
    this.timeframe = "5m";
    this.strategyName = "ema";

    this.balance = 10000;
    this.riskPercent = 1;

    this.maxDailyLossPercent = 5;
    this.maxOpenTrades = 3;

    this.stopLossPercent = 1;
    this.takeProfitPercent = 2;
  }

  async runCycle() {
    if (this.isRunning) {
      return {
        success: false,
        message: "Bot cycle already running",
      };
    }

    this.isRunning = true;

    try {
      console.log("=================================");
      console.log("🤖 Trading Bot Cycle Started");
      console.log("=================================");

      // ==========================================
      // 1. Fetch latest market data
      // ==========================================

      await fetchAndStoreCandles(
        this.symbol,
        this.timeframe,
        200
      );

      console.log("✅ Market data updated");

      // ==========================================
      // 2. Get candles
      // ==========================================

      const candles = await Candle.find({
        symbol: this.symbol,
        timeframe: this.timeframe,
      })
        .sort({ timestamp: 1 })
        .limit(200);

      if (candles.length < 50) {
        throw new Error(
          "Not enough candle data for trading"
        );
      }

      // ==========================================
      // 3. Indicators
      // ==========================================

      const indicators =
        calculateIndicators(candles);

      console.log("✅ Indicators calculated");

      // ==========================================
      // 4. Strategy
      // ==========================================

      let strategyType;

      if (this.strategyName === "ema") {
        strategyType = "EMA_CROSSOVER";
      } else if (this.strategyName === "rsi") {
        strategyType =
          "RSI_MEAN_REVERSION";
      } else {
        throw new Error(
          "Invalid strategy configured"
        );
      }

      const strategy =
        createStrategy(strategyType);

      // ==========================================
      // 5. Generate signal
      // ==========================================

      const signal =
        strategy.generateSignal(indicators);

      console.log(
        `📈 Strategy: ${strategyType}`
      );

      console.log(
        `📊 Signal: ${signal.signal}`
      );

      // ==========================================
      // 6. No signal
      // ==========================================

      if (
        !signal.signal ||
        signal.signal === "HOLD"
      ) {
        return {
          success: true,
          message: "No trading signal",
          market: {
            symbol: this.symbol,
            timeframe: this.timeframe,
          },
          strategy: strategyType,
          signal: signal.signal || "HOLD",
        };
      }

      // ==========================================
      // 7. Existing open trades
      // ==========================================

      const openTrades =
        await Trade.countDocuments({
          symbol: this.symbol,
          status: "OPEN",
        });

      // ==========================================
      // 8. Daily PnL
      // ==========================================

      const startOfDay = new Date();

      startOfDay.setHours(0, 0, 0, 0);

      const todayTrades =
        await Trade.find({
          symbol: this.symbol,
          status: "CLOSED",
          closedAt: {
            $gte: startOfDay,
          },
        });

      const dailyPnL =
        todayTrades.reduce(
          (total, trade) =>
            total + (trade.pnl || 0),
          0
        );

      // ==========================================
      // 9. Risk check
      // ==========================================

      const riskCheck =
        checkRiskRules({
          dailyPnL,
          maxDailyLossPercent:
            this.maxDailyLossPercent,
          openTrades,
          maxOpenTrades:
            this.maxOpenTrades,
          balance: this.balance,
        });

      if (!riskCheck.allowed) {
        console.log(
          `🛑 Risk blocked trade: ${riskCheck.reason}`
        );

        return {
          success: false,
          message:
            "Trade blocked by risk management",
          reason: riskCheck.reason,
        };
      }

      console.log("✅ Risk checks passed");

      // ==========================================
      // 10. Entry price
      // ==========================================

      const latestCandle =
        candles[candles.length - 1];

      const entryPrice =
        Number(latestCandle.close);

      if (!entryPrice || entryPrice <= 0) {
        throw new Error(
          "Invalid market entry price"
        );
      }

      // ==========================================
      // 11. Stop Loss
      // ==========================================

      const stopLoss =
        calculateStopLoss({
          entryPrice,
          side: signal.signal,
          stopLossPercent:
            this.stopLossPercent,
        });

      // ==========================================
      // 12. Take Profit
      // ==========================================

      const takeProfit =
        calculateTakeProfit({
          entryPrice,
          side: signal.signal,
          takeProfitPercent:
            this.takeProfitPercent,
        });

     // ==========================================
// 13. POSITION SIZING
// ==========================================

const position =
  calculatePositionSize({
    balance: this.balance,
    riskPercent: this.riskPercent,
    entryPrice,
    stopLossPrice: stopLoss,
  });

const quantity = position.quantity;

if (!quantity || quantity <= 0) {
  throw new Error(
    "Invalid position size"
  );
}

console.log(
  `💰 Quantity: ${quantity}`
);

console.log(
  `💵 Risk Amount: ${position.riskAmount}`
);

console.log(
  `📏 Price Risk: ${position.priceRisk}`
);

console.log(
  `🛑 Stop Loss: ${stopLoss}`
);

console.log(
  `🎯 Take Profit: ${takeProfit}`
);

      // ==========================================
      // 14. Execute trade
      // ==========================================

      const trade =
        await this.orderManager.openTrade({
          symbol: this.symbol,
          strategy: strategyType,
          signal: signal.signal,
          quantity,
          stopLoss,
          takeProfit,
          balance: this.balance,
          riskPercent: this.riskPercent,
        });

      console.log("🚀 Trade executed");

      return {
        success: true,
        message:
          "Trading cycle completed",

        market: {
          symbol: this.symbol,
          timeframe: this.timeframe,
        },

        strategy: strategyType,
        signal: signal.signal,

        balance: this.balance,
        riskPercent: this.riskPercent,

        entryPrice,
        quantity,
        stopLoss,
        takeProfit,

        trade,
      };
    } catch (error) {
      console.error(
        "❌ Bot cycle error:",
        error.message
      );

      return {
        success: false,
        message: "Bot cycle failed",
        error: error.message,
      };
    } finally {
      this.isRunning = false;

      console.log(
        "🤖 Trading Bot Cycle Finished"
      );
    }
  }
}

module.exports = BotEngine;