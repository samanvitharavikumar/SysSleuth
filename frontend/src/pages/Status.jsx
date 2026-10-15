import React from "react";

export default function Status() {
  const username = sessionStorage.getItem("logged_in_username") || "User";

  const tokens = JSON.parse(
    localStorage.getItem("raised_tokens") || "[]"
  );

  const userId = sessionStorage.getItem("user_id");

  const myTokens = tokens.filter((token) => {
    return (
      token.username === username ||
      token.user_id === userId
    );
  });

  return (
    <div className="min-h-screen bg-[#08080d] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => {
            window.location.href = "/my-tokens";
          }}
          className="mb-8 text-sm text-purple-300 hover:text-white"
        >
          ← Back to My Tokens
        </button>

        <h1 className="text-3xl font-bold text-purple-300">
          Token Status
        </h1>

        <p className="text-gray-400 mt-2 mb-8">
          Track the progress of your raised tokens.
        </p>

        {myTokens.length === 0 ? (
          <div className="border border-white/10 bg-[#111019] rounded-xl p-8 text-center">
            <p className="text-gray-300">
              No tokens found for your account.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {myTokens.map((token, index) => {
              const status = (
                token.status || "SUBMITTED"
              ).toUpperCase();

              const resolved =
                status === "RESOLVED" ||
                status === "SOLVED";

              return (
                <div
                  key={token.token_id || token.id || index}
                  className="border border-purple-500/20 bg-[#111019] rounded-xl p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500">
                        Token ID
                      </p>

                      <p className="font-semibold mt-1 break-all">
                        {token.token_id ||
                          token.tokenId ||
                          token.id ||
                          token._id ||
                          `TOKEN-${index + 1}`}
                      </p>
                    </div>

                    <span
                      className={`inline-block w-fit rounded-full px-4 py-2 text-xs font-bold ${
                        resolved
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-sm text-gray-400">
                      {token.title ||
                        token.issue ||
                        token.description ||
                        token.message ||
                        "No additional token details available."}
                    </p>

                    {resolved && (
                      <p className="mt-4 text-sm text-green-400">
                        ✓ Your token has been resolved.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}