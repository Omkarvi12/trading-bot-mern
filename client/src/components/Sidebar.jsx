import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  X,
} from "lucide-react";

function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div>
            <h2>TradingBot</h2>
            <span>Trading Dashboard</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/backtest"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <BarChart3 size={19} />
            <span>Backtest</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;