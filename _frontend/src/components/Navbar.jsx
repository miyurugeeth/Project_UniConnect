import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useTheme } from "../context/ThemeContext";


function Navbar() {

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const { darkMode, toggleTheme } = useTheme();

  const token = localStorage.getItem("token");

  let isAdmin = false;

  if (token) {

    try {

      const payload =
        JSON.parse(
          atob(token.split(".")[1])
        );

      isAdmin =
        payload.role === "ADMIN";

    } catch {

      isAdmin = false;

    }

  }


  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/login");

  };


  return (

    <header
      className={`ucs-navbar ${
        darkMode ? "ucs-navbar-dark" : ""
      }`}
    >

      <style>{`

        .ucs-navbar {
          height: 70px;
          width: 100%;

          background: var(--surface);

          border-bottom: 1px solid var(--border);

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 32px;

          position: sticky;
          top: 0;
          z-index: 1000;

          box-shadow: var(--shadow-sm);

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          transition:
            background 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }


        /* ============================= */
        /* DARK NAVBAR - Removed, CSS variables handle theme */
        /* ============================= */


        /* ============================= */
        /* BRAND */
        /* ============================= */

        .ucs-brand {
          display: flex;
          align-items: center;

          gap: 11px;

          text-decoration: none;
        }


        .ucs-brand-icon {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #6c4df6,
              #8b72ff
            );

          color: white;

          font-size: 19px;

          box-shadow:
            0 6px 16px
            rgba(108, 77, 246, 0.22);
        }


        .ucs-brand-name {
          font-size: 20px;

          font-weight: 750;

          color: var(--text);

          letter-spacing: -0.4px;

          transition: color 0.3s ease;
        }


        .ucs-brand-name span {
          color: var(--primary);
        }


        /* ============================= */
        /* RIGHT SIDE */
        /* ============================= */

        .ucs-navbar-right {
          display: flex;

          align-items: center;

          gap: 12px;
        }


        /* ============================= */
        /* THEME BUTTON */
        /* ============================= */

        .ucs-theme-btn {
          height: 40px;

          min-width: 40px;

          padding: 0 12px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          border-radius: 10px;

          border: 1px solid var(--border);

          background: var(--surface-hover);

          color: var(--text-secondary);

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;

          transition: all 0.2s ease, background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }


        .ucs-theme-btn:hover {
          background: var(--surface-strong);

          border-color: var(--primary);

          color: var(--primary);

          transform: translateY(-1px);
        }


        /* DARK THEME BUTTON - Removed, CSS variables handle theme */


        /* ============================= */
        /* ADMIN */
        /* ============================= */

        .ucs-admin-link {
          display: flex;

          align-items: center;

          gap: 7px;

          padding: 9px 13px;

          border-radius: 9px;

          color: var(--primary);

          background: var(--primary-light);

          font-size: 13px;

          font-weight: 650;

          text-decoration: none;

          transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease;
        }


        .ucs-admin-link:hover {
          background: var(--surface-strong);

          transform: translateY(-1px);
        }


        /* ============================= */
        /* PROFILE */
        /* ============================= */

        .ucs-profile {
          display: flex;

          align-items: center;

          gap: 9px;

          padding: 5px 9px 5px 5px;

          border: 1px solid #e8e9ef;

          border-radius: 12px;

          background: #ffffff;

          cursor: pointer;

          text-decoration: none;

          transition: all 0.2s ease;
        }


        .ucs-profile:hover {
          border-color: #d8d3f5;

          background: #faf9ff;
        }


        .ucs-navbar-dark .ucs-profile {
          background: #222437;

          border-color: #34374d;
        }


        .ucs-navbar-dark .ucs-profile:hover {
          background: #292c40;

          border-color: #4b4770;
        }


        /* ============================= */
        /* AVATAR */
        /* ============================= */

        .ucs-avatar {
          width: 34px;

          height: 34px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 9px;

          background: #eeeaff;

          color: #6c4df6;

          font-size: 16px;
        }


        .ucs-navbar-dark .ucs-avatar {
          background: #302b4c;

          color: #a99aff;
        }


        /* ============================= */
        /* PROFILE TEXT */
        /* ============================= */

        .ucs-profile-text {
          display: flex;

          flex-direction: column;

          line-height: 1.2;
        }


        .ucs-profile-name {
          font-size: 13px;

          font-weight: 650;

          color: #292c38;
        }


        .ucs-navbar-dark .ucs-profile-name {
          color: #f1f1f5;
        }


        .ucs-profile-role {
          font-size: 10px;

          color: #9a9dab;

          margin-top: 2px;
        }


        .ucs-navbar-dark .ucs-profile-role {
          color: #9295a8;
        }


        /* ============================= */
        /* LOGOUT */
        /* ============================= */

        .ucs-logout {
          height: 40px;

          padding: 0 14px;

          border-radius: 10px;

          border: 1px solid #ececf1;

          background: #ffffff;

          color: #6b7280;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;

          transition: all 0.2s ease;
        }


        .ucs-logout:hover {
          color: #dc2626;

          background: #fff5f5;

          border-color: #fee2e2;
        }


        .ucs-navbar-dark .ucs-logout {
          background: #222437;

          border-color: #34374d;

          color: #aeb1c0;
        }


        .ucs-navbar-dark .ucs-logout:hover {
          color: #ff7b7b;

          background: #35252d;

          border-color: #63373d;
        }


        /* ============================= */
        /* MOBILE MENU */
        /* ============================= */

        .ucs-mobile-menu {
          display: none;

          width: 40px;

          height: 40px;

          align-items: center;

          justify-content: center;

          border-radius: 10px;

          background: #f5f4fa;

          border: none;

          font-size: 18px;

          cursor: pointer;
        }


        .ucs-navbar-dark .ucs-mobile-menu {
          background: #25283b;

          color: #ffffff;
        }


        /* ============================= */
        /* MOBILE */
        /* ============================= */

        @media (max-width: 750px) {

          .ucs-navbar {
            padding: 0 16px;
          }


          .ucs-profile-text {
            display: none;
          }


          .ucs-profile {
            border: none;

            padding: 3px;

            background: transparent;
          }


          .ucs-navbar-dark .ucs-profile {
            border: none;

            background: transparent;
          }


          .ucs-admin-link {
            display: none;
          }


          .ucs-logout {
            display: none;
          }


          .ucs-theme-btn span {
            display: none;
          }


          .ucs-theme-btn {
            width: 40px;

            padding: 0;
          }


          .ucs-mobile-menu {
            display: flex;
          }

        }


        @media (max-width: 450px) {

          .ucs-brand-name {
            font-size: 18px;
          }


          .ucs-brand-icon {
            width: 35px;

            height: 35px;
          }

        }

      `}</style>


      {/* ============================= */}
      {/* BRAND */}
      {/* ============================= */}

      <Link
        to="/dashboard"
        className="ucs-brand"
      >

        <div className="ucs-brand-icon">
          🎓
        </div>

        <div className="ucs-brand-name">
          Uni<span>Connect</span>
        </div>

      </Link>


      {/* ============================= */}
      {/* RIGHT SIDE */}
      {/* ============================= */}

      <div className="ucs-navbar-right">


        {/* ============================= */}
        {/* THEME CHANGER */}
        {/* ============================= */}

        <button
          type="button"
          className="ucs-theme-btn"
          onClick={toggleTheme}
          title={
            darkMode
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
        >

          {darkMode ? "☀️" : "🌙"}

          <span>
            {darkMode
              ? "Light"
              : "Dark"}
          </span>

        </button>


        {/* ============================= */}
        {/* ADMIN */}
        {/* ============================= */}

        {isAdmin && (

          <Link
            to="/admin"
            className="ucs-admin-link"
          >

            🛡️
            Admin Dashboard

          </Link>

        )}


        {/* ============================= */}
        {/* PROFILE */}
        {/* ============================= */}

        <Link
          to="/profile"
          className="ucs-profile"
        >

          <div className="ucs-avatar">
            👤
          </div>

          <div className="ucs-profile-text">

            <span className="ucs-profile-name">
              Profile
            </span>

            <span className="ucs-profile-role">
              {isAdmin
                ? "Administrator"
                : "Student"}
            </span>

          </div>

        </Link>


        {/* ============================= */}
        {/* LOGOUT */}
        {/* ============================= */}

        <button
          type="button"
          className="ucs-logout"
          onClick={handleLogout}
        >
          Logout
        </button>


        {/* ============================= */}
        {/* MOBILE */}
        {/* ============================= */}

        <button
          type="button"
          className="ucs-mobile-menu"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          ☰
        </button>

      </div>

    </header>

  );

}


export default Navbar;