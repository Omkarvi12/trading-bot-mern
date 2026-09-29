const BaseStrategy = require("./baseStrategy");

class RSIMeanReversion extends BaseStrategy {
  constructor(config = {}) {
    super("RSI_MEAN_REVERSION");

    this.oversold = config.oversold || 30;
    this.overbought = config.overbought || 70;
  }

  generateSignal(indicators) {
    const rsi = indicators.rsi14?.at(-1);

    if (rsi === undefined) {
      return {
        signal: "HOLD",
        strategy: this.name,
        reason: "Insufficient RSI data",
      };
    }

    if (rsi <= this.oversold) {
      return {
        signal: "BUY",
        strategy: this.name,
        reason: `RSI is oversold (${rsi.toFixed(2)})`,
        indicators: {
          rsi,
        },
      };
    }

    if (rsi >= this.overbought) {
      return {
        signal: "SELL",
        strategy: this.name,
        reason: `RSI is overbought (${rsi.toFixed(2)})`,
        indicators: {
          rsi,
        },
      };
    }

    return {
      signal: "HOLD",
      strategy: this.name,
      reason: `RSI is neutral (${rsi.toFixed(2)})`,
      indicators: {
        rsi,
      },
    };
  }
}

module.exports = RSIMeanReversion;