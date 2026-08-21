import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

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

            <div className="product-card" key={product.product_id}>

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
                <div className="empty-icon">🛒</div>
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
                    <span>TOTAL</span>

                    <strong>
                      ₹
                      {cartTotal.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <button className="checkout-button">
                    PROCEED TO CHECKOUT →
                  </button>

                </div>

              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default App;