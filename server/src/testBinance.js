require("dotenv").config();

const ccxt = require("ccxt");
console.log("API KEY EXISTS:", !!process.env.BINANCE_API_KEY);
console.log("SECRET EXISTS:", !!process.env.BINANCE_SECRET_KEY);

async function testBinance() {
  try {
    const binance = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_SECRET_KEY,
      enableRateLimit: true,
    });

    console.log("🔄 Testing Binance API...");

    // Public API test
    const ticker = await binance.fetchTicker("BTC/USDT");

    console.log("✅ Public API Connected");
    console.log("BTC Price:", ticker.last);

    // Private API / API-key test
    const balance = await binance.fetchBalance();

    console.log("✅ Private API Authentication Successful");
    console.log("USDT Balance:", balance.free?.USDT || 0);

    console.log("🎉 Binance API Test Successful");
  } catch (error) {
    console.error("❌ Binance API Test Failed");
    console.error("Error:", error.message);
  }
}

testBinance();