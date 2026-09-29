const Trade = require("../models/Trade");
const CCXTExecutor = require("./ccxtExecutor");

const {
  validateTradeRisk,
} = require("../risk/riskRules");

const {
  calculatePositionSize,
} = require("../risk/positionSizer");

class OrderManager {
  constructor() {
    this.broker = new CCXTExecutor();

    this.riskConfig = {
      defaultBalance: 10000,
      riskPercent: 1,
      maxOpenTrades: 3,
      maxDailyLoss: 100,
    };
  }

  // ==========================================
  // OPEN TRADE
  // ==========================================

  async openTrade({
    user,
    symbol,
    strategy,
    signal,
    quantity,
    stopLoss,
    takeProfit,
    balance,
    riskPercent,
  }) {
    if (!["BUY", "SELL"].includes(signal)) {
      throw new Error("Invalid trading signal");
    }

    if (!symbol) {
      throw new Error("Trading symbol is required");
    }

    const currentPrice =
      await this.broker.getCurrentPrice(symbol);

    if (!currentPrice || currentPrice <= 0) {
      throw new Error("Invalid current market price");
    }

    // ------------------------------------------
    // Existing open trades
    // ------------------------------------------

    const currentOpenTrades =
      await Trade.countDocuments({
        status: "OPEN",
      });

    // ------------------------------------------
    // Today's PnL
    // ------------------------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyTrades =
      await Trade.find({
        status: "CLOSED",
        closedAt: {
          $gte: startOfDay,
        },
      });

    const dailyPnL = dailyTrades.reduce(
      (total, trade) =>
        total + (trade.pnl || 0),
      0
    );

    // ------------------------------------------
    // Risk validation
    // ------------------------------------------

    const riskCheck = validateTradeRisk({
      side: signal,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      maxOpenTrades:
        this.riskConfig.maxOpenTrades,
      currentOpenTrades,
      dailyPnL,
      maxDailyLoss:
        this.riskConfig.maxDailyLoss,
    });

    if (!riskCheck.allowed) {
      throw new Error(
        `Trade rejected by risk management: ${riskCheck.errors.join(
          ", "
        )}`
      );
    }

    // ------------------------------------------
    // Position sizing
    // ------------------------------------------

    const accountBalance =
      balance || this.riskConfig.defaultBalance;

    const tradeRiskPercent =
      riskPercent ||
      this.riskConfig.riskPercent;

    const position =
      calculatePositionSize({
        balance: accountBalance,
        riskPercent: tradeRiskPercent,
        entryPrice: currentPrice,
        stopLoss,
      });

    const calculatedQuantity =
      typeof position === "number"
        ? position
        : position.quantity;

    const finalQuantity =
      quantity && quantity > 0
        ? quantity
        : calculatedQuantity;

    if (!finalQuantity || finalQuantity <= 0) {
      throw new Error(
        "Calculated quantity is invalid"
      );
    }

    // ------------------------------------------
    // Create broker order
    // ------------------------------------------

    const order =
      await this.broker.createOrder({
        symbol,
        side: signal,
        quantity: finalQuantity,
        price: currentPrice,
        type: "MARKET",
      });

    if (!order || !order.price) {
      throw new Error(
        "Broker order execution failed"
      );
    }

    // ------------------------------------------
    // Save trade
    // ------------------------------------------

    const trade = await Trade.create({
      user,
      symbol,
      strategy,
      side: signal,
      type: "MARKET",
      quantity: finalQuantity,
      entryPrice: order.price,
      stopLoss,
      takeProfit,
      pnl: 0,
      closeReason: null,
      status: "OPEN",

      mode:
        order.mode === "DRY_RUN"
          ? "DRY_RUN"
          : "LIVE",

      openedAt: new Date(),
    });

    return {
      trade,
      order,

      risk: {
        balance: accountBalance,
        riskPercent: tradeRiskPercent,

        riskAmount:
          typeof position === "object"
            ? position.riskAmount
            : undefined,

        priceRisk:
          typeof position === "object"
            ? position.priceRisk
            : undefined,
      },
    };
  }

  // ==========================================
  // CLOSE TRADE
  // ==========================================

