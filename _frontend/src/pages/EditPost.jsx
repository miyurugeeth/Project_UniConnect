import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getPostById,
  updatePostWithAttachment
} from "../services/postService";


function EditPost() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");


  // ----------------------------------------
  // LOAD POST
  // ----------------------------------------

  useEffect(() => {

    const loadPost = async () => {

      try {

        setLoading(true);

        const post = await getPostById(id);

        console.log("Post:", post);

        setTitle(post.title);
        setContent(post.content);

      } catch (error) {

        console.error(
          "Failed to load post:",
          error
        );

        setError(
          "Failed to load post."
        );

      } finally {

        setLoading(false);

      }

    };

    loadPost();

  }, [id]);


  // ----------------------------------------
  // UPDATE POST
  // ----------------------------------------

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    if (!title.trim() || !content.trim()) {

      setError(
        "Title and content are required."
      );

      return;
    }


    try {

      setSaving(true);

      await updatePostWithAttachment(id, {
        title: title,
        content: content
      }, file);

      alert("Post updated successfully!");

      navigate("/my-posts");

    } catch (error) {

      console.error(
        "Failed to update post:",
        error
      );

      if (error.response?.status === 403) {

        setError(
          "You are not allowed to edit this post."
        );

      } else {

        setError(
          "Failed to update post."
        );

      }

    } finally {

      setSaving(false);

    }

  };


  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {

    return (

      <div>

        <Navbar />

        <Sidebar />

        <main>

          <p>
            Loading post...
          </p>

        </main>

      </div>

    );

  }


  return (

    <div>

      <Navbar />

      <div>

        <Sidebar />

        <main>

          <h1>
            ✏️ Edit Post
          </h1>


          {error && (

            <p>
              {error}
            </p>

          )}


          <form onSubmit={handleSubmit}>

            {/* TITLE */}

            <div>

              <label>
                Title
              </label>

              <br />

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Post title"
              />

            </div>


            <br />

            <div>
              <label htmlFor="edit-post-file">Replace attachment (optional)</label>
              <input
                id="edit-post-file"
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <br />


            {/* CONTENT */}

            <div>

              <label>
                Content
              </label>

              <br />

              <textarea
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                placeholder="Write your post..."
                rows="8"
              />

            </div>


            <br />


            {/* SAVE */}

            <button
              type="submit"
              disabled={saving}
            >

              {saving
                ? "Saving..."
                : "💾 Save Changes"}

            </button>


            {" "}


            {/* CANCEL */}

            <button
              type="button"
              onClick={() =>
                navigate("/my-posts")
              }
            >
              ❌ Cancel
            </button>

          </form>

        </main>

      </div>

    </div>

  );

}


export default EditPost;