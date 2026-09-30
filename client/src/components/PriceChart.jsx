import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import axios from "axios";
import { API_URL } from "../services/api";

function PriceChart() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // CREATE CHART
  // ==========================================
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,

      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },

      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },

      rightPriceScale: {
        borderColor: "#374151",
      },

      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // RESPONSIVE
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();

      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ==========================================
  // FETCH CANDLES
  // ==========================================
  useEffect(() => {
    const fetchCandles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/api/market/candles`,
          {
            params: {
              symbol: "BTC/USDT",
              timeframe: "5m",
              limit: 100,
            },
          }
        );

        console.log("📊 Market candles response:", response.data);

        if (!response.data?.success) {
          throw new Error("Market data request failed");
        }

        const candles = response.data.data || [];

        if (candles.length === 0) {
          throw new Error("No candle data available");
        }

        // ==========================================
        // CONVERT DATA FOR LIGHTWEIGHT CHART
        // ==========================================
        const chartData = candles
          .map((candle) => ({
            time: Math.floor(
              new Date(candle.timestamp).getTime() / 1000
            ),
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
          }))
          .filter(
            (candle) =>
              candle.time &&
              Number.isFinite(candle.open) &&
              Number.isFinite(candle.high) &&
              Number.isFinite(candle.low) &&
              Number.isFinite(candle.close) &&
              candle.open > 0 &&
              candle.high > 0 &&
              candle.low > 0 &&
              candle.close > 0
          )
          .sort((a, b) => a.time - b.time);

        // ==========================================
        // REMOVE DUPLICATE TIMESTAMPS
        // ==========================================
        const uniqueData = [];
        const timestamps = new Set();

        for (const candle of chartData) {
          if (!timestamps.has(candle.time)) {
            timestamps.add(candle.time);
            uniqueData.push(candle);
          }
        }

        if (uniqueData.length === 0) {
          throw new Error("No valid candle data available");
        }

        // ==========================================
        // SET CHART DATA
        // ==========================================
        if (seriesRef.current) {
          seriesRef.current.setData(uniqueData);

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }
      } catch (err) {
        console.error("❌ Chart error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load market data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
  }, []);

  // ==========================================
  // UI
  // ==========================================
  return (
    <div
      className="price-chart-wrapper"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "400px",
      }}
    >
      {loading && (
        <div
          className="chart-loading"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          Loading BTC/USDT chart...
        </div>
      )}

      {error && !loading && (
        <div
          className="chart-error"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: "400px",
        }}
      />
    </div>
  );
}

export default PriceChart;