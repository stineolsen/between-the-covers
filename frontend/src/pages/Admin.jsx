import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { productsApi } from '../api/productsApi';
import ProductForm from '../components/shop/ProductForm';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchPendingUsers();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.getPendingUsers();
      setPendingUsers(data.users);
      setError('');
    } catch (err) {
      setError('Failed to load pending users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, status) => {
    try {
      await authApi.approveUser(userId, status);
      setSuccessMessage(`User ${status} successfully!`);
      // Remove user from pending list
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Failed to ${status} user`);
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getProducts();
      setProducts(data.products || []);
      setError('');
    } catch (err) {
      setError('Failed to load products');
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
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsApi.deleteProduct(productId);
      setSuccessMessage('Product deleted successfully!');
      setProducts(products.filter(p => p._id !== productId));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete product');
      console.error(err);
    }
  };

  const handleProductFormSuccess = () => {
    setSuccessMessage(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
    setShowProductForm(false);
    setEditingProduct(null);
    fetchProducts();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleProductFormCancel = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-white text-lg drop-shadow-lg">Manage users and products</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'users'
                ? 'text-white'
                : 'bg-white text-gray-700'
            }`}
            style={activeTab === 'users' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
          >
            👥 Pending Users
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'products'
                ? 'text-white'
                : 'bg-white text-gray-700'
            }`}
            style={activeTab === 'products' ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' } : {}}
          >
            🛍️ Manage Products
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
            {successMessage}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#667eea' }}></div>
                <p className="text-gray-700 font-bold">Loading pending users...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-gray-700 text-lg font-bold">✅ No pending users at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-6 animate-fadeIn">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="container-gradient hover:shadow-2xl transition-all transform hover:scale-[1.02]">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold gradient-text mb-1">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-gray-600 mb-1 font-semibold">@{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.bio && (
                          <p className="mt-2 text-gray-700 italic">{user.bio}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Registered: {new Date(user.joinedDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-3 ml-6">
                        <button
                          onClick={() => handleApproveUser(user._id, 'approved')}
                          className="btn-accent px-6"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleApproveUser(user._id, 'rejected')}
                          className="px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-white"
                          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                        >
                          ✕ Reject
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
        {activeTab === 'products' && (
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
                    ✨ Add New Product
                  </button>
                </div>

                {loading ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#f093fb' }}></div>
                    <p className="text-gray-700 font-bold">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <p className="text-gray-700 text-lg font-bold">📦 No products in the shop yet. Click "Add New Product" to get started!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {products.map((product) => (
                      <div key={product._id} className="container-gradient hover:shadow-2xl transition-all transform hover:scale-105">
                        <h3 className="text-xl font-bold gradient-text mb-2">{product.name}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-gray-800">
                            {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '£'}
                            {product.price.toFixed(2)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isAvailable ? '✅ Available' : '❌ Unavailable'}
                          </span>
                        </div>

                        <div className="flex gap-2 mb-3 text-xs">
                          <span className="px-3 py-1 rounded-full font-bold text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                            {product.category}
                          </span>
                          <span className="px-3 py-1 rounded-full font-bold text-white" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                            Stock: {product.stock}
                          </span>
                        </div>

                        {product.book && (
                          <p className="text-xs text-gray-500 mb-3">
                            📚 Related to: {product.book.title}
                          </p>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 btn-secondary py-2 text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="flex-1 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-md text-sm text-white"
                            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                          >
                            🗑️ Delete
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
      </div>
    </div>
  );
};

export default Admin;
