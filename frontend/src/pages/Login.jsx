import React, { useState } from "react";

export default function Login() {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    setUsername("");
    setPassword("");
    setError("");
  };

  const goBack = () => {
    setRole(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    // =====================================================
    // USER LOGIN
    // =====================================================

    if (
      role === "user" &&
      username === "user" &&
      password === "user123"
    ) {
      sessionStorage.setItem(
        "user_logged_in",
        "true"
      );

      sessionStorage.removeItem(
        "admin_logged_in"
      );

      window.location.href = "/user";

      return;
    }

    // =====================================================
    // ADMIN LOGIN
    // =====================================================

    if (
      role === "admin" &&
      username === "admin" &&
      password === "admin123"
    ) {
      sessionStorage.setItem(
        "admin_logged_in",
        "true"
      );

      sessionStorage.removeItem(
        "user_logged_in"
      );

      window.location.href = "/admin";

      return;
    }

    setError("Invalid username or password.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dbe9f2] via-[#7895ad] to-[#173f72] text-slate-900">

      {/* NAVBAR */}
      <nav className="h-[90px] border-b border-slate-900/20 flex items-center justify-between px-10 md:px-16">

        <div className="text-2xl md:text-3xl font-bold tracking-[0.25em]">
          SYSSLEUTH
        </div>

        <div className="border border-slate-900/40 px-6 py-3 text-xs tracking-[0.2em] uppercase">
          LOGIN
        </div>

      </nav>

      {/* MAIN */}
      <main className="min-h-[calc(100vh-90px)] relative overflow-hidden">

        {/* Decorative line */}
        <div className="absolute top-24 left-10 md:left-16 w-12 h-px bg-slate-900/70" />

        <div className="absolute top-28 left-10 md:left-16 text-[10px] tracking-[0.4em] text-slate-800/70">
          2026
        </div>

        {/* Background geometric shapes */}
        <div className="absolute right-[-100px] top-24 w-[520px] h-[520px] border border-white/10" />

        <div className="absolute right-[40px] top-44 w-[380px] h-[380px] border border-white/10" />

        <div className="absolute right-[150px] top-64 w-[220px] h-[220px] border border-white/10" />

        {/* CONTENT */}
        <div className="relative z-10 min-h-[calc(100vh-90px)] flex items-center justify-center px-6">

          <div className="w-full max-w-6xl grid md:grid-cols-2 gap-16 items-center">

            {/* LEFT SIDE */}
            <div>

              <p className="text-sm tracking-[0.4em] uppercase mb-8 text-slate-800">
                Welcome
              </p>

              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
                Smarter
                <br />
                <span className="text-white/80">
                  commerce.
                </span>
              </h1>

              <p className="mt-10 max-w-md text-sm leading-7 text-slate-800/80">
                A smarter commerce experience powered by
                intelligent systems and reliable infrastructure.
              </p>

            </div>

            {/* RIGHT SIDE */}
            <div className="flex justify-center md:justify-end">

              <div className="w-full max-w-md">

                <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl p-8 md:p-10">

                  {/* =================================================
                      STEP 1 — CHOOSE ROLE
                  ================================================= */}

                  {!role && (
                    <>

                      <p className="text-xs tracking-[0.35em] uppercase text-slate-500 mb-4">
                        Secure Access
                      </p>

                      <h2 className="text-4xl font-bold tracking-tight">
                        Choose your role.
                      </h2>

                      <p className="mt-3 text-sm text-slate-500 mb-10">
                        Select how you want to access Kickstart.
                      </p>

                      {/* USER */}

                      <button
                        onClick={() => selectRole("user")}
                        className="group w-full border border-slate-300 p-6 mb-4 text-left hover:bg-slate-950 hover:text-white transition-all duration-300"
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-xs tracking-[0.3em] uppercase mb-2 opacity-60">
                              Customer
                            </p>

                            <h3 className="text-2xl font-bold">
                              USER
                            </h3>

                            <p className="text-sm opacity-60 mt-2">
                              Shop products and manage your orders.
                            </p>

                          </div>

                          <span className="text-2xl group-hover:translate-x-2 transition-transform">
                            →
                          </span>

                        </div>

                      </button>

                      {/* ADMIN */}

                      <button
                        onClick={() => selectRole("admin")}
                        className="group w-full border border-slate-300 p-6 text-left hover:bg-slate-950 hover:text-white transition-all duration-300"
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-xs tracking-[0.3em] uppercase mb-2 opacity-60">
                              Management
                            </p>

                            <h3 className="text-2xl font-bold">
                              ADMIN
                            </h3>

                            <p className="text-sm opacity-60 mt-2">
                              Monitor incidents and analyze system failures.
                            </p>

                          </div>

                          <span className="text-2xl group-hover:translate-x-2 transition-transform">
                            →
                          </span>

                        </div>

                      </button>

                    </>
                  )}

                  {/* =================================================
                      STEP 2 — LOGIN
                  ================================================= */}

                  {role && (
                    <>

                      {/* BACK */}

                      <button
                        onClick={goBack}
                        className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 mb-8"
                      >
                        ← Back
                      </button>

                      {/* HEADING */}

                      <p className="text-xs tracking-[0.35em] uppercase text-slate-500 mb-4">
                        {role === "user"
                          ? "Customer Access"
                          : "Management Access"}
                      </p>

                      <h2 className="text-4xl font-bold tracking-tight">
                        Welcome back.
                      </h2>

                      <p className="mt-3 text-sm text-slate-500 mb-10">
                        Sign in as{" "}
                        <span className="font-semibold text-slate-800">
                          {role.toUpperCase()}
                        </span>
                      </p>

                      {/* LOGIN FORM */}

                      <form
                        onSubmit={handleLogin}
                        className="space-y-7"
                      >

                        {/* USERNAME */}

                        <div>

                          <label className="block text-xs uppercase tracking-[0.2em] text-slate-600 mb-2">
                            Username
                          </label>

                          <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                              setUsername(e.target.value)
                            }
                            placeholder="Enter username"
                            className="w-full bg-transparent border-b border-slate-400 px-1 py-3 text-sm outline-none focus:border-slate-900 transition"
                            required
                          />

                        </div>

                        {/* PASSWORD */}

                        <div>

                          <label className="block text-xs uppercase tracking-[0.2em] text-slate-600 mb-2">
                            Password
                          </label>

                          <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                              setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            className="w-full bg-transparent border-b border-slate-400 px-1 py-3 text-sm outline-none focus:border-slate-900 transition"
                            required
                          />

                        </div>

                        {/* ERROR */}

                        {error && (
                          <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                            {error}
                          </div>
                        )}

                        {/* SIGN IN */}

                        <button
                          type="submit"
                          className="w-full bg-slate-950 text-white py-4 text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition duration-300"
                        >
                          Sign In
                        </button>

                      </form>

                      {/* DEMO CREDENTIALS */}

                      <div className="mt-8 pt-6 border-t border-slate-200">

                        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
                          Demo Credentials
                        </p>

                        {role === "user" ? (

                          <p className="text-xs text-slate-500">
                            Username:{" "}
                            <span className="text-slate-800 font-medium">
                              user
                            </span>

                            {" "} / {" "}

                            Password:{" "}
                            <span className="text-slate-800 font-medium">
                              user123
                            </span>
                          </p>

                        ) : (

                          <p className="text-xs text-slate-500">
                            Username:{" "}
                            <span className="text-slate-800 font-medium">
                              admin
                            </span>

                            {" "} / {" "}

                            Password:{" "}
                            <span className="text-slate-800 font-medium">
                              admin123
                            </span>
                          </p>

                        )}

                      </div>

                    </>
                  )}

                  {/* FOOTER */}

                  <div className="mt-8 pt-6 border-t border-slate-200">

                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                      SysSleuth Intelligent Commerce
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}