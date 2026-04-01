import axiosClient from "./axiosClient";

export const getCart = () => axiosClient.get("/api/cart");
export const addToCart = (data) => axiosClient.post("/api/cart", data);
export const removeFromCart = (productId) => axiosClient.delete(`/api/cart/${productId}`);