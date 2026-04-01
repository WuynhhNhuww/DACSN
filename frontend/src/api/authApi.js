import axiosClient from "./axiosClient";

export const register = (data) => axiosClient.post("/api/users/register", data);
export const login = (data) => axiosClient.post("/api/users/login", data);
export const getProfile = () => axiosClient.get("/api/users/profile");
export const updateProfile = (data) => axiosClient.put("/api/users/profile", data);