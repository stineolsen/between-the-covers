import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers from localStorage (mobile-compatible)
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Don't log 404s for user-specific resources (expected when resource doesn't exist)
      const is404 = error.response.status === 404;
      const isUserResource = error.config?.url?.match(
        /\/(user-books|reviews)\/book\/[^/]+(?:\/user)?$/,
      );

      if (is404 && isUserResource) {
        // Silently pass through expected 404s for user reviews/books
        return Promise.reject(error);
      }

      // Handle specific error codes
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        console.error("Unauthorized access");
      } else if (error.response.status === 403) {
        // Forbidden - account not approved
        console.error("Access forbidden");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
