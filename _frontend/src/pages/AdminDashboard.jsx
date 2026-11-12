import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function AdminDashboard() {

const navigate = useNavigate();

const [stats, setStats] = useState(null);
const [error, setError] = useState("");

useEffect(() => {

const loadStats = async () => {

  try {

    const response =
      await api.get("/admin/dashboard");

    setStats(response.data);

  } catch (requestError) {

    setError(
      requestError.response?.data?.message ||
      "Unable to load dashboard statistics"
    );

  }

};

loadStats();

}, []);

// LOGOUT
const handleLogout = () => {


localStorage.removeItem("token");

navigate("/login");


};

return (


<div className="admin-page">

  <style>{`

    * {
      box-sizing: border-box;
    }

    .admin-page {
      min-height: 100vh;
      background: var(--background);
      color: var(--text);
      font-family: Inter, Arial, sans-serif;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    .admin-layout {
      display: flex;
      align-items: flex-start;
    }

    .admin-main {
      flex: 1;
      min-width: 0;
      padding: 35px;
    }

    .admin-container {
      max-width: 1200px;
      margin: auto;
    }


    /* HEADER */

    .admin-header {
      background: linear-gradient(
        135deg,
        #4f46e5,
        #6366f1
      );

      color: white;

      border-radius: 20px;

      padding: 32px;

      margin-bottom: 28px;

      box-shadow:
        0 10px 30px rgba(79, 70, 229, 0.18);
    }

    .admin-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .admin-eyebrow {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: 0.8;
      margin-bottom: 8px;
    }

    .admin-title {
      margin: 0;
      font-size: 32px;
      font-weight: 750;
    }

    .admin-subtitle {
      margin: 8px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }


    /* ERROR */

    .admin-error {
      background: #fff1f2;
      color: #be123c;
      border: 1px solid #fecdd3;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 25px;
      font-size: 14px;
      font-weight: 600;
    }


    /* STAT CARDS */

    .stats-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(190px, 1fr));

      gap: 18px;

      margin-bottom: 35px;
    }

    .stat-card {
      background: var(--surface);

      border: 1px solid var(--border);

      border-radius: 16px;

      padding: 22px;

      box-shadow: var(--shadow-sm);

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.25s ease,
        border-color 0.25s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);

      box-shadow:
        0 12px 25px rgba(15, 23, 42, 0.08);
    }

    .stat-icon {
      width: 42px;
      height: 42px;

      display: flex;
      align-items: center;
      justify-content: center;

      background: #eef2ff;

      border-radius: 12px;

      font-size: 20px;

      margin-bottom: 15px;
    }

    .stat-value {
      display: block;

      font-size: 30px;

      font-weight: 750;

      color: var(--text);

      margin-bottom: 5px;

      transition: color 0.25s ease;
    }

    .stat-label {
      font-size: 13px;

      color: var(--text-secondary);

      font-weight: 600;

      text-transform: capitalize;

      transition: color 0.25s ease;
    }


    /* SECTION */

    .section-header {
      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 18px;
    }

    .section-title {
      margin: 0;

      font-size: 21px;

      font-weight: 750;

      color: var(--text);

      transition: color 0.25s ease;
    }

    .section-description {
      margin: 5px 0 0;

      font-size: 13px;

      color: var(--text-secondary);

      transition: color 0.25s ease;
    }


    /* FEATURE GRID */

    .feature-grid {
      display: grid;

      grid-template-columns:
        repeat(auto-fit, minmax(240px, 1fr));

      gap: 18px;

      margin-bottom: 30px;
    }

    .feature-card {
      background: var(--surface);

      border: 1px solid var(--border);

      border-radius: 17px;

      padding: 24px;

      display: flex;

      flex-direction: column;

      min-height: 190px;

      box-shadow: var(--shadow-sm);

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.25s ease,
        border-color 0.25s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);

      box-shadow:
        0 12px 28px rgba(15, 23, 42, 0.09);
    }

    .feature-icon {
      width: 48px;
      height: 48px;

      display: flex;

      align-items: center;
      justify-content: center;

      background: #eef2ff;

      border-radius: 13px;

      font-size: 22px;

      margin-bottom: 16px;
    }

    .feature-title {
      margin: 0 0 7px;

      font-size: 17px;

      font-weight: 700;

      color: var(--text);

      transition: color 0.25s ease;
    }

    .feature-text {
      margin: 0 0 20px;

      color: var(--text-secondary);

      font-size: 13.5px;

      line-height: 1.55;

      flex: 1;

      transition: color 0.25s ease;
    }


    /* BUTTON */

    .admin-btn {
      border: none;

      background: var(--primary);

      color: white;

      padding: 10px 17px;

      border-radius: 10px;

      font-size: 13px;

      font-weight: 700;

      cursor: pointer;

      transition:
        background 0.2s ease,
        transform 0.2s ease;
    }

    .admin-btn:hover {
      background: #4338ca;

      transform: translateY(-1px);
    }

    .admin-link {
      text-decoration: none;

      display: inline-block;
    }


    /* INFO */

    .admin-info {
      background: var(--surface);

      border: 1px solid var(--border);

      border-radius: 17px;

      padding: 24px;

      margin-bottom: 25px;

      box-shadow: var(--shadow-sm);

      transition:
        background-color 0.25s ease,
        border-color 0.25s ease,
        box-shadow 0.25s ease;
    }

    .info-title {
      margin: 0 0 10px;

      font-size: 17px;

      font-weight: 750;

      color: var(--text);

      transition: color 0.25s ease;
    }

    .info-text {
      margin: 5px 0;

      font-size: 13.5px;

      color: var(--text-secondary);

      line-height: 1.6;

      transition: color 0.25s ease;
    }


    /* LOGOUT */

    .logout-btn {
      border: 1px solid #fecaca;

      background: #fff;

      color: #dc2626;

      padding: 11px 20px;

      border-radius: 10px;

      font-size: 13px;

      font-weight: 700;

      cursor: pointer;

      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: #dc2626;

      color: white;

      border-color: #dc2626;
    }


    /* RESPONSIVE */

    @media (max-width: 768px) {

      .admin-main {
        padding: 20px;
      }

      .admin-header {
        padding: 24px;
      }

      .admin-header-top {
        flex-direction: column;

        align-items: flex-start;
      }

      .admin-title {
        font-size: 26px;
      }

    }

  `}</style>


  <Navbar />


  <div className="admin-layout">

    <Sidebar />


    <main className="admin-main">

      <div className="admin-container">


        {/* HEADER */}

        <section className="admin-header">

          <div className="admin-header-top">

            <div>

              <div className="admin-eyebrow">
                UniConnect Administration
              </div>

              <h1 className="admin-title">
                🛡️ Admin Dashboard
              </h1>

              <p className="admin-subtitle">
                Manage users, posts, comments and
                administrator accounts.
              </p>

            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="admin-error">
            ⚠️ {error}
          </div>

        )}


        {/* STATISTICS */}

        {stats && (

          <div className="stats-grid">

            {Object.entries(stats).map(
              ([key, value], index) => (

                <div
                  className="stat-card"
                  key={key}
                >

                  <div className="stat-icon">

                    {index === 0
                      ? "👥"
                      : index === 1
                      ? "📝"
                      : index === 2
                      ? "💬"
                      : "📊"}

                  </div>

                  <strong className="stat-value">
                    {value}
                  </strong>

                  <div className="stat-label">

                    {key
                      .replace(
                        /^total/,
                        "Total "
                      )
                      .replace(
                        /([A-Z])/g,
                        " $1"
                      )}

                  </div>

                </div>

              )
            )}

          </div>

        )}


        {/* ADMINISTRATION */}

        <div className="section-header">

          <div>

            <h2 className="section-title">
              Administration
            </h2>

            <p className="section-description">
              Manage the main areas of UniConnect.
            </p>

          </div>

        </div>


        <div className="feature-grid">


          {/* CREATE ADMIN */}

          <div className="feature-card">

            <div className="feature-icon">
              👤
            </div>

            <h3 className="feature-title">
              Create Admin
            </h3>

            <p className="feature-text">
              Create another administrator account
              for the UniConnect system.
            </p>

            <Link
              className="admin-link"
              to="/admin/register"
            >

              <button className="admin-btn">
                ➕ Create Admin
              </button>

            </Link>

          </div>


          {/* MANAGE USERS */}

          <div className="feature-card">

            <div className="feature-icon">
              👥
            </div>

            <h3 className="feature-title">
              Manage Users
            </h3>

            <p className="feature-text">
              View and manage registered UniConnect
              users.
            </p>

            <button
              className="admin-btn"
              onClick={() =>
                navigate("/admin/users")
              }
            >
              👥 Manage Users
            </button>

          </div>


          {/* MANAGE POSTS */}

          <div className="feature-card">

            <div className="feature-icon">
              📝
            </div>

            <h3 className="feature-title">
              Manage Posts
            </h3>

            <p className="feature-text">
              Review and manage posts created by
              UniConnect users.
            </p>

            <button
              className="admin-btn"
              onClick={() =>
                navigate("/admin/posts")
              }
            >
              📝 Manage Posts
            </button>

          </div>


          {/* MANAGE COMMENTS */}

          <div className="feature-card">

            <div className="feature-icon">
              💬
            </div>

            <h3 className="feature-title">
              Manage Comments
            </h3>

            <p className="feature-text">
              Review and manage comments created
              by users.
            </p>

            <button
              className="admin-btn"
              onClick={() =>
                navigate("/admin/comments")
              }
            >
              💬 Manage Comments
            </button>

          </div>


        </div>


        {/* ADMIN INFORMATION */}

        <section className="admin-info">

          <h3 className="info-title">
            🛡️ Administrator Access
          </h3>

          <p className="info-text">
            As an administrator, you can manage
            users, posts and comments across the
            UniConnect platform.
          </p>

          <p className="info-text">
            You can also create additional
            administrator accounts when required.
          </p>

        </section>


        {/* LOGOUT */}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>


      </div>

    </main>

  </div>

</div>

);

}

export default AdminDashboard;
