import React, { useEffect, useState } from "react";

export default function TokensRaised() {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const savedTokens = JSON.parse(
      localStorage.getItem("raised_tokens") || "[]"
    );

    setTokens(savedTokens.reverse());
  }, []);

  const openRCA = (token) => {
    window.location.href =
      `/admin?product_id=${encodeURIComponent(token.product_id)}`;
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
            ADMINISTRATION
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = "/admin";
          }}
          className="border border-[#6E8799]/50 px-7 py-4 text-[10px] tracking-[0.16em] font-bold hover:bg-white hover:text-[#071A2F] transition"
        >
          BACK TO RCA
        </button>

      </nav>


      {/* CONTENT */}
      <main className="max-w-[1400px] mx-auto px-8 md:px-14 py-16">

        <div className="mb-12">

          <p className="text-[10px] tracking-[0.35em] text-[#8198A9] font-bold">
            ADMIN
          </p>

          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] mt-5">
            Tokens
            <br />
            <span className="text-[#657D91]">
              Raised.
            </span>
          </h1>

          <p className="text-[#7890A1] mt-8">
            Complaints raised by users requiring investigation.
          </p>

        </div>


        {/* NO TOKENS */}
        {tokens.length === 0 ? (

          <div className="border border-white/10 p-10">

            <p className="text-[10px] tracking-[0.3em] text-[#718A9D] font-bold">
              TOKENS
            </p>

            <h2 className="text-2xl font-bold mt-4">
              No complaints raised yet.
            </h2>

          </div>

        ) : (

          <div className="border border-white/10">

            {/* HEADER */}
            <div className="grid grid-cols-5 border-b border-white/10 p-6 text-[10px] tracking-[0.2em] text-[#718A9D] font-bold">

              <div>TOKEN</div>
              <div>NAME</div>
              <div>PRODUCT</div>
              <div>TRACE ID</div>
              <div>ACTION</div>

            </div>


            {/* TOKENS */}
            {tokens.map((token) => (

              <div
                key={token.id}
                className="grid grid-cols-5 p-6 border-b border-white/10 items-center hover:bg-white/[0.03]"
              >

                {/* TOKEN */}
                <div className="font-mono text-sm">
                  {token.id}
                </div>


                {/* NAME */}
                <div className="font-semibold">
                  {token.name}
                </div>


                {/* PRODUCT */}
                <div className="font-mono">
                  {token.product_id}
                </div>


                {/* TRACE */}
                <div className="font-mono text-xs break-all pr-6">
                  {token.trace_id}
                </div>


                {/* ACTION */}
                <div>

                  <button
                    onClick={() => openRCA(token)}
                    className="border border-white/30 px-5 py-3 text-[9px] tracking-[0.15em] font-bold hover:bg-white hover:text-[#071A2F] transition"
                  >
                    VIEW RCA
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}