import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// AUTH TOKEN INTERCEPTOR
// ==========================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.log("🔒 Authentication required");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

// ==========================================
// BOT STATUS
// ==========================================

export const getBotStatus = async () => {
  const response = await API.get("/bot/status");
  return response.data;
};

// ==========================================
// START BOT
// ==========================================

export const startBot = async () => {
  const response = await API.post("/bot/start");
  return response.data;
};

// ==========================================
// STOP BOT
// ==========================================

export const stopBot = async () => {
  const response = await API.post("/bot/stop");
  return response.data;
};

// ==========================================
// DASHBOARD
// ==========================================

export const getDashboard = async () => {
  const response = await API.get("/dashboard");
  return response.data;
};

// ==========================================
// TRADES
// ==========================================

export const getTrades = async () => {
  const response = await API.get("/trades");
  return response.data;
};

// ==========================================
// BACKTEST
// ==========================================

export const runBacktest = async ({
  symbol = "BTC/USDT",
  timeframe = "5m",
  strategy = "EMA_CROSSOVER",
  initialBalance = 10000,
  tradeSizePercent = 10,
  limit = 500,
}) => {
  const response = await API.post("/backtest", {
    symbol,
    timeframe,
    strategy,
    initialBalance,
    tradeSizePercent,
    limit,
  });

  return response.data;
};

// ==========================================
// RISK MANAGEMENT
// ==========================================

export const getRiskStatus = async () => {
  const response = await API.get("/risk/status");
  return response.data;
};

// ==========================================
// LIVE MARKET PRICE
// ==========================================

export const getMarketPrice = async (
  symbol = "BTC/USDT"
) => {
  const response = await API.get("/market/price", {
    params: {
      symbol,
    },
  });

  return response.data;
};

// ==========================================
// AUTHENTICATION
// ==========================================

export const registerUser = async ({
  name,
  email,
  password,
}) => {
  const response = await API.post("/auth/register", {
    name,
    email,
    password,
  });

  return response.data;
};

export const loginUser = async ({
  email,
  password,
}) => {
  const response = await API.post("/auth/login", {
    email,
    password,
  });

  // Save token after successful login
  if (response.data?.success) {
    const token = response.data?.data?.token;
    const user = response.data?.data?.user;

    if (token) {
      localStorage.setItem("token", token);
    }

    if (user) {
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );
    }
  }

  return response.data;
};

export const getProfile = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ==========================================
// DEFAULT API
// ==========================================

export default API;