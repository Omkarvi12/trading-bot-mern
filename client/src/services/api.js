import axios from "axios";

// ==========================================
// API BASE URL
// ==========================================
// VITE_API_URL me sirf backend ka root daalo, /api ke bina:
//   https://trading-bot-mern.onrender.com
// Agar galti se /api ya trailing slash laga bhi diya to niche clean ho jayega.
const RAW_URL =
  import.meta.env.VITE_API_URL || "https://trading-bot-mern.onrender.com";

export const API_URL = RAW_URL.replace(/\/+$/, "").replace(/\/api$/, "");

const API_BASE_URL = `${API_URL}/api`;

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// TOKEN INTERCEPTOR
// ==========================================
const attachToken = (config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

API.interceptors.request.use(attachToken, (error) => Promise.reject(error));

// Dashboard / PriceChart jaise files seedha `axios` use karte hain,
// unme bhi token jaye isliye global axios pe bhi lagaya hai.
axios.interceptors.request.use(attachToken);

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

      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

// ==========================================
// BOT
// ==========================================
export const getBotStatus = async () => (await API.get("/bot/status")).data;
export const startBot = async () => (await API.post("/bot/start")).data;
export const stopBot = async () => (await API.post("/bot/stop")).data;

// ==========================================
// DASHBOARD / TRADES
// ==========================================
export const getDashboard = async () => (await API.get("/dashboard")).data;
export const getTrades = async () => (await API.get("/trades")).data;

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
// RISK / MARKET
// ==========================================
export const getRiskStatus = async () => (await API.get("/risk/status")).data;

export const getMarketPrice = async (symbol = "BTC/USDT") =>
  (await API.get("/market/price", { params: { symbol } })).data;

// ==========================================
// AUTH
// ==========================================
export const registerUser = async ({ name, email, password }) => {
  const response = await API.post("/auth/register", { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await API.post("/auth/login", { email, password });

  if (response.data?.success) {
    const token = response.data?.data?.token;
    const user = response.data?.data?.user;

    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }

  return response.data;
};

export const getProfile = async () => (await API.get("/auth/me")).data;

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export default API;