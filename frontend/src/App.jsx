import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [checkoutError, setCheckoutError] = useState(null);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [latencyWarning, setLatencyWarning] = useState(false);
  const [failureInfo, setFailureInfo] = useState(null);

  // -----------------------------
  // Load products
  // -----------------------------
  useEffect(() => {
    axios
      .get("http://localhost:8004/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load products");
      });
  }, []);

  // -----------------------------
  // Add to cart
  // -----------------------------
  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product_id === product.product_id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // -----------------------------
  // Decrease quantity
  // -----------------------------
  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // -----------------------------
  // Remove completely
  // -----------------------------
  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product_id !== productId)
    );
  };

  // -----------------------------
  // Checkout
  // -----------------------------
  const checkout = async () => {
    if (cart.length === 0) return;

    setCheckoutError(null);
    setFailureInfo(null);
    setLatencyWarning(false);
    setIsCheckingOut(true);

    const hasLatencyProduct = cart.some(
      (item) => Number(item.product_id) === 6
    );

    let latencyTimer;

    if (hasLatencyProduct) {
      latencyTimer = setTimeout(() => {
        setLatencyWarning(true);
      }, 3000);
    }

    try {
      for (const item of cart) {
        const amount = Number(item.price_inr) * item.quantity;

        console.log("Sending order:", {
          item_id: item.product_id,
          quantity: item.quantity,
          amount,
        });

        const response = await axios.post(
          "http://localhost:8001/orders",
          null,
          {
            params: {
              item_id: String(item.product_id),
              quantity: item.quantity,
              amount,
            },
            timeout: 10000,
          }
        );

        console.log("Order successful:", response.data);
      }

      if (latencyTimer) clearTimeout(latencyTimer);

      setLatencyWarning(false);

      alert("Order placed successfully!");

      setCart([]);
      setCartOpen(false);
    } catch (err) {
      console.error("Checkout failed:", err);

      if (latencyTimer) clearTimeout(latencyTimer);

      setLatencyWarning(false);

      const failedItem = cart[0];

      const failedProductId = failedItem
        ? Number(failedItem.product_id)
        : null;

      const backendMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Something went wrong during checkout.";

      // PRODUCT 7 — CASCADING FAILURE
      if (failedProductId === 7) {
        setFailureInfo({
          type: "cascading",
          productId: 7,
          title: "Cascading Service Failure",
          message:
            "A failure in one service caused dependent services to fail.",
          backendError: backendMessage,
        });

        setCheckoutError(
          "A dependent service failed while processing your order."
        );

        return;
      }

      // PRODUCT 6 — TIMEOUT
      if (failedProductId === 6) {
        setFailureInfo({
          type: "timeout",
          productId: 6,
          title: "Request Timed Out",
          message: "The inventory service took too long to respond.",
          backendError: backendMessage,
        });

        setCheckoutError("The request took too long to complete.");

        return;
      }

      // PRODUCT 5 — SERVICE CRASH
      if (failedProductId === 5) {
        setFailureInfo({
          type: "service_crash",
          productId: 5,
          title: "Service Crash",
          message:
            "The inventory service stopped unexpectedly while processing the request.",
          backendError: backendMessage,
        });

        setCheckoutError(
          "The inventory service became unavailable."
        );

        return;
      }

      // PRODUCT 8 — PAYMENT FAILURE
      if (failedProductId === 8) {
        setFailureInfo({
          type: "payment",
          productId: 8,
          title: "Payment Failure",
          message:
            "The payment service could not complete the transaction.",
          backendError: backendMessage,
        });

        setCheckoutError("Payment could not be completed.");

        return;
      }

      // INVENTORY / OTHER FAILURE
      setFailureInfo({
        type: "inventory",
        productId: failedProductId,
        title: "Inventory Failure",
        message: backendMessage,
        backendError: backendMessage,
      });

      if (err.response) {
        setCheckoutError(backendMessage);
      } else {
        setCheckoutError(
          "We couldn't connect to the order service."
        );
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  // -----------------------------
  // Cart calculations
  // -----------------------------
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price_inr * item.quantity,
    0
  );

  // -----------------------------
  // Categories
  // -----------------------------
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts =
    category === "All"
      ? products
      : products.filter(
          (product) => product.category === category
        );

  // -----------------------------
  // Diagnostics
  // -----------------------------
  const findOutWhatHappened = () => {
    if (!failureInfo) return;

    const params = new URLSearchParams({
      type: failureInfo.type || "unknown",
      productId: String(failureInfo.productId || ""),
      title: failureInfo.title || "Service Error",
      message: failureInfo.message || "",
    });

    window.location.href = `/diagnostics?${params.toString()}`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050816] text-white">

      {/* =====================================================
          BACKGROUND GRAPHICS
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.35) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Blue glow */}
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[150px]" />

        {/* Purple glow */}
        <div className="absolute right-[-150px] top-[15%] h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[160px]" />

        {/* Bottom glow */}
        <div className="absolute bottom-[-200px] left-[30%] h-[550px] w-[550px] rounded-full bg-indigo-600/15 blur-[150px]" />
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/75 backdrop-blur-2xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">

          {/* Logo */}
          <a
            href="#home"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-600/25">
              <span className="text-lg font-black">
                S
              </span>
            </div>

            <div>
              <div className="text-lg font-black tracking-[0.18em]">
                SYSSLEUTH
              </div>

              <div className="text-[9px] font-medium tracking-[0.35em] text-violet-300">
                PERFORMANCE LAB
              </div>
            </div>
          </a>

          {/* Navigation */}
          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#home"
              className="text-xs font-semibold tracking-[0.2em] text-gray-400 transition hover:text-white"
            >
              HOME
            </a>

            <a
              href="#products"
              className="text-xs font-semibold tracking-[0.2em] text-gray-400 transition hover:text-white"
            >
              PRODUCTS
            </a>

            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 pr-9 text-xs font-semibold tracking-wider text-gray-300 outline-none transition hover:border-violet-500/40 hover:bg-white/[0.08]"
              >
                {categories.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-[#090d1c]"
                  >
                    {cat}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                ↓
              </span>
            </div>
          </div>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="group relative flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-xs font-bold tracking-widest text-violet-200 transition duration-300 hover:border-violet-400/50 hover:bg-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.18)]"
          >
            <span className="text-base">🛒</span>
            <span className="hidden sm:inline">CART</span>

            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-1.5 text-[10px] font-black text-white shadow-lg shadow-violet-600/30">
              {cartCount}
            </span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="home"
        className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-6 py-24 lg:px-10"
      >

        {/* Decorative rings */}
        <div className="pointer-events-none absolute right-[5%] top-[18%] hidden h-[420px] w-[420px] rounded-full border border-violet-500/10 md:block" />

        <div className="pointer-events-none absolute right-[9%] top-[22%] hidden h-[340px] w-[340px] rounded-full border border-blue-500/10 md:block" />

        <div className="relative max-w-4xl">

          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-4 py-2 text-[10px] font-bold tracking-[0.3em] text-violet-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
            NEXT-GENERATION COMMERCE
          </div>

          <h1 className="text-6xl font-black leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-[100px]">
            STEP INTO
            <br />

            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
              THE FUTURE.
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
            Discover iconic sneakers engineered for the next generation.
            Premium silhouettes. Bold design. Zero compromise.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <button
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="group rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-4 text-xs font-black tracking-[0.2em] text-white shadow-xl shadow-violet-600/20 transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(139,92,246,0.35)]"
            >
              EXPLORE COLLECTION
              <span className="ml-3 transition group-hover:translate-x-1">
                →
              </span>
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
              <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              <span className="text-xs font-semibold tracking-wider text-gray-400">
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <main
        id="products"
        className="mx-auto max-w-7xl px-6 pb-32 lg:px-10"
      >

        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">

          <div>
            <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-violet-400">
              &lt; PRODUCT_DATABASE /&gt;
            </p>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              FEATURED
              <span className="ml-2 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                SNEAKERS
              </span>
            </h2>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[10px] tracking-widest text-gray-500">
            {filteredProducts.length} ITEMS FOUND
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {filteredProducts.map((product) => (
            <div
              key={product.product_id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-violet-400/30 hover:bg-white/[0.07] hover:shadow-[0_20px_60px_rgba(76,29,149,0.22)]"
            >

              {/* Glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl transition duration-500 group-hover:bg-violet-500/20" />

              {/* Discount */}
              {product.discount && (
                <div className="absolute left-4 top-4 z-10 rounded-full border border-violet-400/20 bg-[#080b18]/80 px-3 py-1.5 text-[10px] font-black tracking-wider text-violet-300 backdrop-blur-md">
                  {product.discount}
                </div>
              )}

              {/* Product image */}
              <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-white/[0.06] to-transparent p-8">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_60%)]" />

                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.45)] transition duration-700 group-hover:scale-110 group-hover:rotate-[-2deg]"
                />
              </div>

              {/* Product info */}
              <div className="p-5">

                <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-violet-400">
                  {product.category}
                </div>

                <h3 className="min-h-[48px] text-base font-bold leading-6 text-white">
                  {product.product_name}
                </h3>

                {/* Rating */}
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-yellow-400">
                    ★
                  </span>

                  <span className="font-semibold text-gray-300">
                    {product.rating || "N/A"}
                  </span>

                  <span className="text-xs text-gray-600">
                    ({product.rating_count || "0"})
                  </span>
                </div>

                {/* Price */}
                <div className="mt-5 flex items-end justify-between gap-3">

                  <div>
                    <div className="text-2xl font-black tracking-tight">
                      ₹
                      {Number(
                        product.price_inr
                      ).toLocaleString("en-IN")}
                    </div>

                    {product.original_price_inr && (
                      <div className="mt-1 text-xs text-gray-500 line-through">
                        ₹
                        {Number(
                          product.original_price_inr
                        ).toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg shadow-lg shadow-violet-600/20 transition duration-300 hover:scale-110 hover:shadow-[0_0_25px_rgba(139,92,246,0.45)] active:scale-95"
                    aria-label="Add to cart"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-[10px] font-black tracking-[0.2em] text-gray-300 transition duration-300 hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
                >
                  ADD TO CART
                </button>

              </div>
            </div>
          ))}
        </div>
      </main>

      {/* =====================================================
          CART OVERLAY
      ===================================================== */}

      {cartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
          onClick={() => setCartOpen(false)}
        >

          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#070a16]/95 shadow-[-30px_0_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">

              <div>
                <p className="mb-1 font-mono text-[9px] tracking-[0.3em] text-violet-400">
                  &lt; CART /&gt;
                </p>

                <h2 className="text-2xl font-black">
                  YOUR CART
                </h2>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl text-gray-400 transition hover:bg-white/[0.08] hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Cart content */}
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">

                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 text-3xl">
                  🛒
                </div>

                <h3 className="text-xl font-black">
                  CART EMPTY
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  No products have been selected.
                </p>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">

                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >

                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <h4 className="line-clamp-2 text-sm font-bold leading-5">
                          {item.product_name}
                        </h4>

                        <p className="mt-2 text-sm font-black text-violet-300">
                          ₹
                          {Number(
                            item.price_inr
                          ).toLocaleString("en-IN")}
                        </p>

                        <div className="mt-3 flex items-center gap-2">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.product_id
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.1]"
                          >
                            −
                          </button>

                          <span className="w-6 text-center text-xs font-bold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              addToCart(item)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.1]"
                          >
                            +
                          </button>

                          <button
                            onClick={() =>
                              removeFromCart(
                                item.product_id
                              )
                            }
                            className="ml-auto text-[9px] font-bold tracking-wider text-gray-600 transition hover:text-red-400"
                          >
                            REMOVE
                          </button>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 bg-black/10 p-6">

                  <div className="mb-5 flex items-end justify-between">

                    <span className="text-xs font-bold tracking-[0.2em] text-gray-500">
                      TOTAL
                    </span>

                    <strong className="text-3xl font-black">
                      ₹
                      {cartTotal.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <button
                    onClick={checkout}
                    disabled={isCheckingOut}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-xs font-black tracking-[0.2em] text-white shadow-xl shadow-violet-600/20 transition hover:shadow-[0_0_35px_rgba(139,92,246,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCheckingOut
                      ? "PROCESSING..."
                      : "PROCEED TO CHECKOUT →"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* =====================================================
          LATENCY WARNING
      ===================================================== */}

      {latencyWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#02030a]/80 px-4 backdrop-blur-xl">

          <div className="w-full max-w-md rounded-3xl border border-blue-400/20 bg-[#080c1b]/95 p-10 text-center shadow-[0_0_100px_rgba(59,130,246,0.15)]">

            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10">

              <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-blue-400" />

            </div>

            <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-blue-400">
              SYSTEM RESPONSE DELAY
            </div>

            <h2 className="text-3xl font-black">
              PLEASE WAIT
            </h2>

            <p className="mt-4 text-gray-400">
              This request is taking longer than expected.
            </p>

            <p className="mt-2 text-xs text-gray-600">
              The inventory service is still processing your order.
            </p>

          </div>
        </div>
      )}

      {/* =====================================================
          CHECKOUT ERROR
      ===================================================== */}

      {checkoutError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#02030a]/80 px-4 backdrop-blur-xl">

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-400/20 bg-[#080c1b]/95 p-8 text-center shadow-[0_0_100px_rgba(139,92,246,0.15)]">

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

            <button
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-xl text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
              onClick={() => {
                setCheckoutError(null);
                setFailureInfo(null);
              }}
              aria-label="Close error"
            >
              ×
            </button>

            <div className="relative">

              {/* Error icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-3xl text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.12)]">
                !
              </div>

              <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-red-400">
                CHECKOUT FAILURE
              </div>

              <h2 className="text-3xl font-black">
                UH-OH!
              </h2>

              <p className="mt-3 text-gray-400">
                Something went wrong.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm leading-6 text-gray-400">
                {checkoutError}
              </div>

              <div className="mt-6 space-y-3">

                <button
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 text-xs font-black tracking-[0.2em] text-white transition hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] active:scale-[0.98]"
                  onClick={() => {
                    setCheckoutError(null);
                    setFailureInfo(null);
                  }}
                >
                  TRY AGAIN
                </button>

                <button
                  className="w-full rounded-xl border border-violet-400/30 bg-violet-500/[0.06] px-6 py-4 text-xs font-black tracking-[0.2em] text-violet-300 transition hover:bg-violet-500/10 active:scale-[0.98]"
                  onClick={findOutWhatHappened}
                >
                  FIND OUT WHAT HAPPENED →
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;