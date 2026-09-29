import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser({
        email,
        password,
      });

      console.log("Login response:", response);

      if (response.success) {
        // loginUser() already saves token and user
        navigate("/", { replace: true });
      } else {
        setError(
          response.message || "Invalid email or password"
        );
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
        "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* HEADER */}
        <div className="login-header">

          <div className="login-logo">
            TB
          </div>

          <h1 className="login-title">
            TradingBot Login
          </h1>

          <p className="login-subtitle">
            Sign in to access your trading dashboard
          </p>

        </div>

        {/* ERROR */}
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          {/* EMAIL */}
          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          {/* PASSWORD */}
          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

        {/* REGISTER */}
        <div className="auth-switch">

          <span>
            Don't have an account?
          </span>{" "}

          <Link to="/register">
            Create Account
          </Link>

        </div>

        {/* FOOTER */}
        <div className="login-footer">
          TradingBot • Secure Trading Platform
        </div>

      </div>

    </div>
  );
}

export default Login;