import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";

import api from "./services/api";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import MyPosts from "./pages/MyPosts";
import EditPost from "./pages/EditPost";
import Profile from "./pages/Profile";
import Connections from "./pages/Connections";
import Messages from "./pages/Messages";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminRegister from "./pages/AdminRegister";
import AdminUsers from "./pages/AdminUsers";
import AdminPosts from "./pages/AdminPosts";
import AdminComments from "./pages/AdminComments";

import { ThemeProvider } from "./context/ThemeContext";


// =====================================================
// CHECK LOGIN
// =====================================================

function isLoggedIn() {

  const token =
    localStorage.getItem("token");

  return !!token;
}


// =====================================================
// GET ROLE FROM JWT
// =====================================================

function getUserRole() {

  const token =
    localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {

    const payload =
      JSON.parse(
        atob(
          token.split(".")[1]
        )
      );

    return payload.role;

  } catch (error) {

    console.error(
      "Failed to decode token:",
      error
    );

    return null;
  }
}


// =====================================================
// PROTECTED ROUTE
// =====================================================

function clearSession() {
  localStorage.removeItem("token");
}

function SessionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        const response = await api.get("/users/me");

        if (!isMounted) {
          return;
        }

        if (response.data?.accountStatus === "SUSPENDED") {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        clearSession();
        navigate("/login", { replace: true });
      }
    };

    validateSession();

    const intervalId = setInterval(validateSession, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [navigate]);

  return null;
}

function ProtectedRoute({ children }) {

  if (!isLoggedIn()) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }

  return children;
}


// =====================================================
// ADMIN ROUTE
// =====================================================

function AdminRoute({ children }) {

  if (!isLoggedIn()) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }

  const role =
    getUserRole();

  if (role !== "ADMIN") {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }

  return children;
}


// =====================================================
// APP
// =====================================================

function App() {

  return (

    <ThemeProvider>

      <BrowserRouter>

        <SessionGuard />

        <Routes>

          {/* ================================================= */}
          {/* DEFAULT */}
          {/* ================================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          {/* ================================================= */}
          {/* LOGIN */}
          {/* ================================================= */}

          <Route
            path="/login"
            element={<Login />}
          />


          {/* ================================================= */}
          {/* STUDENT REGISTRATION */}
          {/* ================================================= */}

          <Route
            path="/register"
            element={<Register />}
          />


          {/* ================================================= */}
          {/* NORMAL DASHBOARD */}
          {/* ================================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* CREATE POST */}
          {/* ================================================= */}

          <Route
            path="/create-post"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* MY POSTS */}
          {/* ================================================= */}

          <Route
            path="/my-posts"
            element={
              <ProtectedRoute>
                <MyPosts />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* EDIT POST */}
          {/* ================================================= */}

          <Route
            path="/edit-post/:id"
            element={
              <ProtectedRoute>
                <EditPost />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* PROFILE */}
          {/* ================================================= */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* CONNECTIONS */}
          {/* ================================================= */}

          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* MESSAGES */}
          {/* ================================================= */}

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />


          {/* ================================================= */}
          {/* ADMIN DASHBOARD */}
          {/* ================================================= */}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />


          {/* ================================================= */}
          {/* CREATE ADMIN */}
          {/* ================================================= */}

          <Route
            path="/admin/register"
            element={
              <AdminRoute>
                <AdminRegister />
              </AdminRoute>
            }
          />


          {/* ================================================= */}
          {/* ADMIN USERS */}
          {/* ================================================= */}

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />


          {/* ================================================= */}
          {/* ADMIN POSTS */}
          {/* ================================================= */}

          <Route
            path="/admin/posts"
            element={
              <AdminRoute>
                <AdminPosts />
              </AdminRoute>
            }
          />


          {/* ================================================= */}
          {/* ADMIN COMMENTS */}
          {/* ================================================= */}

          <Route
            path="/admin/comments"
            element={
              <AdminRoute>
                <AdminComments />
              </AdminRoute>
            }
          />


          {/* ================================================= */}
          {/* UNKNOWN ROUTE */}
          {/* ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </ThemeProvider>

  );

}


export default App;