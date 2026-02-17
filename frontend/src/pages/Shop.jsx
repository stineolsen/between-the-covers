import { useState, useEffect } from 'react';
import { productsApi } from '../api/productsApi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import BookCoverFallback from '../components/common/BookCoverFallback';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const { cart, addToCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const toast = useToast();

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryAddress: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getProducts({ available: 'true' });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Greide ikke hente varer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} lagt til i handlekurven!`);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.warning('Din handlekurv er tom');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare order items
      const items = cart.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      // Submit order
      await productsApi.submitContactOrder({
        ...checkoutForm,
        items
      });

      // Clear cart and form
      clearCart();
      setCheckoutForm({ name: '', email: '', phone: '', deliveryAddress: '', notes: '' });
      setShowCheckout(false);
      setShowCart(false);

      toast.success('Besilling sendt med suksess! Du vil bli kontaktet fortløpende.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Greide ikke sende bestilling');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-20 w-20 mx-auto mb-4" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
          <p className="text-white text-xl font-bold drop-shadow-lg">✨ Laster inn varer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">🛍️ BTC butikken</h1>
            <p className="text-xl text-white font-medium">Bøker, merch og mer!</p>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative px-6 py-4 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            🛒 Handlekurv ({getTotalItems()})
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gradient-text">Din handlekurv</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-3xl text-gray-600 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-600">Din handlekurv er tom</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.product._id} className="flex gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{item.product.name}</h3>
                          <p className="text-gray-600">${item.product.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="ml-2 text-red-500 hover:text-red-700 font-bold"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold mb-4">
                      <span>Total:</span>
                      <span className="gradient-text">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full py-4 rounded-full font-bold text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
                    >
                      Fortsett til utsjekk
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold gradient-text">Utsjekk</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-3xl text-gray-600 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Navn *</label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">Epost *</label>
                  <input
                    type="email"
                    required
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">Leveringsmåte</label>
                  <textarea
                    value={checkoutForm.deliveryAddress}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, deliveryAddress: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">Notater</label>
                  <textarea
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                    placeholder="Any special requests?"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold text-lg mb-4">Bestilling oppsummering</h3>
                  {cart.map(item => (
                    <div key={item.product._id} className="flex justify-between mb-2">
                      <span>{item.product.name} × {item.quantity}</span>
                      <span className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
                    <span>Totalt:</span>
                    <span className="gradient-text">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-full font-bold text-white shadow-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </button>

                <p className="text-sm text-gray-600 text-center">
                  Du vil bli kontaktet ang din bestilling (betaling og levering).
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div
            className="container-gradient text-center py-20 animate-fadeIn"
            style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}
          >
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Ingen varer tilgjendelig</h2>
            <p className="text-gray-600 text-lg">Kom tilbake senere for nye varer!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product._id} className="container-gradient group transform transition-all hover:scale-105">
                {/* Product Image */}
                <BookCoverFallback
                  src={product.images && product.images[0] ? productsApi.getImageUrl(product.images[0]) : null}
                  alt={product.name}
                  category={product.category || 'merchandise'}
                  className="h-48 w-full rounded-2xl mb-4 object-cover"
                />

                {/* Product Info */}
                <h3 className="text-lg font-bold gradient-text mb-2">{product.name}</h3>
                {product.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* Price and Stock */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold gradient-text">${product.price.toFixed(2)}</span>
                  {product.inStock ? (
                    <span className="text-green-600 text-sm font-bold">✓ På lager</span>
                  ) : (
                    <span className="text-red-600 text-sm font-bold">Ikke på lager</span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className="w-full py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                >
                  {product.inStock ? '🛒 Legg til i handlekurven' : 'Ikke tilgjengelig for øyeblikket'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
