import React from "react";

function Detail({ label, value }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const displayValue =
    typeof value === "object"
      ? JSON.stringify(value, null, 2)
      : String(value);

  return (
    <div className="border border-white/10 bg-white/[0.03] rounded-lg p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="break-words whitespace-pre-wrap text-sm text-white">
        {displayValue}
      </p>
    </div>
  );
}

export default function Status() {
  const username =
    sessionStorage.getItem("logged_in_username") || "User";

  const userId = sessionStorage.getItem("user_id");

  let tokens = [];

  try {
    tokens = JSON.parse(
      localStorage.getItem("raised_tokens") || "[]"
    );
  } catch {
    tokens = [];
  }

  const myTokens = tokens.filter((token) => {
    return (
      token.username === username ||
      (userId && token.user_id === userId) ||
      (!token.username &&
        !token.user_id &&
        username === "user")
    );
  });

  return (
    <div className="min-h-screen bg-[#08080d] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
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

        <p className="mb-8 mt-2 text-gray-400">
          Track your tokens, order information, incident analysis,
          and recommended resolutions.
        </p>

        {myTokens.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#111019] p-8 text-center">
            <p className="text-gray-300">
              No tokens found for your account.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {myTokens.map((token, index) => {
              const status = (
                token.status || "SUBMITTED"
              ).toUpperCase();

              const resolved =
                status === "RESOLVED" ||
                status === "SOLVED";

              const order =
                token.order_details || {};

              const incident =
                token.incident_details || {};

              const proposedFix =
                token.proposed_fix || {};

              const orderId =
                order.order_id ??
                incident.product_id ??
                token.product_id;

              const quantity =
                order.quantity ??
                incident.quantity ??
                1;

              const orderStatus =
                order.display_status ||
                (order.status === "PLACED"
                  ? "Order Placed Successfully"
                  : order.status);

              return (
                <div
                  key={token.token_id || token.id || index}
                  className="rounded-xl border border-purple-500/20 bg-[#111019] p-6"
                >
                  {/* Token header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500">
                        Token ID
                      </p>

                      <p className="mt-1 break-all font-semibold">
                        {token.token_id ||
                          token.tokenId ||
                          token.id ||
                          token._id ||
                          `TOKEN-${index + 1}`}
                      </p>
                    </div>

                    <span
                      className={`inline-block w-fit rounded-full border px-4 py-2 text-xs font-bold ${
                        resolved
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {resolved ? "Resolved" : status}
                    </span>
                  </div>

                  {/* Original token information */}
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-sm text-gray-300">
                      {token.title ||
                        token.issue ||
                        token.reason ||
                        token.description ||
                        token.message ||
                        "No additional token details available."}
                    </p>

                    {token.trace_id && (
                      <p className="mt-3 break-all text-xs text-gray-500">
                        Trace ID: {token.trace_id}
                      </p>
                    )}

                    {resolved && (
                      <p className="mt-4 text-sm text-green-400">
                        ✓ Your token has been resolved.
                      </p>
                    )}
                  </div>

                  {/* Order details from /fixed */}
                  {token.order_details && (
                    <section className="mt-6 border-t border-white/10 pt-6">
                      <h2 className="mb-4 text-lg font-bold text-purple-300">
                        Order Details
                      </h2>

                      {order.customer_name ||
                      order.customer ||
                      order.username ||
                      token.username ? (
                        <div className="mb-4 grid gap-4 sm:grid-cols-2">
                          <Detail
                            label="Customer"
                            value={
                              order.customer_name ||
                              order.customer ||
                              order.username ||
                              token.username
                            }
                          />
                        </div>
                      ) : null}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Detail
                          label="Order ID"
                          value={orderId}
                        />

                        <Detail
                          label="Token Status"
                          value={resolved ? "Resolved" : status}
                        />

                        <Detail
                          label="Quantity"
                          value={quantity}
                        />

                        <Detail
                          label="Order Status"
                          value={orderStatus || "Status unavailable"}
                        />

                        <Detail
                          label="Product ID"
                          value={
                            incident.product_id ??
                            token.product_id
                          }
                        />

                        <Detail
                          label="Product Name"
                          value={
                            order.product_name ||
                            order.product ||
                            incident.product_name
                          }
                        />
                      </div>

                      {token.order_confirmation === true && (
                        <p className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                          ✓ Your order resolution was recorded
                          in SysSleuth.
                        </p>
                      )}
                    </section>
                  )}

                  {/* Incident analysis from /fixed */}
                  {token.incident_details && (
                    <section className="mt-6 border-t border-white/10 pt-6">
                      <h2 className="mb-4 text-lg font-bold text-purple-300">
                        Incident Analysis
                      </h2>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Detail
                          label="Failure Type"
                          value={incident.failure_type}
                        />

                        <Detail
                          label="Root Cause"
                          value={incident.root_cause}
                        />

                        <Detail
                          label="Incident Reason"
                          value={incident.reason}
                        />

                        <Detail
                          label="Service"
                          value={incident.service}
                        />

                        <Detail
                          label="Confidence"
                          value={incident.confidence}
                        />

                        <Detail
                          label="Trace ID"
                          value={
                            incident.trace_id || token.trace_id
                          }
                        />

                        <Detail
                          label="Span ID"
                          value={incident.span_id}
                        />

                        <Detail
                          label="Operation"
                          value={incident.operation}
                        />

                        <Detail
                          label="Status Code"
                          value={incident.status_code}
                        />
                      </div>
                    </section>
                  )}

                  {/* Proposed fix from /fixed */}
                  {token.proposed_fix && (
                    <section className="mt-6 border-t border-purple-400/20 pt-6">
                      <h2 className="mb-4 text-lg font-bold text-purple-300">
                        Resolution Details
                      </h2>

                      <div className="space-y-4">
                        <Detail
                          label="Recommended Action"
                          value={
                            proposedFix.recommended_action ||
                            proposedFix.fix_description
                          }
                        />

                        <Detail
                          label="Why This Fix"
                          value={proposedFix.why}
                        />

                        <Detail
                          label="Expected Result"
                          value={proposedFix.expected_result}
                        />

                        <Detail
                          label="Developer Investigation"
                          value={
                            proposedFix.developer_investigation
                          }
                        />
                      </div>
                    </section>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}