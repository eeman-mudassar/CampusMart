import { useEffect, useState } from "react";
import "./App.css";
import DashboardCharts from "./DashboardCharts";


const stationeryHero =
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=90";

const notebookPhoto =
  "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85";

const pensPhoto =
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85";

const bluePenPhoto =
  "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=85";

const blueBallpointPhoto =
  "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=900&q=85";

const stickyNotesPhoto =
  "https://images.unsplash.com/photo-1506784983877-45594e0fa4c8?auto=format&fit=crop&w=900&q=85";

const artSuppliesPhoto =
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85";

const pencilsPhoto =
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=85";



const API = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

function authHeaders(extraHeaders = {}) {
  const token = sessionStorage.getItem("campusmartToken");

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}


const emptyProduct = {
  name: "",
  sku: "",
  category: "Notebooks",
  purchasePrice: "",
  price: "",
  stock: "",
  description: "",
};


function SidebarIcon({ name }) {
  const paths = {
    Dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    Products: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
        <path d="M2 4h2M2 9h2M2 14h2M2 19h2" />
      </>
    ),
    "POS Billing": (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 7h10M7 11h2M12 11h2M7 15h2M12 15h5" />
      </>
    ),
    "Sales History": (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 3 5-7" />
      </>
    ),
    "Daily Report": (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
      </>
    ),
    Receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [newProduct, setNewProduct] = useState(emptyProduct);
  
  
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [lastSale, setLastSale] = useState(null);
  const [reportDate, setReportDate] = useState(getLocalDateString());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
const [token, setToken] = useState(
  () => sessionStorage.getItem("campusmartToken") || ""
);
const [adminEmail, setAdminEmail] = useState(
  () => sessionStorage.getItem("campusmartAdminEmail") || ""
);
const [loginEmail, setLoginEmail] = useState("admin@campusmart.local");
const [loginPassword, setLoginPassword] = useState("");
const [loginError, setLoginError] = useState("");
const [loginLoading, setLoginLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);


  async function loadProducts() {
    const response = await fetch(`${API}/products`, {
  headers: authHeaders(),
});
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load products.");
    setProducts(data);
  }

  async function loadSales() {
    const response = await fetch(`${API}/sales`, {
  headers: authHeaders(),
});
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load sales history.");
    setSales(data);
  }
  
async function handleAdminLogin(event) {
  event.preventDefault();
  setLoginLoading(true);
  setLoginError("");

  try {
    const response = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.trim(),
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    sessionStorage.setItem("campusmartToken", data.token);
    sessionStorage.setItem("campusmartAdminEmail", data.admin.email);

    setToken(data.token);
    setAdminEmail(data.admin.email);
    setLoginPassword("");
    setError("");
    setMessage("");
  } catch (err) {
    setLoginError(err.message || "Unable to log in.");
  } finally {
    setLoginLoading(false);
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem("campusmartToken");
  sessionStorage.removeItem("campusmartAdminEmail");

  setToken("");
  setAdminEmail("");
  setProducts([]);
  setSales([]);
  setCart([]);
  setLastSale(null);
  setPage("Dashboard");
  setLoginPassword("");
  setLoginError("");
  setError("");
  setMessage("");
}



useEffect(() => {
  if (!token) {
    setLoading(false);
    setProducts([]);
    setSales([]);
    return;
  }

  async function initialize() {
    setLoading(true);

    try {
      await Promise.all([loadProducts(), loadSales()]);
    } catch (err) {
      setError(err.message || "Backend connection error.");
    } finally {
      setLoading(false);
    }
  }

  initialize();
}, [token]);


  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  const dailySales = sales.filter((sale) => {
    if (!sale.createdAt) return false;
    return getLocalDateString(new Date(sale.createdAt)) === reportDate;
  });

  const dailyRevenue = dailySales.reduce(
    (sum, sale) => sum + Number(sale.total ?? 0),
    0
  );
  const dailyItemsSold = dailySales.reduce(
    (sum, sale) =>
      sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
    0
  );

  const dailyCost = dailySales.reduce(
    (sum, sale) =>
      sum +
      (sale.items || []).reduce(
        (itemSum, item) =>
          itemSum + (item.purchasePrice == null
            ? 0
            : Number(item.purchasePrice) * Number(item.quantity || 0)),
        0
      ),
    0
  );

  const dailySalesWithCost = dailySales.filter((sale) =>
    (sale.items || []).every((item) => item.purchasePrice != null && Number.isFinite(Number(item.purchasePrice)))
  );
  const hasCompleteDailyCost = dailySalesWithCost.length === dailySales.length;
  const dailyGrossProfit = dailyRevenue - dailyCost;

  const filtered = products.filter((product) =>
    `${product.name} ${product.category} ${product.sku}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function notify(text) {
    setMessage(text);
    setError("");
  }

  function addToCart(product) {
    if (product.stock < 1) {
      setError("This product is out of stock.");
      return;
    }
    const existing = cart.find((item) => item._id === product._id);
    if (existing && existing.qty >= product.stock) {
      setError(`Only ${product.stock} units are available.`);
      return;
    }
    setCart((current) => {
      const found = current.find((item) => item._id === product._id);
      if (found) {
        return current.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...current, { ...product, qty: 1 }];
    });
    notify(`${product.name} added to the cart.`);
  }

  function changeQuantity(productId, amount) {
    setCart((current) =>
      current
        .map((item) => {
          if (item._id !== productId) return item;
          const nextQty = item.qty + amount;
          if (nextQty < 1) return null;
          if (nextQty > item.stock) {
            setError(`Only ${item.stock} units are available.`);
            return item;
          }
          return { ...item, qty: nextQty };
        })
        .filter(Boolean)
    );
  }
function handleImageChange(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select a valid image file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Image size must be less than 5MB.");
    return;
  }

  setProductImage(file);
  setImagePreview(URL.createObjectURL(file));
  setError("");
}

  async function handleAddProduct(event) {
  event.preventDefault();

  setSavingProduct(true);
  setError("");
  setMessage("");

  try {
    const formData = new FormData();

    formData.append("name", newProduct.name);
    formData.append("sku", newProduct.sku);
    formData.append("category", newProduct.category);
    formData.append(
      "purchasePrice",
      Number(newProduct.purchasePrice || 0)
    );
    formData.append("price", Number(newProduct.price));
    formData.append("stock", Number(newProduct.stock || 0));
    formData.append("description", newProduct.description);

    if (productImage) {
      formData.append("image", productImage);
    }

    const response = await fetch(`${API}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to save product.");
    }

    setProducts((current) => [data, ...current]);

    setNewProduct(emptyProduct);
    setProductImage(null);
    setImagePreview("");
    setShowAddForm(false);

    notify("Product saved successfully to MongoDB!");

  } catch (err) {
    setError(err.message);
  } finally {
    setSavingProduct(false);
  }
}

  async function checkout() {
    if (cart.length === 0) {
      setError("Add a product to the cart first.");
      return;
    }
    setCheckingOut(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API}/sales`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          paymentMethod,
          items: cart.map((item) => ({ productId: item._id, quantity: item.qty })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Checkout could not be completed.");
      setLastSale(data.sale);
      setCart([]);
      setPage("Receipt");
      await Promise.all([loadProducts(), loadSales()]);
      notify("Sale saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  async function refreshData() {
    try {
      await Promise.all([loadProducts(), loadSales()]);
      notify("Data refreshed successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function updatePurchaseCost(productId, purchasePrice) {
    const cost = Number(purchasePrice);
    if (!Number.isFinite(cost) || cost < 0) {
      setError("Enter a valid purchase cost of zero or more.");
      return false;
    }
    try {
      const response = await fetch(`${API}/products/${productId}`, {
        method: "PUT",
       headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ purchasePrice: cost }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update purchase cost.");
      setProducts((current) =>
        current.map((product) => product._id === productId ? data : product)
      );
      notify("Purchase cost updated successfully.");
      return true;
    } catch (err) {
      setError(err.message || "Unable to update purchase cost.");
      return false;
    }
  }
    async function updateProduct(productId, fields) {
    try {
      const response = await fetch(`${API}/products/${productId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update product.");
      setProducts((current) =>
        current.map((product) => (product._id === productId ? data : product))
      );
      notify("Product updated successfully.");
      return true;
    } catch (err) {
      setError(err.message || "Unable to update product.");
      return false;
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? Old sales records will stay safe.`
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`${API}/products/${product._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete product.");
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setCart((current) => current.filter((item) => item._id !== product._id));
      notify("Product deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  }
  function printReceipt(sale) {
    if (!sale) return;
    const escapeHTML = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);

    const rows = sale.items.map((item) => `
      <tr>
        <td>${escapeHTML(item.name)}<small>${escapeHTML(item.sku)}</small></td>
        <td>${item.quantity}</td>
        <td>Rs ${Number(item.price).toFixed(2)}</td>
        <td>Rs ${Number(item.lineTotal).toFixed(2)}</td>
      </tr>
    `).join("");

    const billNumber = String(sale._id || "").slice(-8).toUpperCase();
    const date = new Date(sale.createdAt || Date.now()).toLocaleString();
    const printWindow = window.open("", "_blank", "width=700,height=800");
    if (!printWindow) {
      setError("The print window was blocked. Please allow pop-ups in your browser.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CampusMart Receipt ${escapeHTML(billNumber)}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 650px; margin: 30px auto; padding: 20px; color: #222; }
          header { text-align: center; margin-bottom: 24px; }
          h1 { margin-bottom: 5px; }
          .muted { color: #666; font-size: 13px; }
          .details { margin: 20px 0; line-height: 1.8; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 5px; border-bottom: 1px solid #ddd; text-align: left; font-size: 13px; }
          th { background: #f5f5f5; }
          td small { display: block; color: #666; margin-top: 4px; }
          .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
          .thanks { text-align: center; margin-top: 35px; }
          .print-button { padding: 10px 18px; margin-bottom: 20px; cursor: pointer; }
          @media print { .print-button { display: none; } body { margin: 0 auto; padding: 5px; } }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print Receipt</button>
        <header>
          <h1>CampusMart</h1>
          <div>Stationery Store · POS Receipt</div>
          <p class="muted">Thank you for shopping with us!</p>
        </header>
        <div class="details">
          <div><strong>Bill No:</strong> ${escapeHTML(billNumber)}</div>
          <div><strong>Date:</strong> ${escapeHTML(date)}</div>
          <div><strong>Payment:</strong> ${escapeHTML(sale.paymentMethod)}</div>
        </div>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">Total: Rs ${Number(sale.total).toFixed(2)}</div>
        <div class="thanks"><p>Thank you for your purchase!</p><p class="muted">CampusMart POS</p></div>
        <script>window.onload = () => window.print();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  const navItems = ["Dashboard", "Products", "POS Billing", "Sales History", "Daily Report", "Receipt"];
  

if (!token) {
  return (
    <div className="login-page">
      <section
        className="login-visual"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15,39,65,.94), rgba(31,78,112,.82)), url(${stationeryHero})`,
        }}
      >
        <div className="login-visual-content">
          <img
            src="/images/campusmart-logo.png"
            alt="CampusMart Logo"
            className="login-large-logo"
          />

        

          <h1>Welcome to CampusMart</h1>

          <p>
            A smarter way to manage your stationery store.
            Track inventory, process sales and monitor
            your business from one place.
          </p>

          <div className="login-feature-list">
            <div><span>01</span> Inventory Management</div>
            <div><span>02</span> Fast POS Billing</div>
            <div><span>03</span> Sales &amp; Business Reports</div>
          </div>
        </div>

       
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="login-mobile-brand">
            <img src="/images/campusmart-logo.png" alt="CampusMart" />
          </div>

          <div className="login-heading">
            <span className="login-small-label">ADMINISTRATOR ACCESS</span>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleAdminLogin}>
            <label className="login-field">
              <span>Email Address</span>
              <div className="login-input-wrap">
                <span className="login-input-icon">✉</span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="Enter your email address"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="login-field">
              <span>Password</span>
              <div className="login-input-wrap">
                <span className="login-input-icon">⌑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
                
<button
  type="button"
  className="password-toggle"
  onClick={() => setShowPassword((current) => !current)}
  aria-label={showPassword ? "Hide password" : "Show password"}
  title={showPassword ? "Hide password" : "Show password"}
>
  {showPassword ? (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.3 3.2" />
      <path d="M6.2 6.2C4.1 7.5 2.9 9.5 2.5 12c.7 2 4.2 7 9.5 7 1.2 0 2.3-.2 3.3-.6" />
    </svg>
  ) : (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )}
</button>

              </div>
            </label>

            <div className="login-options">
              <span className="secure-label">Secure Admin Login</span>
            </div>

            {loginError && (
              <div className="login-error" role="alert">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in..." : "Sign In to Dashboard →"}
            </button>
          </form>

          <div className="login-security-note">
            <span>▣</span>
            <p>
              This area is restricted to authorized CampusMart
              administrators only.
            </p>
          </div>

          <div className="login-copyright">
            © {new Date().getFullYear()} CampusMart POS. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}



  return (
    <div className="app-shell">
     
<aside className={`sidebar sidebar-modern ${sidebarCollapsed ? "collapsed" : ""}`}>
  <div className="brand">
    <button
      type="button"
      className="brand-icon"
      aria-label="Go to Dashboard"
      onClick={() => {
        setPage("Dashboard");
        setSearch("");
        setError("");
        setMessage("");
      }}
    >
      <img
        src="/images/campusmart-icon.jpeg"
        alt="CampusMart"
        className="brand-symbol"
      />
    </button>

    {!sidebarCollapsed && (
      <div>
        <h2>CampusMart</h2>
        <small>STATIONERY SHOP</small>
      </div>
    )}
  </div>

 

  <nav className="modern-nav">
    {navItems.map((item) => (
      <button
        key={item}
        className={`nav-item ${page === item ? "active" : ""}`}
        title={sidebarCollapsed ? item : ""}
        onClick={() => {
          setPage(item);
          setSearch("");
          setError("");
          setMessage("");

          if (item === "Sales History" || item === "Daily Report") {
            loadSales().catch((err) => setError(err.message));
          }
        }}
      >
        <SidebarIcon name={item} />
        {!sidebarCollapsed && <span>{item}</span>}
      </button>
    ))}
  </nav>

  <div className="sidebar-bottom modern-sidebar-bottom">
    <div className="admin-profile">
      <div className="admin-avatar">A</div>

      {!sidebarCollapsed && (
        <div className="admin-details">
          <strong>Admin</strong>
          <span>{adminEmail || "Administrator"}</span>
        </div>
      )}
    </div>

    <button
      type="button"
      className="sidebar-logout"
      onClick={handleAdminLogout}
      title="Logout"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </svg>

      {!sidebarCollapsed && <span>Logout</span>}
    </button>
  </div>
</aside>


      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
  <button
    className="menu-toggle"
    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  >
    ☰
  </button>

  <div>
    <p className="eyebrow">
      CAMPUSMART
    </p>
    <h1>{page}</h1>
  </div>
</div>
          <button className="secondary-btn" onClick={refreshData}>Refresh data ↻</button>
        </header>

        {loading && <div className="panel">Loading CampusMart data...</div>}
        {error && <div className="notice" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {message && <div className="notice">{message}<button onClick={() => setMessage("")}>×</button></div>}

        {!loading && page === "Dashboard" && (
          <>
            <section className="welcome-panel">
              <div>
                <span className="welcome-tag">YOUR STORE AT A GLANCE</span>
                <h2>Welcome to CampusMart 👋</h2>
                <p>Manage stationery, inventory and customer sales.</p>
                <button className="primary-btn" onClick={() => setPage("POS Billing")}>Start a sale →</button>
              </div>
              <div className="welcome-art">
                <img
                  src={stationeryHero}
                  alt="Stationery and writing supplies arranged on a desk"
                  loading="lazy"
                />
              </div>
            </section>

            <section className="stats-grid">
              <Stat label="Total Products" value={products.length} icon="▤" />
              <Stat label="Units in Stock" value={products.reduce((sum, p) => sum + Number(p.stock || 0), 0)} icon="▦" />
              <Stat label="Low Stock Items" value={products.filter((p) => p.stock < 10).length} icon="!" />
              <Stat label="Total Sales Revenue" value={`Rs ${totalRevenue.toFixed(2)}`} icon="↗" />
            </section>
            <DashboardCharts
               sales={sales}
               products={products}
/>

            <section className="panel">
              <div className="panel-heading">
                <div><h2>Inventory Overview</h2><p>Your stationery products</p></div>
                <button className="secondary-btn" onClick={() => setPage("Products")}>View products →</button>
              </div>
              <ProductTable products={products.slice(0, 5)} onUpdatePurchaseCost={updatePurchaseCost} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />
            </section>
          </>
        )}

        {!loading && page === "Products" && (
          <section className="panel">
            <div className="panel-heading">
              <div><h2>Product Inventory</h2><p>Products stored in MongoDB</p></div>
              <button className="primary-btn" onClick={() => setShowAddForm(!showAddForm)}>{showAddForm ? "Cancel" : "+ Add Product"}</button>
            </div>

            {showAddForm && (
              <form className="product-form" onSubmit={handleAddProduct}>
                <label>Product Name<input required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></label>
                <label>SKU (unique)<input required value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} /></label>
                <label>
                  Category
                  <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                    {["Notebooks", "Pens", "Pencils", "Registers", "Art Supplies", "Stationery"].map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label>Purchase Price (Rs)<input required type="number" min="0" step="0.01" value={newProduct.purchasePrice} onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })} /></label>
                <label>Selling Price (Rs)<input required type="number" min="0" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} /></label>
                <label>Stock<input required type="number" min="0" step="1" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} /></label>
                <label>Description (optional)<input value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></label>
                <div className="product-image-upload">
  <label htmlFor="productImage">
    Product Image
  </label>

  <input
    id="productImage"
    type="file"
    accept="image/*"
    onChange={handleImageChange}
  />

  {imagePreview && (
    <div className="image-preview">
      <img
        src={imagePreview}
        alt="Selected product"
      />
    </div>
  )}
</div>
                <button className="primary-btn" disabled={savingProduct}>{savingProduct ? "Saving..." : "Save Product"}</button>
              </form>
            )}

            <p>{products.length} products in inventory. </p>
            <input className="search-input" placeholder="Search by product, SKU or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <ProductTable products={filtered} onUpdatePurchaseCost={updatePurchaseCost} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />
          </section>
        )}

        {!loading && page === "POS Billing" && (
          <section className="billing-layout">
            <div className="panel">
              <div className="panel-heading"><div><h2>Select Products</h2><p>Click a product to add it to the bill.</p></div></div>
              <input className="search-input" placeholder="Search stationery..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="product-grid">
                {filtered.map((product) => (
                  <button key={product._id} className="product-card" onClick={() => addToCart(product)} disabled={product.stock === 0}>
                    <div className="product-image-wrap">
                      <img
                        className="product-image"
                        src={getProductImage(product)}
                        alt={product.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?auto=format&fit=crop&w=900&q=85";
                        }}
                      />
                    </div>
                    <strong>{product.name}</strong>
                    <span>Rs {product.price}</span>
                    <small>{product.stock} in stock</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel cart-panel">
              <h2>Current Bill</h2><p>Review quantities before checkout.</p>
              {cart.length === 0 ? <div className="empty-cart">🛒<p>Your cart is empty</p></div> : cart.map((item) => (
                <div className="cart-item" key={item._id}>
                  <div>
                    <strong>{item.name}</strong><small>Rs {item.price} each</small>
                    <div className="quantity-controls">
                      <button onClick={() => changeQuantity(item._id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button disabled={item.qty >= item.stock} onClick={() => changeQuantity(item._id, 1)}>+</button>
                    </div>
                  </div>
                  <b>Rs {item.qty * item.price}</b>
                </div>
              ))}
              <div className="cart-total"><span>Total</span><strong>Rs {cartTotal.toFixed(2)}</strong></div>
              <label className="payment-label">
                Payment Method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash">Cash</option><option value="Card">Card</option><option value="Easypaisa">Easypaisa</option><option value="JazzCash">JazzCash</option>
                </select>
              </label>
              <button className="primary-btn checkout-btn" onClick={checkout} disabled={checkingOut || cart.length === 0}>{checkingOut ? "Processing..." : "Complete Checkout"}</button>
              <small className="demo-note">Sale and stock are saved in MongoDB.</small>
            </div>
          </section>
        )}

        {!loading && page === "Sales History" && (
          <section className="panel">
            <div className="panel-heading">
              <div><h2>Sales History</h2><p>Completed bills from MongoDB</p></div>
              <strong>Revenue: Rs {totalRevenue.toFixed(2)}</strong>
            </div>
            {sales.length === 0 ? <p className="empty-message">No sales have been recorded yet.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Bill ID</th><th>Date</th><th>Items</th><th>Payment</th><th>Total</th><th>Receipt</th></tr></thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale._id}>
                        <td>{sale._id.slice(-8).toUpperCase()}</td>
                        <td>{new Date(sale.createdAt).toLocaleString()}</td>
                        <td>{sale.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</td>
                        <td>{sale.paymentMethod}</td><td>Rs {Number(sale.total || 0).toFixed(2)}</td>
                        <td><button className="secondary-btn" onClick={() => printReceipt(sale)}>Print</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {!loading && page === "Daily Report" && (
          <section className="panel">
            <div className="panel-heading">
              <div><h2>Daily Sales &amp; Profit Report</h2><p>Review revenue, product costs and gross profit for a selected date.</p></div>
              <button className="secondary-btn" onClick={refreshData}>Update report ↻</button>
            </div>

            <label className="report-date-label">
              Report date
              <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
            </label>

            <section className="stats-grid report-stats">
              <Stat label="Total Sales" value={`Rs ${dailyRevenue.toFixed(2)}`} icon="↗" />
              <Stat label="Bills Completed" value={dailySales.length} icon="▤" />
              <Stat label="Items Sold" value={dailyItemsSold} icon="▦" />
              <Stat label="Cost of Goods Sold" value={hasCompleteDailyCost ? `Rs ${dailyCost.toFixed(2)}` : "Incomplete"} icon="−" />
            </section>

            <section className="report-profit-panel">
              <div>
                <span className="welcome-tag">GROSS PROFIT</span>
                <h2>{hasCompleteDailyCost ? `Rs ${dailyGrossProfit.toFixed(2)}` : "Cannot calculate accurately"}</h2>
                <p>
                  {hasCompleteDailyCost
                    ? "Calculated as total sales minus the purchase cost of sold items."
                    : "Some sales on this date do not have purchasePrice saved. Their profit cannot be calculated accurately. New sales recorded after the backend update should include it."}
                </p>
              </div>
            </section>

            <div className="panel-heading report-table-heading">
              <div><h2>Sales for {reportDate}</h2><p>Each row represents a completed bill.</p></div>
            </div>

            {dailySales.length === 0 ? <p className="empty-message">No sales found for this date.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Bill ID</th><th>Time</th><th>Items</th><th>Payment</th><th>Sales</th><th>Cost</th><th>Gross Profit</th></tr></thead>
                  <tbody>
                    {dailySales.map((sale) => {
                      const saleHasCost = (sale.items || []).every((item) => item.purchasePrice != null && Number.isFinite(Number(item.purchasePrice)));
                      const saleCost = (sale.items || []).reduce((sum, item) => sum + (item.purchasePrice == null ? 0 : Number(item.purchasePrice) * Number(item.quantity || 0)), 0);
                      return (
                        <tr key={sale._id}>
                          <td>{String(sale._id).slice(-8).toUpperCase()}</td>
                          <td>{new Date(sale.createdAt).toLocaleTimeString()}</td>
                          <td>{(sale.items || []).map((item) => `${item.name} × ${item.quantity}`).join(", ")}</td>
                          <td>{sale.paymentMethod}</td>
                          <td>Rs {Number(sale.total || 0).toFixed(2)}</td>
                          <td>{saleHasCost ? `Rs ${saleCost.toFixed(2)}` : "Missing cost"}</td>
                          <td>{saleHasCost ? `Rs ${(Number(sale.total || 0) - saleCost).toFixed(2)}` : "Unavailable"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="report-footnote"></p>
          </section>
        )}

        {!loading && page === "Receipt" && (
          <section className="panel receipt-panel">
            {lastSale ? <Receipt sale={lastSale} onPrint={printReceipt} /> : (
              <>
                <h2>No recent receipt</h2>
                <p>You can print a previous receipt from Sales History.</p>
                <button className="primary-btn" onClick={() => setPage("Sales History")}>Open Sales History</button>
              </>
            )}
          </section>
        )}

        <footer>CampusMart POS · MERN Stack Learning Project</footer>
      </main>
    </div>
  );
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}



function getProductImage(product) {
  if (!product.image) return "";

  return `${SERVER_URL}${product.image}`;
}


function getProductIcon(product) {
  const category = String(product.category || "").toLowerCase();
  const name = String(product.name || "").toLowerCase();
  if (category.includes("notebook") || name.includes("notebook")) return "📓";
  if (category.includes("register") || name.includes("register")) return "📔";
  if (category.includes("pen") || name.includes("pen")) return "🖊️";
  if (category.includes("pencil") || name.includes("pencil")) return "✏️";
  if (category.includes("art") || name.includes("color") || name.includes("paint")) return "🎨";
  if (name.includes("ruler")) return "📏";
  if (name.includes("eraser")) return "🧽";
  if (name.includes("marker")) return "🖍️";
  if (name.includes("paper") || name.includes("sheet")) return "📄";
  return "📚";
}

function Receipt({ sale, onPrint }) {
  return (
    <div className="receipt-content">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 30, marginBottom: 4 }}>CampusMart</h2>
        <p>Stationery Store · Customer Receipt</p>
        <p>Thank you for shopping with us!</p>
      </div>
      <div style={{ lineHeight: 1.9 }}>
        <p><strong>Bill No:</strong> {String(sale._id).slice(-8).toUpperCase()}</p>
        <p><strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()}</p>
        <p><strong>Payment:</strong> {sale.paymentMethod}</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={`${item.sku}-${index}`}>
                <td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td><td>Rs {item.price}</td><td>Rs {item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: "right", marginTop: 24 }}>
        <p>Subtotal: Rs {sale.subtotal}</p><h2>Total: Rs {sale.total}</h2>
      </div>
      <p style={{ textAlign: "center", marginTop: 30 }}>Thank you for your purchase!</p>
      <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => onPrint(sale)}>Print Receipt 🖨️</button>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <p>{label}</p>
      <h2>{value}</h2>
    </div>
  );
}

const productCategories = ["Notebooks", "Pens", "Pencils", "Registers", "Art Supplies", "Stationery"];

function ProductTable({ products, onUpdatePurchaseCost, onUpdateProduct, onDeleteProduct }) {
  const [editingCostId, setEditingCostId] = useState("");
  const [costValue, setCostValue] = useState("");
  const [savingCost, setSavingCost] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  if (products.length === 0) return <p className="empty-message">No products found.</p>;

  async function saveCost(productId) {
    setSavingCost(true);
    const saved = await onUpdatePurchaseCost(productId, costValue);
    setSavingCost(false);
    if (saved) {
      setEditingCostId("");
      setCostValue("");
    }
  }

  function startEdit(product) {
    setEditingCostId("");
    setEditingId(product._id);
    setDraft({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
    });
  }

  function cancelEdit() {
    setEditingId("");
    setDraft(null);
  }

  async function saveEdit(productId) {
    setSavingEdit(true);
    const saved = await onUpdateProduct(productId, {
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      category: draft.category,
      price: draft.price === "" ? NaN : Number(draft.price),
      stock: draft.stock === "" ? NaN : Number(draft.stock),
    });
    setSavingEdit(false);
    if (saved) cancelEdit();
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th><th>SKU</th><th>Category</th><th>Purchase Cost</th>
            <th>Selling Price</th><th>Stock</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isEditing = editingId === product._id && draft;
            const categoryOptions = isEditing && !productCategories.includes(draft.category)
              ? [draft.category, ...productCategories]
              : productCategories;

            return (
              <tr key={product._id}>
                <td>
                  {isEditing ? (
                    <input aria-label="Product name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={{ width: 140 }} />
                  ) : (
                    <span className="inventory-product">
                      <img src={getProductImage(product)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                      <strong>{product.name}</strong>
                    </span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input aria-label="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} style={{ width: 100 }} />
                  ) : (
                    product.sku
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select aria-label="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                      {categoryOptions.map((category) => <option key={category}>{category}</option>)}
                    </select>
                  ) : (
                    product.category
                  )}
                </td>
                <td>
                  {editingCostId === product._id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 170 }}>
                      <input aria-label={`Purchase cost for ${product.name}`} type="number" min="0" step="0.01" value={costValue} onChange={(event) => setCostValue(event.target.value)} style={{ width: 95 }} />
                      <button className="secondary-btn" disabled={savingCost || costValue === ""} onClick={() => saveCost(product._id)}>{savingCost ? "Saving..." : "Save"}</button>
                      <button className="secondary-btn" disabled={savingCost} onClick={() => { setEditingCostId(""); setCostValue(""); }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 150 }}>
                      <span>Rs {Number(product.purchasePrice || 0).toFixed(2)}</span>
                      <button className="secondary-btn" disabled={Boolean(isEditing)} onClick={() => { setEditingCostId(product._id); setCostValue(String(product.purchasePrice ?? 0)); }}>Edit Cost</button>
                    </div>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input aria-label="Selling price" type="number" min="0" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} style={{ width: 90 }} />
                  ) : (
                    `Rs ${Number(product.price).toFixed(2)}`
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input aria-label="Stock" type="number" min="0" step="1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} style={{ width: 70 }} />
                  ) : (
                    product.stock
                  )}
                </td>
                <td>
                  <span className={`stock-badge ${product.stock < 10 ? "low" : "available"}`}>
                    {product.stock < 1 ? "Out of stock" : product.stock < 10 ? "Low stock" : "Available"}
                  </span>
                </td>
                <td>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="secondary-btn" disabled={savingEdit} onClick={() => saveEdit(product._id)}>{savingEdit ? "Saving..." : "Save"}</button>
                      <button className="secondary-btn" disabled={savingEdit} onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="secondary-btn" onClick={() => startEdit(product)}>Edit</button>
                      <button className="secondary-btn" onClick={() => onDeleteProduct(product)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
