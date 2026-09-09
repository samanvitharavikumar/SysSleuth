import React, { useState } from "react";

export default function Complaint() {
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const traceId =
    sessionStorage.getItem("rca_trace_id") ||
    "TRACE ID NOT FOUND";

  const spanId =
    sessionStorage.getItem("rca_span_id") ||
    "SPAN ID NOT FOUND";

  const productId =
    sessionStorage.getItem("rca_product_id") ||
    "PRODUCT ID NOT FOUND";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !reason.trim()) {
      alert("Please enter your name and reason.");
      return;
    }

    const complaint = {
      name,
      reason,
      trace_id: traceId,
      span_id: spanId,
      product_id: productId,
      created_at: new Date().toISOString(),
    };

    console.log("COMPLAINT:", complaint);

    const existingTokens = JSON.parse(
  localStorage.getItem("raised_tokens") || "[]"
);

const token = {
  id: `TOKEN-${Date.now()}`,
  name,
  reason,
  trace_id: traceId,
  span_id: spanId,
  product_id: productId,
  created_at: new Date().toISOString(),
};

existingTokens.push(token);

localStorage.setItem(
  "raised_tokens",
  JSON.stringify(existingTokens)
);

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#071A2F] text-white">

      {/* NAVBAR */}
      <nav className="h-[82px] border-b border-white/10 px-8 md:px-14 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-black tracking-[0.22em]">
            SYSSLEUTH
          </h1>

          <p className="text-[9px] tracking-[0.28em] text-[#71899A] mt-1">
            INCIDENT REPORT
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = "/rca";
          }}
          className="border border-[#6E8799]/50 px-6 py-3 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
        >
          BACK TO RCA
        </button>

      </nav>


      {/* CONTENT */}
      <main className="max-w-[1000px] mx-auto px-6 md:px-12 py-16">

        <div className="mb-12">

          <p className="text-[10px] tracking-[0.35em] text-[#8198A9] font-bold">
            INCIDENT REPORT
          </p>

          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] mt-5">
            Raise a
            <br />
            <span className="text-[#657D91]">
              Complaint.
            </span>
          </h1>

          <p className="mt-8 text-[#7890A1] max-w-xl">
            Tell us what happened. Your incident identifiers
            are attached automatically so the issue can be investigated.
          </p>

        </div>


        {submitted ? (

          /* SUCCESS */
          <div className="border border-white/10 bg-white/[0.03] p-8 md:p-12">

            <p className="text-[10px] tracking-[0.3em] text-green-300 font-bold">
              SUBMITTED
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-5">
              Complaint received.
            </h2>

            <p className="text-[#7890A1] mt-5">
              Your complaint has been recorded with the incident
              information attached.
            </p>

            <div className="mt-10 space-y-6">

              <div>
                <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold">
                  TRACE ID
                </p>

                <p className="font-mono mt-3 break-all">
                  {traceId}
                </p>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold">
                  SPAN ID
                </p>

                <p className="font-mono mt-3 break-all">
                  {spanId}
                </p>
              </div>

            </div>

          </div>

        ) : (

          /* FORM */
          <form
            onSubmit={handleSubmit}
            className="border border-white/10 bg-white/[0.03]"
          >

            {/* INCIDENT INFORMATION */}
            <div className="p-8 md:p-10 border-b border-white/10">

              <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold mb-8">
                INCIDENT INFORMATION
              </p>


              {/* TRACE ID */}
              <div className="mb-8">

                <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold">
                  TRACE ID
                </p>

                <div className="mt-3 border border-white/10 bg-black/10 p-5 font-mono text-sm break-all">
                  {traceId}
                </div>

              </div>


              {/* SPAN ID */}
              <div className="mb-8">

                <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold">
                  SPAN ID
                </p>

                <div className="mt-3 border border-white/10 bg-black/10 p-5 font-mono text-sm break-all">
                  {spanId}
                </div>

              </div>


              {/* PRODUCT ID */}
              <div>

                <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold">
                  PRODUCT ID
                </p>

                <div className="mt-3 border border-white/10 bg-black/10 p-5 font-mono text-sm">
                  {productId}
                </div>

              </div>

            </div>


            {/* USER DETAILS */}
            <div className="p-8 md:p-10">

              <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold mb-8">
                YOUR DETAILS
              </p>


              {/* NAME */}
              <div className="mb-8">

                <label className="block text-[10px] tracking-[0.25em] text-[#718A9D] font-bold mb-3">
                  NAME
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-transparent border border-white/10 px-5 py-4 text-white outline-none focus:border-white/40"
                />

              </div>


              {/* REASON */}
              <div className="mb-10">

                <label className="block text-[10px] tracking-[0.25em] text-[#718A9D] font-bold mb-3">
                  REASON
                </label>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe what went wrong..."
                  rows={7}
                  className="w-full bg-transparent border border-white/10 px-5 py-4 text-white outline-none resize-none focus:border-white/40"
                />

              </div>


              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full border border-white/30 py-5 text-[10px] tracking-[0.2em] font-bold hover:bg-white hover:text-[#071A2F] transition"
              >
                SUBMIT COMPLAINT
              </button>

            </div>

          </form>

        )}

      </main>

    </div>
  );
}