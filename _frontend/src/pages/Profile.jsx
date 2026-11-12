
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getCurrentUser,
  updateUser
} from "../services/userService";


function Profile() {

  const [user, setUser] = useState(null);

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    university: "",
    faculty: "",
    batch: ""
  });

  const [loading, setLoading] = useState(true);


  // ----------------------------------------
  // LOAD CURRENT USER
  // ----------------------------------------

  const loadUser = async () => {

    try {

      setLoading(true);

      const data = await getCurrentUser();

      console.log("Profile user:", data);

      setUser(data);

      setFormData({
        name: data.name || "",
        university: data.university || "",
        faculty: data.faculty || "",
        batch: data.batch || ""
      });

    } catch (error) {

      console.error(
        "Failed to load profile:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    const load = async () => {
      await loadUser();
    };

    load();

  }, []);


  // ----------------------------------------
  // HANDLE INPUT CHANGE
  // ----------------------------------------

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };


  // ----------------------------------------
  // EDIT PROFILE
  // ----------------------------------------

  const handleEdit = () => {

    setEditing(true);

  };


  // ----------------------------------------
  // CANCEL EDIT
  // ----------------------------------------

  const handleCancel = () => {

    setEditing(false);

    setFormData({
      name: user.name || "",
      university: user.university || "",
      faculty: user.faculty || "",
      batch: user.batch || ""
    });

  };


  // ----------------------------------------
  // UPDATE PROFILE
  // ----------------------------------------

  const handleUpdate = async (e) => {

    e.preventDefault();

    try {

      const updatedUser =
        await updateUser(
          user.id,
          formData
        );

      console.log(
        "Updated user:",
        updatedUser
      );

      setUser(updatedUser);

      setFormData({
        name: updatedUser.name || "",
        university: updatedUser.university || "",
        faculty: updatedUser.faculty || "",
        batch: updatedUser.batch || ""
      });

      setEditing(false);

      alert("Profile updated successfully!");

    } catch (error) {

      console.error(
        "Failed to update profile:",
        error
      );

      alert("Failed to update profile.");

    }

  };


  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {

    return (

      <div className="profile-page">

        <style>{`

          .profile-page {

            min-height: 100vh;

            background:
              linear-gradient(
                180deg,
                #f8f7f3 0%,
                #f3f1eb 100%
              );

            font-family: Arial, sans-serif;

          }

          .profile-loading-layout {

            display: flex;

            min-height:
              calc(100vh - 70px);

          }

          .profile-loading-main {

            flex: 1;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 40px;

          }

          .profile-loading-card {

            padding: 35px 55px;

            background: var(--surface);

            border: 1px solid var(--border);

            border-radius: 18px;

            color: var(--text-secondary);

            font-size: 13px;

            box-shadow: var(--shadow);

            transition:
              background-color 0.25s ease,
              border-color 0.25s ease,
              color 0.25s ease;

          }

        `}</style>


        <Navbar />


        <div className="profile-loading-layout">

          <Sidebar />

          <main className="profile-loading-main">

            <div className="profile-loading-card">

              ⏳ Loading profile...

            </div>

          </main>

        </div>

      </div>

    );

  }


  return (

    <div className="profile-page">

      <style>{`

        * {
          box-sizing: border-box;
        }


        .profile-page {

          min-height: 100vh;

          background: var(--background);

          color: var(--text);

          font-family: Arial, sans-serif;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;

        }


        .profile-layout {

          display: flex;

          min-height:
            calc(100vh - 70px);

        }


        .profile-main {

          flex: 1;

          min-width: 0;

          padding:
            40px 42px 80px;

        }


        .profile-container {

          max-width: 850px;

          margin: 0 auto;

        }


        /* ============================================
           PAGE HEADER
        ============================================ */

        .profile-header {

          margin-bottom: 25px;

        }


        .profile-label {

          margin-bottom: 8px;

          color: #c99a3a;

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 2px;

          text-transform: uppercase;

        }


        .profile-title {

          margin: 0;

          color: #102a46;

          font-size: 30px;

          font-weight: 800;

          letter-spacing: -0.5px;

        }


        .profile-subtitle {

          margin:
            8px 0 0;

          color: #687386;

          font-size: 13px;

        }


        /* ============================================
           PROFILE CARD
        ============================================ */

        .profile-card {

          overflow: hidden;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius:
            22px;

          box-shadow: var(--shadow);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

        }


        /* ============================================
           PROFILE COVER
        ============================================ */

        .profile-cover {

          position: relative;

          height: 145px;

          overflow: hidden;

          background:
            linear-gradient(
              135deg,
              #102a46,
              #17365d,
              #2d5a89
            );

        }


        .profile-cover::before {

          content: "";

          position: absolute;

          width: 260px;

          height: 260px;

          right: -80px;

          top: -140px;

          border-radius: 50%;

          background:
            rgba(201,154,58,0.2);

        }


        .profile-cover::after {

          content: "";

          position: absolute;

          width: 180px;

          height: 180px;

          left: 35%;

          bottom: -145px;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.06);

        }


        .cover-text {

          position: absolute;

          left: 28px;

          top: 25px;

          color:
            rgba(255,255,255,0.65);

          font-size:
            10px;

          font-weight:
            700;

          letter-spacing:
            1.5px;

          text-transform:
            uppercase;

        }


        /* ============================================
           PROFILE TOP
        ============================================ */

        .profile-info {

          position: relative;

          padding:
            0 28px 25px;

        }


        .profile-avatar {

          position: relative;

          display: flex;

          align-items: center;

          justify-content: center;

          width: 88px;

          height: 88px;

          margin-top: -44px;

          margin-bottom: 15px;

          border:
            5px solid white;

          border-radius:
            24px;

          background:
            linear-gradient(
              135deg,
              #17365d,
              #2d5a89
            );

          color:
            #f4e7c3;

          font-size:
            27px;

          font-weight:
            800;

          box-shadow:
            0 8px 22px
            rgba(23,54,93,0.2);

        }


        .online-dot {

          position: absolute;

          right: -2px;

          bottom: -2px;

          width: 17px;

          height: 17px;

          border:
            3px solid white;

          border-radius: 50%;

          background:
            #42b883;

        }


        .profile-name {

          margin:
            0 0 5px;

          color:
            #102a46;

          font-size:
            21px;

          font-weight:
            800;

        }


        .profile-role {

          margin:
            0;

          color:
            #929ba8;

          font-size:
            11px;

        }


        /* ============================================
           PROFILE DETAILS
        ============================================ */

        .profile-details {

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            13px;

          margin-top:
            25px;

        }


        .detail-box {

          padding:
            17px;

          border:
            1px solid #e8eaed;

          border-radius:
            14px;

          background:
            #fafaf9;

          transition:
            all 0.2s ease;

        }


        .detail-box:hover {

          border-color:
            #ded9c9;

          background:
            #fcfbf7;

          transform:
            translateY(-1px);

        }


        .detail-label {

          display:
            block;

          margin-bottom:
            7px;

          color:
            #929ba8;

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            0.8px;

          text-transform:
            uppercase;

        }


        .detail-value {

          display:
            block;

          overflow:
            hidden;

          color:
            #17365d;

          font-size:
            13px;

          font-weight:
            700;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

        }


        /* ============================================
           ACTION
        ============================================ */

        .profile-action-row {

          display:
            flex;

          justify-content:
            flex-end;

          margin-top:
            22px;

          padding-top:
            20px;

          border-top:
            1px solid #eef0f2;

        }


        .edit-profile-button {

          height:
            42px;

          padding:
            0 18px;

          border:
            none;

          border-radius:
            11px;

          background:
            linear-gradient(
              135deg,
              #17365d,
              #2d5a89
            );

          color:
            white;

          font-size:
            11px;

          font-weight:
            800;

          cursor:
            pointer;

          box-shadow:
            0 7px 17px
            rgba(23,54,93,0.16);

          transition:
            all 0.2s ease;

        }


        .edit-profile-button:hover {

          transform:
            translateY(-2px);

          box-shadow:
            0 11px 23px
            rgba(23,54,93,0.22);

        }


        /* ============================================
           EDIT CARD
        ============================================ */

        .edit-card {

          padding:
            28px;

          background:
            rgba(255,255,255,0.97);

          border:
            1px solid #e5e7eb;

          border-radius:
            20px;

          box-shadow:
            0 10px 30px
            rgba(23,36,54,0.07);

        }


        .edit-card-header {

          display:
            flex;

          align-items:
            center;

          gap:
            13px;

          margin-bottom:
            25px;

          padding-bottom:
            20px;

          border-bottom:
            1px solid #eef0f2;

        }


        .edit-icon {

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            45px;

          height:
            45px;

          border-radius:
            13px;

          background:
            #f4e7c3;

          font-size:
            19px;

        }


        .edit-card-header h2 {

          margin:
            0 0 4px;

          color:
            #102a46;

          font-size:
            16px;

          font-weight:
            800;

        }


        .edit-card-header p {

          margin:
            0;

          color:
            #929ba8;

          font-size:
            10px;

        }


        /* ============================================
           FORM
        ============================================ */

        .profile-form {

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            20px 17px;

        }


        .form-field {

          min-width:
            0;

        }


        .form-field.full {

          grid-column:
            1 / -1;

        }


        .form-label {

          display:
            block;

          margin-bottom:
            8px;

          color:
            #102a46;

          font-size:
            11px;

          font-weight:
            800;

        }


        .profile-input {

          width:
            100%;

          height:
            46px;

          padding:
            0 13px;

          border:
            1px solid #dfe2e6;

          border-radius:
            11px;

          outline:
            none;

          background:
            #fafaf9;

          color:
            #17202a;

          font-family:
            Arial, sans-serif;

          font-size:
            12px;

          transition:
            all 0.2s ease;

        }


        .profile-input:focus {

          background:
            white;

          border-color:
            #c99a3a;

          box-shadow:
            0 0 0 4px
            rgba(201,154,58,0.1);

        }


        /* ============================================
           FORM ACTIONS
        ============================================ */

        .form-actions {

          display:
            flex;

          justify-content:
            flex-end;

          gap:
            9px;

          grid-column:
            1 / -1;

          margin-top:
            5px;

          padding-top:
            22px;

          border-top:
            1px solid #eef0f2;

        }


        .save-button,
        .cancel-button {

          height:
            41px;

          padding:
            0 17px;

          border:
            none;

          border-radius:
            10px;

          font-size:
            11px;

          font-weight:
            800;

          cursor:
            pointer;

          transition:
            all 0.2s ease;

        }


        .save-button {

          background:
            #17365d;

          color:
            white;

          box-shadow:
            0 6px 15px
            rgba(23,54,93,0.15);

        }


        .save-button:hover {

          background:
            #102a46;

          transform:
            translateY(-1px);

        }


        .cancel-button {

          background:
            #eef0f2;

          color:
            #687386;

        }


        .cancel-button:hover {

          background:
            #e3e6e9;

        }


        /* ============================================
           NOT FOUND
        ============================================ */

        .not-found {

          padding:
            50px 25px;

          text-align:
            center;

          background:
            white;

          border:
            1px dashed #d5d9df;

          border-radius:
            20px;

        }


        .not-found-icon {

          margin-bottom:
            10px;

          font-size:
            34px;

        }


        .not-found h2 {

          margin:
            0 0 7px;

          color:
            #102a46;

          font-size:
            17px;

        }


        .not-found p {

          margin:
            0;

          color:
            #929ba8;

          font-size:
            12px;

        }


        /* ============================================
           RESPONSIVE
        ============================================ */

        @media (max-width: 750px) {

          .profile-main {

            padding:
              28px 22px 60px;

          }


          .profile-details {

            grid-template-columns:
              1fr;

          }


          .profile-form {

            grid-template-columns:
              1fr;

          }


          .form-field.full {

            grid-column:
              auto;

          }


          .form-actions {

            grid-column:
              auto;

          }

        }


        @media (max-width: 550px) {

          .profile-main {

            padding:
              20px 13px 50px;

          }


          .profile-title {

            font-size:
              25px;

          }


          .profile-card {

            border-radius:
              17px;

          }


          .profile-cover {

            height:
              120px;

          }


          .profile-info {

            padding:
              0 18px 20px;

          }


          .profile-avatar {

            width:
              78px;

            height:
              78px;

            margin-top:
              -39px;

            border-radius:
              20px;

          }


          .edit-card {

            padding:
              20px 17px;

            border-radius:
              17px;

          }


          .form-actions {

            flex-direction:
              column;

          }


          .save-button,
          .cancel-button {

            width:
              100%;

          }

        }

      `}</style>


      <Navbar />


      <div className="profile-layout">

        <Sidebar />


        <main className="profile-main">

          <div className="profile-container">


            {/* ============================================
                HEADER
            ============================================ */}

            <div className="profile-header">

              <div className="profile-label">
                UniConnect Account
              </div>

              <h1 className="profile-title">
                My Profile
              </h1>

              <p className="profile-subtitle">
                View and manage your UniConnect profile information.
              </p>

            </div>


            {!user ? (

              /* ==========================================
                 USER NOT FOUND
              ========================================== */

              <div className="not-found">

                <div className="not-found-icon">
                  👤
                </div>

                <h2>
                  User profile not found
                </h2>

                <p>
                  We couldn't load your profile information.
                </p>

              </div>

            ) : !editing ? (

              /* ==========================================
                 VIEW PROFILE
              ========================================== */

              <div className="profile-card">


                {/* COVER */}

                <div className="profile-cover">

                  <span className="cover-text">
                    UniConnect Student Profile
                  </span>

                </div>


                {/* PROFILE INFO */}

                <div className="profile-info">


                  {/* AVATAR */}

                  <div className="profile-avatar">

                    {user.name
                      ? user.name
                          .split(" ")
                          .map(
                            (word) =>
                              word[0]
                          )
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "?"}

                    <span className="online-dot" />

                  </div>


                  <h2 className="profile-name">

                    {user.name}

                  </h2>


                  <p className="profile-role">

                    🎓 UniConnect Student

                  </p>


                  {/* DETAILS */}

                  <div className="profile-details">


                    <div className="detail-box">

                      <span className="detail-label">
                        Email
                      </span>

                      <span className="detail-value">
                        {user.email || "Not provided"}
                      </span>

                    </div>


                    <div className="detail-box">

                      <span className="detail-label">
                        University
                      </span>

                      <span className="detail-value">
                        {user.university || "Not provided"}
                      </span>

                    </div>


                    <div className="detail-box">

                      <span className="detail-label">
                        Faculty
                      </span>

                      <span className="detail-value">
                        {user.faculty || "Not provided"}
                      </span>

                    </div>


                    <div className="detail-box">

                      <span className="detail-label">
                        Batch
                      </span>

                      <span className="detail-value">
                        {user.batch || "Not provided"}
                      </span>

                    </div>


                  </div>


                  {/* EDIT BUTTON */}

                  <div className="profile-action-row">

                    <button
                      className="edit-profile-button"
                      onClick={handleEdit}
                    >
                      ✏️ Edit Profile
                    </button>

                  </div>


                </div>

              </div>

            ) : (

              /* ==========================================
                 EDIT PROFILE
              ========================================== */

              <div className="edit-card">


                {/* EDIT HEADER */}

                <div className="edit-card-header">

                  <div className="edit-icon">
                    ✏️
                  </div>

                  <div>

                    <h2>
                      Edit Profile
                    </h2>

                    <p>
                      Update your UniConnect profile information.
                    </p>

                  </div>

                </div>


                <form
                  className="profile-form"
                  onSubmit={handleUpdate}
                >


                  {/* NAME */}

                  <div className="form-field full">

                    <label
                      className="form-label"
                      htmlFor="profile-name"
                    >
                      Name
                    </label>

                    <input
                      id="profile-name"
                      className="profile-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />

                  </div>


                  {/* UNIVERSITY */}

                  <div className="form-field">

                    <label
                      className="form-label"
                      htmlFor="profile-university"
                    >
                      University
                    </label>

                    <input
                      id="profile-university"
                      className="profile-input"
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                    />

                  </div>


                  {/* FACULTY */}

                  <div className="form-field">

                    <label
                      className="form-label"
                      htmlFor="profile-faculty"
                    >
                      Faculty
                    </label>

                    <input
                      id="profile-faculty"
                      className="profile-input"
                      type="text"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                    />

                  </div>


                  {/* BATCH */}

                  <div className="form-field">

                    <label
                      className="form-label"
                      htmlFor="profile-batch"
                    >
                      Batch
                    </label>

                    <input
                      id="profile-batch"
                      className="profile-input"
                      type="text"
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                    />

                  </div>


                  {/* ACTIONS */}

                  <div className="form-actions">

                    <button
                      className="cancel-button"
                      type="button"
                      onClick={handleCancel}
                    >
                      ❌ Cancel
                    </button>


                    <button
                      className="save-button"
                      type="submit"
                    >
                      💾 Save Changes
                    </button>

                  </div>


                </form>

              </div>

            )}

          </div>

        </main>

      </div>

    </div>

  );

}


export default Profile;

