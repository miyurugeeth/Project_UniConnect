import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081/api",

  headers: {
    "Content-Type": "application/json",
  },
});


// =========================================================
// REQUEST INTERCEPTOR
// Automatically attach JWT token
// =========================================================

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("token");

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }
);


// =========================================================
// RESPONSE INTERCEPTOR
// Handle authentication errors
// =========================================================

api.interceptors.response.use(

  (response) => {

    return response;

  },

  (error) => {

    // -----------------------------------------
    // 401 / 403
    // -----------------------------------------

    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {

      console.error(
        "Authentication / Authorization error:",
        error.response?.data
      );

      /*
       * IMPORTANT:
       * Don't automatically remove the token here.
       *
       * A 403 can simply mean the logged-in user
       * doesn't have permission for that endpoint.
       */

    }

    return Promise.reject(error);

  }
);


export default api;