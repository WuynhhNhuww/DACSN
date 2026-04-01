import axiosClient from "./axiosClient";

export const createOrder = (data) => axiosClient.post("/api/orders", data);
export const getMyOrders = () => axiosClient.get("/api/orders/my");
export const updateOrderStatus = (orderId, data) =>
  axiosClient.put(`/api/orders/${orderId}/status`, data);