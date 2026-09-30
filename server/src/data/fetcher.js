const Candle = require("../models/Candle");
const {
  createExchange,
  exchangeId,
} = require("../utils/exchangeFactory");

const exchange = createExchange();

/**
 * Fetch OHLCV candles from the configured exchange
 *
 * @param {string} symbol - Example: BTC/USDT
 * @param {string} timeframe - Example: 5m, 15m, 1h
 * @param {number} limit - Number of candles
 */
const fetchCandles = async (
  symbol = "BTC/USDT",
  timeframe = "5m",
  limit = 100
) => {
  try {
    console.log(
      `📡 Fetching ${limit} candles for ${symbol} (${timeframe})...`
    );

    const ohlcv = await exchange.fetchOHLCV(
      symbol,
      timeframe,
      undefined,
      limit
    );

    const candles = ohlcv.map((candle) => ({
      symbol,
      timeframe,
      timestamp: new Date(candle[0]),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));

    console.log(`✅ ${candles.length} candles fetched`);

    return candles;
  } catch (error) {
    console.error(`❌ Failed to fetch market data from ${exchangeId}:`);
    console.error(error.message);

    throw error;
  }
};

/**
 * Fetch candles and save them to MongoDB
 */
const fetchAndStoreCandles = async (
  symbol = "BTC/USDT",
  timeframe = "5m",
  limit = 100
) => {
  try {
    const candles = await fetchCandles(symbol, timeframe, limit);

    if (!candles.length) {
      console.log("⚠️ No candle data received");
      return [];
    }

    const operations = candles.map((candle) => ({
      updateOne: {
        filter: {
          symbol: candle.symbol,
          timeframe: candle.timeframe,
          timestamp: candle.timestamp,
        },
        update: {
          $set: candle,
        },
        upsert: true,
      },
    }));

    await Candle.bulkWrite(operations);

    console.log(
      `💾 ${candles.length} candles saved/updated in MongoDB`
    );

    return candles;
  } catch (error) {
    console.error("❌ Failed to store candles:");
    console.error(error.message);

    throw error;
  }
};

module.exports = {
  fetchCandles,
  fetchAndStoreCandles,
};