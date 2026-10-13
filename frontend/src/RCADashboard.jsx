import { useEffect, useState } from "react";


// ============================================================
// RCA DASHBOARD
// ============================================================

export default function RCADashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Admin AI proposed fix
  const [proposedFix, setProposedFix] = useState(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState(null);


  // ==========================================================
  // LOAD RCA
  // ==========================================================

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    async function loadRCA() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const productId = params.get("product_id");

        let url =
          "http://localhost:8010/analyze/inventory-service";

        if (productId) {
          url += `?product_id=${encodeURIComponent(productId)}`;
        }

        console.log("RCA REQUEST:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }

        const result = await response.json();

        console.log("RCA DATA:", result);

        if (cancelled) {
          return;
        }


        // ------------------------------------------------------
        // RETRY IF RCA IS UNKNOWN
        // ------------------------------------------------------

        if (
          productId &&
          String(result.failure_type || "")
            .toUpperCase() === "UNKNOWN"
        ) {
          console.log(
            "RCA UNKNOWN - waiting for telemetry and retrying..."
          );

          retryTimer = setTimeout(() => {
            if (!cancelled) {
              loadRCA();
            }
          }, 2000);

          return;
        }


        // ------------------------------------------------------
        // STORE RCA RESULT
        // ------------------------------------------------------

        setData(result);


        // ------------------------------------------------------
        // GENERATE ADMIN AI PROPOSED FIX
        // ------------------------------------------------------

        setFixLoading(true);
        setFixError(null);
        setProposedFix(null);

        try {
          const trace = getBestTrace(
            result,
            productId
          );

          console.log(
            "TRACE SENT TO ADMIN AI:",
            trace
          );

          const fixResponse = await fetch(
            "http://localhost:8005/propose-fix",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                failure_type:
                  result.failure_type ||
                  "UNKNOWN",

                root_cause:
                  result.root_cause ||
                  "",

                reason:
                  result.reason ||
                  "",

                service:
                  result.service ||
                  trace?.service ||
                  "inventory-service",

                confidence:
                  result.confidence ??
                  null,

                trace_id:
                  result.trace_id ||
                  trace?.trace_id ||
                  null,

                span_id:
                  result.span_id ||
                  trace?.span_id ||
                  null,

                operation:
                  result.operation ||
                  trace?.operation ||
                  null,

                status_code:
                  result.status_code ||
                  trace?.status_code ||
                  null,

               
product_id:
  productId != null && productId !== ""
    ? String(productId)
    : result.product_id != null
      ? String(result.product_id)
      : trace?.product_id != null
        ? String(trace.product_id)
        : null,


                quantity:
                  result.quantity ||
                  trace?.quantity ||
                  null,
              }),
            }
          );


          if (!fixResponse.ok) {
            throw new Error(
              `Admin AI returned ${fixResponse.status}`
            );
          }


          const fixResult =
            await fixResponse.json();

          console.log(
            "PROPOSED FIX RESULT:",
            fixResult
          );


          if (!cancelled) {
            setProposedFix(fixResult);
          }

        } catch (err) {
          console.error(
            "PROPOSED FIX ERROR:",
            err
          );

          if (!cancelled) {
            setFixError(
              err?.message ||
              "Unable to generate proposed fix."
            );
          }

        } finally {
          if (!cancelled) {
            setFixLoading(false);
          }
        }

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "RCA ERROR:",
          err
        );

        setError(
          err?.message ||
          "Unable to load RCA."
        );
      }
    }


    loadRCA();


    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      cancelled = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };

  }, []);


  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#071A2F] via-[#0B2D4D] to-[#164E63] text-white flex items-center justify-center">

        <div className="text-center px-6">

          <p className="text-xs tracking-[0.3em] text-[#8EA7B8] font-bold">
            SYSSLEUTH
          </p>

          <h1 className="text-5xl font-black mt-4">
            RCA unavailable
          </h1>

          <p className="mt-4 text-[#8EA7B8]">
            {error}
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#071A2F] via-[#0B2D4D] to-[#164E63] text-white flex items-center justify-center">

        <div className="text-center">

          <p className="text-xs tracking-[0.3em] text-[#8EA7B8] font-bold">
            SYSSLEUTH / FAILURE INVESTIGATION
          </p>

          <p className="text-lg mt-5 text-[#B8C9D4]">
            Analyzing failure...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PRODUCT ID
  // ==========================================================

  const params = new URLSearchParams(
    window.location.search
  );

  const productId =
    params.get("product_id");


  // ==========================================================
  // BEST TRACE
  // ==========================================================

  const trace = getBestTrace(
    data,
    productId
  );


  // ==========================================================
  // CONFIDENCE
  // ==========================================================

  const confidence =
    data.confidence != null
      ? Math.round(
          Number(data.confidence) * 100
        )
      : 0;


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6B21A8] via-[#2E1065] to-[#000000] text-white">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="min-h-[82px] border-b border-white/10 px-6 md:px-14 py-5 flex flex-col md:flex-row items-center justify-between gap-5">

        <div>

          <h1 className="text-xl md:text-2xl font-black tracking-[0.16em] md:tracking-[0.22em]">
            SYSSLEUTH / FAILURE INVESTIGATION
          </h1>

          <p className="text-[9px] tracking-[0.28em] text-[#71899A] mt-1">
            SYSTEM INTELLIGENCE RCA DASHBOARD
          </p>

        </div>


        <div className="flex gap-3">

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="border border-[#6E8799]/50 px-5 md:px-7 py-3 md:py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
          >
            BACK TO STORE
          </button>


          <button
            onClick={() => {
              window.location.href = "/tokens";
            }}
            className="border border-[#6E8799]/50 px-5 md:px-7 py-3 md:py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
          >
            TOKENS RAISED
          </button>

        </div>

      </nav>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="max-w-[1520px] mx-auto px-6 md:px-14 lg:px-16">


        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="min-h-[300px] border-b border-white/10 relative flex flex-col justify-center">

          <div className="absolute top-0 left-0 flex items-center gap-4">

            <div className="w-11 h-[1px] bg-white/70" />

            <p className="text-[10px] tracking-[0.35em] text-[#8198A9] font-bold">
              SYSTEM INTELLIGENCE
            </p>

          </div>


          <h1 className="text-[48px] md:text-[85px] leading-[0.86] font-black tracking-[-0.06em] max-w-4xl">

            Root Cause

            <br />

            <span className="text-[#657D91]">
              Analysis.
            </span>

          </h1>


          <p className="mt-12 text-sm md:text-base text-[#7890A1]">
            Automated analysis of logs, metrics and distributed traces.
          </p>

        </section>


        {/* ====================================================
            FAILURE / ROOT CAUSE
        ==================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-2 border-b border-white/10">

          <div className="py-14 md:pr-14 md:border-r border-white/10">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              FAILURE TYPE
            </p>

            <h2 className="text-2xl font-black mt-8 tracking-tight">
              {data.failure_type || "UNKNOWN"}
            </h2>

          </div>


          <div className="py-14 md:pl-14">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              ROOT CAUSE
            </p>

            <h2 className="text-2xl md:text-3xl font-black mt-8">
              {data.root_cause || "Unknown"}
            </h2>

            <p className="text-sm text-[#7890A1] mt-5 max-w-2xl leading-relaxed">
              {data.reason || "No reason available."}
            </p>

          </div>

        </section>


        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10">

          <InfoCard
            title="SERVICE"
            value={
              data.service ||
              trace?.service ||
              "N/A"
            }
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


        {/* ====================================================
            FAILURE TRACE
        ==================================================== */}

        <section className="py-16 border-b border-white/10">

          <div className="mb-10">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              TELEMETRY
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              Failure Trace
            </h2>

          </div>


          {trace ? (

            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-white/10">

              <TraceItem
                title="TRACE ID"
                value={trace.trace_id}
              />

              <TraceItem
                title="SPAN ID"
                value={trace.span_id}
              />

              <TraceItem
                title="OPERATION"
                value={trace.operation}
              />

              <TraceItem
                title="SERVICE"
                value={trace.service}
              />

              <TraceItem
                title="FAILURE TYPE"
                value={trace.failure_type}
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

          ) : (

            <p className="text-[#718A9D]">
              No failure trace found.
            </p>

          )}

        </section>


        {/* ====================================================
            TRACE TIMELINE
        ==================================================== */}

        <section className="py-16 border-b border-white/10">

          <div className="mb-12">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              EXECUTION
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              Trace Timeline
            </h2>

          </div>


          {trace ? (

            <>

              <div className="relative border-l border-white/15 ml-3">

                <TimelineItem
                  title="START TIME"
                  value={formatTraceTime(
                    trace.start_time
                  )}
                />

                <TimelineItem
                  title="FAILURE DETECTED"
                  value={
                    trace.failure_type ||
                    data.failure_type ||
                    "UNKNOWN"
                  }
                />

                <TimelineItem
                  title="END TIME"
                  value={formatTraceTime(
                    trace.end_time
                  )}
                />

              </div>


              <div className="mt-12 border-t border-b border-white/10 py-7 flex justify-between items-center">

                <span className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
                  TOTAL TRACE DURATION
                </span>

                <span className="text-2xl md:text-3xl font-black text-[#DCE6EC]">
                  {trace.duration_ms != null
                    ? `${trace.duration_ms} ms`
                    : "N/A"}
                </span>

              </div>

            </>

          ) : (

            <p className="text-[#718A9D]">
              No trace timeline available.
            </p>

          )}

        </section>


        {/* ====================================================
            EVIDENCE
        ==================================================== */}

        <section className="py-16 border-b border-white/10">

          <div className="mb-10">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              ANALYSIS
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              Evidence
            </h2>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-white/10">

            <InfoCard
              title="LOGS ANALYZED"
              value={
                data.evidence?.logs_checked ??
                0
              }
            />

            <InfoCard
              title="FAILURE TRACES"
              value={
                data.evidence?.failure_traces ??
                0
              }
            />

          </div>

        </section>


        {/* ====================================================
            AI PROPOSED FIX
        ==================================================== */}

        <section className="py-16 border-b border-white/10">

          <div className="mb-10">

            <p className="text-[10px] tracking-[0.3em] text-cyan-300 font-bold">
              AI ASSISTANCE
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              Proposed Fix
            </h2>

            <p className="mt-4 text-sm text-[#8EA7B8]">
              Developer-oriented remediation guidance generated from the RCA.
            </p>

          </div>


          {/* ==================================================
              AI LOADING
          ================================================== */}

          {fixLoading && (

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">

              <p className="text-white/50">
                Generating developer remediation guidance...
              </p>

            </div>

          )}


          {/* ==================================================
              AI ERROR
          ================================================== */}

          {!fixLoading && fixError && (

            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8">

              <p className="text-red-300">
                Unable to generate proposed fix:{" "}
                {fixError}
              </p>

            </div>

          )}


          {/* ==================================================
              AI RESULT
          ================================================== */}

          {!fixLoading &&
            !fixError &&
            proposedFix && (

              <div className="space-y-5">


                {/* ==================================================
                    RECOMMENDED ACTION
                ================================================== */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">

                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">

                    <div>

                      <p className="text-[10px] tracking-[0.28em] text-purple-300/70 font-bold">
                        RECOMMENDED ACTION
                      </p>

                      <p className="text-lg font-semibold mt-4 text-white/90 leading-relaxed">
                        {proposedFix.recommended_action ||
                          "No recommended action returned."}
                      </p>

                    </div>


                    {proposedFix.confidence && (

                      <div className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2">

                        <span className="text-xs font-bold text-cyan-300">
                          {proposedFix.confidence}
                        </span>

                      </div>

                    )}

                  </div>

                </div>


                {/* ==================================================
                    WHY
                ================================================== */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">

                  <p className="text-[10px] tracking-[0.28em] text-purple-300/70 font-bold">
                    WHY
                  </p>

                  <p className="mt-4 text-white/65 leading-relaxed">
                    {proposedFix.why ||
                      "No explanation returned."}
                  </p>

                </div>


                {/* ==================================================
                    DEVELOPER INVESTIGATION
                ================================================== */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">

                  <p className="text-[10px] tracking-[0.28em] text-purple-300/70 font-bold">
                    DEVELOPER INVESTIGATION
                  </p>


                  <div className="mt-5 space-y-4">

                    {Array.isArray(
                      proposedFix.developer_investigation
                    ) &&
                    proposedFix.developer_investigation.length > 0 ? (

                      proposedFix.developer_investigation.map(
                        (item, index) => (

                          <div
                            key={index}
                            className="flex gap-4 text-white/70 leading-relaxed"
                          >

                            <span className="text-cyan-300 font-bold">
                              {index + 1}.
                            </span>

                            <span>
                              {item}
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <p className="text-white/50">
                        No developer investigation steps returned.
                      </p>

                    )}

                  </div>

                </div>


                {/* ==================================================
                    EXPECTED RESULT
                ================================================== */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">

                  <p className="text-[10px] tracking-[0.28em] text-purple-300/70 font-bold">
                    EXPECTED RESULT
                  </p>

                  <p className="mt-4 text-white/65 leading-relaxed">
                    {proposedFix.expected_result ||
                      "No expected result returned."}
                  </p>

                </div>

              </div>

            )}


        </section>


      </main>

    </div>
  );
}


// ============================================================
// SELECT BEST TRACE
// ============================================================

function getBestTrace(
  result,
  productId
) {
  if (
    !result ||
    !Array.isArray(result.traces) ||
    result.traces.length === 0
  ) {
    return (
      result?.failure_trace ||
      null
    );
  }


  // ----------------------------------------------------------
  // 1. PRODUCT MATCH
  // ----------------------------------------------------------

  if (productId) {

    const productTrace =
      result.traces.find(
        (trace) =>
          String(trace?.product_id) ===
          String(productId)
      );

    if (productTrace) {
      return productTrace;
    }
  }


  // ----------------------------------------------------------
  // 2. FAILURE TYPE MATCH
  // ----------------------------------------------------------

  const matchingTrace =
    result.traces.find(
      (trace) =>
        String(
          trace?.failure_type ||
          ""
        ).toLowerCase() ===
        String(
          result.failure_type ||
          ""
        ).toLowerCase()
    );

  if (matchingTrace) {
    return matchingTrace;
  }


  // ----------------------------------------------------------
  // 3. SERVICE MATCH
  // ----------------------------------------------------------

  const serviceTrace =
    result.traces.find(
      (trace) =>
        trace?.service ===
        result.service
    );

  if (serviceTrace) {
    return serviceTrace;
  }


  // ----------------------------------------------------------
  // 4. FIRST TRACE
  // ----------------------------------------------------------

  return result.traces[0];
}


// ============================================================
// FORMAT TRACE TIME
// ============================================================

function formatTraceTime(
  timestamp
) {
  if (timestamp == null) {
    return "N/A";
  }

  try {
    const numericTimestamp =
      Number(timestamp);

    if (
      !Number.isFinite(
        numericTimestamp
      )
    ) {
      return "N/A";
    }

    // Jaeger timestamps are commonly
    // stored in microseconds.
    const milliseconds =
      numericTimestamp > 10000000000000
        ? numericTimestamp / 1000
        : numericTimestamp;

    return new Date(
      milliseconds
    ).toLocaleString();

  } catch {
    return "N/A";
  }
}


// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  title,
  value,
}) {
  return (
    <div className="p-8 border-r border-b border-white/10 min-h-[145px] flex flex-col justify-between">

      <p className="text-[10px] tracking-[0.28em] text-[#718A9D] font-bold">
        {title}
      </p>

      <p className="text-2xl md:text-3xl font-black mt-7 break-all">
        {value ?? "N/A"}
      </p>

    </div>
  );
}


// ============================================================
// TRACE ITEM
// ============================================================

function TraceItem({
  title,
  value,
}) {
  return (
    <div className="p-7 border-r border-b border-white/10 min-h-[125px]">

      <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold mb-4">
        {title}
      </p>

      <p className="font-semibold text-[#D9E4EA] break-all">
        {value ?? "N/A"}
      </p>

    </div>
  );
}


// ============================================================
// TIMELINE ITEM
// ============================================================

function TimelineItem({
  title,
  value,
}) {
  return (
    <div className="relative pl-10 pb-10 last:pb-0">

      <div className="absolute -left-[5px] top-1 w-[9px] h-[9px] bg-[#9EB4C3]" />

      <p className="text-[10px] tracking-[0.25em] text-[#718A9D] font-bold">
        {title}
      </p>

      <p className="font-semibold mt-3 text-[#D9E4EA]">
        {value ?? "N/A"}
      </p>

    </div>
  );
}