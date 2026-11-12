
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getMyPosts,
  deletePost
} from "../services/postService";


function MyPosts() {

  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);


  // ----------------------------------------
  // LOAD MY POSTS
  // ----------------------------------------

  const loadMyPosts = async () => {

    try {

      setLoading(true);

      const data = await getMyPosts();

      console.log("My Posts:", data);

      setPosts(data);

    } catch (error) {

      console.error(
        "Failed to load my posts:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    const load = async () => {
      await loadMyPosts();
    };

    load();

  }, []);


  // ----------------------------------------
  // DELETE POST
  // ----------------------------------------

  const handleDelete = async (postId) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this post?"
      );

    if (!confirmed) {
      return;
    }


    try {

      await deletePost(postId);

      // Reload posts
      await loadMyPosts();

    } catch (error) {

      console.error(
        "Failed to delete post:",
        error
      );

    }

  };


  return (

    <div className="my-posts-page">

      <style>{`

        * {
          box-sizing: border-box;
        }


        .my-posts-page {

          min-height: 100vh;

          background: var(--background);

          color: var(--text);

          font-family: Arial, sans-serif;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;

        }


        .my-posts-layout {

          display: flex;

          min-height:
            calc(100vh - 70px);

        }


        .my-posts-main {

          flex: 1;

          min-width: 0;

          padding:
            40px 42px 80px;

        }


        .my-posts-container {

          max-width: 920px;

          margin: 0 auto;

        }


        /* =================================================
           HEADER
        ================================================= */

        .my-posts-header {

          display: flex;

          align-items: flex-end;

          justify-content: space-between;

          gap: 20px;

          margin-bottom: 28px;

        }


        .my-posts-label {

          margin-bottom: 8px;

          color: var(--primary);

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 2px;

          text-transform: uppercase;

        }


        .my-posts-title {

          margin: 0;

          color: var(--text);

          font-size: 30px;

          font-weight: 800;

          letter-spacing: -0.5px;

        }


        .my-posts-subtitle {

          margin:
            8px 0 0;

          color: var(--text-secondary);

          font-size: 13px;

        }


        /* =================================================
           CREATE BUTTON
        ================================================= */

        .create-post-button {

          flex-shrink: 0;

          height: 44px;

          padding:
            0 18px;

          border: none;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #17365d,
              #2d5a89
            );

          color: white;

          font-size: 12px;

          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 8px 18px
            rgba(23, 54, 93, 0.18);

          transition:
            all 0.2s ease;

        }


        .create-post-button:hover {

          transform:
            translateY(-2px);

          box-shadow:
            0 12px 25px
            rgba(23, 54, 93, 0.25);

        }


        /* =================================================
           SUMMARY
        ================================================= */

        .my-posts-summary {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 18px;

          padding:
            15px 18px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius:
            15px;

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .summary-left {

          display: flex;

          align-items: center;

          gap: 11px;

        }


        .summary-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 36px;

          height: 36px;

          border-radius: 10px;

          background:
            #f4e7c3;

          font-size: 16px;

        }


        .summary-title {

          margin: 0 0 3px;

          color: var(--text);

          font-size: 12px;

          font-weight: 800;

        }


        .summary-description {

          margin: 0;

          color: var(--text-light);

          font-size: 10px;

        }


        .post-count {

          padding:
            6px 11px;

          border-radius:
            999px;

          background: var(--primary-light);

          color: var(--primary-dark);

          font-size: 11px;

          font-weight: 800;

        }


        /* =================================================
           LOADING
        ================================================= */

        .loading-card {

          display: flex;

          align-items: center;

          justify-content: center;

          min-height: 220px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius: 18px;

          color: var(--text-secondary);

          font-size: 13px;

          box-shadow: var(--shadow-sm);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            color 0.25s ease;

        }


        .loading-content {

          text-align: center;

        }


        .loading-icon {

          margin-bottom: 10px;

          font-size: 30px;

          animation:
            floatIcon 1.5s ease-in-out infinite;

        }


        @keyframes floatIcon {

          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }

        }


        /* =================================================
           EMPTY
        ================================================= */

        .empty-card {

          padding:
            55px 25px;

          text-align: center;

          background: var(--surface);

          border:
            1px dashed var(--border);

          border-radius:
            20px;

          box-shadow: var(--shadow-sm);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

        }


        .empty-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 65px;

          height: 65px;

          margin:
            0 auto 15px;

          border-radius: 18px;

          background:
            #f4e7c3;

          font-size: 28px;

        }


        .empty-title {

          margin:
            0 0 7px;

          color: var(--text);

          font-size:
            17px;

          font-weight:
            800;

        }


        .empty-text {

          margin:
            0 auto 20px;

          max-width:
            400px;

          color: var(--text-secondary);

          font-size:
            12px;

          line-height:
            1.6;

        }


        .empty-button {

          height:
            40px;

          padding:
            0 16px;

          border:
            none;

          border-radius:
            11px;

          background:
            #17365d;

          color:
            white;

          font-size:
            11px;

          font-weight:
            700;

          cursor:
            pointer;

          transition:
            0.2s;

        }


        .empty-button:hover {

          background:
            #102a46;

          transform:
            translateY(-1px);

        }


        /* =================================================
           POST CARD
        ================================================= */

        .my-post-card {

          position:
            relative;

          margin-bottom:
            17px;

          padding:
            22px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius:
            19px;

          box-shadow: var(--shadow-sm);

          transition:
            all 0.2s ease,
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .my-post-card:hover {

          transform:
            translateY(-2px);

          box-shadow:
            0 12px 30px
            rgba(23,36,54,0.08);

        }


        /* =================================================
           POST TOP
        ================================================= */

        .my-post-top {

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          margin-bottom:
            16px;

        }


        .post-badge {

          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          padding:
            6px 9px;

          border-radius:
            8px;

          background: var(--surface-alt);

          color: var(--primary-dark);

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            0.5px;

          text-transform:
            uppercase;

        }


        .post-date {

          color: var(--text-light);

          font-size:
            10px;

        }


        /* =================================================
           POST CONTENT
        ================================================= */

        .my-post-title {

          margin:
            0 0 9px;

          color: var(--text);

          font-size:
            18px;

          font-weight:
            800;

          line-height:
            1.4;

        }


        .my-post-content {

          margin:
            0;

          color: var(--text-secondary);

          font-size:
            13px;

          line-height:
            1.75;

          white-space:
            pre-wrap;

        }


        /* =================================================
           STATS
        ================================================= */

        .my-post-stats {

          display:
            flex;

          align-items:
            center;

          gap:
            18px;

          margin-top:
            20px;

          padding-top:
            14px;

          border-top:
            1px solid var(--border);

        }


        .post-stat {

          display:
            flex;

          align-items:
            center;

          gap:
            6px;

          color: var(--text-secondary);

          font-size:
            11px;

          font-weight:
            600;

        }


        .stat-icon {

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            24px;

          height:
            24px;

          border-radius:
            7px;

          background: var(--surface-alt);

          font-size:
            11px;

        }


        /* =================================================
           ACTIONS
        ================================================= */

        .my-post-actions {

          display:
            flex;

          justify-content:
            flex-end;

          gap:
            8px;

          margin-top:
            17px;

        }


        .post-action {

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          height:
            35px;

          padding:
            0 12px;

          border:
            none;

          border-radius:
            9px;

          font-size:
            10px;

          font-weight:
            700;

          cursor:
            pointer;

          transition:
            all 0.18s ease;

        }


        .edit-action {

          background: var(--surface-alt);

          color: var(--primary-dark);

        }


        .edit-action:hover {

          background: var(--surface-strong);

          transform:
            translateY(-1px);

        }


        .delete-action {

          background: rgba(220, 38, 38, 0.08);

          color: var(--danger);

        }


        .delete-action:hover {

          background: rgba(220, 38, 38, 0.14);

          transform:
            translateY(-1px);

        }


        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 800px) {

          .my-posts-main {

            padding:
              28px 24px 60px;

          }

        }


        @media (max-width: 600px) {

          .my-posts-main {

            padding:
              22px 14px 50px;

          }


          .my-posts-header {

            align-items:
              flex-start;

            flex-direction:
              column;

          }


          .my-posts-title {

            font-size:
              25px;

          }


          .create-post-button {

            width:
              100%;

          }


          .my-posts-summary {

            padding:
              13px;

          }


          .my-post-card {

            padding:
              17px;

            border-radius:
              16px;

          }


          .my-post-title {

            font-size:
              16px;

          }


          .my-post-actions {

            justify-content:
              stretch;

          }


          .post-action {

            flex:
              1;

          }

        }


        @media (max-width: 400px) {

          .my-posts-main {

            padding:
              18px 11px 40px;

          }


          .my-posts-title {

            font-size:
              22px;

          }


          .my-post-top {

            align-items:
              flex-start;

            flex-direction:
              column;

          }

        }

      `}</style>


      <Navbar />


      <div className="my-posts-layout">

        <Sidebar />


        <main className="my-posts-main">

          <div className="my-posts-container">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="my-posts-header">

              <div>

                <div className="my-posts-label">
                  UniConnect Community
                </div>

                <h1 className="my-posts-title">
                  My Posts
                </h1>

                <p className="my-posts-subtitle">
                  Manage the posts you have shared
                  with the university community.
                </p>

              </div>


              <button
                className="create-post-button"
                onClick={() =>
                  navigate("/create-post")
                }
              >
                ➕ Create Post
              </button>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            {!loading && (

              <div className="my-posts-summary">

                <div className="summary-left">

                  <div className="summary-icon">
                    📝
                  </div>

                  <div>

                    <p className="summary-title">
                      Your Community Posts
                    </p>

                    <p className="summary-description">
                      Posts, engagement and activity
                    </p>

                  </div>

                </div>


                <span className="post-count">
                  {posts.length}{" "}
                  {posts.length === 1
                    ? "Post"
                    : "Posts"}
                </span>

              </div>

            )}


            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

              <div className="loading-card">

                <div className="loading-content">

                  <div className="loading-icon">
                    ⏳
                  </div>

                  Loading your posts...

                </div>

              </div>

            ) : posts.length === 0 ? (

              /* =================================================
                 EMPTY
              ================================================= */

              <div className="empty-card">

                <div className="empty-icon">
                  📝
                </div>

                <h2 className="empty-title">
                  No posts yet
                </h2>

                <p className="empty-text">
                  You haven't created any posts yet.
                  Share your first post with the
                  UniConnect community.
                </p>

                <button
                  className="empty-button"
                  onClick={() =>
                    navigate("/create-post")
                  }
                >
                  Create Your First Post
                </button>

              </div>

            ) : (

              /* =================================================
                 POSTS
              ================================================= */

              <section>

                {posts.map((post) => (

                  <article
                    className="my-post-card"
                    key={post.id}
                  >


                    {/* POST TOP */}

                    <div className="my-post-top">

                      <span className="post-badge">
                        ✦ My Post
                      </span>

                      <span className="post-date">

                        Posted{" "}

                        {new Date(
                          post.createdAt
                        ).toLocaleString()}

                      </span>

                    </div>


                    {/* TITLE */}

                    <h2 className="my-post-title">

                      {post.title}

                    </h2>


                    {/* CONTENT */}

                    <p className="my-post-content">

                      {post.content}

                    </p>


                    {/* STATS */}

                    <div className="my-post-stats">

                      <div className="post-stat">

                        <span className="stat-icon">
                          ❤️
                        </span>

                        <span>
                          {post.likeCount} Likes
                        </span>

                      </div>


                      <div className="post-stat">

                        <span className="stat-icon">
                          💬
                        </span>

                        <span>
                          {post.commentCount} Comments
                        </span>

                      </div>

                    </div>


                    {/* ACTIONS */}

                    <div className="my-post-actions">

                      <button
                        className="post-action edit-action"
                        onClick={() =>
                          navigate(
                            `/edit-post/${post.id}`
                          )
                        }
                      >
                        ✏️ Edit
                      </button>


                      <button
                        className="post-action delete-action"
                        onClick={() =>
                          handleDelete(post.id)
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>


                  </article>

                ))}

              </section>

            )}

          </div>

        </main>

      </div>

    </div>

  );

}


export default MyPosts;
