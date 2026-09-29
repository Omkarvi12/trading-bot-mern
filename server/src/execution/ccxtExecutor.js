const BrokerInterface = require("./brokerInterface");
const {
  createExchange,
  exchangeId,
} = require("../utils/exchangeFactory");

class CCXTExecutor extends BrokerInterface {
  constructor() {
    super();

    this.mode = (
      process.env.TRADING_MODE || "dry-run"
    ).toLowerCase();

    // ==========================================
    // EXCHANGE
    // ==========================================

    // IMPORTANT:
    // In dry-run mode we don't need to connect
    // to Binance at all.
    if (this.mode === "live") {
      this.exchange = createExchange({
        authenticated: true,
      });

      console.log(
        `🔌 ${exchangeId} executor initialized | Mode: LIVE`
      );
    } else {
      this.exchange = null;

      console.log(
        "🧪 CCXT executor initialized | Mode: DRY-RUN"
      );
      console.log(
        "ℹ️ Binance API disabled in dry-run mode"
      );
    }
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

    // ==========================================
    // DRY-RUN DEMO PRICE
    // ==========================================

    if (this.mode === "dry-run") {
      const demoPrices = {
        "BTC/USDT": 85000,
        "ETH/USDT": 2800,
        "BNB/USDT": 600,
        "SOL/USDT": 200,
      };

      const price =
        demoPrices[symbol] || 100;

      console.log(
        `🧪 DRY-RUN price | ${symbol}: ${price}`
      );

      return price;
    }

    // ==========================================
    // LIVE PRICE
    // ==========================================

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
    // LIVE ORDER
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