import React, { useEffect, useState } from "react";

export default function MyTokens() {
  const [tokens, setTokens] = useState([]);

  const loggedInUsername =
    sessionStorage.getItem("logged_in_username") || "user";

  const loadTokens = () => {
    try {
      const savedTokens = JSON.parse(
        localStorage.getItem("raised_tokens") || "[]"
      );

      const myTokens = savedTokens.filter(
        (token) =>
          token.user_id === loggedInUsername ||
          (!token.user_id && loggedInUsername === "user")
      );

      setTokens([...myTokens].reverse());
    } catch (error) {
      console.error("Could not load raised tokens:", error);
      setTokens([]);
    }
  };

  useEffect(() => {
    loadTokens();

    // Refresh if another tab updates localStorage.
    const handleStorage = (event) => {
      if (event.key === "raised_tokens") {
        loadTokens();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", loadTokens);
    window.addEventListener("pageshow", loadTokens);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", loadTokens);
      window.removeEventListener("pageshow", loadTokens);
    };
  }, []);

  const deleteToken = (tokenToDelete) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this token?"
    );

    if (!confirmed) return;

    try {
      const savedTokens = JSON.parse(
        localStorage.getItem("raised_tokens") || "[]"
      );

      const updatedTokens = savedTokens.filter(
        (token) => token.id !== tokenToDelete.id
      );

      localStorage.setItem(
        "raised_tokens",
        JSON.stringify(updatedTokens)
      );

      setTokens((current) =>
        current.filter((token) => token.id !== tokenToDelete.id)
      );
    } catch (error) {
      console.error("Could not delete token:", error);
      window.alert("Could not delete this token.");
    }
  };

  const refreshTokenStatus = (tokenToRefresh) => {
    try {
      const savedTokens = JSON.parse(
        localStorage.getItem("raised_tokens") || "[]"
      );

      const latestToken = savedTokens.find(
        (token) => token.id === tokenToRefresh.id
      );

      if (!latestToken) {
        window.alert("This token no longer exists.");
        loadTokens();
        return;
      }

      setTokens((current) =>
        current.map((token) =>
          token.id === tokenToRefresh.id
            ? { ...token, ...latestToken }
            : token
        )
      );
    } catch (error) {
      console.error("Could not refresh token status:", error);
      window.alert("Could not refresh the token status.");
    }
  };

    const isSolved = (status) =>
    ["SOLVED", "RESOLVED"].includes(String(status).toUpperCase());

  const statusClass = (status) =>
    isSolved(status)
      ? "border-green-400/30 text-green-300 bg-green-400/10"
      : "border-violet-400/30 text-violet-200 bg-violet-400/10";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-black to-[#2E1065] text-white">
      <nav className="min-h-[82px] border-b border-white/10 px-6 md:px-14 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-[0.22em]">
            SYSSLEUTH
          </h1>
          <p className="text-[9px] tracking-[0.28em] text-[#71899A] mt-1">
            MY TOKENS
          </p>
        </div>
 {/* Large purple glow */}

          <div
            className="
              absolute
              -left-40
              -top-40
              h-[500px]
              w-[500px]
              bg-purple-700/15
              blur-[140px]
            "
          />


          {/* Bottom purple glow */}

          <div
            className="
              absolute
              -bottom-40
              -right-40
              h-[500px]
              w-[500px]
            
              bg-violet-600/10
              blur-[140px]
            "
          />

          

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.assign("/login")}
            className="border border-[#6E8799]/50 px-5 py-3 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
          >
            ADMIN LOGIN
          </button>

          <button
            onClick={() => {
              window.location.href = "/user";
            }}
            className="border border-[#6E8799]/50 px-5 py-3 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
          >
            BACK TO STORE
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 md:px-14 py-14 md:py-16">
        <div className="mb-12">
          <p className="text-[10px] tracking-[0.35em] text-[#C4B5FD] font-bold">
            CUSTOMER PORTAL
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] mt-5">
            My Tokens.
          </h1>
          <p className="text-[#B0A1C7] mt-6 max-w-2xl">
            Track the complaints you have submitted and check their current
            status.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between border border-white/10 bg-white/[0.03] p-5">
          <span className="text-xs tracking-[0.2em] text-[#B0A1C7] font-bold">
            TOTAL COMPLAINTS
          </span>
          <span className="text-2xl font-black">{tokens.length}</span>
        </div>

        {tokens.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="text-[10px] tracking-[0.3em] text-[#B0A1C7] font-bold">
              NO TOKENS
            </p>
            <h2 className="text-2xl font-bold mt-4">
              You haven't raised any complaints yet.
            </h2>
            <p className="text-[#9A8BAF] mt-3">
              If you reported an issue, submit it while logged in so it can
              be associated with your account.
            </p>
            <button
              onClick={() => {
                window.location.href = "/complaint";
              }}
              className="mt-7 border border-white/30 px-6 py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
            >
              RAISE A COMPLAINT
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {tokens.map((token) => {
              const status = token.status || "SUBMITTED";

              return (
                <article
                  key={token.id}
  className="relative z-10 border border-white/10 bg-white/[0.03] p-6 md:p-8"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-[0.25em] text-[#B0A1C7] font-bold">
                        TOKEN ID
                      </p>
                      <h2 className="font-mono text-lg md:text-xl mt-2 break-all">
                        {token.id || "TOKEN ID NOT AVAILABLE"}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex self-start border px-4 py-2 text-xs font-bold ${statusClass(status)}`}
                      >
                        {status.toUpperCase()}
                      </span>

                      <button
                        type="button"
                          onClick={() => {
                              sessionStorage.setItem("selected_token_id", token.id);

  window.location.href = "/status";

}} 
                        className="border border-violet-400/40 px-4 py-2 text-xs font-bold text-violet-200 hover:bg-violet-400/10 transition"
                      >
                        STATUS
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteToken(token)}
                        className="border border-violet-400/40 px-4 py-2 text-xs font-bold text-violet-200 hover:bg-violet-400/10 transition"
                      >
                        DELETE TOKEN
                      </button>
                    </div>
                  </div>

 {isSolved(status) && (
                      <div className="mt-6 border border-green-400/30 bg-green-400/10 p-4 text-green-200">
                      <p className="font-bold">Your issue has been solved.</p>
                      <p className="mt-2">
                        {token.resolution_message ||
                          `Your order for product ${token.product_id ?? "requested"} has been placed.`}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-[#B0A1C7] font-bold">
                        COMPLAINT
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        {token.reason || "No reason provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-[#B0A1C7] font-bold">
                        SUBMITTED BY
                      </p>
                      <p className="mt-2">{token.name || "Unknown"}</p>

                      <p className="text-[10px] tracking-[0.2em] text-[#B0A1C7] font-bold mt-5">
                        DATE SUBMITTED
                      </p>
                      <p className="mt-2">
                        {token.created_at
                          ? new Date(token.created_at).toLocaleString()
                          : "Date unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-[#B0A1C7] font-bold">
                        PRODUCT ID
                      </p>
                      <p className="font-mono mt-2 break-all">
                        {token.product_id ?? "NOT AVAILABLE"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-[#B0A1C7] font-bold">
                        TRACE ID
                      </p>
                      <p className="font-mono text-sm mt-2 break-all">
                        {token.trace_id || "NOT AVAILABLE"}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-[10px] tracking-[0.2em] text-[#B0A1C7] font-bold">
                        SPAN ID
                      </p>
                      <p className="font-mono text-sm mt-2 break-all">
                        {token.span_id || "NOT AVAILABLE"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}