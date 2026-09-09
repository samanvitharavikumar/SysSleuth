import React from "react";
import ReactDOM from "react-dom/client";

import Complaint from "./pages/Complaint";
import App from "./App";
import UserRCADashboard from "./UserRCADashboard";
import RCADashboard from "./RCADashboard";
import Login from "./pages/Login";
import TokensRaised from "./pages/TokensRaised";

import "./index.css";

const path = window.location.pathname;

const userLoggedIn =
  sessionStorage.getItem("user_logged_in") === "true";

const adminLoggedIn =
  sessionStorage.getItem("admin_logged_in") === "true";

let page;

if (path === "/" || path === "/login") {
  page = <Login />;
}

// USER E-COMMERCE SITE
else if (path === "/user") {
  if (userLoggedIn) {
    page = <App />;
  } else {
    window.location.href = "/login";
  }
}

// USER RCA DASHBOARD
else if (path === "/rca") {
  if (userLoggedIn) {
    page = <UserRCADashboard />;
  } else {
    window.location.href = "/login";
  }
}

// COMPLAINT PAGE
else if (path === "/complaint") {
  if (userLoggedIn) {
    page = <Complaint />;
  } else {
    window.location.href = "/login";
  }
}
// ADMIN TOKENS
else if (path === "/tokens") {
  if (adminLoggedIn) {
    page = <TokensRaised />;
  } else {
    window.location.href = "/login";
  }
}

// ADMIN ORIGINAL RCA DASHBOARD
else if (path === "/admin") {
  if (adminLoggedIn) {
    page = <RCADashboard />;
  } else {
    window.location.href = "/login";
  }
}

// ANY UNKNOWN URL
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