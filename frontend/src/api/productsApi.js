import api from "./axiosConfig";

export const productsApi = {
  // Get all products (optionally filtered)
  getProducts: async (params = {}) => {
    const response = await api.get("/api/products", { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  // Create product (admin only)
  createProduct: async (productData, imageFile) => {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== null && value !== undefined)
        formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    if (imageFile) formData.append("image", imageFile);
    const response = await api.post("/api/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Update product (admin only)
  updateProduct: async (id, productData, imageFile) => {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== null && value !== undefined)
        formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    if (imageFile) formData.append("image", imageFile);
    const response = await api.put(`/api/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Delete product (admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },

  // Submit contact form order
  submitContactOrder: async (orderData) => {
    const response = await api.post("/api/products/shop/order", orderData);
    return response.data;
  },

  // Get all orders (admin only)
  getOrders: async (params = {}) => {
    const response = await api.get("/api/products/orders", { params });
    return response.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status, adminNotes) => {
    const response = await api.put(`/api/products/orders/${orderId}/status`, {
      status,
      adminNotes,
    });
    return response.data;
  },

  // Helper to get product image URL
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/products/${imagePath}`;
  },

  getProductImageUrl: (imagePath) => {
    if (!imagePath) return null;
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/products/${imagePath}`;
  },
};

export default productsApi;
