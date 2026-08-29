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

    // Clear previous checkout error
    setCheckoutError(null);

    try {
      for (const item of cart) {
        const amount = Number(item.price_inr) * item.quantity;

        console.log("Sending order:", {
          item_id: item.product_id,
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
          }
        );

        console.log("Order successful:", response.data);
      }

      alert("Order placed successfully!");

      setCart([]);
      setCartOpen(false);
    } catch (err) {
      console.error("Checkout failed:", err);

      if (err.response) {
        setCheckoutError(
          err.response.data.detail || "Something went wrong during checkout."
        );
      } else {
        setCheckoutError("We couldn't connect to the order service.");
      }
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
            <p className="section-code">&lt; PRODUCT_DATABASE /&gt;</p>
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
                    ₹{Number(product.price_inr).toLocaleString("en-IN")}
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
                  >
                    PROCEED TO CHECKOUT →
                  </button>

                </div>

              </>

            )}

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
              onClick={() => setCheckoutError(null)}
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


            {/* Actual backend error */}
            <p className="mb-8 text-sm leading-6 text-gray-500">
              {checkoutError}
            </p>


            {/* Try again */}
            <button
              className="w-full rounded-xl bg-green-400 px-6 py-3.5 font-semibold tracking-wide text-black transition-all duration-200 hover:bg-green-300 hover:shadow-[0_0_25px_rgba(74,222,128,0.25)] active:scale-[0.98]"
              onClick={() => setCheckoutError(null)}
            >
              TRY AGAIN
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;