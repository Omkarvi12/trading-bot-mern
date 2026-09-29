const config = {
  port: process.env.PORT || 5000,

  nodeEnv: process.env.NODE_ENV || "development",

  mongoUri: process.env.MONGO_URI,

  tradingMode: process.env.TRADING_MODE || "dry-run",

  exchange: process.env.EXCHANGE || "binance",

  jwtSecret: process.env.JWT_SECRET,

  apiKey: process.env.API_KEY,

  apiSecret: process.env.API_SECRET,
};

module.exports = config;