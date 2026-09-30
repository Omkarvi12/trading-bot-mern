const ccxt = require("ccxt");

const exchangeId = (
  process.env.EXCHANGE || "binance"
).trim().toLowerCase();

const Exchange = ccxt[exchangeId];

if (typeof Exchange !== "function") {
  throw new Error(
    `Unsupported CCXT exchange: ${exchangeId}`
  );
}

const createExchange = ({ authenticated = false } = {}) => {
  const options = {
    enableRateLimit: true,
  };

  if (authenticated) {
    const apiKey =
      process.env.EXCHANGE_API_KEY ||
      (exchangeId === "binance"
        ? process.env.BINANCE_API_KEY
        : "");
    const secret =
      process.env.EXCHANGE_SECRET ||
      (exchangeId === "binance"
        ? process.env.BINANCE_SECRET_KEY
        : "");

    if (!apiKey || !secret) {
      throw new Error(
        `API credentials are missing for ${exchangeId}`
      );
    }

    options.apiKey = apiKey;
    options.secret = secret;
  }

  return new Exchange(options);
};

module.exports = {
  createExchange,
  exchangeId,
};