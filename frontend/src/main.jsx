import React from "react";
import ReactDOM from "react-dom/client";

import MyTokens from "./pages/MyTokens";
import Complaint from "./pages/Complaint";
import App from "./App";
import UserRCADashboard from "./UserRCADashboard";
import RCADashboard from "./RCADashboard";
import Login from "./pages/Login";
import TokensRaised from "./pages/TokensRaised";
import Fixed from "./pages/Fixed";
import Status from "./pages/Status";

import "./index.css";

const path = window.location.pathname;

const userLoggedIn =
  sessionStorage.getItem("user_logged_in") === "true";

const adminLoggedIn =
  sessionStorage.getItem("admin_logged_in") === "true";

let page;

if (path === "/" || path === "/login") {
  page = <Login />;
} else if (path === "/admin/login") {
  page = <Login />;
} else if (path === "/user") {
  if (userLoggedIn) {
    page = <App />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/rca") {
  if (userLoggedIn) {
    page = <UserRCADashboard />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/complaint") {
  if (userLoggedIn) {
    page = <Complaint />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/my-tokens") {
  if (userLoggedIn) {
    page = <MyTokens />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/status") {
  if (userLoggedIn) {
    page = <Status />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/tokens") {
  if (adminLoggedIn) {
    page = <TokensRaised />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/admin") {
  if (adminLoggedIn) {
    page = <RCADashboard />;
  } else {
    window.location.href = "/login";
  }
} else if (path === "/fixed") {
  if (adminLoggedIn) {
    page = <Fixed />;
  } else {
    window.location.href = "/login";
  }
} else {
  window.location.href = "/login";
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{page || null}</React.StrictMode>
);