import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { getCurrentUser } from "../services/userService";
import { getPosts } from "../services/postService";

import {
  likePost,
  unlikePost
} from "../services/likeService";

import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment
} from "../services/commentService";


const getAttachmentUrl = (path) =>
  path?.startsWith("http")
    ? path
    : `http://localhost:8081${path}`;


const getInitials = (name) => {

  if (!name) return "?";

  const parts = name.trim().split(" ");

  const first = parts[0]?.[0] || "";

  const last =
    parts.length > 1
      ? parts[parts.length - 1][0]
      : "";

  return (first + last).toUpperCase();
};


function Dashboard() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");


  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  useEffect(() => {

    const loadUser = async () => {

      try {

        const data = await getCurrentUser();

        console.log("Current user:", data);

        setUser(data);

      } catch (error) {

        console.error(
          "Failed to load user:",
          error
        );

      }

    };

    loadUser();

  }, []);


  // =========================================================
  // LOAD POSTS
  // =========================================================

  useEffect(() => {

    const loadPosts = async () => {

      try {

        const data = await getPosts();

        console.log("Posts:", data);

        setPosts(data);

      } catch (error) {

        console.error(
          "Failed to load posts:",
          error
        );

      }

    };

    loadPosts();

  }, []);


  // =========================================================
  // LIKE / UNLIKE
  // =========================================================

  const handleLike = async (
    postId,
    currentlyLiked
  ) => {

    try {

      if (currentlyLiked) {

        await unlikePost(postId);

      } else {

        await likePost(postId);

      }

      const updatedPosts = await getPosts();

      setPosts(updatedPosts);

    } catch (error) {

      console.error(
        "Failed to update like:",
        error
      );

    }

  };


  // =========================================================
  // GET COMMENTS
  // =========================================================

  const handleGetComments = async (postId) => {

    try {

      const data =
        await getCommentsByPost(postId);

      setComments((previous) => ({
        ...previous,
        [postId]: data
      }));

      setOpenComments((previous) => ({
        ...previous,
        [postId]: !previous[postId]
      }));

    } catch (error) {

      console.error(
        "Failed to load comments:",
        error
      );

    }

  };


  // =========================================================
  // COMMENT INPUT
  // =========================================================

  const handleCommentTextChange = (
    postId,
    value
  ) => {

    setCommentText((previous) => ({
      ...previous,
      [postId]: value
    }));

  };


  // =========================================================
  // CREATE COMMENT
  // =========================================================

  const handleCreateComment = async (postId) => {

    const text =
      commentText[postId]?.trim();

    if (!text) return;

    try {

      const newComment =
        await createComment(
          postId,
          text
        );

      setComments((previous) => ({

        ...previous,

        [postId]: [
          ...(previous[postId] || []),
          newComment
        ]

      }));

      setCommentText((previous) => ({

        ...previous,

        [postId]: ""

      }));

      const updatedPosts =
        await getPosts();

      setPosts(updatedPosts);

    } catch (error) {

      console.error(
        "Failed to create comment:",
        error
      );

    }

  };


  // =========================================================
  // START EDIT
  // =========================================================

  const handleStartEdit = (comment) => {

    setEditingComment(comment.id);

    setEditCommentText(
      comment.content
    );

  };


  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {

    setEditingComment(null);

    setEditCommentText("");

  };


  // =========================================================
  // UPDATE COMMENT
  // =========================================================

  const handleUpdateComment = async (
    commentId,
    postId
  ) => {

    const text =
      editCommentText.trim();

    if (!text) return;

    try {

      const updatedComment =
        await updateComment(
          commentId,
          text
        );

      setComments((previous) => ({

        ...previous,

        [postId]:
          (previous[postId] || []).map(
            (comment) =>
              comment.id === commentId
                ? updatedComment
                : comment
          )

      }));

      setEditingComment(null);

      setEditCommentText("");

    } catch (error) {

      console.error(
        "Failed to update comment:",
        error
      );

    }

  };


  // =========================================================
  // DELETE COMMENT
  // =========================================================

  const handleDeleteComment = async (
    commentId,
    postId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) return;

    try {

      await deleteComment(commentId);

      setComments((previous) => ({

        ...previous,

        [postId]:
          (previous[postId] || []).filter(
            (comment) =>
              comment.id !== commentId
          )

      }));

      const updatedPosts =
        await getPosts();

      setPosts(updatedPosts);

    } catch (error) {

      console.error(
        "Failed to delete comment:",
        error
      );

    }

  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="uc-app">

      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap'
        );


        /* =====================================================
           ROOT
        ===================================================== */

        .uc-app {

          --navy: var(--primary);
          --navy-dark: #102A46;
          --navy-light: #2D5A89;

          --gold: var(--primary);
          --gold-light: var(--primary-light);

          --cream: var(--surface-alt);
          --cream-dark: var(--surface-strong);

          --white: var(--surface);

          --text: var(--text);
          --text-soft: var(--text-secondary);
          --text-light: var(--text-light);

          --border: var(--border);

          --danger: var(--danger);

          min-height: 100vh;

          background: var(--background);

          color: var(--text);

          font-family:
            'Inter',
            sans-serif;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;

        }


        .uc-app * {
          box-sizing: border-box;
        }


        /* =====================================================
           BODY
        ===================================================== */

        .uc-layout {

          display: flex;

          min-height:
            calc(100vh - 70px);

        }


        .uc-content {

          flex: 1;

          min-width: 0;

          padding:
            36px 42px 80px;

        }


        .uc-container {

          max-width: 920px;

          margin:
            0 auto;

        }


        /* =====================================================
           WELCOME HEADER
        ===================================================== */

        .uc-welcome {

          position: relative;

          overflow: hidden;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 30px;

          padding:
            30px 32px;

          margin-bottom: 24px;

          border-radius: 22px;

          background:
            linear-gradient(
              135deg,
              var(--navy-dark),
              var(--navy)
            );

          color: white;

          box-shadow:
            0 14px 35px
            rgba(23, 54, 93, 0.18);

        }


        .uc-welcome::before {

          content: "";

          position: absolute;

          width: 240px;

          height: 240px;

          right: -80px;

          top: -100px;

          border-radius: 50%;

          background:
            rgba(201, 154, 58, 0.18);

        }


        .uc-welcome::after {

          content: "";

          position: absolute;

          width: 140px;

          height: 140px;

          right: 100px;

          bottom: -100px;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.05);

        }


        .uc-welcome-content {

          position: relative;

          z-index: 1;

        }


        .uc-eyebrow {

          display: block;

          margin-bottom: 8px;

          color:
            #E7C878;

          font-size: 11px;

          font-weight: 800;

          letter-spacing:
            0.16em;

          text-transform:
            uppercase;

        }


        .uc-welcome-title {

          margin: 0;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 29px;

          font-weight: 800;

          letter-spacing:
            -0.03em;

        }


        .uc-welcome-subtitle {

          margin:
            8px 0 0;

          color:
            rgba(255,255,255,0.72);

          font-size: 13px;

        }


        .uc-create-button {

          position: relative;

          z-index: 2;

          flex-shrink: 0;

          border: none;

          border-radius: 13px;

          padding:
            13px 19px;

          background:
            var(--gold);

          color:
            #152A43;

          font-family:
            'Inter',
            sans-serif;

          font-size: 13px;

          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 8px 20px
            rgba(0,0,0,0.15);

          transition:
            all 0.2s ease;

        }


        .uc-create-button:hover {

          transform:
            translateY(-2px);

          background:
            #D9AE50;

          box-shadow:
            0 12px 25px
            rgba(0,0,0,0.2);

        }


        /* =====================================================
           PROFILE CARD
        ===================================================== */

        .uc-profile-card {

          display: flex;

          align-items: center;

          gap: 17px;

          padding:
            18px 20px;

          margin-bottom: 30px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius:
            18px;

          box-shadow:
            0 5px 20px
            rgba(23,36,54,0.05);

          backdrop-filter:
            blur(10px);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .uc-profile-avatar {

          position: relative;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: center;

          width: 55px;

          height: 55px;

          border-radius: 16px;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy-light)
            );

          color:
            #F5E7BF;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 18px;

          font-weight: 800;

          box-shadow:
            0 7px 18px
            rgba(23,54,93,0.18);

        }


        .uc-online-dot {

          position: absolute;

          right: -2px;

          bottom: -2px;

          width: 13px;

          height: 13px;

          border-radius: 50%;

          background: #42B883;

          border:
            3px solid white;

        }


        .uc-profile-name {

          margin: 0 0 4px;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 16px;

          font-weight: 700;

          color:
            var(--navy-dark);

        }


        .uc-profile-meta {

          display: flex;

          align-items: center;

          flex-wrap: wrap;

          gap: 7px;

          margin: 0;

          color:
            var(--text-soft);

          font-size: 12px;

        }


        .uc-meta-dot {

          color:
            #C8CDD4;

        }


        /* =====================================================
           FEED HEADER
        ===================================================== */

        .uc-feed-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 17px;

        }


        .uc-feed-heading {

          margin: 0;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 17px;

          font-weight: 800;

          color:
            var(--navy-dark);

        }


        .uc-feed-count {

          padding:
            5px 10px;

          border-radius: 999px;

          background:
            var(--gold-light);

          color:
            #88651E;

          font-size: 11px;

          font-weight: 800;

        }


        /* =====================================================
           EMPTY
        ===================================================== */

        .uc-empty {

          padding:
            45px 25px;

          text-align: center;

          background: var(--surface);

          border:
            1px dashed var(--border);

          border-radius:
            18px;

          color:
            var(--text-soft);

          font-size: 13px;

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        /* =====================================================
           POST CARD
        ===================================================== */

        .uc-post {

          position: relative;

          padding:
            22px;

          margin-bottom: 18px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius:
            20px;

          box-shadow:
            0 5px 20px
            rgba(23,36,54,0.045);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .uc-post:hover {

          transform:
            translateY(-2px);

          box-shadow:
            0 12px 30px
            rgba(23,36,54,0.08);

        }


        /* =====================================================
           POST HEADER
        ===================================================== */

        .uc-post-header {

          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 17px;

        }


        .uc-post-avatar {

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;

          width: 43px;

          height: 43px;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #E8EDF4,
              #D9E2EE
            );

          color:
            var(--navy);

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 13px;

          font-weight: 800;

        }


        .uc-author {

          margin: 0;

          font-size: 14px;

          font-weight: 800;

          color:
            var(--navy-dark);

        }


        .uc-post-date {

          display: block;

          margin-top: 3px;

          color:
            var(--text-light);

          font-size: 11px;

        }


        .uc-post-menu {

          margin-left: auto;

          color:
            #A1A8B3;

          font-size: 18px;

          cursor: pointer;

        }


        /* =====================================================
           POST CONTENT
        ===================================================== */

        .uc-post-title {

          margin:
            0 0 8px;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 18px;

          line-height: 1.35;

          font-weight: 800;

          color:
            var(--text);

        }


        .uc-post-content {

          margin:
            0;

          color: var(--text-secondary);

          font-size: 13.5px;

          line-height: 1.75;

          white-space:
            pre-wrap;

          transition:
            color 0.25s ease;

        }


        /* =====================================================
           ATTACHMENT
        ===================================================== */

        .uc-media {

          margin-top: 17px;

          overflow: hidden;

          border-radius: 15px;

          background: var(--surface-alt);

          border:
            1px solid var(--border);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .uc-media img,
        .uc-media video {

          display: block;

          width: 100%;

          max-height: 430px;

          object-fit: cover;

        }


        .uc-download {

          display: inline-flex;

          align-items: center;

          gap: 6px;

          margin:
            10px 12px 12px;

          padding:
            7px 10px;

          border-radius: 8px;

          background:
            var(--cream);

          color:
            var(--navy);

          font-size: 11px;

          font-weight: 700;

          text-decoration: none;

        }


        .uc-download:hover {

          background:
            var(--gold-light);

        }


        /* =====================================================
           POST STATS
        ===================================================== */

        .uc-post-stats {

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding:
            13px 2px 10px;

          color:
            var(--text-light);

          font-size: 11px;

        }


        .uc-stats-left {

          display: flex;

          align-items: center;

          gap: 7px;

        }


        .uc-like-circle {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 22px;

          height: 22px;

          border-radius: 50%;

          background:
            #F7E5B7;

          font-size: 11px;

        }


        /* =====================================================
           ACTION BAR
        ===================================================== */

        .uc-actions {

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 8px;

          padding-top: 10px;

          border-top:
            1px solid var(--border);

          transition:
            border-color 0.25s ease;

        }


        .uc-action {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          min-height: 38px;

          border: none;

          border-radius: 11px;

          background:
            transparent;

          color: var(--text-secondary);

          font-family:
            'Inter',
            sans-serif;

          font-size: 12px;

          font-weight: 700;

          cursor: pointer;

          transition:
            all 0.18s ease,
            color 0.25s ease;

        }


        .uc-action:hover {

          background:
            var(--cream);

          color:
            var(--navy);

        }


        .uc-action.liked {

          background:
            #F4E7C3;

          color:
            #85611B;

        }


        .uc-like-status {

          margin:
            9px 0 0;

          text-align: center;

          color:
            var(--text-light);

          font-size: 10px;

        }


        /* =====================================================
           COMMENTS
        ===================================================== */

        .uc-comments {

          margin-top: 17px;

          padding:
            17px;

          border-radius:
            15px;

          background: var(--surface-alt);

          border:
            1px solid var(--border);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .uc-comments-title {

          margin:
            0 0 15px;

          color:
            var(--navy);

          font-size: 11px;

          font-weight: 800;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;

        }


        .uc-comment {

          display: flex;

          gap: 9px;

          margin-bottom: 13px;

        }


        .uc-comment-avatar {

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;

          width: 31px;

          height: 31px;

          border-radius: 10px;

          background:
            #E1E7EE;

          color:
            var(--navy);

          font-size: 10px;

          font-weight: 800;

        }


        .uc-comment-box {

          flex: 1;

          min-width: 0;

        }


        .uc-comment-author {

          margin-bottom: 2px;

          color:
            var(--navy-dark);

          font-size: 11px;

          font-weight: 800;

        }


        .uc-comment-text {

          margin:
            0;

          color: var(--text-secondary);

          font-size: 12px;

          line-height: 1.55;

          transition:
            color 0.25s ease;

        }


        .uc-comment-actions {

          display: flex;

          gap: 12px;

          margin-top: 5px;

        }


        .uc-comment-action {

          padding: 0;

          border: none;

          background: none;

          color: var(--text-light);

          font-size: 10px;

          font-weight: 700;

          cursor: pointer;

          transition:
            color 0.25s ease;

        }


        .uc-comment-action:hover {

          color:
            var(--navy);

        }


        .uc-comment-action.delete:hover {

          color:
            var(--danger);

        }


        /* =====================================================
           EDIT COMMENT
        ===================================================== */

        .uc-edit-row {

          display: flex;

          gap: 7px;

          flex-wrap: wrap;

        }


        .uc-edit-input {

          flex: 1;

          min-width: 150px;

          padding:
            8px 10px;

          border:
            1px solid var(--border);

          border-radius:
            9px;

          outline: none;

          background: var(--surface);

          color: var(--text);

          font-family:
            'Inter',
            sans-serif;

          font-size: 12px;

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            color 0.25s ease;

        }


        .uc-edit-input:focus {

          border-color:
            var(--gold);

          box-shadow:
            0 0 0 3px
            rgba(201,154,58,0.1);

        }


        .uc-small-button {

          padding:
            7px 10px;

          border: none;

          border-radius:
            8px;

          font-size: 10px;

          font-weight: 800;

          cursor: pointer;

        }


        .uc-save {

          background:
            var(--navy);

          color:
            white;

        }


        .uc-cancel {

          background:
            #E9EBEE;

          color:
            #626B77;

        }


        /* =====================================================
           COMMENT COMPOSER
        ===================================================== */

        .uc-compose {

          display: flex;

          align-items: center;

          gap: 8px;

          margin-top: 15px;

        }


        .uc-compose-input {

          flex: 1;

          min-width: 0;

          height: 38px;

          padding:
            0 14px;

          border:
            1px solid var(--border);

          border-radius:
            12px;

          background: var(--surface);

          color: var(--text);

          outline: none;

          font-family:
            'Inter',
            sans-serif;

          font-size: 12px;

          transition:
            border 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.25s ease,
            color 0.25s ease;

        }


        .uc-compose-input:focus {

          border-color:
            var(--gold);

          box-shadow:
            0 0 0 3px
            rgba(201,154,58,0.09);

        }


        .uc-comment-button {

          height: 38px;

          padding:
            0 14px;

          border: none;

          border-radius:
            11px;

          background:
            var(--navy);

          color:
            white;

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;

          transition:
            all 0.2s ease;

        }


        .uc-comment-button:hover {

          background:
            var(--navy-dark);

          transform:
            translateY(-1px);

        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 900px) {

          .uc-content {

            padding:
              28px 24px 60px;

          }

        }


        @media (max-width: 700px) {

          .uc-layout {

            display: block;

          }


          .uc-content {

            padding:
              20px 14px 50px;

          }


          .uc-welcome {

            flex-direction: column;

            align-items: flex-start;

            padding:
              24px;

          }


          .uc-welcome-title {

            font-size: 24px;

          }


          .uc-create-button {

            width: 100%;

          }


          .uc-profile-card {

            padding:
              15px;

          }


          .uc-profile-meta {

            display: block;

            line-height: 1.7;

          }


          .uc-meta-dot {

            display: none;

          }


          .uc-post {

            padding:
              17px;

            border-radius:
              17px;

          }


          .uc-post-title {

            font-size: 16px;

          }


          .uc-actions {

            gap: 5px;

          }

        }


        @media (max-width: 450px) {

          .uc-welcome {

            border-radius:
              17px;

          }


          .uc-welcome-title {

            font-size: 21px;

          }


          .uc-post {

            padding:
              14px;

          }


          .uc-compose {

            align-items:
              stretch;

          }


          .uc-comment-button {

            padding:
              0 11px;

          }

        }

      `}</style>


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />


      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <div className="uc-layout">


        {/* SIDEBAR */}

        <Sidebar />


        {/* CONTENT */}

        <main className="uc-content">

          <div className="uc-container">


            {/* =================================================
                WELCOME
            ================================================= */}

            <section className="uc-welcome">

              <div className="uc-welcome-content">

                <span className="uc-eyebrow">
                  UniConnect Campus Feed
                </span>

                <h1 className="uc-welcome-title">

                  Welcome back
                  {user?.name
                    ? `, ${user.name.split(" ")[0]}`
                    : ""} 👋

                </h1>

                <p className="uc-welcome-subtitle">

                  Connect, share knowledge and stay
                  connected with your university community.

                </p>

              </div>


              <button
                className="uc-create-button"
                onClick={() =>
                  navigate("/create-post")
                }
              >

                ✨ Create Post

              </button>

            </section>


            {/* =================================================
                USER CARD
            ================================================= */}

            {user ? (

              <section className="uc-profile-card">

                <div className="uc-profile-avatar">

                  {getInitials(user.name)}

                  <span className="uc-online-dot" />

                </div>


                <div>

                  <h2 className="uc-profile-name">

                    {user.name}

                  </h2>


                  <p className="uc-profile-meta">

                    <span>
                      {user.faculty || "Student"}
                    </span>

                    <span className="uc-meta-dot">
                      •
                    </span>

                    <span>
                      {user.university ||
                        "University"}
                    </span>

                    <span className="uc-meta-dot">
                      •
                    </span>

                    <span>
                      Batch {user.batch}
                    </span>

                  </p>

                </div>

              </section>

            ) : (

              <div className="uc-profile-card">

                Loading profile...

              </div>

            )}


            {/* =================================================
                FEED HEADER
            ================================================= */}

            <div className="uc-feed-header">

              <h2 className="uc-feed-heading">
                Latest Posts
              </h2>

              <span className="uc-feed-count">
                {posts.length} Posts
              </span>

            </div>


            {/* =================================================
                POSTS
            ================================================= */}

            {posts.length === 0 ? (

              <div className="uc-empty">

                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "10px"
                  }}
                >
                  📝
                </div>

                No posts available yet.

              </div>

            ) : (

              posts.map((post) => (

                <article
                  className="uc-post"
                  key={post.id}
                >


                  {/* POST HEADER */}

                  <div className="uc-post-header">

                    <div className="uc-post-avatar">

                      {getInitials(
                        post.userName
                      )}

                    </div>


                    <div>

                      <h3 className="uc-author">

                        {post.userName}

                      </h3>

                      <small className="uc-post-date">

                        {new Date(
                          post.createdAt
                        ).toLocaleString()}

                      </small>

                    </div>


                    <div className="uc-post-menu">
                      •••
                    </div>

                  </div>


                  {/* POST TITLE */}

                  <h3 className="uc-post-title">

                    {post.title}

                  </h3>


                  {/* POST CONTENT */}

                  <p className="uc-post-content">

                    {post.content}

                  </p>


                  {/* =================================================
                      ATTACHMENT
                  ================================================= */}

                  {post.attachmentUrl && (

                    <div className="uc-media">

                      {post.attachmentType
                        ?.startsWith("image/") && (

                        <img
                          src={getAttachmentUrl(
                            post.attachmentUrl
                          )}
                          alt={
                            post.attachmentName ||
                            "Post attachment"
                          }
                        />

                      )}


                      {post.attachmentType
                        ?.startsWith("video/") && (

                        <video controls>

                          <source
                            src={getAttachmentUrl(
                              post.attachmentUrl
                            )}
                            type={
                              post.attachmentType
                            }
                          />

                        </video>

                      )}


                      <a
                        className="uc-download"
                        href={getAttachmentUrl(
                          post.attachmentUrl
                        )}
                        download={
                          post.attachmentName
                        }
                        target="_blank"
                        rel="noreferrer"
                      >

                        ⬇ Download{" "}
                        {post.attachmentName ||
                          "attachment"}

                      </a>

                    </div>

                  )}


                  {/* =================================================
                      POST STATS
                  ================================================= */}

                  <div className="uc-post-stats">

                    <div className="uc-stats-left">

                      <span className="uc-like-circle">
                        ❤️
                      </span>

                      <span>
                        {post.likeCount || 0}
                        {" "}
                        Likes
                      </span>

                    </div>


                    <span>

                      {post.commentCount || 0}
                      {" "}
                      Comments

                    </span>

                  </div>


                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="uc-actions">

                    <button
                      className={
                        "uc-action" +
                        (
                          post.likedByCurrentUser
                            ? " liked"
                            : ""
                        )
                      }
                      onClick={() =>
                        handleLike(
                          post.id,
                          post.likedByCurrentUser
                        )
                      }
                    >

                      {post.likedByCurrentUser
                        ? "❤️ Liked"
                        : "🤍 Like"}

                    </button>


                    <button
                      className="uc-action"
                      onClick={() =>
                        handleGetComments(
                          post.id
                        )
                      }
                    >

                      💬{" "}

                      {openComments[post.id]
                        ? "Hide Comments"
                        : "Comments"}

                    </button>

                  </div>


                  {/* =================================================
                      LIKE STATUS
                  ================================================= */}

                  {post.likedByCurrentUser && (

                    <p className="uc-like-status">

                      ❤️ You liked this post

                    </p>

                  )}


                  {/* =================================================
                      COMMENTS
                  ================================================= */}

                  {openComments[post.id] && (

                    <div className="uc-comments">

                      <h4 className="uc-comments-title">

                        Comments

                      </h4>


                      {/* EXISTING COMMENTS */}

                      {(comments[post.id] || [])
                        .length === 0 ? (

                        <p
                          style={{
                            color: "#929BA8",
                            fontSize: "12px",
                            margin: "0 0 12px"
                          }}
                        >
                          No comments yet. Be the
                          first to comment.
                        </p>

                      ) : (

                        comments[post.id].map(
                          (comment) => (

                            <div
                              className="uc-comment"
                              key={comment.id}
                            >


                              <div className="uc-comment-avatar">

                                {getInitials(
                                  comment.userName
                                )}

                              </div>


                              <div className="uc-comment-box">


                                <div className="uc-comment-author">

                                  {comment.userName}

                                </div>


                                {/* EDIT */}

                                {editingComment ===
                                comment.id ? (

                                  <div className="uc-edit-row">

                                    <input
                                      className="uc-edit-input"
                                      type="text"
                                      value={
                                        editCommentText
                                      }
                                      onChange={(e) =>
                                        setEditCommentText(
                                          e.target.value
                                        )
                                      }
                                    />


                                    <button
                                      className={
                                        "uc-small-button uc-save"
                                      }
                                      onClick={() =>
                                        handleUpdateComment(
                                          comment.id,
                                          post.id
                                        )
                                      }
                                    >
                                      Save
                                    </button>


                                    <button
                                      className={
                                        "uc-small-button uc-cancel"
                                      }
                                      onClick={
                                        handleCancelEdit
                                      }
                                    >
                                      Cancel
                                    </button>

                                  </div>

                                ) : (

                                  <>

                                    <p className="uc-comment-text">

                                      {comment.content}

                                    </p>


                                    {/* OWNER ACTIONS */}

                                    {user &&
                                      Number(
                                        comment.userId
                                      ) ===
                                      Number(user.id) && (

                                      <div className="uc-comment-actions">

                                        <button
                                          className="uc-comment-action"
                                          onClick={() =>
                                            handleStartEdit(
                                              comment
                                            )
                                          }
                                        >
                                          ✏ Edit
                                        </button>


                                        <button
                                          className={
                                            "uc-comment-action delete"
                                          }
                                          onClick={() =>
                                            handleDeleteComment(
                                              comment.id,
                                              post.id
                                            )
                                          }
                                        >
                                          🗑 Delete
                                        </button>

                                      </div>

                                    )}

                                  </>

                                )}

                              </div>

                            </div>

                          )
                        )

                      )}


                      {/* =================================================
                          COMMENT COMPOSER
                      ================================================= */}

                      <div className="uc-compose">

                        <input
                          className="uc-compose-input"
                          type="text"
                          placeholder="Write a comment..."
                          value={
                            commentText[post.id] || ""
                          }
                          onChange={(e) =>
                            handleCommentTextChange(
                              post.id,
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => {

                            if (
                              e.key === "Enter"
                            ) {

                              handleCreateComment(
                                post.id
                              );

                            }

                          }}
                        />


                        <button
                          className="uc-comment-button"
                          onClick={() =>
                            handleCreateComment(
                              post.id
                            )
                          }
                        >

                          Send

                        </button>

                      </div>

                    </div>

                  )}

                </article>

              ))

            )}

          </div>

        </main>

      </div>

    </div>

  );

}


export default Dashboard;