class BrokerInterface {
  async getBalance() {
    throw new Error("getBalance() must be implemented");
  }

  async getCurrentPrice(symbol) {
    throw new Error("getCurrentPrice() must be implemented");
  }

  async createOrder(order) {
    throw new Error("createOrder() must be implemented");
  }

  async closeOrder(order) {
    throw new Error("closeOrder() must be implemented");
  }
}

module.exports = BrokerInterface;