import { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("bookclubCart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error(
          "Greide ikke laste inn handlekurv fra localStorage:",
          error,
        );
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("bookclubCart", JSON.stringify(cart));
  }, [cart]);

  // Add item to cart (size is optional; same product + different size = separate line)
  const addToCart = (product, quantity = 1, size = null) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product._id === product._id && item.size === size,
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product._id === product._id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        return [...currentCart, { product, quantity, size }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId, size = null) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => !(item.product._id === productId && item.size === size),
      ),
    );
  };

  // Update item quantity
  const updateQuantity = (productId, quantity, size = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
    } else {
      setCart((currentCart) =>
        currentCart.map((item) =>
          item.product._id === productId && item.size === size
            ? { ...item, quantity }
            : item,
        ),
      );
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  };

  // Calculate total items
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
