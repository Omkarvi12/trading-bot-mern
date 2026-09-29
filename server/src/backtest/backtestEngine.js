const {
  calculateIndicators,
} = require("../indicators/indicatorService");

const {
  calculatePerformance,
} = require("./performanceMetrics");

// ==========================================
// RUN BACKTEST
// ==========================================

const runBacktest = ({
  candles,
  strategy,
  initialBalance = 10000,
  tradeSizePercent = 10,
}) => {
  // ========================================
  // VALIDATION
  // ========================================

  if (!candles || candles.length < 50) {
    throw new Error(
      "At least 50 candles are required for backtesting"
    );
  }

  if (!strategy) {
    throw new Error(
      "Strategy is required for backtesting"
    );
  }

  if (
    tradeSizePercent <= 0 ||
    tradeSizePercent > 100
  ) {
    throw new Error(
      "Trade size percent must be between 0 and 100"
    );
  }

  // ========================================
  // INITIAL STATE
  // ========================================

  let balance = Number(initialBalance);

  let openPosition = null;

  const trades = [];

  let peakBalance = balance;

  let maxDrawdown = 0;

  // ========================================
  // BACKTEST LOOP
  // ========================================

  for (
    let i = 50;
    i < candles.length;
    i++
  ) {
    const historicalCandles =
      candles.slice(0, i + 1);

    // ======================================
    // CALCULATE INDICATORS
    // ======================================

    const indicators =
      calculateIndicators(
        historicalCandles
      );

    // ======================================
    // GENERATE STRATEGY SIGNAL
    // ======================================

    const signal =
      strategy.generateSignal(
        indicators
      );

    const currentCandle =
      candles[i];

    const currentPrice =
      Number(currentCandle.close);

    // ======================================
    // OPEN POSITION
    // ======================================

    if (!openPosition) {
      if (
        signal &&
        (
          signal.signal === "BUY" ||
          signal.signal === "SELL"
        )
      ) {
        const tradeCapital =
          balance *
          (tradeSizePercent / 100);

        const quantity =
          tradeCapital / currentPrice;

        openPosition = {
          side: signal.signal,

          entryPrice: currentPrice,

          quantity,

          entryTime:
            currentCandle.timestamp,
        };
      }

      continue;
    }

    // ======================================
    // CLOSE POSITION
    // ======================================

    const shouldClose =
      (
        openPosition.side === "BUY" &&
        signal.signal === "SELL"
      ) ||
      (
        openPosition.side === "SELL" &&
        signal.signal === "BUY"
      );

    if (shouldClose) {
      let pnl = 0;

      // ====================================
      // BUY PNL
      // ====================================

      if (
        openPosition.side === "BUY"
      ) {
        pnl =
          (
            currentPrice -
            openPosition.entryPrice
          ) *
          openPosition.quantity;
      }

      // ====================================
      // SELL PNL
      // ====================================

      else {
        pnl =
          (
            openPosition.entryPrice -
            currentPrice
          ) *
          openPosition.quantity;
      }

      // ====================================
      // UPDATE BALANCE
      // ====================================

      balance += pnl;

      // ====================================
      // UPDATE PEAK BALANCE
      // ====================================

      if (balance > peakBalance) {
        peakBalance = balance;
      }

      // ====================================
      // CALCULATE DRAWDOWN
      // ====================================

      const drawdown =
        peakBalance - balance;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      // ====================================
      // SAVE TRADE
      // ====================================

      trades.push({
        side:
          openPosition.side,

        entryPrice:
          Number(
            openPosition.entryPrice.toFixed(2)
          ),

        exitPrice:
          Number(
            currentPrice.toFixed(2)
          ),

        quantity:
          Number(
            openPosition.quantity.toFixed(8)
          ),

        pnl:
          Number(
            pnl.toFixed(2)
          ),

        entryTime:
          openPosition.entryTime,

        exitTime:
          currentCandle.timestamp,
      });

      // ====================================
      // RESET POSITION
      // ====================================

      openPosition = null;
    }
  }

  // ==========================================
  // CLOSE REMAINING POSITION
  // ==========================================

  if (openPosition) {
    const lastCandle =
      candles[candles.length - 1];

    const exitPrice =
      Number(lastCandle.close);

    let pnl = 0;

    // ========================================
    // BUY
    // ========================================

    if (
      openPosition.side === "BUY"
    ) {
      pnl =
        (
          exitPrice -
          openPosition.entryPrice
        ) *
        openPosition.quantity;
    }

    // ========================================
    // SELL
    // ========================================

    else {
      pnl =
        (
          openPosition.entryPrice -
          exitPrice
        ) *
        openPosition.quantity;
    }

    balance += pnl;

    // ========================================
    // UPDATE PEAK / DRAWDOWN
    // ========================================

    if (balance > peakBalance) {
      peakBalance = balance;
    }

    const drawdown =
      peakBalance - balance;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    // ========================================
    // SAVE FINAL TRADE
    // ========================================

    trades.push({
      side:
        openPosition.side,

      entryPrice:
        Number(
          openPosition.entryPrice.toFixed(2)
        ),

      exitPrice:
        Number(
          exitPrice.toFixed(2)
        ),

      quantity:
        Number(
          openPosition.quantity.toFixed(8)
        ),

      pnl:
        Number(
          pnl.toFixed(2)
        ),

      entryTime:
        openPosition.entryTime,

      exitTime:
        lastCandle.timestamp,

      closeReason:
        "END_OF_BACKTEST",
    });

    openPosition = null;
  }

  // ==========================================
  // PERFORMANCE
  // ==========================================

  const performance =
    calculatePerformance(
      trades,
      initialBalance
    );

  // ==========================================
  // FINAL RESULT
  // ==========================================

  return {
    strategy:
      strategy.name,

    initialBalance:
      Number(
        initialBalance.toFixed(2)
      ),

    finalBalance:
      Number(
        balance.toFixed(2)
      ),

    totalPnL:
      Number(
        (balance - initialBalance)
          .toFixed(2)
      ),

    maxDrawdown:
      Number(
        maxDrawdown.toFixed(2)
      ),

    totalTrades:
      trades.length,

    performance,

    trades,
  };
};

module.exports = {
  runBacktest,
};