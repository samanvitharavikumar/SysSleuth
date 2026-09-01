import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import RCADashboard from "./RCADashboard";

import "./index.css";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {path === "/rca" ? <RCADashboard /> : <App />}
  </React.StrictMode>
);