import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      console.log("Login successful:", data);

      localStorage.setItem("token", data.token);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);

      if (error.response) {
        setError(
          typeof error.response.data === "string"
            ? error.response.data
            : "Invalid email or password"
        );
      } else {
        setError("Unable to connect to server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <style>{`

        * {
          box-sizing: border-box;
        }

        /* =========================================
           LOGIN PAGE
        ========================================= */

        .login-page {
          min-height: 100vh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 30px;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          background:
            radial-gradient(
              circle at 10% 20%,
              rgba(99, 102, 241, 0.25),
              transparent 30%
            ),

            radial-gradient(
              circle at 90% 80%,
              rgba(37, 99, 235, 0.20),
              transparent 30%
            ),

            linear-gradient(
              135deg,
              #eef2ff,
              #f8fafc,
              #e0f2fe
            );

          position: relative;
          overflow: hidden;
        }


        /* =========================================
           BACKGROUND CIRCLES
        ========================================= */

        .login-circle {
          position: absolute;

          border-radius: 50%;

          filter: blur(1px);

          pointer-events: none;
        }


        .circle-one {
          width: 280px;
          height: 280px;

          background:
            rgba(99, 102, 241, 0.12);

          top: -100px;
          left: -80px;
        }


        .circle-two {
          width: 350px;
          height: 350px;

          background:
            rgba(14, 165, 233, 0.10);

          bottom: -160px;
          right: -100px;
        }


        /* =========================================
           LOGIN CARD
        ========================================= */

        .login-card {
          width: 100%;
          max-width: 430px;

          background:
            rgba(255, 255, 255, 0.88);

          backdrop-filter: blur(20px);

          border:
            1px solid
            rgba(255, 255, 255, 0.7);

          border-radius: 24px;

          padding: 42px;

          box-shadow:
            0 25px 70px
            rgba(15, 23, 42, 0.14);

          position: relative;

          z-index: 2;
        }


        /* =========================================
           UNICONNECT LOGO
        ========================================= */

        .login-logo {

          width: fit-content;

          min-width: 150px;

          height: 68px;

          margin:
            0 auto 18px;

          padding:
            0 22px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 19px;

          background:
            linear-gradient(
              135deg,
              #d910cf,
              #4fb6ff
            );

          color: white;

          font-size: 22px;

          font-weight: 800;

          letter-spacing: -0.5px;

          box-shadow:
            0 12px 28px
            rgba(79, 70, 229, 0.28);

          white-space: nowrap;
        }


        /* =========================================
           HEADER
        ========================================= */

        .login-header {

          text-align: center;

          margin-bottom: 32px;
        }


        .login-title {

          margin:
            0 0 8px;

          font-size: 29px;

          font-weight: 750;

          letter-spacing: -0.7px;

          color: #0f172a;
        }


        .login-subtitle {

          margin: 0;

          font-size: 14px;

          color: #64748b;
        }


        /* =========================================
           FORM
        ========================================= */

        .login-form-group {

          margin-bottom: 20px;
        }


        .login-label {

          display: block;

          margin-bottom: 8px;

          font-size: 13px;

          font-weight: 650;

          color: #334155;
        }


        .login-input-wrapper {

          position: relative;
        }


        .login-input-icon {

          position: absolute;

          left: 15px;

          top: 50%;

          transform:
            translateY(-50%);

          font-size: 17px;

          color: #64748b;

          pointer-events: none;
        }


        .login-input {

          width: 100%;

          height: 52px;

          padding:
            0 45px;

          border:
            1px solid #dbe2ea;

          border-radius: 12px;

          outline: none;

          background: #f8fafc;

          color: #0f172a;

          font-size: 14px;

          transition:
            all 0.2s ease;
        }


        .login-input::placeholder {

          color: #94a3b8;
        }


        .login-input:focus {

          border-color: #6366f1;

          background: #ffffff;

          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.10);
        }


        /* =========================================
           PASSWORD BUTTON
        ========================================= */

        .password-toggle {

          position: absolute;

          right: 13px;

          top: 50%;

          transform:
            translateY(-50%);

          border: none;

          background: transparent;

          cursor: pointer;

          font-size: 16px;

          color: #64748b;

          padding: 5px;
        }


        .password-toggle:hover {

          color: #4f46e5;
        }


        /* =========================================
           LOGIN BUTTON
        ========================================= */

        .login-button {

          width: 100%;

          height: 52px;

          margin-top: 5px;

          border: none;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #2563eb
            );

          color: white;

          font-size: 15px;

          font-weight: 650;

          cursor: pointer;

          box-shadow:
            0 10px 24px
            rgba(37, 99, 235, 0.22);

          transition:
            all 0.2s ease;
        }


        .login-button:hover:not(:disabled) {

          transform:
            translateY(-1px);

          box-shadow:
            0 14px 30px
            rgba(37, 99, 235, 0.28);
        }


        .login-button:active:not(:disabled) {

          transform:
            translateY(0);
        }


        .login-button:disabled {

          opacity: 0.65;

          cursor: not-allowed;
        }


        /* =========================================
           ERROR
        ========================================= */

        .login-error {

          margin-top: 18px;

          padding:
            12px 14px;

          border-radius: 10px;

          background: #fff1f2;

          border:
            1px solid #fecdd3;

          color: #be123c;

          font-size: 13px;

          text-align: center;
        }


        /* =========================================
           REGISTER
        ========================================= */

        .login-register {

          margin-top: 26px;

          padding-top: 22px;

          border-top:
            1px solid #e5e7eb;

          text-align: center;

          font-size: 13px;

          color: #64748b;
        }


        .login-register a {

          color: #4f46e5;

          font-weight: 650;

          text-decoration: none;

          margin-left: 4px;
        }


        .login-register a:hover {

          text-decoration: underline;
        }


        /* =========================================
           SECURITY TEXT
        ========================================= */

        .login-security {

          display: flex;

          justify-content: center;

          align-items: center;

          gap: 6px;

          margin-top: 18px;

          font-size: 11px;

          color: #94a3b8;
        }


        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 520px) {

          .login-page {

            padding: 18px;
          }


          .login-card {

            padding:
              30px 24px;

            border-radius: 20px;
          }


          .login-title {

            font-size: 25px;
          }


          .login-logo {

            height: 60px;

            min-width: 140px;

            padding:
              0 18px;

            font-size: 20px;
          }

        }

      `}</style>


      {/* =========================================
          BACKGROUND DECORATION
      ========================================= */}

      <div className="login-circle circle-one"></div>

      <div className="login-circle circle-two"></div>


      {/* =========================================
          LOGIN CARD
      ========================================= */}

      <div className="login-card">


        {/* =========================================
            UNICONNECT LOGO
        ========================================= */}

        <div className="login-logo">
          UniConnect
        </div>


        {/* =========================================
            HEADER
        ========================================= */}

        <div className="login-header">

          <h1 className="login-title">
            Welcome Back 👋
          </h1>

          <p className="login-subtitle">
            Sign in to your UniConnect account
          </p>

        </div>


        {/* =========================================
            FORM
        ========================================= */}

        <form onSubmit={handleLogin}>


          {/* EMAIL */}

          <div className="login-form-group">

            <label className="login-label">
              Email Address
            </label>

            <div className="login-input-wrapper">

              <span className="login-input-icon">
                ✉️
              </span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="login-input"
                required
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="login-form-group">

            <label className="login-label">
              Password
            </label>

            <div className="login-input-wrapper">

              <span className="login-input-icon">
                🔒
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="login-input"
                required
              />


              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >

                {showPassword
                  ? "🙈"
                  : "👁️"}

              </button>

            </div>

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign In →"}

          </button>


        </form>


        {/* ERROR */}

        {error && (

          <div className="login-error">

            ⚠️ {error}

          </div>

        )}


        {/* REGISTER */}

        <div className="login-register">

          Don't have an account?

          <Link to="/register">
            Create Account
          </Link>

        </div>


        {/* SECURITY */}

        <div className="login-security">

          🔐 Your account is protected

        </div>


      </div>

    </div>
  );
}

export default Login;