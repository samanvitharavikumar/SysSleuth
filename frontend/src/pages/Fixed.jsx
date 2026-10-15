import React from "react";

export default function Fixed() {
  const navigationData = JSON.parse(
    sessionStorage.getItem("fixed_order_data") || "{}"
  );

  const order = navigationData.order || {};
  const token = navigationData.token || {};

  const orderId =
    order.order_id ||
    order.orderId ||
    order.id ||
    "Pending confirmation";

  const customer =
    order.customer_name ||
    order.customer ||
    order.username ||
    token.username ||
    token.user_id ||
    "Customer details unavailable";

  const productName =
    order.product_name ||
    order.product ||
    order.name ||
    "Product details unavailable";

  const productImage =
    order.product_image ||
    order.image ||
    order.image_url ||
    "";

  const productDescription =
    order.product_description ||
    order.description ||
    "";

  return (
    <div className="min-h-screen bg-[#08080d] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <div className="border border-purple-500/30 bg-[#111019] rounded-2xl p-8 md:p-10">

          <div className="text-center mb-10">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-500/15 border border-green-400/40 flex items-center justify-center">
              <span className="text-green-400 text-3xl">
                ✓
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-purple-300">
              Fix Applied
            </h1>

            <p className="text-gray-400 mt-3">
              The incident resolution workflow has finished.
            </p>
          </div>

          <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-5 mb-8">
            <h2 className="text-green-400 font-bold text-lg">
              Order placed, token resolved
            </h2>

            <p className="text-gray-300 text-sm mt-2">
              {navigationData.confirmed
                ? "The order confirmation details are available below."
                : "The fix workflow has completed. Order confirmation details have not been verified yet."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-black/30 border border-white/10 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Order ID
              </p>

              <p className="text-lg font-semibold break-all">
                {orderId}
              </p>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Customer
              </p>

              <p className="text-lg font-semibold break-words">
                {customer}
              </p>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Product
              </p>

              <p className="text-lg font-semibold">
                {productName}
              </p>

              {productDescription && (
                <p className="text-gray-400 text-sm mt-2">
                  {productDescription}
                </p>
              )}
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Token ID
              </p>

              <p className="text-lg font-semibold break-all">
                {token.token_id ||
                  token.tokenId ||
                  token.id ||
                  token._id ||
                  "Unavailable"}
              </p>

              <p className="text-xs uppercase tracking-widest text-gray-500 mt-4 mb-2">
                Token Status
              </p>

              <span className="inline-block rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-sm text-green-400">
                RESOLVED
              </span>
            </div>

          </div>

          {productImage && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                Product Image
              </p>

              <img
                src={productImage}
                alt={productName}
                className="w-full max-h-80 object-contain rounded-xl border border-white/10 bg-black/30 p-4"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-10">

            <button
              onClick={() => {
                window.location.href = "/tokens";
              }}
              className="flex-1 border border-purple-400/40 px-6 py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-purple-600 transition"
            >
              BACK TO TOKENS
            </button>

            <button
              onClick={() => {
                window.location.href = "/admin";
              }}
              className="flex-1 border border-white/20 px-6 py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-white hover:text-black transition"
            >
              BACK TO ADMIN DASHBOARD
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}