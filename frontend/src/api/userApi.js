import axiosClient from "./axiosClient";

// Wishlist
export const getWishlist = () => axiosClient.get("/api/users/wishlist");
export const toggleWishlist = (productId) => axiosClient.post(`/api/users/wishlist/${productId}`);

// Addresses
export const getAddresses = () => axiosClient.get("/api/users/addresses");
export const addAddress = (data) => axiosClient.post("/api/users/addresses", data);
export const updateAddress = (id, data) => axiosClient.put(`/api/users/addresses/${id}`, data);
export const deleteAddress = (id) => axiosClient.delete(`/api/users/addresses/${id}`);
export const setDefaultAddress = (id) => axiosClient.patch(`/api/users/addresses/${id}/default`);

// Notifications
export const getNotifications = (params) => axiosClient.get("/api/notifications", { params });
export const markNotifRead = (id) => axiosClient.patch(`/api/notifications/${id}/read`);
export const markAllNotifsRead = () => axiosClient.patch("/api/notifications/read-all");
export const deleteNotif = (id) => axiosClient.delete(`/api/notifications/${id}`);
