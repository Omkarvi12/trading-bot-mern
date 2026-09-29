const cron = require("node-cron");

const BotEngine = require("../bot/botEngine");
const OrderManager = require("../execution/orderManager");

const botEngine = new BotEngine();
const orderManager = new OrderManager();

// ==========================================
// BOT STATE
// ==========================================

let botRunning = false;

let botJob = null;
let monitorJob = null;


// ==========================================
// START TRADE MONITOR
// ==========================================

const startTradeMonitor = () => {

  // Prevent duplicate scheduler
  if (monitorJob) {

    console.log(
      "⚠️ Trade monitor scheduler already running"
    );

    return;
  }

  console.log(
    "⏰ Trade monitor scheduler started"
  );


  // ========================================
  // TRADE MONITOR
  // Every 1 minute
  // ========================================

  monitorJob = cron.schedule(
    "* * * * *",
    async () => {

      try {

        console.log(
          "🔍 Running automatic trade monitor..."
        );

        const result =
          await orderManager.monitorOpenTrades();

        console.log(
          `📊 Monitor result | Checked: ${result.checked} | Closed: ${result.closed}`
        );

      } catch (error) {

        console.error(
          "❌ Trade monitor scheduler error:",
          error.message
        );

      }

    }
  );


  console.log(
    "✅ Trade monitor: Every 1 minute"
  );
};


// ==========================================
// START BOT
// ==========================================

const startBot = () => {

  // Already running
  if (botRunning) {

    return {
      success: false,
      message: "Trading bot is already running",
      running: true,
    };

  }


  // ========================================
  // CREATE BOT JOB
  // Every 5 minutes
  // ========================================

  botJob = cron.schedule(
    "*/5 * * * *",
    async () => {

      // Safety check
      if (!botRunning) {

        console.log(
          "⏸️ Bot cycle skipped — bot is stopped"
        );

        return;
      }


      try {

        console.log(
          "🤖 Running automatic bot cycle..."
        );

        const result =
          await botEngine.runCycle();

        console.log(
          "📈 Bot cycle result:",
          result
        );

      } catch (error) {

        console.error(
          "❌ Bot scheduler error:",
          error.message
        );

      }

    }
  );


  botRunning = true;


  console.log(
    "🟢 Trading bot started"
  );

  console.log(
    "✅ Bot trading cycle: Every 5 minutes"
  );


  return {
    success: true,
    message: "Trading bot started successfully",
    running: true,
  };
};


// ==========================================
// STOP BOT
// ==========================================

const stopBot = () => {

  // Already stopped
  if (!botRunning) {

    return {
      success: false,
      message: "Trading bot is already stopped",
      running: false,
    };

  }


  // ========================================
  // STOP BOT JOB
  // ========================================

  if (botJob) {

    botJob.stop();

    botJob.destroy();

    botJob = null;

  }


  botRunning = false;


  console.log(
    "🔴 Trading bot stopped"
  );


  return {
    success: true,
    message: "Trading bot stopped successfully",
    running: false,
  };
};


// ==========================================
// GET BOT STATUS
// ==========================================

const getBotStatus = () => {

  return {
    running: botRunning,
    status: botRunning
      ? "RUNNING"
      : "STOPPED",
  };

};


// ==========================================
// MODULE EXPORTS
// ==========================================

module.exports = {
  startTradeMonitor,
  startBot,
  stopBot,
  getBotStatus,
};  