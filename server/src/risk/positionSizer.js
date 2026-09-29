// ==========================================
// POSITION SIZER
// ==========================================

const calculatePositionSize = ({
  balance,
  riskPercent,
  entryPrice,
  stopLossPrice,
}) => {
  // ------------------------------------------
  // Validate input
  // ------------------------------------------

  if (
    !Number.isFinite(balance) ||
    !Number.isFinite(riskPercent) ||
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(stopLossPrice) ||
    balance <= 0 ||
    riskPercent <= 0 ||
    entryPrice <= 0 ||
    stopLossPrice <= 0
  ) {
    return {
      quantity: 0,
      riskAmount: 0,
      priceRisk: 0,
    };
  }

  // ------------------------------------------
  // Risk amount
  // ------------------------------------------

  const riskAmount =
    balance * (riskPercent / 100);

  // ------------------------------------------
  // Price risk per unit
  // ------------------------------------------

  const priceRisk = Math.abs(
    entryPrice - stopLossPrice
  );

  if (priceRisk <= 0) {
    return {
      quantity: 0,
      riskAmount: Number(riskAmount.toFixed(2)),
      priceRisk: 0,
    };
  }

  // ------------------------------------------
  // Position quantity
  // ------------------------------------------

  const quantity =
    riskAmount / priceRisk;

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return {
      quantity: 0,
      riskAmount: Number(riskAmount.toFixed(2)),
      priceRisk: Number(priceRisk.toFixed(8)),
    };
  }

  // ------------------------------------------
  // Final result
  // ------------------------------------------

  return {
    quantity: Number(quantity.toFixed(6)),
    riskAmount: Number(riskAmount.toFixed(2)),
    priceRisk: Number(priceRisk.toFixed(8)),
  };
};

module.exports = {
  calculatePositionSize,
};