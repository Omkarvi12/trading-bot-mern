const ccxt = require("ccxt");
const BrokerInterface = require("./brokerInterface");

class CCXTExecutor extends BrokerInterface {
  constructor() {
    super();

    this.mode = (
      process.env.TRADING_MODE || "dry-run"
    ).toLowerCase();

    // ==========================================
    // BINANCE CONFIG
    // ==========================================

    const exchangeConfig = {
      enableRateLimit: true,
    };

    // Credentials only required in LIVE mode
    if (this.mode === "live") {
      if (
        !process.env.BINANCE_API_KEY ||
        !process.env.BINANCE_SECRET_KEY
      ) {
        throw new Error(
          "Binance API credentials are missing"
        );
      }

      exchangeConfig.apiKey =
        process.env.BINANCE_API_KEY;

      exchangeConfig.secret =
        process.env.BINANCE_SECRET_KEY;
    }

    this.exchange = new ccxt.binance(exchangeConfig);

    console.log(
      `🔌 Binance executor initialized | Mode: ${this.mode.toUpperCase()}`
    );
  }

  // ==========================================
  // BALANCE
  // ==========================================

  async getBalance() {
    if (this.mode === "dry-run") {
      return {
        total: 10000,
        free: 10000,
        used: 0,
        currency: "USDT",
        mode: "DRY_RUN",
      };
    }

    const balance =
      await this.exchange.fetchBalance();

    return {
      total: balance.total?.USDT || 0,
      free: balance.free?.USDT || 0,
      used: balance.used?.USDT || 0,
      currency: "USDT",
      mode: "LIVE",
    };
  }

  // ==========================================
  // CURRENT MARKET PRICE
  // ==========================================

  async getCurrentPrice(symbol) {
    if (!symbol) {
      throw new Error(
        "Trading symbol is required"
      );
    }

    const ticker =
      await this.exchange.fetchTicker(symbol);

    if (
      !ticker ||
      !ticker.last ||
      ticker.last <= 0
    ) {
      throw new Error(
        `Invalid market price for ${symbol}`
      );
    }

    return ticker.last;
  }

  // ==========================================
  // CREATE ORDER
  // ==========================================

  async createOrder({
    symbol,
    side,
    quantity,
    price = null,
    type = "MARKET",
  }) {
    if (!symbol) {
      throw new Error(
        "Trading symbol is required"
      );
    }

    if (!["BUY", "SELL"].includes(side)) {
      throw new Error(
        "Order side must be BUY or SELL"
      );
    }

    if (
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      throw new Error(
        "Order quantity must be greater than 0"
      );
    }

    const normalizedType =
      type.toLowerCase();

    // ==========================================
    // DRY RUN
    // ==========================================

    if (this.mode === "dry-run") {
      const currentPrice =
        price ||
        await this.getCurrentPrice(symbol);

      return {
        success: true,
        mode: "DRY_RUN",
        orderId: `DRY-${Date.now()}`,
        symbol,
        side,
        type,
        quantity: Number(quantity),
        price: currentPrice,
        status: "FILLED",
        timestamp: new Date(),
      };
    }

    // ==========================================
    // LIVE BINANCE ORDER
    // ==========================================

    console.log(
      `🚨 LIVE ORDER | ${side} ${quantity} ${symbol}`
    );

    const order =
      await this.exchange.createOrder(
        symbol,
        normalizedType,
        side.toLowerCase(),
        Number(quantity),
        price
      );

    const executedPrice =
      order.average ||
      order.price ||
      price;

    return {
      success: true,
      mode: "LIVE",
      orderId: order.id,
      symbol: order.symbol,
      side: order.side?.toUpperCase(),
      type: order.type?.toUpperCase(),
      quantity: order.amount,
      price: executedPrice,
      status: order.status,
      timestamp: new Date(),
      raw: order,
    };
  }

  // ==========================================
  // CLOSE ORDER
  // ==========================================

  async closeOrder(order) {
    return {
      success: true,
      message:
        "Order close request processed",
      order,
    };
  }
}

module.exports = CCXTExecutor;