import axiosClient from "./axiosClient";

export const getProducts = () => axiosClient.get("/api/products");
export const getProductById = (id) => axiosClient.get(`/api/products/${id}`);
export const createProduct = (data) => axiosClient.post("/api/products", data);