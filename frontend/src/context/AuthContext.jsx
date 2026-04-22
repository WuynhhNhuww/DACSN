import { createContext, useEffect, useState } from "react";
import { getProfile, login as loginApi } from "../api/authApi";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setUser(res.data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) fetchProfile();
    else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    localStorage.setItem("token", res.data.token);
    await fetchProfile();
  };

  const googleLogin = async (idToken) => {
    const { googleLogin: googleLoginApi } = require("../api/authApi");
    const res = await googleLoginApi(idToken);
    localStorage.setItem("token", res.data.token);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}