/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const App = () => {
  const [isLoggedin, setIsLoggedin] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/auth/is-auth`,
        { withCredentials: true }
      );

      setIsLoggedin(data.success);
    } catch {
      setIsLoggedin(false);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  return (
    <div>
      <ToastContainer />

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Redirect to home if already logged in */}
        <Route
          path="/login"
          element={isLoggedin ? <Navigate to="/" /> : <Login />}
        />

        <Route
          path="/verify-email"
          element={isLoggedin ? <Navigate to="/" /> : <EmailVerify />}
        />

        <Route
          path="/reset-password"
          element={isLoggedin ? <Navigate to="/" /> : <ResetPassword />}
        />
      </Routes>
    </div>
  );
};

export default App;