  async closeTrade(
    tradeId,
    exitPrice,
    closeReason = "MANUAL"
  ) {
    const validCloseReasons = [
      "MANUAL",
      "STOP_LOSS",
      "TAKE_PROFIT",
      "BOT_SIGNAL",
      "RISK_LIMIT",
    ];

    if (!validCloseReasons.includes(closeReason)) {
      throw new Error(
        `Invalid close reason: ${closeReason}`
      );
    }

    const trade =
      await Trade.findById(tradeId);

    if (!trade) {
      throw new Error("Trade not found");
    }

    if (trade.status !== "OPEN") {
      throw new Error("Trade is not open");
    }

    if (!exitPrice || exitPrice <= 0) {
      throw new Error(
        "Valid exit price is required"
      );
    }

    // ------------------------------------------
    // Calculate PnL
    // ------------------------------------------

    let pnl;

    if (trade.side === "BUY") {
      pnl =
        (exitPrice - trade.entryPrice) *
        trade.quantity;
    } else {
      pnl =
        (trade.entryPrice - exitPrice) *
        trade.quantity;
    }

    // ------------------------------------------
    // Update trade
    // ------------------------------------------

    trade.exitPrice =
      Number(exitPrice);

    trade.pnl =
      Number(pnl.toFixed(2));

    trade.status = "CLOSED";

    trade.closeReason =
      closeReason;

    trade.closedAt = new Date();

    await trade.save();

    console.log(
      `🔴 Trade closed | ${trade.symbol} | ${trade.side} | Reason: ${closeReason} | PnL: ${trade.pnl}`
    );

    return trade;
  }

  // ==========================================
  // MONITOR OPEN TRADES
  // ==========================================

  async monitorOpenTrades() {
    try {
      const openTrades =
        await Trade.find({
          status: "OPEN",
        });

      if (openTrades.length === 0) {
        return {
          checked: 0,
          closed: 0,
          results: [],
        };
      }

      let closedCount = 0;

      const results = [];

      for (const trade of openTrades) {
        try {
          const currentPrice =
            await this.broker.getCurrentPrice(
              trade.symbol
            );

          if (
            !currentPrice ||
            currentPrice <= 0
          ) {
            console.log(
              `⚠️ Invalid price for ${trade.symbol}`
            );

            continue;
          }

          let closeReason = null;

          // ======================================
          // BUY POSITION
          // ======================================

          if (trade.side === "BUY") {
            if (
              trade.stopLoss &&
              currentPrice <= trade.stopLoss
            ) {
              closeReason = "STOP_LOSS";
            } else if (
              trade.takeProfit &&
              currentPrice >= trade.takeProfit
            ) {
              closeReason = "TAKE_PROFIT";
            }
          }

          // ======================================
          // SELL POSITION
          // ======================================

          if (trade.side === "SELL") {
            if (
              trade.stopLoss &&
              currentPrice >= trade.stopLoss
            ) {
              closeReason = "STOP_LOSS";
            } else if (
              trade.takeProfit &&
              currentPrice <= trade.takeProfit
            ) {
              closeReason = "TAKE_PROFIT";
            }
          }

          // ======================================
          // AUTO CLOSE
          // ==========================================

          if (closeReason) {
            console.log(
              `🎯 ${closeReason} hit | ${trade.symbol} | Current Price: ${currentPrice}`
            );

            const closedTrade =
              await this.closeTrade(
                trade._id,
                currentPrice,
                closeReason
              );

            closedCount++;

            results.push({
              tradeId: trade._id,
              symbol: trade.symbol,
              side: trade.side,
              entryPrice:
                trade.entryPrice,
              exitPrice:
                currentPrice,
              reason: closeReason,
              pnl: closedTrade.pnl,
            });
          }
        } catch (error) {
          console.error(
            `❌ Monitoring error for trade ${trade._id}:`,
            error.message
          );
        }
      }

      return {
        checked: openTrades.length,
        closed: closedCount,
        results,
      };
    } catch (error) {
      console.error(
        "❌ Open trade monitoring failed:",
        error.message
      );

      throw error;
    }
  }
}

module.exports = OrderManager;