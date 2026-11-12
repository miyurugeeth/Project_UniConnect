import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";


function Register() {

  const navigate = useNavigate();


  // =========================================
  // FORM DATA
  // =========================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    faculty: "",
    batch: ""
  });


  // =========================================
  // UI STATES
  // =========================================

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  // =========================================
  // HANDLE INPUT CHANGE
  // =========================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };


  // =========================================
  // REGISTER STUDENT
  // =========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");


    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.university.trim() ||
      !formData.faculty.trim() ||
      !formData.batch
    ) {

      setError(
        "Please fill all fields."
      );

      return;
    }


    // =========================================
    // PASSWORD VALIDATION
    // =========================================

    if (formData.password.length < 6) {

      setError(
        "Password must be at least 6 characters."
      );

      return;
    }


    // =========================================
    // BATCH VALIDATION
    // =========================================

    if (
      !/^\d+$/.test(
        String(formData.batch)
      )
    ) {

      setError(
        "Batch must be a number."
      );

      return;
    }


    try {

      setLoading(true);


      // =========================================
      // STUDENT REGISTRATION ONLY
      // =========================================

      const response = await api.post(
        "/users",
        {
          name: formData.name.trim(),

          email: formData.email.trim(),

          password: formData.password,

          university:
            formData.university.trim(),

          faculty:
            formData.faculty.trim(),

          batch:
            Number(formData.batch)
        }
      );


      console.log(
        "Student registration response:",
        response.data
      );


      // =========================================
      // SUCCESS
      // =========================================

      setSuccess(
        "Student account created successfully!"
      );


      // =========================================
      // CLEAR FORM
      // =========================================

      setFormData({
        name: "",
        email: "",
        password: "",
        university: "",
        faculty: "",
        batch: ""
      });


      // =========================================
      // GO TO LOGIN
      // =========================================

      setTimeout(() => {

        navigate("/login");

      }, 1500);


    } catch (error) {

      console.error(
        "Registration failed:",
        error
      );


      console.error(
        "Backend response:",
        error.response?.data
      );


      // =========================================
      // ERROR MESSAGE
      // =========================================

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Registration failed.";


      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Registration failed."
      );


    } finally {

      setLoading(false);

    }

  };


  // =========================================
  // UI
  // =========================================

  return (

    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px"
      }}
    >

      <h1>
        UniConnect
      </h1>


      <h2>
        Create Student Account
      </h2>


      {/* ===================================== */}
      {/* ACCOUNT INFORMATION */}
      {/* ===================================== */}

      <p>
        Register as a student to join UniConnect.
      </p>


      {/* ===================================== */}
      {/* ERROR */}
      {/* ===================================== */}

      {error && (

        <div
          style={{
            color: "red",
            marginBottom: "15px"
          }}
        >

          ❌ {error}

        </div>

      )}


      {/* ===================================== */}
      {/* SUCCESS */}
      {/* ===================================== */}

      {success && (

        <div
          style={{
            color: "green",
            marginBottom: "15px"
          }}
        >

          ✅ {success}

        </div>

      )}


      {/* ===================================== */}
      {/* FORM */}
      {/* ===================================== */}

      <form
        onSubmit={handleSubmit}
      >


        {/* ================================= */}
        {/* NAME */}
        {/* ================================= */}

        <div>

          <label>
            Name
          </label>

          <br />

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          />

        </div>


        <br />


        {/* ================================= */}
        {/* EMAIL */}
        {/* ================================= */}

        <div>

          <label>
            Email
          </label>

          <br />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          />

        </div>


        <br />


        {/* ================================= */}
        {/* PASSWORD */}
        {/* ================================= */}

        <div>

          <label>
            Password
          </label>

          <br />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          />

        </div>


        <br />


        {/* ================================= */}
        {/* UNIVERSITY */}
        {/* ================================= */}

        <div>

          <label>
            University
          </label>

          <br />

          <input
            type="text"
            name="university"
            value={formData.university}
            onChange={handleChange}
            placeholder="Enter university"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          />

        </div>


        <br />


        {/* ================================= */}
        {/* FACULTY */}
        {/* ================================= */}

        <div>

          <label>
            Faculty
          </label>

          <br />

          <input
            type="text"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            placeholder="Enter faculty"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          />

        </div>


        <br />


        {/* ================================= */}
        {/* BATCH */}
        {/* ================================= */}

        <div>

          <label>
            Batch
          </label>

          <br />

          <input
            type="number"
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            placeholder="Enter batch"
            min="1"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box"
            }}
          />

        </div>


        <br />


        {/* ================================= */}
        {/* REGISTER BUTTON */}
        {/* ================================= */}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            cursor: loading
              ? "not-allowed"
              : "pointer"
          }}
        >

          {loading
            ? "Creating Account..."
            : "🎓 Register as Student"}

        </button>


      </form>


      <br />


      {/* ===================================== */}
      {/* LOGIN */}
      {/* ===================================== */}

      <p>

        Already have an account?{" "}

        <button
          type="button"
          onClick={() =>
            navigate("/login")
          }
        >
          Login
        </button>

      </p>


    </div>

  );

}


export default Register;