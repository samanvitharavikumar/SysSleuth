
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import RCADashboard from "./RCADashboard";
import Login from "./pages/Login";
import "./index.css";

const path = window.location.pathname;
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {path === "/login" ? (
      <Login />
    ) : path === "/user" ? (
      <App />
    ) : path === "/admin" ? (
      <RCADashboard />
    ) : path === "/rca" ? (
      <RCADashboard />
    ) : (
      <Login />
    )}
  </React.StrictMode>
);