import axiosClient from "./axiosClient";

export const createPromotion = (data) => axiosClient.post("/api/promotions", data);
export const getMyPromotions = () => axiosClient.get("/api/promotions/my");
export const addProductToPromotion = (data) => axiosClient.post("/api/promotion-items", data);
export const removePromotionItem = (id) => axiosClient.delete(`/api/promotion-items/${id}`);