class BaseStrategy {
  constructor(name) {
    this.name = name;
  }

  generateSignal() {
    throw new Error("generateSignal() must be implemented");
  }
}

module.exports = BaseStrategy;