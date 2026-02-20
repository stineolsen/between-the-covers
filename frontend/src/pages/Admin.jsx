import { useState, useEffect } from "react";
import { authApi } from "../api/authApi";
import { productsApi } from "../api/productsApi";
import ProductForm from "../components/shop/ProductForm";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (activeTab === "users") {
      fetchPendingUsers();
    } else if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.getPendingUsers();
      setPendingUsers(data.users);
      setError("");
    } catch (err) {
      setError("Greide ikke laste brukere til godkjenning");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, status) => {
    try {
      await authApi.approveUser(userId, status);
      setSuccessMessage(
        `Bruker ${status === "approved" ? "godkjent" : "avvist"}!`,
      );
      // Remove user from pending list
      setPendingUsers(pendingUsers.filter((user) => user._id !== userId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(
        `Greide ikke ${status === "approved" ? "godkjenne" : "avvise"} bruker`,
      );
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getProducts();
      setProducts(data.products || []);
      setError("");
    } catch (err) {
      setError("Greide ikke laste varer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Er du sikker på at du vil slette varen?")) {
      return;
    }

    try {
      await productsApi.deleteProduct(productId);
      setSuccessMessage("Vare slettet!");
      setProducts(products.filter((p) => p._id !== productId));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Lykkes ikke med å slette varen");
      console.error(err);
    }
  };

  const handleProductFormSuccess = () => {
    setSuccessMessage(
      `Vare ${editingProduct ? "oppdatert" : "opprettet"} uten problemer!`,
    );
    setShowProductForm(false);
    setEditingProduct(null);
    fetchProducts();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleProductFormCancel = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getOrders();
      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      setError("Greide ikke laste bestillinger");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await productsApi.updateOrderStatus(orderId, newStatus);
      setSuccessMessage(`Bestillingsstatus oppdatert til ${newStatus}!`);
      fetchOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke oppdatere bestillingsstatus");
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray text-lg drop-shadow-lg">
            Rediger brukere, varer og bestillinger
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "users" ? "text-white" : "bg-white text-gray-700"
            }`}
            style={
              activeTab === "users"
                ? { background: "linear-gradient(135deg, #667eea, #764ba2)" }
                : {}
            }
          >
            👥 Brukere til godkjenning
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "products" ? "text-white" : "bg-white text-gray-700"
            }`}
            style={
              activeTab === "products"
                ? { background: "linear-gradient(135deg, #f093fb, #f5576c)" }
                : {}
            }
          >
            🛍️ Rediger varer
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "orders" ? "text-white" : "bg-white text-gray-700"
            }`}
            style={
              activeTab === "orders"
                ? { background: "linear-gradient(135deg, #14b8a6, #10b981)" }
                : {}
            }
          >
            📦 Bestillinger
          </button>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
            style={{ background: "linear-gradient(135deg, #10b981, #14b8a6)" }}
          >
            {successMessage}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{
                    border: "4px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#667eea",
                  }}
                ></div>
                <p className="text-gray-700 font-bold">
                  Later brukere til godkjenning...
                </p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-gray-700 text-lg font-bold">
                  ✅ Ingen brukere til godkjenning for øyeblikket.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 animate-fadeIn">
                {pendingUsers.map((user) => (
                  <div
                    key={user._id}
                    className="container-gradient hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold gradient-text mb-1">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-gray-600 mb-1 font-semibold">
                          @{user.username}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.bio && (
                          <p className="mt-2 text-gray-700 italic">
                            {user.bio}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Registrert:{" "}
                          {new Date(user.joinedDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-3 ml-6">
                        <button
                          onClick={() =>
                            handleApproveUser(user._id, "approved")
                          }
                          className="btn-accent px-6"
                        >
                          ✓ Godkjenn
                        </button>
                        <button
                          onClick={() =>
                            handleApproveUser(user._id, "rejected")
                          }
                          className="px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444, #dc2626)",
                          }}
                        >
                          ✕ Avvis
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {showProductForm ? (
              <ProductForm
                product={editingProduct}
                onSuccess={handleProductFormSuccess}
                onCancel={handleProductFormCancel}
              />
            ) : (
              <>
                <div className="mb-6">
                  <button
                    onClick={handleAddProduct}
                    className="btn-primary px-8 py-4 text-lg"
                  >
                    ✨ Legg til vare
                  </button>
                </div>

                {loading ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <div
                      className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                      style={{
                        border: "4px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#f093fb",
                      }}
                    ></div>
                    <p className="text-gray-700 font-bold">
                      Laster inn varer...
                    </p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <p className="text-gray-700 text-lg font-bold">
                      📦 Ingen varer i butikken enda. Trykk på "Legg til vare"
                      for å starte!
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="container-gradient hover:shadow-2xl transition-all transform hover:scale-105"
                      >
                        <h3 className="text-xl font-bold gradient-text mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-gray-800">
                            {product.currency === "NOK"
                              ? "kr "
                              : product.currency === "USD"
                                ? "$"
                                : product.currency === "EUR"
                                  ? "€"
                                  : "£"}
                            {product.price.toFixed(2)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              product.isAvailable
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.isAvailable
                              ? "✅ Tilgjengelig"
                              : "❌ Ikke tilgjengelig"}
                          </span>
                        </div>

                        <div className="flex gap-2 mb-3 text-xs">
                          <span
                            className="px-3 py-1 rounded-full font-bold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea, #764ba2)",
                            }}
                          >
                            {product.category}
                          </span>
                          <span
                            className="px-3 py-1 rounded-full font-bold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #f093fb, #f5576c)",
                            }}
                          >
                            Antall igjen i butikk: {product.stock}
                          </span>
                        </div>

                        {product.book && (
                          <p className="text-xs text-gray-500 mb-3">
                            📚 Relatert til: {product.book.title}
                          </p>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 btn-secondary py-2 text-sm"
                          >
                            ✏️ Rediger
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="flex-1 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-md text-sm text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #ef4444, #dc2626)",
                            }}
                          >
                            🗑️ Slett
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{
                    border: "4px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#14b8a6",
                  }}
                ></div>
                <p className="text-gray-700 font-bold">Laster inn varer...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-gray-700 text-lg font-bold">
                  📦 Ingen bestillinger enda.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 animate-fadeIn">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="container-gradient hover:shadow-2xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold gradient-text mb-1">
                          Bestilling #{order._id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-bold text-gray-700 mb-2">
                          Bestillingsdetaljer
                        </h4>
                        <p className="text-gray-700">
                          <strong>Navn:</strong> {order.customerName}
                        </p>
                        <p className="text-gray-700">
                          <strong>Epost:</strong> {order.customerEmail}
                        </p>
                        {order.customerPhone && (
                          <p className="text-gray-700">
                            <strong>Telefon:</strong> {order.customerPhone}
                          </p>
                        )}
                        {order.user && (
                          <p className="text-xs text-gray-500 mt-1">
                            Bruker: @{order.user.username}
                          </p>
                        )}
                      </div>

                      <div>
                        {order.deliveryAddress && (
                          <div className="mb-2">
                            <h4 className="font-bold text-gray-700 mb-1">
                              Adresse
                            </h4>
                            <p className="text-gray-700 text-sm">
                              {order.deliveryAddress}
                            </p>
                          </div>
                        )}
                        {order.notes && (
                          <div>
                            <h4 className="font-bold text-gray-700 mb-1">
                              Notater
                            </h4>
                            <p className="text-gray-700 text-sm italic">
                              {order.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-bold text-gray-700 mb-2">
                        Bestillingsgjenstander
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-white rounded-xl"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {item.productName}
                              </p>
                              {item.product && (
                                <p className="text-xs text-gray-500">
                                  {item.product.category}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-gray-700">
                                <strong>Antall:</strong> {item.quantity}
                              </p>
                              <p className="text-gray-700 font-bold">
                                {item.currency === "USD"
                                  ? "$"
                                  : item.currency === "EUR"
                                    ? "€"
                                    : "£"}
                                {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        className="mt-3 p-3 rounded-xl text-right"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
                        }}
                      >
                        <p className="text-2xl font-bold text-gray-800">
                          Total: {order.totalAmount.toFixed(2)} kr
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order._id, e.target.value)
                        }
                        className="flex-1 input-field py-2"
                      >
                        <option value="pending">Ventende</option>
                        <option value="confirmed">Bekreftet</option>
                        <option value="shipped">Sendt</option>
                        <option value="delivered">Levert</option>
                        <option value="cancelled">Kansellert</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
