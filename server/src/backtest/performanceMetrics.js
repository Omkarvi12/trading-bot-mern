const calculatePerformance = (trades, initialBalance) => {
  const totalTrades = trades.length;

  const winningTrades = trades.filter(
    (trade) => trade.pnl > 0
  );

  const losingTrades = trades.filter(
    (trade) => trade.pnl < 0
  );

  const totalProfit = winningTrades.reduce(
    (sum, trade) => sum + trade.pnl,
    0
  );

  const totalLoss = Math.abs(
    losingTrades.reduce(
      (sum, trade) => sum + trade.pnl,
      0
    )
  );

  const totalPnL = totalProfit - totalLoss;

  const winRate =
    totalTrades > 0
      ? (winningTrades.length / totalTrades) * 100
      : 0;

  const profitFactor =
    totalLoss > 0
      ? totalProfit / totalLoss
      : totalProfit > 0
      ? Infinity
      : 0;

  let balance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdown = 0;

  for (const trade of trades) {
    balance += trade.pnl;

    if (balance > peakBalance) {
      peakBalance = balance;
    }

    const drawdown =
      ((peakBalance - balance) / peakBalance) * 100;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const finalBalance = balance;

  const returnPercent =
    initialBalance > 0
      ? (totalPnL / initialBalance) * 100
      : 0;

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,

    winRate: Number(winRate.toFixed(2)),

    totalProfit: Number(totalProfit.toFixed(2)),
    totalLoss: Number(totalLoss.toFixed(2)),
    totalPnL: Number(totalPnL.toFixed(2)),

    profitFactor:
      profitFactor === Infinity
        ? "Infinity"
        : Number(profitFactor.toFixed(2)),

    initialBalance,
    finalBalance: Number(finalBalance.toFixed(2)),

    returnPercent: Number(
      returnPercent.toFixed(2)
    ),

    maxDrawdown: Number(
      maxDrawdown.toFixed(2)
    ),
  };
};

module.exports = {
  calculatePerformance,
};