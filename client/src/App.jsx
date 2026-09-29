import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Menu } from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Backtest from "./pages/Backtest";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sidebar from "./components/Sidebar";
import { getProfile, logoutUser } from "./services/api";

import "./styles/global.css";

function ProtectedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState(() =>
    localStorage.getItem("token") ? "checking" : "unauthenticated"
  );

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      return;
    }

    let isActive = true;

    getProfile()
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (response.success) {
          setAuthStatus("authenticated");
        } else {
          logoutUser();
          setAuthStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (isActive) {
          logoutUser();
          setAuthStatus("unauthenticated");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (authStatus === "checking") {
    return (
      <div className="auth-loading" role="status">
        Checking session...
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">

      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="app-main">

        {/* Mobile Menu */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>

        <Routes>

          {/* Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Backtest */}
          <Route
            path="/backtest"
            element={<Backtest />}
          />

          {/* Unknown protected route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </main>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            LOGIN
        ========================= */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            REGISTER
        ========================= */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            PROTECTED APPLICATION
        ========================= */}
        <Route
          path="/*"
          element={<ProtectedLayout />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;