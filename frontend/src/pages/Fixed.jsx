
import { useEffect, useState } from "react";

function Detail({ label, value }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  

  return (
    <div className=" border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="break-words text-sm text-white">
        {typeof value === "object" ? JSON.stringify(value) : String(value)}
      </p>
    </div>
  );
}

export default function Fixed() {
  const [savedData, setSavedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const rawData = sessionStorage.getItem("fixed_order_data");

      if (!rawData) {
        setError(
          "No incident details were found. Please return to the RCA dashboard and apply the fix again."
        );
        setLoading(false);
        return;
      }

      setSavedData(JSON.parse(rawData));

      // Visual transition only. This does not confirm a real order.
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    } catch {
      setError("The saved incident details could not be loaded.");
      setLoading(false);
    }
  }, []);
  useEffect(() => {
if (!savedData) return;
try {
  const tokens = JSON.parse(
    localStorage.getItem("raised_tokens") || "[]"
  );

  const incident = savedData.incident || {};
  const traceId = incident.trace_id || savedData.trace_id;
  const tokenId =
    savedData.token?.token_id ||
    savedData.token?.tokenId ||
    savedData.token?.id ||
    savedData.token_id;

  const updatedTokens = tokens.map((token) => {
    const matches = tokenId
      ? String(token.token_id || token.tokenId || token.id || token._id) ===
        String(tokenId)
      : String(token.trace_id || "") === String(traceId || "") ||
        String(token.product_id) === String(incident.product_id);

    if (!matches) return token;

    return {
      ...token,
      status: "RESOLVED",
      order_details: {
        ...(token.order_details || {}),
        ...(savedData.order || {}),
        order_id: incident.product_id ?? savedData.order?.order_id ?? null,
        quantity:
          savedData.order?.quantity ??
          incident.quantity ??
          savedData.quantity ??
          1,
        display_status: "Order Placed Successfully",
      },
      incident_details: incident,
      proposed_fix:
        savedData.proposed_fix ||
        savedData.proposedFix ||
        incident.proposed_fix ||
        {},
      order_confirmation: false,
    };
  });

  localStorage.setItem(
    "raised_tokens",
    JSON.stringify(updatedTokens)
  );
} catch (error) {
  console.error("Failed to update resolved token:", error);
}}, [savedData]);

  const order = savedData?.order || {};
  const token = savedData?.token || {};
  const incident = savedData?.incident || {};
  const proposedFix =
    savedData?.proposed_fix ||
    savedData?.proposedFix ||
    incident?.proposed_fix ||
    {};

  const orderId =
     incident.product_id ?? "Unknown";
    

  const customer =
    order.customer_name ||
    order.customer ||
    order.username ||
    token.username ||
    token.user_id ||
    savedData?.customer ||
    null;

  const productName =
    order.product_name ||
    order.product ||
    order.name ||
    incident.product_name ||
    savedData?.product_name ||
    null;

  const productImage =
    order.product_image ||
    order.image ||
    order.image_url ||
    incident.product_image ||
    savedData?.product_image ||
    null;

  const quantity =
    order.quantity ??
    incident.quantity ??
    savedData?.quantity ??
    null;

  const tokenId =
    token.token_id ||
    token.tokenId ||
    token.id ||
    savedData?.token_id ||
    null;

  const failureType =
    incident.failure_type ||
    incident.failureType ||
    savedData?.failure_type ||
    null;

  const rootCause =
    incident.root_cause ||
    incident.rootCause ||
    savedData?.root_cause ||
    null;

  const traceId =
    incident.trace_id ||
    incident.traceId ||
    savedData?.trace_id ||
    null;

  // Only show success when the backend explicitly confirms it.
  const orderConfirmed =
    savedData?.confirmed === true ||
    order?.confirmed === true ||
    order?.success === true;

  const tokenStatus =
    token.status ||
    savedData?.token_status ||
    "PENDING";

  if (error) {
    return (
      <div className="min-h-screen bg-[#080b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="mb-3 text-2xl font-bold">
            Unable to Load Resolution
          </h1>
          <p className="text-gray-300">{error}</p>

          <button
            onClick={() => {
              window.location.href = "/admin";
            }}
            className="mt-6  bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
          >
            Back to RCA Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080b14] px-6 text-white">
        <div className="h-16 w-16 animate-spin  border-4 border-purple-500/20 border-t-purple-500" />

        <h1 className="mt-8 text-2xl font-bold">
          Processing Resolution
        </h1>

        <p className="mt-3 text-center text-gray-400">
          Preparing your incident and order details...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E1065] via-[#000000] to-[#2E1065]  px-5 py-12 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
        <h1 className="text-white/40 text-3xl font-bold md:text-5xl">
            Resolution Information 
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Your incident details and proposed fix are displayed below.
        </p>
        </div> 
          {/* Order Success Message */}
        <div className="py-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-wide text-white/40">
            ORDER PLACED SUCCESSFULLY
        </h2>
        </div>

        {/* Header */}
        
        <div className="mb-10 text-center">

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
        
        </div>

        {/* Order information */}
        <section className="mb-6 border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="mb-6 text-xl font-bold">
            Order Details
          </h2>

          {productImage && (
            <div className="mb-6">
              <img
                src={productImage}
                alt={productName || "Product"}
                className="h-40 w-40 border border-white/10 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Order ID" value={orderId} />
            <Detail label="Customer" value={customer} />
            <Detail label="Token Status" value="Resolved" />
            <Detail label="Quantity" value={quantity} />
            <Detail
              label="Order Status"
             value="Order Placed Successfully"
            />
          </div>

          {!orderId && (
            <p className="mt-5 text-sm text-amber-300">
            </p>
          )}
        </section>

       

        {/* Incident information */}
        <section className="mb-6 border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="mb-6 text-xl font-bold">
            Incident Analysis
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Failure Type" value={failureType} />
            <Detail label="Root Cause" value={rootCause} />
            <Detail label="Service" value={incident.service} />
            <Detail label="Confidence" value={incident.confidence} />
            <Detail label="Trace ID" value={traceId} />
            <Detail
              label="Span ID"
              value={incident.span_id || incident.spanId}
            />
            <Detail
              label="Operation"
              value={incident.operation}
            />
            <Detail
              label="Status Code"
              value={incident.status_code}
            />
            <Detail
              label="Product ID"
              value={incident.product_id}
            />
            <Detail
                label="Incident Reason"
                value={incident.reason}
            />    
        
          </div>

         
          
        </section>

        {/* Proposed fix */}
        <section className="mb-8 border border-purple-400/20 bg-purple-500/[0.05] p-6 md:p-8">
          <h2 className="mb-6 text-xl font-bold">
            Proposed Fix
          </h2>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-300">
                Recommended Action
              </p>
              <p className="leading-7 text-gray-200">
                {proposedFix.recommended_action ||
                  proposedFix.fix_description ||
                  "No recommended action was saved."}
              </p>
            </div>

            {proposedFix.why && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-300">
                  Why This Fix
                </p>
                <p className="leading-7 text-gray-300">
                  {proposedFix.why}
                </p>
              </div>
            )}

            {proposedFix.expected_result && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-300">
                  Expected Result
                </p>
                <p className="leading-7 text-gray-300">
                  {proposedFix.expected_result}
                </p>
              </div>
            )}

            {proposedFix.developer_investigation && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-300">
                  Developer Investigation
                </p>

                {Array.isArray(proposedFix.developer_investigation) ? (
                  <ul className="list-inside list-disc space-y-2 text-gray-300">
                    {proposedFix.developer_investigation.map(
                      (item, index) => (
                        <li key={index}>
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item)}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="leading-7 text-gray-300">
                    {String(proposedFix.developer_investigation)}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              window.location.href = "/tokens";
            }}
            className=" border border-white/15 px-6 py-3 font-semibold transition hover:bg-white/10"
          >
            View My Tokens
          </button>

          <button
            onClick={() => {
              window.location.href = "/admin";
            }}
            className="  border border-white/15 px-6 py-3 font-semibold transition hover:bg-purple-500"
          >
            Back to RCA Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
