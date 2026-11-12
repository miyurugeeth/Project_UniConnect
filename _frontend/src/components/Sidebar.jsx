import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  getUnreadMessageCount
} from "../services/messageService";


function Sidebar() {

  const location = useLocation();

  const [unreadCount, setUnreadCount] =
    useState(0);


  // =====================================================
  // LOAD UNREAD MESSAGE COUNT
  // =====================================================

  const loadUnreadCount = async () => {

    try {

      const count =
        await getUnreadMessageCount();

      setUnreadCount(
        Number(count) || 0
      );

    } catch (error) {

      console.error(
        "Failed to load unread message count:",
        error
      );

    }

  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadUnreadCount();

  }, []);


  // =====================================================
  // REFRESH UNREAD COUNT
  // =====================================================

  useEffect(() => {

    const handleUnreadUpdate = () => {

      loadUnreadCount();

    };


    window.addEventListener(
      "unreadMessagesUpdated",
      handleUnreadUpdate
    );


    return () => {

      window.removeEventListener(
        "unreadMessagesUpdated",
        handleUnreadUpdate
      );

    };

  }, []);


  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isActive = (path) => {

    return location.pathname === path;

  };


  return (

    <aside className="ucs-sidebar">

      <style>{`

        .ucs-sidebar {
          width: 235px;
          min-height: calc(100vh - 70px);

          flex-shrink: 0;

          background: var(--surface);

          border-right: 1px solid var(--border);

          padding: 25px 14px;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          position: sticky;
          top: 70px;

          height: calc(100vh - 70px);

          overflow-y: auto;

          transition:
            background 0.25s ease,
            border-color 0.25s ease;
        }


        .ucs-sidebar-title {
          padding: 0 12px;

          margin-bottom: 18px;

          color: var(--text-light);

          font-size: 11px;

          font-weight: 750;

          letter-spacing: 0.13em;

          text-transform: uppercase;
        }


        .ucs-sidebar-nav {
          display: flex;

          flex-direction: column;

          gap: 5px;
        }


        .ucs-menu-link {
          position: relative;

          display: flex;

          align-items: center;

          gap: 12px;

          min-height: 46px;

          padding: 0 13px;

          border-radius: 11px;

          color: var(--text-secondary);

          text-decoration: none;

          font-size: 14px;

          font-weight: 550;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }


        .ucs-menu-link:hover {
          background: var(--surface-hover);

          color: var(--primary);

          transform: translateX(2px);
        }


        .ucs-menu-link.active {
          color: var(--primary);

          background: var(--primary-light);

          font-weight: 700;
        }


        .ucs-menu-link.active::before {
          content: "";

          position: absolute;

          left: -14px;

          top: 9px;

          width: 3px;

          height: 28px;

          border-radius: 0 4px 4px 0;

          background: var(--primary);
        }


        .ucs-menu-icon {
          width: 22px;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 17px;
        }


        .ucs-menu-label {
          flex: 1;
        }


        .ucs-badge {
          min-width: 22px;

          height: 22px;

          padding: 0 6px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 999px;

          color: white;

          background: var(--primary);

          font-size: 11px;

          font-weight: 750;

          box-shadow:
            0 3px 8px rgba(108, 77, 246, 0.25);
        }


        .ucs-sidebar-divider {
          height: 1px;

          background: var(--border);

          margin: 22px 8px;
        }


        .ucs-sidebar-footer {
          margin-top: 25px;

          padding: 15px 13px;

          border-radius: 13px;

          background: var(--surface-strong);

          border: 1px solid var(--border);

          transition:
            background 0.25s ease,
            border-color 0.25s ease;
        }


        .ucs-footer-title {
          color: var(--primary);

          font-size: 12px;

          font-weight: 700;

          margin-bottom: 4px;
        }


        .ucs-footer-text {
          color: var(--text-secondary);

          font-size: 11px;

          line-height: 1.5;
        }


        @media (max-width: 850px) {

          .ucs-sidebar {
            width: 200px;
          }

        }


        @media (max-width: 700px) {

          .ucs-sidebar {
            width: 70px;

            padding: 20px 10px;
          }


          .ucs-sidebar-title,
          .ucs-menu-label,
          .ucs-sidebar-footer {
            display: none;
          }


          .ucs-menu-link {
            justify-content: center;

            padding: 0;

            gap: 0;
          }


          .ucs-menu-icon {
            width: 100%;
          }


          .ucs-badge {
            position: absolute;

            top: 3px;

            right: 2px;

            min-width: 17px;

            height: 17px;

            padding: 0 4px;

            font-size: 9px;
          }


          .ucs-menu-link.active::before {
            left: -10px;
          }

        }

      `}</style>


      {/* =====================================================
          TITLE
      ===================================================== */}

      <div className="ucs-sidebar-title">
        Main Menu
      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="ucs-sidebar-nav">


        {/* HOME */}

        <Link
          to="/dashboard"
          className={`ucs-menu-link ${
            isActive("/dashboard")
              ? "active"
              : ""
          }`}
        >

          <span className="ucs-menu-icon">
            🏠
          </span>

          <span className="ucs-menu-label">
            Home
          </span>

        </Link>


        {/* CREATE POST */}

        <Link
          to="/create-post"
          className={`ucs-menu-link ${
            isActive("/create-post")
              ? "active"
              : ""
          }`}
        >

          <span className="ucs-menu-icon">
            ➕
          </span>

          <span className="ucs-menu-label">
            Create Post
          </span>

        </Link>


        {/* MY POSTS */}

        <Link
          to="/my-posts"
          className={`ucs-menu-link ${
            isActive("/my-posts")
              ? "active"
              : ""
          }`}
        >

          <span className="ucs-menu-icon">
            📝
          </span>

          <span className="ucs-menu-label">
            My Posts
          </span>

        </Link>


        {/* PROFILE */}

        <Link
          to="/profile"
          className={`ucs-menu-link ${
            isActive("/profile")
              ? "active"
              : ""
          }`}
        >

          <span className="ucs-menu-icon">
            👤
          </span>

          <span className="ucs-menu-label">
            Profile
          </span>

        </Link>


        {/* CONNECTIONS */}

        <Link
          to="/connections"
          className={`ucs-menu-link ${
            isActive("/connections")
              ? "active"
              : ""
          }`}
        >

          <span className="ucs-menu-icon">
            👥
          </span>

          <span className="ucs-menu-label">
            Connections
          </span>

        </Link>


        {/* MESSAGES */}

        <Link
          to="/messages"
          className={`ucs-menu-link ${
            isActive("/messages")
              ? "active"
              : ""
          }`}
        >

          <span className="ucs-menu-icon">
            💬
          </span>

          <span className="ucs-menu-label">
            Messages
          </span>


          {unreadCount > 0 && (

            <span className="ucs-badge">
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>

          )}

        </Link>


      </nav>


      <div className="ucs-sidebar-divider" />


      {/* =====================================================
          SIDEBAR FOOTER
      ===================================================== */}

      <div className="ucs-sidebar-footer">

        <div className="ucs-footer-title">
          🎓 UniConnect
        </div>

        <div className="ucs-footer-text">
          Connect with your university
          community.
        </div>

      </div>


    </aside>

  );

}


export default Sidebar;