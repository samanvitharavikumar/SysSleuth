import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import Login from "./pages/Login";
import RCADashboard from "./RCADashboard";
import UserRCADashboard from "./UserRCADashboard";

import "./index.css";

const path = window.location.pathname;

let page;

if (path === "/" || path === "/login") {
  page = <Login />;
}
else if (path === "/user") {
  page = <App />;
}
else if (path === "/rca") {
  page = <UserRCADashboard />;
}
else if (path === "/admin") {
  page = <RCADashboard />;
}
else {
  page = <Login />;
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {page}
  </React.StrictMode>
);