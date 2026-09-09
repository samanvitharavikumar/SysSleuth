import { useEffect, useState } from "react";

export default function UserRCADashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // ============================================================
  // PRODUCT ID
  // ============================================================

  const params = new URLSearchParams(
    window.location.search
  );

  const productId =
    params.get("product_id") ||
    sessionStorage.getItem("rca_product_id");


  // ============================================================
  // FIND TRACE
  //
  // This is calculated on every render.
  // It does NOT use a hook, so it is safe before returns.
  // ============================================================

  const trace =
    data?.traces?.find(
      (item) =>
        String(item.product_id) === String(productId) &&
        item.trace_id
    ) ||
    data?.traces?.find(
      (item) =>
        String(item.failure_type || "").toLowerCase() ===
          String(data?.failure_type || "").toLowerCase() &&
        item.trace_id
    ) ||
    data?.traces?.find(
      (item) => item.trace_id
    );


  // ============================================================
  // REAL TRACE ID
  // ============================================================

  const traceId = trace?.trace_id;

  const hasTraceId =
    Boolean(
      traceId &&
      String(traceId).trim()
    );
    // ============================================================
// SAVE INCIDENT DATA FOR COMPLAINT PAGE
// ============================================================

useEffect(() => {
  if (trace?.trace_id) {
    sessionStorage.setItem(
      "rca_trace_id",
      trace.trace_id
    );
  }

  if (trace?.span_id) {
    sessionStorage.setItem(
      "rca_span_id",
      trace.span_id
    );
  }

  if (productId) {
    sessionStorage.setItem(
      "rca_product_id",
      productId
    );
  }
}, [trace, productId]);

  // ============================================================
  // LOAD RCA DATA
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadRCA() {
      try {
        if (!productId) {
          throw new Error(
            "No product ID found for this incident."
          );
        }

        const url =
          `http://localhost:8010/analyze/inventory-service` +
          `?product_id=${encodeURIComponent(productId)}`;

        console.log(
          "================================="
        );

        console.log(
          "USER RCA REQUEST:",
          url
        );

        console.log(
          "================================="
        );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `RCA backend returned ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "USER RCA DATA:",
          result
        );

        if (cancelled) {
          return;
        }


        // --------------------------------------------------------
        // Jaeger may need a moment to receive the latest trace.
        // --------------------------------------------------------

        if (
          String(
            result.failure_type || ""
          ).toUpperCase() === "UNKNOWN"
        ) {
          console.log(
            "RCA still UNKNOWN. Retrying..."
          );

          setTimeout(() => {
            if (!cancelled) {
              loadRCA();
            }
          }, 2000);

          return;
        }


        setData(result);

      } catch (err) {

        if (!cancelled) {
          console.error(
            "RCA ERROR:",
            err
          );

          setError(err.message);
        }
      }
    }

    loadRCA();

    return () => {
      cancelled = true;
    };

  }, [productId]);


  // ============================================================
  // AI EXPLANATION
  //
  // IMPORTANT:
  //
  // This hook is ABOVE ALL RETURN STATEMENTS.
  //
  // The REAL TRACE ID is explicitly sent to Gemma 3.
  // ============================================================

  useEffect(() => {

    if (!data || !traceId) {
      return;
    }

    let cancelled = false;

    async function generateAIExplanation() {

      setAiLoading(true);
      setAiError(null);
      setAiExplanation("");


      try {

        console.log(
          "================================="
        );

        console.log(
          "SENDING REAL TRACE ID TO AI:",
          traceId
        );

        console.log(
          "================================="
        );


        const prompt = `
You are the customer-facing AI assistant for SysSleuth.

Your job is to explain an actual e-commerce checkout
failure to a normal customer.

The Trace ID below belongs to the REAL incident that
just occurred.

REAL INCIDENT TRACE ID:
${traceId}

Use the incident information below to explain what
actually happened.

Do not invent anything.

Do not blame the customer.

Do not expose internal technical implementation
details.

The customer should understand the problem without
having technical knowledge.

Do NOT mention:
- OpenTelemetry
- Jaeger
- spans
- traces
- telemetry
- logs
- microservices
- distributed systems
- HTTP status codes
- internal service names
- database technology
- programming
- APIs

The customer needs to know:

1. What went wrong
2. What happened to their order
3. Whether they did anything wrong
4. What they should do next

============================================================
ACTUAL INCIDENT
============================================================

Trace ID:
${traceId}

Failure type:
${data.failure_type || "Unknown"}

Root cause:
${data.root_cause || "Unknown"}

Reason:
${data.reason || "Unknown"}

Product ID:
${productId || "Unknown"}

Quantity:
${trace?.quantity ?? "Unknown"}

Service involved:
${trace?.service || data.service || "Unknown"}

Status:
${trace?.status_code ?? data.status_code ?? "Unknown"}

Operation:
${trace?.operation || "Unknown"}

============================================================

Return ONLY the following format:

WHAT HAPPENED

Explain the problem in 2 or 3 simple sentences.

WHAT THIS MEANS

Explain what this means for the customer's order in
1 or 2 simple sentences.

WHAT YOU CAN DO

Give the customer a simple next step in 1 or 2 sentences.

Keep the entire response below 150 words.

Be calm, clear and reassuring.
`;


        const response = await fetch(
          "http://localhost:11434/api/generate",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              model: "gemma3",
              prompt: prompt,
              stream: false,
            }),
          }
        );


        if (!response.ok) {
          throw new Error(
            `Ollama returned ${response.status}`
          );
        }


        const result =
          await response.json();


        console.log(
          "AI RESPONSE:",
          result
        );


        if (cancelled) {
          return;
        }


        if (!result.response) {
          throw new Error(
            "Ollama returned an empty response."
          );
        }


        setAiExplanation(
          result.response.trim()
        );


      } catch (err) {

        if (!cancelled) {

          console.error(
            "AI EXPLANATION ERROR:",
            err
          );

          setAiError(
            "The AI explanation could not be generated."
          );
        }

      } finally {

        if (!cancelled) {
          setAiLoading(false);
        }

      }
    }


    generateAIExplanation();


    return () => {
      cancelled = true;
    };

  }, [
    data,
    traceId,
    productId
  ]);


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (
      <div className="min-h-screen bg-[#071A2F] text-white flex items-center justify-center">

        <div className="text-center max-w-xl px-8">

          <p className="text-xs tracking-[0.3em] text-[#8EA7B8] font-bold">
            SYSSLEUTH
          </p>

          <h1 className="text-4xl font-black mt-5">
            RCA unavailable
          </h1>

          <p className="mt-4 text-[#8EA7B8]">
            {error}
          </p>

          <button
            onClick={() => {
              window.location.href = "/user";
            }}
            className="mt-8 border border-white/30 px-6 py-3 text-xs tracking-widest hover:bg-white hover:text-[#071A2F] transition"
          >
            BACK TO STORE
          </button>

        </div>

      </div>
    );
  }


  // ============================================================
  // LOADING
  // ============================================================

  if (!data) {

    return (
      <div className="min-h-screen bg-[#071A2F] text-white flex items-center justify-center">

        <div className="text-center">

          <p className="text-xs tracking-[0.3em] text-[#8EA7B8] font-bold">
            SYSSLEUTH
          </p>

          <p className="text-lg mt-5 text-[#B8C9D4]">
            Analyzing what went wrong...
          </p>

        </div>

      </div>
    );
  }


  // ============================================================
  // CONFIDENCE
  // ============================================================

  const confidence = Math.round(
    (data.confidence ?? 0) * 100
  );


  // ============================================================
  // USER RCA DASHBOARD
  // ============================================================

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#123B5D] via-[#0B2D4D] to-[#164E63] text-white">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="h-[82px] border-b border-white/10 px-14 flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-black tracking-[0.22em]">
            SYSSLEUTH
          </h1>

          <p className="text-[9px] tracking-[0.28em] text-[#71899A] mt-1">
            INCIDENT EXPLANATION
          </p>

        </div>


        <button
          onClick={() => {
            window.location.href = "/user";
          }}
          className="border border-[#6E8799]/50 px-7 py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
        >
          BACK TO STORE
        </button>

      </nav>



      <main className="max-w-[1400px] mx-auto px-10 md:px-16">


        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="py-20 border-b border-white/10">

          <p className="text-[10px] tracking-[0.35em] text-[#8198A9] font-bold">
            INCIDENT INVESTIGATION
          </p>


          <h1 className="text-[52px] md:text-[80px] leading-[0.9] font-black tracking-[-0.05em] mt-6">

            Root Cause

            <br />

            <span className="text-[#657D91]">
              Analysis.
            </span>

          </h1>


          <p className="mt-10 text-sm md:text-base text-[#7890A1]">
            Automated analysis of logs, metrics and distributed traces.
          </p>

        </section>



        {/* ==================================================
            FAILURE SUMMARY
        ================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10">


          <InfoCard
            title="FAILURE TYPE"
            value={data.failure_type}
          />


        

          <InfoCard
            title="CONFIDENCE"
            value={`${confidence}%`}
          />


          <InfoCard
            title="STATUS CODE"
            value={
              trace?.status_code ??
              data.status_code ??
              "N/A"
            }
          />


        </section>



      
       



        {/* ==================================================
            AI EXPLANATION
        ================================================== */}

        <section className="py-16 border-b border-white/10">


          <div className="mb-10">


            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              AI ASSISTANT
            </p>


            <h2 className="text-4xl md:text-5xl font-black mt-4">
              What happened?
            </h2>


            <p className="text-[#7890A1] mt-4">
              A simple explanation of the issue with your checkout.
            </p>


          </div>



          {/* =================================================
              AI BOX
          ================================================= */}

          <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10">


            {/* NO TRACE */}

            {!hasTraceId && (

              <div>

                <p className="text-red-300 font-bold">
                  TRACE ID NOT FOUND
                </p>


                <p className="text-[#8FA4B3] mt-3">
                  The AI explanation cannot be generated
                  because the actual incident Trace ID
                  was not returned by the RCA system.
                </p>

              </div>

            )}



            {/* AI LOADING */}

            {hasTraceId && aiLoading && (

              <div className="flex items-center gap-4">


                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />


                <div>

                  <p className="text-[#D8E3E9] font-semibold">
                    Understanding what happened...
                  </p>


                  <p className="text-xs text-[#718A9D] mt-2">
                    Analyzing incident {traceId}
                  </p>

                </div>


              </div>

            )}



            {/* AI ERROR */}

            {hasTraceId && aiError && (

              <div>

                <p className="text-red-300 font-semibold">
                  {aiError}
                </p>


                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="mt-5 border border-white/20 px-5 py-3 text-xs tracking-widest hover:bg-white hover:text-[#071A2F] transition"
                >
                  TRY AGAIN
                </button>

              </div>

            )}



            {/* AI RESPONSE */}

            {hasTraceId &&
              !aiLoading &&
              !aiError &&
              aiExplanation && (

                <div>

                  <div className="whitespace-pre-line text-[#D8E3E9] leading-8 text-base md:text-lg">
                    {aiExplanation}
                  </div>


                </div>

              )}


          </div>


        </section>



        {/* ==================================================
            TELEMETRY
        ================================================== */}

        <section className="py-16">


          <div className="mb-10">


            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              TELEMETRY
            </p>


            <h2 className="text-4xl md:text-5xl font-black mt-4">
              Failure Trace
            </h2>


          </div>



          {/* TRACE MUST EXIST */}

          {!hasTraceId ? (

            <div className="border border-red-400/30 p-8">

              <p className="text-red-300 font-bold">
                TRACE NOT FOUND
              </p>


              <p className="text-[#8FA4B3] mt-3">
                The RCA system did not return the actual
                Trace ID for this incident.
              </p>

            </div>

          ) : (

            <div className="border border-white/10">


              {/* =================================================
                  TRACE ID
              ================================================= */}

              <div className="p-8 md:p-10 border-b border-white/10">


                <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
                  TRACE ID
                </p>


                <p className="text-xl md:text-2xl font-mono font-bold text-white mt-4 break-all">
                  {trace.trace_id}
                </p>


              </div>



              {/* =================================================
                  TRACE INFORMATION
              ================================================= */}

              <div className="grid grid-cols-1 md:grid-cols-2">


                <TraceItem
                  title="SPAN ID"
                  value={trace.span_id}
                />


                <TraceItem
                  title="OPERATION"
                  value={trace.operation}
                />


              
                <TraceItem
                  title="HTTP METHOD"
                  value={trace.http_method}
                />


                <TraceItem
                  title="STATUS CODE"
                  value={trace.status_code}
                />


                <TraceItem
                  title="PRODUCT ID"
                  value={trace.product_id}
                />


                <TraceItem
                  title="QUANTITY"
                  value={trace.quantity}
                />


              </div>


            </div>

          )}

        </section>



        {/* ==================================================
            RAISE COMPLAINT
        ================================================== */}

        <section className="py-16 border-t border-white/10">

          <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

            <div>

              <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
                NEED HELP?
              </p>

              <h2 className="text-3xl md:text-4xl font-black mt-4">
                Raise a Complaint
              </h2>

              <p className="text-[#7890A1] mt-3 max-w-xl">
                Report this checkout issue and provide more information
                about what happened.
              </p>

            </div>

            <button
              onClick={() => {
                if (!hasTraceId) {
                  alert("The incident Trace ID is not available yet.");
                  return;
                }

                window.location.href = "/complaint";
              }}
              disabled={!hasTraceId}
              className="border border-white/30 px-8 py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              RAISE A COMPLAINT
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}



// ============================================================
// INFO CARD
// ============================================================

function InfoCard({ title, value }) {
  return (
    <div className="p-10 border-r border-b border-white/10 min-h-[190px] flex flex-col justify-between">

      <p className="text-[10px] tracking-[0.28em] text-[#718A9D] font-bold">
        {title}
      </p>

      <p className="text-2xl md:text-3xl font-black mt-8 break-all">
        {value ?? "N/A"}
      </p>

    </div>
  );
}


// ============================================================
// TRACE ITEM
// ============================================================

function TraceItem({ title, value }) {
  return (
    <div className="p-8 md:p-10 border-r border-b border-white/10 min-h-[145px]">

      <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold mb-5">
        {title}
      </p>

      <p className="font-semibold text-[#D9E4E9] break-all">
        {value ?? "N/A"}
      </p>

    </div>
  );
}
