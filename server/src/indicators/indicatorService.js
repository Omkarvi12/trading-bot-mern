const {
  EMA,
  RSI,
  MACD,
  BollingerBands,
} = require("technicalindicators");

/**
 * Calculate EMA
 */
const calculateEMA = (prices, period = 20) => {
  return EMA.calculate({
    period,
    values: prices,
  });
};

/**
 * Calculate RSI
 */
const calculateRSI = (prices, period = 14) => {
  return RSI.calculate({
    period,
    values: prices,
  });
};

/**
 * Calculate MACD
 */
const calculateMACD = (prices) => {
  return MACD.calculate({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
};

/**
 * Calculate Bollinger Bands
 */
const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  return BollingerBands.calculate({
    period,
    stdDev,
    values: prices,
  });
};

/**
 * Calculate all indicators
 */
const calculateIndicators = (candles) => {
  if (!candles || candles.length === 0) {
    throw new Error("No candle data provided");
  }

  const closes = candles.map((candle) => Number(candle.close));

  return {
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    rsi14: calculateRSI(closes, 14),
    macd: calculateMACD(closes),
    bollingerBands: calculateBollingerBands(closes, 20, 2),
  };
};

module.exports = {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateIndicators,
};