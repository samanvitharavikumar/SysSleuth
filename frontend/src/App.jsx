import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [checkoutError, setCheckoutError] = useState(null);
  const [error, setError] = useState(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [latencyWarning, setLatencyWarning] = useState(false);

  // NEW:
  // Stores information about the failure so the
  // "Find Out What Happened" button can use it.
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
  // Remove one quantity
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
    if (cart.length === 0) {
      return;
    }

    // Clear previous messages
    setCheckoutError(null);
    setFailureInfo(null);
    setLatencyWarning(false);
    setIsCheckingOut(true);

    // Product 6 = intentional latency test
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
          amount: amount,
        });

        const response = await axios.post(
          "http://localhost:8001/orders",
          null,
          {
            params: {
              item_id: String(item.product_id),
              quantity: item.quantity,
              amount: amount,
            },
            timeout: 10000,
          }
        );

        console.log("Order successful:", response.data);
      }

      // Stop latency timer
      if (latencyTimer) {
        clearTimeout(latencyTimer);
      }

      setLatencyWarning(false);

      alert("Order placed successfully!");

      setCart([]);
      setCartOpen(false);
    } catch (err) {
      console.error("Checkout failed:", err);

      if (latencyTimer) {
        clearTimeout(latencyTimer);
      }

      setLatencyWarning(false);

      /*
      ============================================================
      DETERMINE WHICH PRODUCT CAUSED THE FAILURE
      ============================================================
      */

      const failedItem = cart[0];

      const failedProductId = failedItem
        ? Number(failedItem.product_id)
        : null;

      let backendMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Something went wrong during checkout.";

      /*
      ============================================================
      PRODUCT 7
      CASCADING FAILURE
      ============================================================
      */

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

      /*
      ============================================================
      PRODUCT 6
      TIMEOUT
      ============================================================
      */

      if (failedProductId === 6) {
        setFailureInfo({
          type: "timeout",
          productId: 6,
          title: "Request Timed Out",
          message:
            "The inventory service took too long to respond.",
          backendError: backendMessage,
        });

        setCheckoutError(
          "The request took too long to complete."
        );

        return;
      }

      /*
      ============================================================
      PRODUCT 5
      SERVICE CRASH
      ============================================================
      */

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

      /*
      ============================================================
      PRODUCT 8
      PAYMENT FAILURE
      ============================================================
      */

      if (failedProductId === 8) {
        setFailureInfo({
          type: "payment",
          productId: 8,
          title: "Payment Failure",
          message:
            "The payment service could not complete the transaction.",
          backendError: backendMessage,
        });

        setCheckoutError(
          "Payment could not be completed."
        );

        return;
      }

      /*
      ============================================================
      INVENTORY / OTHER FAILURE
      ============================================================
      */

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
  // Category filtering
  // -----------------------------
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts =
    category === "All"
      ? products
      : products.filter((product) => product.category === category);

  /*
  ============================================================
  FIND OUT WHAT HAPPENED
  ============================================================
  */

  const findOutWhatHappened = () => {
    if (!failureInfo) {
      return;
    }

    /*
      Using window.location.href instead of navigate()
      means you do NOT need react-router just for this.
    */

    const params = new URLSearchParams({
      type: failureInfo.type || "unknown",
      productId: String(failureInfo.productId || ""),
      title: failureInfo.title || "Service Error",
      message: failureInfo.message || "",
    });

    window.location.href = `/diagnostics?${params.toString()}`;
  };

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="logo">
          DIGIBUY
          <small>STORE</small>
        </div>

        <div className="nav-links">

          <a href="#home">HOME</a>

          {/* Category Dropdown */}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-dropdown"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <a href="#products">PRODUCTS</a>

        </div>

        {/* Cart */}

        <button
          className="cart-button"
          onClick={() => setCartOpen(true)}
        >
          🛒 CART
          <span className="cart-count">{cartCount}</span>
        </button>

      </nav>


      {/* ================= HERO ================= */}

      <section className="hero" id="home">

        <div className="hero-glow"></div>

        <h1>
          TECHNOLOGY
          <br />
          <span>REDEFINED.</span>
        </h1>

        <button
          className="hero-button"
          onClick={() =>
            document
              .getElementById("products")
              .scrollIntoView({ behavior: "smooth" })
          }
        >
          EXPLORE PRODUCTS →
        </button>

      </section>


      {/* ================= PRODUCTS ================= */}

      <main id="products" className="products-section">

        <div className="section-header">

          <div>
            <p className="section-code">
              &lt; PRODUCT_DATABASE /&gt;
            </p>

            <h2></h2>
          </div>

          <div className="product-count">
            {filteredProducts.length} ITEMS FOUND
          </div>

        </div>


        {error && (
          <p className="error">
            ⚠ {error}
          </p>
        )}


        <div className="products-grid">

          {filteredProducts.map((product) => (

            <div
              className="product-card"
              key={product.product_id}
            >

              {/* Discount */}

              {product.discount && (
                <div className="discount">
                  {product.discount}
                </div>
              )}


              {/* Product image */}

              <div className="product-image-container">

                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="product-image"
                />

              </div>


              {/* Product information */}

              <div className="product-info">

                <div className="product-category">
                  {product.category}
                </div>

                <h3>
                  {product.product_name}
                </h3>


                <div className="rating">
                  ★ {product.rating || "N/A"}

                  <span>
                    ({product.rating_count || "0"})
                  </span>
                </div>


                <div className="price-row">

                  <span className="price">
                    ₹
                    {Number(
                      product.price_inr
                    ).toLocaleString("en-IN")}
                  </span>

                  {product.original_price_inr && (
                    <span className="old-price">
                      ₹
                      {Number(
                        product.original_price_inr
                      ).toLocaleString("en-IN")}
                    </span>
                  )}

                </div>


                <button
                  className="add-cart"
                  onClick={() => addToCart(product)}
                >
                  🛒 ADD TO CART
                </button>

              </div>

            </div>

          ))}

        </div>

      </main>


      {/* ================= CART SIDEBAR ================= */}

      {cartOpen && (

        <div
          className="cart-overlay"
          onClick={() => setCartOpen(false)}
        >

          <div
            className="cart-sidebar"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="cart-header">

              <div>
                <p>&lt; CART /&gt;</p>
                <h2>YOUR CART</h2>
              </div>

              <button
                className="close-cart"
                onClick={() => setCartOpen(false)}
              >
                ×
              </button>

            </div>


            {cart.length === 0 ? (

              <div className="empty-cart">

                <div className="empty-icon">
                  🛒
                </div>

                <h3>CART EMPTY</h3>

                <p>
                  No products have been selected.
                </p>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={item.product_id}
                    >

                      <img
                        src={item.image_url}
                        alt={item.product_name}
                      />


                      <div className="cart-item-info">

                        <h4>
                          {item.product_name}
                        </h4>


                        <p className="cart-item-price">
                          ₹
                          {Number(
                            item.price_inr
                          ).toLocaleString("en-IN")}
                        </p>


                        <div className="quantity-controls">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.product_id
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              addToCart(item)
                            }
                          >
                            +
                          </button>

                        </div>


                        <button
                          className="remove-item"
                          onClick={() =>
                            removeFromCart(
                              item.product_id
                            )
                          }
                        >
                          REMOVE
                        </button>

                      </div>

                    </div>

                  ))}

                </div>


                <div className="cart-footer">

                  <div className="cart-total">

                    <span>
                      TOTAL
                    </span>

                    <strong>
                      ₹
                      {cartTotal.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>


                  <button
                    className="checkout-button"
                    onClick={checkout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut
                      ? "PROCESSING..."
                      : "PROCEED TO CHECKOUT →"}
                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}


      {/* ================= LATENCY WARNING ================= */}

      {latencyWarning && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">

          <div className="relative w-full max-w-[430px] rounded-2xl border border-white/10 bg-[#0b0f0c] p-10 text-center shadow-[0_25px_80px_rgba(0,0,0,0.7)]">

            {/* Loading spinner */}

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/40">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-green-400"></div>

            </div>

            <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white">
              PLEASE WAIT
            </h2>

            <p className="mb-2 text-lg text-gray-300">
              This is taking too much time...
            </p>

            <p className="text-sm text-gray-500">
              We're still processing your order.
            </p>

          </div>

        </div>

      )}


      {/* ================= CHECKOUT ERROR ================= */}

      {checkoutError && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">

          <div className="relative w-full max-w-[430px] rounded-2xl border border-white/10 bg-[#0b0f0c] p-10 text-center shadow-[0_25px_80px_rgba(0,0,0,0.7)]">

            {/* Close button */}

            <button
              className="absolute right-5 top-4 text-2xl font-light text-gray-500 transition-colors hover:text-white"
              onClick={() => {
                setCheckoutError(null);
                setFailureInfo(null);
              }}
              aria-label="Close error"
            >
              ×
            </button>


            {/* Error icon */}

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/40 bg-green-400/5 text-3xl font-semibold text-green-400">
              !
            </div>


            {/* Heading */}

            <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white">
              UH-OH!
            </h2>


            <p className="mb-4 text-lg text-gray-300">
              Something went wrong.
            </p>


            {/* Error message */}

            <p className="mb-8 text-sm leading-6 text-gray-500">
              {checkoutError}
            </p>


            {/* Try again */}

            <button
              className="mb-3 w-full rounded-xl bg-green-400 px-6 py-3.5 font-semibold tracking-wide text-black transition-all duration-200 hover:bg-green-300 hover:shadow-[0_0_25px_rgba(74,222,128,0.25)] active:scale-[0.98]"
              onClick={() => {
                setCheckoutError(null);
                setFailureInfo(null);
              }}
            >
              TRY AGAIN
            </button>


            {/* Find out what happened */}

            <button
              className="w-full rounded-xl border border-green-400/40 px-6 py-3.5 font-semibold tracking-wide text-green-400 transition-all duration-200 hover:bg-green-400/10 active:scale-[0.98]"
              onClick={findOutWhatHappened}
            >
              FIND OUT WHAT HAPPENED
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;