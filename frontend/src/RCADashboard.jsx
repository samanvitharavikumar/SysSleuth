import { useEffect, useState } from "react";

export default function RCADashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // =========================================================
  // LOAD RCA
  // =========================================================

  useEffect(() => {
    async function loadRCA() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const productId =
          params.get("product_id");

        let url =
          "http://localhost:8010/analyze/inventory-service";

        if (productId) {
          url +=
            `?product_id=${encodeURIComponent(
              productId
            )}`;
        }

        console.log(
          "RCA REQUEST:",
          url
        );

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }

        const result =
          await response.json();

        console.log(
          "RCA DATA:",
          result
        );

        setData(result);

      } catch (err) {

        console.error(err);

        setError(
          err.message
        );
      }
    }

    loadRCA();

  }, []);

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#071A2F] via-[#0B2D4D] to-[#164E63] text-white flex items-center justify-center">

        <div className="text-center">

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

  // =========================================================
  // LOADING
  // =========================================================

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

  // =========================================================
  // SELECT BEST TRACE
  // =========================================================

  const trace = (() => {

    if (
      !data.traces ||
      data.traces.length === 0
    ) {
      return null;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const productId =
      params.get("product_id");

    // -------------------------------------------------------
    // 1. PRODUCT MATCH
    // -------------------------------------------------------

    if (productId) {

      const productTrace =
        data.traces.find(
          (t) =>
            String(
              t.product_id
            ) ===
            String(productId)
        );

      if (productTrace) {
        return productTrace;
      }
    }

    // -------------------------------------------------------
    // 2. FAILURE TYPE MATCH
    // -------------------------------------------------------

    const matchingTrace =
      data.traces.find(
        (t) =>
          String(
            t.failure_type || ""
          ).toLowerCase() ===
          String(
            data.failure_type || ""
          ).toLowerCase()
      );

    if (matchingTrace) {
      return matchingTrace;
    }

    // -------------------------------------------------------
    // 3. SERVICE MATCH
    // -------------------------------------------------------

    const serviceTrace =
      data.traces.find(
        (t) =>
          t.service ===
          data.service
      );

    if (serviceTrace) {
      return serviceTrace;
    }

    // -------------------------------------------------------
    // 4. FIRST TRACE
    // -------------------------------------------------------

    return data.traces[0];

  })();

  const confidence =
    Math.round(
      (data.confidence ?? 0) *
        100
    );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#123B5D] via-[#0B2D4D] to-[#164E63] text-white">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="h-[82px] border-b border-white/10 px-14 flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-black tracking-[0.22em]">
            SYSSLEUTH / FAILURE INVESTIGATION
          </h1>

          <p className="text-[9px] tracking-[0.28em] text-[#71899A] mt-1">
            SYSTEM INTELLIGENCE RCA DASHBOARD
          </p>

        </div>

        <button
          onClick={() =>
            (window.location.href = "/")
          }
          className="border border-[#6E8799]/50 px-7 py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
        >
          BACK TO STORE
        </button>

      </nav>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="max-w-[1520px] mx-auto px-14 md:px-16">

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="min-h-[300px] border-b border-white/10 relative flex flex-col justify-center">

          <div className="absolute top-0 left-0 flex items-center gap-4">

            <div className="w-11 h-[1px] bg-white/70" />

            <p className="text-[10px] tracking-[0.35em] text-[#8198A9] font-bold">
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

        {/* ===================================================
            FAILURE / ROOT CAUSE
        =================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-2 border-b border-white/10">

          <div className="py-14 md:pr-14 md:border-r border-white/10">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              FAILURE TYPE
            </p>

            <h2 className="text-2xl md:text-2xl font-black mt-8 tracking-tight">
              {data.failure_type}
            </h2>

          </div>

          <div className="py-14 md:pl-14">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              ROOT CAUSE
            </p>

            <h2 className="text-2xl md:text-3xl font-black mt-8">
              {data.root_cause}
            </h2>

            <p className="text-sm text-[#7890A1] mt-5 max-w-2xl leading-relaxed">
              {data.reason}
            </p>

          </div>

        </section>

        {/* ===================================================
            SUMMARY
        =================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10">

          <InfoCard
            title="SERVICE"
            value={data.service}
          />

          <InfoCard
            title="CONFIDENCE"
            value={`${confidence}%`}
          />

          <InfoCard
            title="STATUS CODE"
            value={
              trace?.status_code ??
              "N/A"
            }
          />

        </section>

        {/* ===================================================
            FAILURE TRACE
        =================================================== */}

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
                value={
                  trace?.trace_id
                }
              />

              <TraceItem
                title="SPAN ID"
                value={
                  trace?.span_id
                }
              />

              <TraceItem
                title="OPERATION"
                value={
                  trace?.operation
                }
              />

              <TraceItem
                title="SERVICE"
                value={
                  trace?.service
                }
              />

              <TraceItem
                title="FAILURE TYPE"
                value={
                  trace?.failure_type
                }
              />

              <TraceItem
                title="HTTP METHOD"
                value={
                  trace?.http_method
                }
              />

              <TraceItem
                title="STATUS CODE"
                value={
                  trace?.status_code
                }
              />

              <TraceItem
                title="PRODUCT ID"
                value={
                  trace?.product_id
                }
              />

              <TraceItem
                title="QUANTITY"
                value={
                  trace?.quantity
                }
              />

            </div>

          ) : (

            <p className="text-[#718A9D]">
              No failure trace found.
            </p>

          )}

        </section>

        {/* ===================================================
            TRACE TIMELINE
        =================================================== */}

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
                  value={
                    trace?.start_time
                      ? new Date(
                          trace.start_time /
                            1000
                        ).toLocaleString()
                      : "N/A"
                  }
                />

                <TimelineItem
                  title="FAILURE DETECTED"
                  value={
                    trace.failure_type
                  }
                />

                <TimelineItem
                  title="END TIME"
                  value={
                    trace?.end_time
                      ? new Date(
                          trace.end_time /
                            1000
                        ).toLocaleString()
                      : "N/A"
                  }
                />

              </div>

              <div className="mt-12 border-t border-b border-white/10 py-7 flex justify-between items-center">

                <span className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
                  TOTAL TRACE DURATION
                </span>

                <span className="text-2xl md:text-3xl font-black text-[#DCE6EC]">
                  {trace.duration_ms !=
                  null
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

        {/* ===================================================
            EVIDENCE
        =================================================== */}

        <section className="py-16">

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
                data.evidence
                  ?.logs_checked ??
                0
              }
            />

            <InfoCard
              title="FAILURE TRACES"
              value={
                data.evidence
                  ?.failure_traces ??
                0
              }
            />

          </div>

        </section>

      </main>

    </div>
  );
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