const EMACrossover = require("./emaCrossover");
const RSIMeanReversion = require("./rsiMeanReversion");

const createStrategy = (type, config = {}) => {
  switch (type) {
    case "EMA_CROSSOVER":
      return new EMACrossover(config);

    case "RSI_MEAN_REVERSION":
      return new RSIMeanReversion(config);

    default:
      throw new Error(`Unknown strategy: ${type}`);
  }
};

module.exports = {
  createStrategy,
};