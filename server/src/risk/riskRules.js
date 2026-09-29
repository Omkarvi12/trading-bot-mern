// ==========================================
// RISK RULES
// ==========================================

const checkRiskRules = ({
  dailyPnL = 0,
  maxDailyLossPercent = 5,
  openTrades = 0,
  maxOpenTrades = 3,
  balance = 0,
}) => {
  const maxDailyLoss =
    balance * (maxDailyLossPercent / 100);

  // ==========================================
  // Daily Loss Limit
  // ==========================================

  if (dailyPnL <= -maxDailyLoss) {
    return {
      allowed: false,
      reason: "Daily loss limit reached",
    };
  }

  // ==========================================
  // Maximum Open Trades
  // ==========================================

  if (openTrades >= maxOpenTrades) {
    return {
      allowed: false,
      reason: "Maximum open trades reached",
    };
  }

  return {
    allowed: true,
    reason: "Risk checks passed",
  };
};

// ==========================================
// Stop Loss Calculation
// ==========================================

const calculateStopLoss = ({
  entryPrice,
  side,
  stopLossPercent,
}) => {
  const percentage =
    stopLossPercent / 100;

  if (side === "BUY") {
    return entryPrice * (1 - percentage);
  }

  if (side === "SELL") {
    return entryPrice * (1 + percentage);
  }

  throw new Error("Invalid trade side");
};

// ==========================================
// Take Profit Calculation
// ==========================================

const calculateTakeProfit = ({
  entryPrice,
  side,
  takeProfitPercent,
}) => {
  const percentage =
    takeProfitPercent / 100;

  if (side === "BUY") {
    return entryPrice * (1 + percentage);
  }

  if (side === "SELL") {
    return entryPrice * (1 - percentage);
  }

  throw new Error("Invalid trade side");
};

// ==========================================
// Validation Used By OrderManager
// ==========================================

const validateTradeRisk = ({
  side,
  entryPrice,
  stopLoss,
  takeProfit,
  maxOpenTrades = 3,
  currentOpenTrades = 0,
  dailyPnL = 0,
  maxDailyLoss = 100,
}) => {
  const errors = [];

  // Basic validation
  if (!["BUY", "SELL"].includes(side)) {
    errors.push("Side must be BUY or SELL");
  }

  if (!entryPrice || entryPrice <= 0) {
    errors.push("Invalid entry price");
  }

  if (!stopLoss || stopLoss <= 0) {
    errors.push("Invalid stop loss");
  }

  if (!takeProfit || takeProfit <= 0) {
    errors.push("Invalid take profit");
  }

  // ==========================================
  // BUY Rules
  // ==========================================

  if (side === "BUY") {
    if (stopLoss >= entryPrice) {
      errors.push(
        "For BUY, stop loss must be below entry price"
      );
    }

    if (takeProfit <= entryPrice) {
      errors.push(
        "For BUY, take profit must be above entry price"
      );
    }
  }

  // ==========================================
  // SELL Rules
  // ==========================================

  if (side === "SELL") {
    if (stopLoss <= entryPrice) {
      errors.push(
        "For SELL, stop loss must be above entry price"
      );
    }

    if (takeProfit >= entryPrice) {
      errors.push(
        "For SELL, take profit must be below entry price"
      );
    }
  }

  // ==========================================
  // Maximum Open Trades
  // ==========================================

  if (
    currentOpenTrades >= maxOpenTrades
  ) {
    errors.push(
      "Maximum open trades limit reached"
    );
  }

  // ==========================================
  // Daily Loss Limit
  // ==========================================

  if (
    dailyPnL <= -Math.abs(maxDailyLoss)
  ) {
    errors.push(
      "Daily loss limit reached"
    );
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  checkRiskRules,
  calculateStopLoss,
  calculateTakeProfit,
  validateTradeRisk,
};