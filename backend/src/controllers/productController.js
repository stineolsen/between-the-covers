const Product = require("../models/Product");
const Order = require("../models/Order");

// @desc    Get all products (with optional filters)
// @route   GET /api/products
// @access  Public (authenticated)
exports.getProducts = async (req, res) => {
  try {
    const { category, available } = req.query;

    let query = {};

    // Filter by category
    if (category) query.category = category;

    // Filter by availability
    if (available === "true") query.isAvailable = true;

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public (authenticated)
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      category,
      stock,
      bookId,
      images,
    } = req.body;

    const imageFilename = req.file ? req.file.filename : null;
    const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];

    const product = await Product.create({
      name,
      description,
      price,
      currency: currency || "NOK",
      category: category || "other",
      stock: stock || 0,
      book: bookId || null,
      images: imageFilename ? [imageFilename] : (images || []),
      sizes,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      category,
      stock,
      isAvailable,
      bookId,
      images,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (currency !== undefined) product.currency = currency;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    if (bookId !== undefined) product.book = bookId || null;
    if (req.file) product.images = [req.file.filename];
    else if (images !== undefined) product.images = images;
    if (req.body.sizes !== undefined) {
      try { product.sizes = JSON.parse(req.body.sizes); } catch { product.sizes = []; }
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// @desc    Submit contact form order
// @route   POST /api/shop/contact-order
// @access  Private
exports.submitContactOrder = async (req, res) => {
  try {
    const { name, email, phone, items, deliveryAddress, notes } = req.body;

    // Validate required fields
    if (!name || !email || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and at least one item",
      });
    }

    // Validate and process items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
        });
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Add to order items
      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        currency: product.currency,
      });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      notes,
      status: "pending",
    });

    console.log("New order created:", {
      orderId: order._id,
      user: req.user.email,
      name,
      totalAmount,
      itemCount: items.length,
    });

    res.status(201).json({
      success: true,
      message:
        "Order received! We will contact you shortly via email to arrange payment and delivery.",
      order: {
        _id: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit contact order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit order",
    });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private (Admin)
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};
