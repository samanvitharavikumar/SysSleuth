import { useEffect, useState } from "react";

export default function RCADashboard() {

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {

    async function loadRCA() {

      try {

        const response = await fetch(
          "http://localhost:8010/analyze/inventory-service"
        );

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }

        const result = await response.json();

        console.log("RCA DATA:", result);

        setData(result);

      } catch (err) {

        console.error(err);

        setError(err.message);
      }
    }

    loadRCA();

  }, []);


  if (error) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        <div className="text-center">

          <h1 className="text-4xl font-black text-red-400">
            RCA unavailable
          </h1>

          <p className="mt-4 text-slate-400">
            {error}
          </p>

        </div>

      </div>
    );
  }


  if (!data) {

    return (
      <div className="min-h-screen bg-[#05070d] text-white flex items-center justify-center">

        <p className="text-xl text-slate-400">
          Analyzing failure...
        </p>

      </div>
    );
  }


  const trace = (() => {
    if (!data.traces || data.traces.length === 0) {
      return null;
    }

    // Prefer the trace that matches the RCA failure type
    const matchingTrace = data.traces.find(
      (t) =>
        String(t.failure_type || "").toLowerCase() ===
        String(data.failure_type || "").toLowerCase()
    );

    // If we found the correct failure span, use it.
    if (matchingTrace) {
      return matchingTrace;
    }

    // Otherwise prefer inventory-service over parent services
    const inventoryTrace = data.traces.find(
      (t) => t.service === data.service
    );

    if (inventoryTrace) {
      return inventoryTrace;
    }

    // Final fallback
    return data.traces[0];
  })();

  const confidence = Math.round(
    (data.confidence ?? 0) * 100
  );


  return (

    <div className="min-h-screen bg-[#05070d] text-white px-6 py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-10">

          <p className="text-xs tracking-[0.3em] text-violet-400 font-bold">
            SYSSLEUTH FAILURE INVESTIGATION
          </p>

          <h1 className="text-5xl font-black mt-2">
            Root Cause Analysis
          </h1>

          <p className="text-slate-400 mt-3">
            Automated analysis of logs, metrics and distributed traces
          </p>

        </div>


        {/* FAILURE TYPE */}

        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-8 mb-6">

          <p className="text-xs tracking-widest text-slate-400">
            FAILURE TYPE
          </p>

          <h2 className="text-4xl font-black text-red-400 mt-3">
            {data.failure_type}
          </h2>

        </div>


        {/* ROOT CAUSE */}

        <div className="rounded-2xl border border-violet-900 bg-violet-950/20 p-8 mb-6">

          <p className="text-xs tracking-widest text-slate-400">
            ROOT CAUSE
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {data.root_cause}
          </h2>

          <p className="text-slate-400 mt-3">
            {data.reason}
          </p>

        </div>


        {/* SUMMARY */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

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
            value={trace?.status_code ?? "N/A"}
          />

        </div>


        {/* FAILURE TRACE */}

        <div className="rounded-2xl bg-[#0d1626] border border-slate-800 p-8 mb-6">

          <h2 className="text-2xl font-bold mb-8">
            Failure Trace
          </h2>

          {trace ? (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

<TraceItem
  title="Trace ID"
  value={trace?.trace_id}
/>

<TraceItem
  title="Span ID"
  value={trace?.span_id}
/>

<TraceItem
  title="Operation"
  value={trace?.operation}
/>

<TraceItem
  title="Service"
  value={trace?.service}
/>

<TraceItem
  title="Failure Type"
  value={trace?.failure_type}
/>

<TraceItem
  title="HTTP Method"
  value={trace?.http_method}
/>

<TraceItem
  title="Status Code"
  value={trace?.status_code}
/>

<TraceItem
  title="Product ID"
  value={trace?.product_id}
/>

<TraceItem
  title="Quantity"
  value={trace?.quantity}
/>
            </div>

          ) : (

            <p className="text-slate-500">
              No failure trace found.
            </p>

          )}

        </div>


        {/* TIMELINE */}

        <div className="rounded-2xl bg-[#0d1626] border border-slate-800 p-8 mb-6">

          <h2 className="text-2xl font-bold mb-8">
            Trace Timeline
          </h2>


          {trace ? (

            <>

              <div className="space-y-6">

              <TimelineItem
                title="START TIME"
                value={
                  trace?.start_time
                    ? new Date(trace.start_time / 1000).toLocaleString()
                    : "N/A"
                }
              />

                <TimelineItem
                  title="FAILURE DETECTED"
                  value={trace.failure_type}
                />

                <TimelineItem
                  title="END TIME"
                  value={
                    trace?.end_time
                      ? new Date(trace.end_time / 1000).toLocaleString()
                      : "N/A"
                  }
                />

              </div>


              <div className="mt-8 rounded-xl bg-slate-900 p-6 flex justify-between items-center">

                <span className="text-xs tracking-widest text-slate-400">
                  TOTAL TRACE DURATION
                </span>

                <span className="text-2xl font-black text-violet-400">

                  {trace.duration_ms != null
                    ? `${trace.duration_ms} ms`
                    : "N/A"}

                </span>

              </div>

            </>

          ) : (

            <p className="text-slate-500">
              No trace timeline available.
            </p>

          )}

        </div>


        {/* EVIDENCE */}

        <div className="rounded-2xl bg-[#0d1626] border border-slate-800 p-8">

          <h2 className="text-2xl font-bold mb-8">
            Evidence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <InfoCard
              title="LOGS ANALYZED"
              value={
                data.evidence?.logs_checked ?? 0
              }
            />

            <InfoCard
              title="FAILURE TRACES"
              value={
                data.evidence?.failure_traces ?? 0
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
}


function InfoCard({ title, value }) {

  return (

    <div className="rounded-2xl bg-[#0d1626] border border-slate-800 p-7">

      <p className="text-xs tracking-widest text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-black mt-3">
        {value ?? "N/A"}
      </p>

    </div>
  );
}


function TraceItem({ title, value }) {

  return (

    <div className="rounded-xl bg-slate-900 p-5">

      <p className="text-xs tracking-widest text-slate-500 mb-2">
        {title}
      </p>

      <p className="font-semibold break-all">
        {value ?? "N/A"}
      </p>

    </div>
  );
}


function TimelineItem({ title, value }) {

  return (

    <div className="flex items-center gap-5">

      <div className="w-3 h-3 rounded-full bg-violet-400 shrink-0" />

      <div>

        <p className="text-xs tracking-widest text-slate-500">
          {title}
        </p>

        <p className="font-semibold mt-1">
          {value ?? "N/A"}
        </p>

      </div>

    </div>
  );
}