
import { useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { createPostWithAttachment } from "../services/postService";


function CreatePost() {

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");


    if (!title.trim()) {

      setMessage("Please enter a title.");

      return;

    }


    if (!content.trim()) {

      setMessage("Please enter some content.");

      return;

    }


    try {

      setLoading(true);


      const postData = {

        title: title.trim(),

        content: content.trim()

      };


      const createdPost =
        await createPostWithAttachment(
          postData,
          file
        );


      console.log(
        "Created post:",
        createdPost
      );


      setTitle("");
      setContent("");
      setFile(null);

      setMessage(
        "Post created successfully! 🎉"
      );


    } catch (error) {

      console.error(
        "Failed to create post:",
        error
      );


      setMessage(
        error.response?.data?.message ||
        "Failed to create post."
      );


    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="uc-create-page">

      <style>{`

        /* =====================================================
           ROOT
        ===================================================== */

        .uc-create-page {

          min-height: 100vh;

          background: var(--background);

          color: var(--text);

          font-family:
            Inter,
            Arial,
            sans-serif;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;

        }


        .uc-create-page * {
          box-sizing: border-box;
        }


        /* =====================================================
           LAYOUT
        ===================================================== */

        .uc-create-layout {

          display: flex;

          min-height:
            calc(100vh - 70px);

        }


        .uc-create-main {

          flex: 1;

          min-width: 0;

          padding:
            38px 42px 80px;

        }


        .uc-create-container {

          width: 100%;

          max-width: 850px;

          margin: 0 auto;

        }


        /* =====================================================
           PAGE HEADER
        ===================================================== */

        .uc-create-header {

          margin-bottom: 25px;

        }


        .uc-create-eyebrow {

          display: block;

          margin-bottom: 7px;

          color: var(--gold);

          font-size: 11px;

          font-weight: 800;

          letter-spacing:
            0.16em;

          text-transform:
            uppercase;

        }


        .uc-create-title {

          margin: 0;

          color: var(--navy-dark);

          font-family:
            "Plus Jakarta Sans",
            Inter,
            sans-serif;

          font-size: 30px;

          font-weight: 800;

          letter-spacing:
            -0.035em;

        }


        .uc-create-subtitle {

          margin:
            8px 0 0;

          color:
            var(--text-soft);

          font-size: 13px;

          line-height: 1.6;

        }


        /* =====================================================
           MAIN CARD
        ===================================================== */

        .uc-create-card {

          overflow: hidden;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius:
            23px;

          box-shadow: var(--shadow);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

        }


        /* =====================================================
           CARD TOP
        ===================================================== */

        .uc-create-card-top {

          display: flex;

          align-items: center;

          gap: 15px;

          padding:
            21px 25px;

          border-bottom:
            1px solid var(--border);

          transition:
            border-color 0.25s ease;

        }


        .uc-create-avatar {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 46px;

          height: 46px;

          flex-shrink: 0;

          border-radius:
            14px;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy-light)
            );

          color:
            #F5E7BF;

          font-size: 18px;

          font-weight: 800;

          box-shadow:
            0 7px 18px
            rgba(23,54,93,0.18);

        }


        .uc-create-user-title {

          margin: 0 0 3px;

          color: var(--text);

          font-size: 14px;

          font-weight: 800;

          transition: color 0.25s ease;

        }


        .uc-create-user-subtitle {

          margin: 0;

          color: var(--text-light);

          font-size: 11px;

          transition: color 0.25s ease;

        }


        /* =====================================================
           FORM
        ===================================================== */

        .uc-create-form {

          padding:
            28px 25px 25px;

        }


        .uc-field {

          margin-bottom:
            23px;

        }


        .uc-label {

          display: block;

          margin-bottom: 9px;

          color:
            var(--navy-dark);

          font-size: 12px;

          font-weight: 800;

        }


        .uc-required {

          color:
            var(--danger, #D64545);

        }


        /* =====================================================
           INPUTS
        ===================================================== */

        .uc-input,
        .uc-textarea {

          width: 100%;

          border:
            1px solid var(--border);

          outline: none;

          background: var(--surface);

          color:
            var(--text);

          font-family:
            Inter,
            Arial,
            sans-serif;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease,
            color 0.2s ease;

        }


        .uc-input {

          height: 49px;

          padding:
            0 15px;

          border-radius:
            12px;

          font-size:
            13px;

        }


        .uc-textarea {

          min-height:
            180px;

          padding:
            14px 15px;

          border-radius:
            14px;

          resize:
            vertical;

          font-size:
            13px;

          line-height:
            1.7;

        }


        .uc-input::placeholder,
        .uc-textarea::placeholder {

          color: var(--text-light);

        }


        .uc-input:focus,
        .uc-textarea:focus {

          background: var(--surface);

          border-color:
            var(--primary);

          box-shadow:
            0 0 0 4px
            rgba(108, 77, 246, 0.12);

        }


        /* =====================================================
           ATTACHMENT
        ===================================================== */

        .uc-attachment {

          position: relative;

          padding:
            18px;

          border:
            1px dashed var(--border);

          border-radius:
            15px;

          background: var(--surface-alt);

          transition:
            all 0.2s ease;

        }


        .uc-attachment:hover {

          border-color:
            var(--primary);

          background: var(--surface-strong);

        }


        .uc-file-row {

          display: flex;

          align-items: center;

          gap: 13px;

        }


        .uc-file-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 43px;

          height: 43px;

          flex-shrink: 0;

          border-radius:
            12px;

          background:
            var(--gold-light);

          font-size:
            19px;

        }


        .uc-file-info {

          flex: 1;

          min-width: 0;

        }


        .uc-file-title {

          margin: 0 0 3px;

          color:
            var(--navy-dark);

          font-size:
            12px;

          font-weight:
            800;

        }


        .uc-file-help {

          margin: 0;

          color:
            var(--text-light);

          font-size:
            10px;

        }


        .uc-file-input {

          position: absolute;

          inset: 0;

          width: 100%;

          height: 100%;

          opacity: 0;

          cursor: pointer;

        }


        /* =====================================================
           SELECTED FILE
        ===================================================== */

        .uc-selected-file {

          display: flex;

          align-items: center;

          gap: 10px;

          margin-top:
            12px;

          padding:
            10px 12px;

          border-radius:
            10px;

          background: var(--surface-alt);

          color: var(--text-secondary);

          font-size:
            11px;

          font-weight:
            600;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;

        }


        .uc-selected-file-name {

          overflow: hidden;

          flex: 1;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

        }


        /* =====================================================
           MESSAGE
        ===================================================== */

        .uc-message {

          display: flex;

          align-items: center;

          gap: 9px;

          margin-bottom:
            18px;

          padding:
            12px 14px;

          border-radius:
            11px;

          font-size:
            12px;

          font-weight:
            700;

        }


        .uc-message.success {

          background:
            #EAF7F0;

          border:
            1px solid #CBEBD9;

          color:
            #24764A;

        }


        .uc-message.error {

          background:
            #FFF0F0;

          border:
            1px solid #F3CCCC;

          color:
            #B53A3A;

        }


        /* =====================================================
           BOTTOM BAR
        ===================================================== */

        .uc-form-footer {

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;

          margin-top:
            8px;

          padding-top:
            20px;

          border-top:
            1px solid var(--border);

          transition:
            border-color 0.25s ease;

        }


        .uc-footer-hint {

          color:
            var(--text-light);

          font-size:
            10px;

          line-height:
            1.5;

        }


        .uc-publish-button {

          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          min-width:
            150px;

          height:
            45px;

          padding:
            0 18px;

          border: none;

          border-radius:
            12px;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy-light)
            );

          color:
            white;

          font-family:
            Inter,
            Arial,
            sans-serif;

          font-size:
            12px;

          font-weight:
            800;

          cursor:
            pointer;

          box-shadow:
            0 8px 18px
            rgba(23,54,93,0.18);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;

        }


        .uc-publish-button:hover:not(:disabled) {

          transform:
            translateY(-2px);

          box-shadow:
            0 12px 24px
            rgba(23,54,93,0.23);

        }


        .uc-publish-button:disabled {

          opacity:
            0.65;

          cursor:
            not-allowed;

        }


        /* =====================================================
           TIPS CARD
        ===================================================== */

        .uc-tips {

          display: flex;

          align-items: flex-start;

          gap: 12px;

          margin-top:
            18px;

          padding:
            16px 18px;

          border:
            1px solid var(--border);

          border-radius:
            15px;

          background: var(--surface-alt);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;

        }


        .uc-tip-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 30px;

          height: 30px;

          flex-shrink: 0;

          border-radius:
            9px;

          background:
            var(--gold-light);

          font-size:
            14px;

        }


        .uc-tip-title {

          margin:
            0 0 3px;

          color:
            var(--navy-dark);

          font-size:
            11px;

          font-weight:
            800;

        }


        .uc-tip-text {

          margin: 0;

          color:
            var(--text-soft);

          font-size:
            10px;

          line-height:
            1.6;

        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 900px) {

          .uc-create-main {

            padding:
              28px 24px 60px;

          }

        }


        @media (max-width: 700px) {

          .uc-create-layout {

            display:
              block;

          }


          .uc-create-main {

            padding:
              22px 14px 50px;

          }


          .uc-create-title {

            font-size:
              25px;

          }


          .uc-create-card {

            border-radius:
              18px;

          }


          .uc-create-card-top {

            padding:
              17px;

          }


          .uc-create-form {

            padding:
              22px 17px;

          }


          .uc-form-footer {

            flex-direction:
              column;

            align-items:
              stretch;

          }


          .uc-footer-hint {

            text-align:
              center;

          }


          .uc-publish-button {

            width:
              100%;

          }

        }


        @media (max-width: 450px) {

          .uc-create-title {

            font-size:
              22px;

          }


          .uc-create-subtitle {

            font-size:
              12px;

          }


          .uc-create-card-top {

            gap:
              11px;

          }


          .uc-create-avatar {

            width:
              42px;

            height:
              42px;

            border-radius:
              12px;

          }


          .uc-input {

            height:
              46px;

          }


          .uc-textarea {

            min-height:
              150px;

          }

        }

      `}</style>


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />


      {/* =====================================================
          LAYOUT
      ===================================================== */}

      <div className="uc-create-layout">


        {/* SIDEBAR */}

        <Sidebar />


        {/* MAIN */}

        <main className="uc-create-main">

          <div className="uc-create-container">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="uc-create-header">

              <span className="uc-create-eyebrow">
                UniConnect Community
              </span>

              <h1 className="uc-create-title">
                Create a Post
              </h1>

              <p className="uc-create-subtitle">
                Share your thoughts, notes, knowledge,
                resources and ideas with the university
                community.
              </p>

            </header>


            {/* =================================================
                CARD
            ================================================= */}

            <section className="uc-create-card">


              {/* USER HEADER */}

              <div className="uc-create-card-top">

                <div className="uc-create-avatar">
                  ✨
                </div>

                <div>

                  <h2 className="uc-create-user-title">
                    Share with UniConnect
                  </h2>

                  <p className="uc-create-user-subtitle">
                    Your post will be visible to the
                    university community.
                  </p>

                </div>

              </div>


              {/* FORM */}

              <form
                className="uc-create-form"
                onSubmit={handleSubmit}
              >


                {/* TITLE */}

                <div className="uc-field">

                  <label
                    className="uc-label"
                    htmlFor="post-title"
                  >
                    Post Title
                    <span className="uc-required">
                      {" "}*
                    </span>
                  </label>


                  <input
                    id="post-title"
                    className="uc-input"
                    type="text"
                    value={title}
                    placeholder="Give your post a clear title..."
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                  />

                </div>


                {/* CONTENT */}

                <div className="uc-field">

                  <label
                    className="uc-label"
                    htmlFor="post-content"
                  >
                    Content
                    <span className="uc-required">
                      {" "}*
                    </span>
                  </label>


                  <textarea
                    id="post-content"
                    className="uc-textarea"
                    value={content}
                    placeholder="What's on your mind? Share notes, ideas, questions or useful knowledge..."
                    rows="6"
                    onChange={(e) =>
                      setContent(e.target.value)
                    }
                  />

                </div>


                {/* ATTACHMENT */}

                <div className="uc-field">

                  <label className="uc-label">
                    Attachment
                  </label>


                  <div className="uc-attachment">

                    <div className="uc-file-row">

                      <div className="uc-file-icon">
                        📎
                      </div>


                      <div className="uc-file-info">

                        <p className="uc-file-title">
                          Add an attachment
                        </p>

                        <p className="uc-file-help">
                          Images, videos or PDF files
                        </p>

                      </div>

                    </div>


                    <input
                      id="post-file"
                      className="uc-file-input"
                      type="file"
                      accept="image/*,video/*,application/pdf"
                      onChange={(e) =>
                        setFile(
                          e.target.files?.[0] || null
                        )
                      }
                    />


                    {file && (

                      <div className="uc-selected-file">

                        <span>
                          📄
                        </span>

                        <span className="uc-selected-file-name">
                          {file.name}
                        </span>

                      </div>

                    )}

                  </div>

                </div>


                {/* MESSAGE */}

                {message && (

                  <div
                    className={
                      "uc-message " +
                      (
                        message.includes(
                          "successfully"
                        )
                          ? "success"
                          : "error"
                      )
                    }
                  >

                    <span>
                      {message.includes(
                        "successfully"
                      )
                        ? "✓"
                        : "!"}
                    </span>

                    <span>
                      {message}
                    </span>

                  </div>

                )}


                {/* FOOTER */}

                <div className="uc-form-footer">

                  <span className="uc-footer-hint">
                    * Required fields
                  </span>


                  <button
                    className="uc-publish-button"
                    type="submit"
                    disabled={loading}
                  >

                    {loading ? (
                      <>
                        <span>⏳</span>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        Create Post
                      </>
                    )}

                  </button>

                </div>


              </form>

            </section>


            {/* =================================================
                TIP
            ================================================= */}

            <div className="uc-tips">

              <div className="uc-tip-icon">
                💡
              </div>


              <div>

                <p className="uc-tip-title">
                  Share something valuable
                </p>

                <p className="uc-tip-text">
                  Help your fellow students by sharing
                  useful notes, resources, questions,
                  experiences or academic knowledge.
                </p>

              </div>

            </div>


          </div>

        </main>

      </div>

    </div>

  );

}


export default CreatePost;

