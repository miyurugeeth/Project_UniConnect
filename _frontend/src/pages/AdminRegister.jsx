import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    faculty: "",
    batch: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/admin/users", {
        ...formData,
        batch: Number(formData.batch)
      });
      navigate("/admin");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        requestError.response?.data ||
        "Unable to create administrator"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="uar-shell">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

        .uar-shell {
          --uar-paper: #FAF7EF;
          --uar-paper-line: #E7DFCB;
          --uar-ink: #1C2430;
          --uar-ink-soft: #5B6472;
          --uar-navy: #1E3A5F;
          --uar-navy-deep: #142B45;
          --uar-gold: #C08A28;
          --uar-gold-soft: #EFDCA6;
          --uar-white: #FFFFFF;
          --uar-danger: #9A3B3B;
          --uar-danger-soft: #F4E3E3;

          font-family: 'Inter', sans-serif;
          color: var(--uar-ink);
          background: var(--uar-paper);
          max-width: 480px;
          margin: 48px auto;
          padding: 0 24px 96px;
          box-sizing: border-box;
        }

        .uar-shell * {
          box-sizing: border-box;
        }

        .uar-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--uar-navy);
        }

        .uar-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--uar-gold);
          margin-bottom: 6px;
        }

        .uar-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 28px;
          letter-spacing: -0.01em;
          color: var(--uar-navy-deep);
          margin: 0;
        }

        .uar-form-card {
          background: var(--uar-white);
          border: 1px solid var(--uar-paper-line);
          border-left: 4px solid var(--uar-gold);
          border-radius: 8px;
          padding: 28px;
        }

        .uar-field {
          margin-bottom: 16px;
        }

        .uar-label {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--uar-ink-soft);
          margin-bottom: 6px;
        }

        .uar-input {
          display: block;
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--uar-ink);
          background: var(--uar-paper);
          border: 1px solid var(--uar-paper-line);
          border-radius: 5px;
          padding: 11px 13px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .uar-input::placeholder {
          color: #A9A08A;
        }

        .uar-input:focus {
          outline: none;
          border-color: var(--uar-gold);
          box-shadow: 0 0 0 3px rgba(192, 138, 40, 0.15);
        }

        .uar-error {
          font-size: 13px;
          font-weight: 600;
          color: var(--uar-danger);
          background: var(--uar-danger-soft);
          border: 1px solid var(--uar-danger);
          border-radius: 6px;
          padding: 11px 14px;
          margin-bottom: 16px;
        }

        .uar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 22px;
        }

        .uar-submit-btn {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--uar-white);
          background: var(--uar-navy);
          border: none;
          padding: 12px 22px;
          border-radius: 22px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
        }

        .uar-submit-btn:hover:not(:disabled) {
          background: var(--uar-navy-deep);
          transform: translateY(-1px);
        }

        .uar-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .uar-cancel-link {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--uar-ink-soft);
          text-decoration: none;
        }

        .uar-cancel-link:hover {
          color: var(--uar-danger);
        }
      `}</style>

      <div className="uar-header">
        <span className="uar-eyebrow">UniConnect Admin</span>
        <h1 className="uar-title">Create Administrator</h1>
      </div>

      <div className="uar-form-card">

        <form onSubmit={handleSubmit}>

          {error && <p className="uar-error">{String(error)}</p>}

          {Object.keys(formData).map((field) => (
            <div className="uar-field" key={field}>
              <label className="uar-label" htmlFor={field}>
                {field[0].toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                className="uar-input"
                name={field}
                type={field === "password" ? "password" : field === "batch" ? "number" : field === "email" ? "email" : "text"}
                placeholder={field[0].toUpperCase() + field.slice(1)}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="uar-actions">
            <button className="uar-submit-btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Administrator"}
            </button>
            <Link className="uar-cancel-link" to="/admin">Cancel</Link>
          </div>

        </form>

      </div>

    </main>
  );
}

export default AdminRegister;