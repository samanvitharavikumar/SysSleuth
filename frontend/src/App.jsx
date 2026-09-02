import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [checkoutError, setCheckoutError] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [latencyWarning, setLatencyWarning] = useState(false);

  // --------------------------------------------------
  // LOAD PRODUCTS
  // --------------------------------------------------

  useEffect(() => {
    axios
      .get("http://localhost:8004/products")
      .then((response) => {
        setProducts(response.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load products.");
      });
  }, []);

  // --------------------------------------------------
  // CART
  // --------------------------------------------------

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

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product_id !== productId)
    );
  };

  // --------------------------------------------------
  // CHECKOUT
  // --------------------------------------------------

  const checkout = async () => {
    if (cart.length === 0) return;

    setCheckoutError(false);
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

        await axios.post(
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
      }

      if (latencyTimer) clearTimeout(latencyTimer);

      setLatencyWarning(false);
      setCart([]);
      setCartOpen(false);

      alert("Order placed successfully!");
    } catch (err) {
      console.error("Checkout failed:", err);

      if (latencyTimer) clearTimeout(latencyTimer);

      setLatencyWarning(false);

      // Intentionally do NOT expose backend failure details here.
      setCheckoutError(true);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // --------------------------------------------------
  // CALCULATIONS
  // --------------------------------------------------

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price_inr) * item.quantity,
    0
  );

  // --------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------

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

  // --------------------------------------------------
  // RCA
  // --------------------------------------------------

  const findOutWhatHappened = () => {
    window.location.href = "/rca";
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DCEAF4] via-[#123B70] to-[#0B1F3A] text-[#111111]">

      {/* ==================================================
          BACKGROUND GRAPHIC
      ================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="absolute right-[-180px] top-[100px] h-[500px] w-[500px] border border-black/[0.04]" />

        <div className="absolute right-[-120px] top-[160px] h-[380px] w-[380px] border border-black/[0.04]" />

      </div>

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/[0.08]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-6 lg:px-10">

          {/* LOGO */}

          <a
            href="#home"
            className="flex items-center gap-3"
          >

            <div>
              <div className="text-[20px] font-bold tracking-[0.18em]">
                KICKSTART
              </div>
            </div>

          </a>

          {/* NAV */}

          <nav className="hidden items-center gap-10 md:flex">

            <a
              href="#home"
              className="text-[19px] font-medium tracking-[0.16em] text-black/55 transition hover:text-black"
            >
              HOME
            </a>

            <a
              href="#products"
              className="text-[19px] font-medium tracking-[0.16em] text-black/55 transition hover:text-black"
            >
              PRODUCTS
            </a>

          </nav>

          {/* CART */}

          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-4 border border-black bg-black px-5 py-3 text-[10px] font-bold tracking-[0.18em] text-white transition hover:bg-[#222]"
          >
            CART

            <span className="flex h-5 min-w-5 items-center justify-center border border-white/30 px-1 text-[9px]">
              {cartCount}
            </span>
          </button>

        </div>

      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section
        id="home"
        className="mx-auto max-w-[1500px] px-6 lg:px-10"
      >

        <div className="grid min-h-[620px] grid-cols-1 items-center border-b border-black/[0.08] lg:grid-cols-[1.15fr_0.85fr]">

          {/* LEFT */}

          <div className="py-24 lg:py-32">

            <div className="mb-8 flex items-center gap-3">
              <span className="h-[1px] w-10 bg-black" />
            </div>

            <h1 className="max-w-4xl text-[62px] font-semibold leading-[0.92] tracking-[-0.065em] sm:text-[82px] lg:text-[108px]">

              Luxury

              <br />

              <span className="text-black/30">
                with comfort.
              </span>

            </h1>

            <p className="mt-10 max-w-lg text-[15px] leading-7 text-black/50">
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="mt-10 border border-black bg-black px-7 py-4 text-[10px] font-bold tracking-[0.2em] text-white transition hover:bg-[#222]"
            >
              VIEW COLLECTION
              <span className="ml-6">→</span>
            </button>

          </div>

          {/* RIGHT GRAPHIC */}

          <div className="relative hidden h-full items-center justify-center lg:flex">

            <div className="relative h-[430px] w-[430px] border border-black/[0.08]">

              <div className="absolute inset-[45px] border border-black/[0.08]" />

              <div className="absolute inset-[90px] border border-black/[0.08]" />

              <div className="absolute left-1/2 top-0 h-full w-px bg-black/[0.06]" />

              <div className="absolute left-0 top-1/2 h-px w-full bg-black/[0.06]" />

              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-black" />

              <div className="absolute bottom-5 left-5 text-[8px] font-medium tracking-[0.25em] text-black/30">
                SS / 01
              </div>

              <div className="absolute right-5 top-5 text-[8px] font-medium tracking-[0.25em] text-black/30">
                2026
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          PRODUCTS
      ================================================== */}

      <main
        id="products"
        className="mx-auto max-w-[1500px] px-6 pb-32 lg:px-10"
      >

        {/* SECTION HEADER */}

        <div className="flex items-end justify-between border-b border-black/[0.08] py-10">

          <div>

            <p className="mb-3 text-[9px] font-bold tracking-[0.25em] text-black/35">
              COLLECTION
            </p>

            <h2 className="text-4xl font-semibold tracking-[-0.04em]">
              Products
            </h2>

          </div>

          <div className="text-right text-[9px] font-medium tracking-[0.18em] text-black/35">
            {filteredProducts.length} ITEMS
          </div>

        </div>

        {/* LOAD ERROR */}

        {error && (
          <div className="border-b border-black/[0.08] py-8 text-sm text-black/50">
            {error}
          </div>
        )}

        {/* PRODUCT GRID */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {filteredProducts.map((product, index) => (

            <article
              key={product.product_id}
              className="group relative border-b border-r border-black/[0.08] bg-[#f5f5f2] transition-colors hover:bg-white"
            >

              {/* PRODUCT NUMBER */}

              <div className="absolute left-5 top-5 z-10 text-[8px] font-bold tracking-[0.18em] text-black/25">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* DISCOUNT */}

              {product.discount && (
                <div className="absolute right-5 top-5 z-10 text-[8px] font-bold tracking-[0.16em]">
                  {product.discount}
                </div>
              )}

              {/* PRODUCT IMAGE */}

              <div className="h-[300px] w-full overflow-hidden bg-[#f5f5f2]">

                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className={`
                    h-full
                    w-full
                    object-contain
                    p-10
                    transition-transform
                    duration-500
                    group-hover:scale-[1.03]

                    ${
                      [4, 5, 6, 7, 12, 13].includes(
                        Number(product.product_id)
                      )
                        ? ""
                        : "mix-blend-multiply"
                    }
                  `}
                />

              </div>

              {/* INFO */}

              <div className="border-t border-black/[0.08] p-6">

                <div className="mb-3 text-[8px] font-bold uppercase tracking-[0.22em] text-black/35">
                  {product.category}
                </div>

                <h3 className="min-h-[48px] text-[15px] font-semibold leading-6 tracking-[-0.015em]">
                  {product.product_name}
                </h3>

                {/* RATING */}

                <div className="mt-4 flex items-center gap-2 text-[10px]">

                  <span>★</span>

                  <span className="font-medium">
                    {product.rating || "N/A"}
                  </span>

                  <span className="text-black/30">
                    {product.rating_count
                      ? `(${product.rating_count})`
                      : ""}
                  </span>

                </div>

                {/* PRICE */}

                <div className="mt-6 flex items-end justify-between">

                  <div>

                    <div className="text-xl font-semibold tracking-[-0.025em]">
                      ₹
                      {Number(
                        product.price_inr
                      ).toLocaleString("en-IN")}
                    </div>

                    {product.original_price_inr && (
                      <div className="mt-1 text-[10px] text-black/30 line-through">
                        ₹
                        {Number(
                          product.original_price_inr
                        ).toLocaleString("en-IN")}
                      </div>
                    )}

                  </div>

                </div>

                {/* ADD TO CART */}

                <button
                  onClick={() => addToCart(product)}
                  className="mt-6 w-full border border-black bg-transparent py-3.5 text-[9px] font-bold tracking-[0.2em] transition group-hover:bg-black group-hover:text-white"
                >
                  ADD TO CART
                </button>

                {/* GO TO CART */}

                <button
                  onClick={() => setCartOpen(true)}
                  className="mt-2 w-full py-2 text-[8px] font-bold tracking-[0.18em] text-black/35 transition hover:text-black"
                >
                  GO TO CART →
                </button>

              </div>

            </article>

          ))}

        </div>

      </main>

      {/* ==================================================
          CART DRAWER
      ================================================== */}

      {cartOpen && (

        <div
          className="fixed inset-0 z-[100] bg-black/30"
          onClick={() => setCartOpen(false)}
        >

          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-[470px] flex-col border-l border-black/10 bg-[#f5f5f2]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-black/10 px-7 py-7">

              <div>

                <p className="mb-2 text-[8px] font-bold tracking-[0.25em] text-black/35">
                  YOUR SELECTION
                </p>

                <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                  Cart
                </h2>

              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="text-2xl font-light text-black/40 transition hover:text-black"
              >
                ×
              </button>

            </div>

            {/* CONTENT */}

            {cart.length === 0 ? (

              <div className="flex flex-1 items-center justify-center">

                <div className="text-center">

                  <div className="text-5xl font-light text-black/10">
                    0
                  </div>

                  <p className="mt-4 text-[10px] font-bold tracking-[0.2em] text-black/40">
                    YOUR CART IS EMPTY
                  </p>

                </div>

              </div>

            ) : (

              <>

                <div className="flex-1 overflow-y-auto">

                  {cart.map((item) => (

                    <div
                      key={item.product_id}
                      className="flex gap-5 border-b border-black/10 p-6"
                    >

                      <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-white">

                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="max-h-full max-w-full object-contain p-3"
                        />

                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">

                        <h4 className="text-[13px] font-semibold leading-5">
                          {item.product_name}
                        </h4>

                        <p className="mt-2 text-sm font-medium">
                          ₹
                          {Number(
                            item.price_inr
                          ).toLocaleString("en-IN")}
                        </p>

                        <div className="mt-auto flex items-center gap-4">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.product_id
                              )
                            }
                            className="text-lg font-light text-black/50 hover:text-black"
                          >
                            −
                          </button>

                          <span className="text-[11px] font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              addToCart(item)
                            }
                            className="text-lg font-light text-black/50 hover:text-black"
                          >
                            +
                          </button>

                          <button
                            onClick={() =>
                              removeFromCart(
                                item.product_id
                              )
                            }
                            className="ml-auto text-[8px] font-bold tracking-[0.15em] text-black/30 hover:text-black"
                          >
                            REMOVE
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

                {/* FOOTER */}

                <div className="border-t border-black/10 p-7">

                  <div className="flex items-end justify-between">

                    <span className="text-[9px] font-bold tracking-[0.2em] text-black/40">
                      TOTAL
                    </span>

                    <span className="text-2xl font-semibold tracking-[-0.03em]">
                      ₹
                      {cartTotal.toLocaleString("en-IN")}
                    </span>

                  </div>

                  <button
                    onClick={checkout}
                    disabled={isCheckingOut}
                    className="mt-7 w-full border border-black bg-black py-4 text-[9px] font-bold tracking-[0.2em] text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isCheckingOut
                      ? "PROCESSING..."
                      : "CHECKOUT →"}
                  </button>

                </div>

              </>

            )}

          </aside>

        </div>

      )}

      {/* ==================================================
          LATENCY
      ================================================== */}

      {latencyWarning && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">

          <div className="w-full max-w-sm border border-black/10 bg-[#f5f5f2] p-10 text-center">

            <div className="mx-auto mb-7 h-8 w-8 border-2 border-black/15 border-t-black animate-spin" />

            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              Please wait.
            </h2>

            <p className="mt-3 text-sm text-black/40">
              Your order is being processed.
            </p>

          </div>

        </div>

      )}

      {/* ==================================================
          ERROR
      ================================================== */}

      {checkoutError && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-6">

          <div className="w-full max-w-[460px] border border-black/10 bg-[#f5f5f2] p-10">

            <div className="mb-10 flex items-center justify-between">

              <span className="text-[9px] font-bold tracking-[0.25em] text-black/35">
                ORDER
              </span>

              <button
                onClick={() => setCheckoutError(false)}
                className="text-xl font-light text-black/40 hover:text-black"
              >
                ×
              </button>

            </div>

            <h2 className="text-6xl font-semibold tracking-[-0.06em]">
              UH-OH.
            </h2>

            <p className="mt-5 text-sm text-black/45">
              Something went wrong.
            </p>

            <div className="mt-10 grid gap-2">

              <button
                onClick={() => setCheckoutError(false)}
                className="w-full border border-black bg-black py-4 text-[9px] font-bold tracking-[0.2em] text-white transition hover:bg-[#222]"
              >
                TRY AGAIN
              </button>

              <button
                onClick={findOutWhatHappened}
                className="w-full border border-black/15 py-4 text-[9px] font-bold tracking-[0.2em] transition hover:border-black hover:bg-white"
              >
                FIND OUT WHAT HAPPENED →
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;