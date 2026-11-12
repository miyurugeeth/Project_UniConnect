import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    try {
      const response = await api.get("/admin/posts");
      setPosts(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load posts");
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadPosts();
    };

    load();
  }, []);

  const deletePost = async (id) => {
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((previous) => previous.filter((post) => post.id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete post");
    }
  };

  return (
    <main className="uap-shell">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

        .uap-shell {
          --uap-paper: #FAF7EF;
          --uap-paper-line: #E7DFCB;
          --uap-ink: #1C2430;
          --uap-ink-soft: #5B6472;
          --uap-navy: #1E3A5F;
          --uap-navy-deep: #142B45;
          --uap-gold: #C08A28;
          --uap-gold-soft: #EFDCA6;
          --uap-white: #FFFFFF;
          --uap-danger: #9A3B3B;
          --uap-danger-soft: #F4E3E3;

          font-family: 'Inter', sans-serif;
          color: var(--uap-ink);
          background: var(--uap-paper);
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 24px 96px;
          box-sizing: border-box;
        }

        .uap-shell * {
          box-sizing: border-box;
        }

        .uap-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--uap-navy);
          text-decoration: none;
          margin-bottom: 22px;
        }

        .uap-back::before {
          content: "←";
        }

        .uap-back:hover {
          color: var(--uap-gold);
        }

        .uap-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
          padding-bottom: 18px;
          border-bottom: 2px solid var(--uap-navy);
        }

        .uap-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--uap-gold);
          margin-bottom: 6px;
        }

        .uap-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 30px;
          letter-spacing: -0.01em;
          color: var(--uap-navy-deep);
          margin: 0;
        }

        .uap-count-pill {
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--uap-navy-deep);
          background: var(--uap-gold-soft);
          border: 1px solid var(--uap-gold);
          padding: 6px 14px;
          border-radius: 999px;
        }

        .uap-error {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--uap-danger);
          background: var(--uap-danger-soft);
          border: 1px solid var(--uap-danger);
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .uap-empty {
          font-size: 14px;
          color: var(--uap-ink-soft);
          background: var(--uap-white);
          border: 1px dashed var(--uap-paper-line);
          border-radius: 6px;
          padding: 28px;
          text-align: center;
        }

        .uap-card {
          position: relative;
          background: var(--uap-white);
          border: 1px solid var(--uap-paper-line);
          border-radius: 6px;
          padding: 20px 20px 16px;
          margin-bottom: 14px;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }

        .uap-card:hover {
          box-shadow: 0 6px 18px rgba(28, 36, 48, 0.07);
          transform: translateY(-2px);
        }

        .uap-tab {
          position: absolute;
          top: -1px;
          left: 20px;
          background: var(--uap-gold);
          color: var(--uap-navy-deep);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 0 0 4px 4px;
        }

        .uap-post-title {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--uap-navy-deep);
          margin: 14px 0 8px;
        }

        .uap-post-content {
          font-size: 14px;
          line-height: 1.65;
          color: var(--uap-ink);
          margin: 0 0 12px;
          white-space: pre-wrap;
        }

        .uap-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px dashed var(--uap-paper-line);
        }

        .uap-meta {
          font-size: 12px;
          color: var(--uap-ink-soft);
        }

        .uap-meta b {
          color: var(--uap-navy-deep);
          font-weight: 600;
        }

        .uap-delete-btn {
          flex-shrink: 0;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--uap-danger);
          background: var(--uap-white);
          border: 1px solid var(--uap-danger);
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .uap-delete-btn:hover {
          background: var(--uap-danger);
          color: var(--uap-white);
        }
      `}</style>

      <Link className="uap-back" to="/admin">Back to dashboard</Link>

      <div className="uap-header">
        <div>
          <span className="uap-eyebrow">UniConnect Admin</span>
          <h1 className="uap-title">Post Moderation</h1>
        </div>
        <span className="uap-count-pill">{posts.length} posts</span>
      </div>

      {error && <p className="uap-error">{error}</p>}

      {posts.length === 0 ? (
        <p className="uap-empty">No posts to review.</p>
      ) : (
        posts.map((post) => (
          <article className="uap-card" key={post.id}>
            <span className="uap-tab">Post</span>
            <h2 className="uap-post-title">{post.title}</h2>
            <p className="uap-post-content">{post.content}</p>
            <div className="uap-footer">
              <small className="uap-meta">By <b>{post.userName}</b></small>
              <button className="uap-delete-btn" onClick={() => deletePost(post.id)}>
                Delete
              </button>
            </div>
          </article>
        ))
      )}

    </main>
  );
}

export default AdminPosts;