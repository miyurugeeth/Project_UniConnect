import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function AdminComments() {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/comments")
      .then((response) => setComments(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load comments"));
  }, []);

  const deleteComment = async (id) => {
    try {
      await api.delete(`/admin/comments/${id}`);
      setComments((previous) => previous.filter((comment) => comment.id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete comment");
    }
  };

  return (
    <main className="uca-shell">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

        .uca-shell {
          --uca-paper: #FAF7EF;
          --uca-paper-line: #E7DFCB;
          --uca-ink: #1C2430;
          --uca-ink-soft: #5B6472;
          --uca-navy: #1E3A5F;
          --uca-navy-deep: #142B45;
          --uca-gold: #C08A28;
          --uca-gold-soft: #EFDCA6;
          --uca-white: #FFFFFF;
          --uca-danger: #9A3B3B;
          --uca-danger-soft: #F4E3E3;

          font-family: 'Inter', sans-serif;
          color: var(--uca-ink);
          background: var(--uca-paper);
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 24px 96px;
          box-sizing: border-box;
        }

        .uca-shell * {
          box-sizing: border-box;
        }

        .uca-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--uca-navy);
          text-decoration: none;
          margin-bottom: 22px;
        }

        .uca-back::before {
          content: "←";
        }

        .uca-back:hover {
          color: var(--uca-gold);
        }

        .uca-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
          padding-bottom: 18px;
          border-bottom: 2px solid var(--uca-navy);
        }

        .uca-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--uca-gold);
          margin-bottom: 6px;
        }

        .uca-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 30px;
          letter-spacing: -0.01em;
          color: var(--uca-navy-deep);
          margin: 0;
        }

        .uca-count-pill {
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--uca-navy-deep);
          background: var(--uca-gold-soft);
          border: 1px solid var(--uca-gold);
          padding: 6px 14px;
          border-radius: 999px;
        }

        .uca-error {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--uca-danger);
          background: var(--uca-danger-soft);
          border: 1px solid var(--uca-danger);
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .uca-empty {
          font-size: 14px;
          color: var(--uca-ink-soft);
          background: var(--uca-white);
          border: 1px dashed var(--uca-paper-line);
          border-radius: 6px;
          padding: 28px;
          text-align: center;
        }

        .uca-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: var(--uca-white);
          border: 1px solid var(--uca-paper-line);
          border-left: 4px solid var(--uca-gold);
          border-radius: 6px;
          padding: 16px 18px;
          margin-bottom: 12px;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }

        .uca-row:hover {
          box-shadow: 0 4px 14px rgba(28, 36, 48, 0.07);
          transform: translateY(-1px);
        }

        .uca-row-body {
          flex: 1;
          min-width: 0;
        }

        .uca-content {
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--uca-ink);
          margin: 0 0 8px;
        }

        .uca-meta {
          font-size: 12px;
          color: var(--uca-ink-soft);
        }

        .uca-meta b {
          color: var(--uca-navy-deep);
          font-weight: 600;
        }

        .uca-delete-btn {
          flex-shrink: 0;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--uca-danger);
          background: var(--uca-white);
          border: 1px solid var(--uca-danger);
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .uca-delete-btn:hover {
          background: var(--uca-danger);
          color: var(--uca-white);
        }
      `}</style>

      <Link className="uca-back" to="/admin">Back to dashboard</Link>

      <div className="uca-header">
        <div>
          <span className="uca-eyebrow">UniConnect Admin</span>
          <h1 className="uca-title">Comment Moderation</h1>
        </div>
        <span className="uca-count-pill">{comments.length} comments</span>
      </div>

      {error && <p className="uca-error">{error}</p>}

      {comments.length === 0 ? (
        <p className="uca-empty">No comments to review.</p>
      ) : (
        comments.map((comment) => (
          <article className="uca-row" key={comment.id}>
            <div className="uca-row-body">
              <p className="uca-content">{comment.content}</p>
              <small className="uca-meta">
                By <b>{comment.userName}</b> on post {comment.postId}
              </small>
            </div>
            <button className="uca-delete-btn" onClick={() => deleteComment(comment.id)}>
              Delete
            </button>
          </article>
        ))
      )}

    </main>
  );
}

export default AdminComments;