const BaseStrategy = require("./baseStrategy");

class EMACrossover extends BaseStrategy {
  constructor(config = {}) {
    super("EMA_CROSSOVER");

    this.fastPeriod = config.fastPeriod || 20;
    this.slowPeriod = config.slowPeriod || 50;
  }

  generateSignal(indicators) {
    const fastEMA = indicators.ema20?.at(-1);
    const slowEMA = indicators.ema50?.at(-1);

    if (fastEMA === undefined || slowEMA === undefined) {
      return {
        signal: "HOLD",
        strategy: this.name,
        reason: "Insufficient EMA data",
      };
    }

    if (fastEMA > slowEMA) {
      return {
        signal: "BUY",
        strategy: this.name,
        reason: "Fast EMA is above Slow EMA",
        indicators: {
          fastEMA,
          slowEMA,
        },
      };
    }

    if (fastEMA < slowEMA) {
      return {
        signal: "SELL",
        strategy: this.name,
        reason: "Fast EMA is below Slow EMA",
        indicators: {
          fastEMA,
          slowEMA,
        },
      };
    }

    return {
      signal: "HOLD",
      strategy: this.name,
      reason: "No EMA crossover condition",
      indicators: {
        fastEMA,
        slowEMA,
      },
    };
  }
}

module.exports = EMACrossover;