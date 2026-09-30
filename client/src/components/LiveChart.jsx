import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LiveChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandles = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/test/market-data?symbol=BTC%2FUSDT&timeframe=5m&limit=100`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result?.success && Array.isArray(result.data)) {
        const chartData = result.data.map((candle) => ({
          time: new Date(
            candle.timestamp || candle.time
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: Number(candle.close ?? candle.price ?? 0),
        }));

        setData(chartData);
      }
    } catch (error) {
      console.error("❌ Live chart error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandles();

    // Refresh every 5 minutes
    const interval = setInterval(fetchCandles, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-chart-card">
      <div className="live-chart-header">
        <div>
          <h3>BTC/USDT</h3>
          <span>Live Market • 5m</span>
        </div>

        <div className="live-indicator">
          <span></span>
          LIVE
        </div>
      </div>

      <div className="live-chart">
        {loading ? (
          <div className="chart-loading">Loading market data...</div>
        ) : data.length === 0 ? (
          <div className="chart-loading">No market data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="priceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopOpacity={0.25} />
                  <stop offset="100%" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.12} />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                minTickGap={30}
              />

              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                width={75}
              />

              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  "Price",
                ]}
              />

              <Area
                type="monotone"
                dataKey="price"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LiveChart;