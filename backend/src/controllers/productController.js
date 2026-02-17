const Product = require('../models/Product');

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
    if (available === 'true') query.isAvailable = true;

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
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
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, currency, category, stock, bookId, images } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      currency: currency || 'USD',
      category: category || 'other',
      stock: stock || 0,
      book: bookId || null,
      images: images || []
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, currency, category, stock, isAvailable, bookId, images } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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
    if (images !== undefined) product.images = images;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product'
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
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
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
        message: 'Please provide name, email, and at least one item'
      });
    }

    // In a real application, you would:
    // 1. Send email notification to admin
    // 2. Store order in database
    // 3. Send confirmation email to customer

    // For now, just log the order and send success response
    console.log('New order received:', {
      user: req.user.email,
      name,
      email,
      phone,
      items,
      deliveryAddress,
      notes,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Order received! We will contact you shortly via email to arrange payment and delivery.'
    });
  } catch (error) {
    console.error('Submit contact order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit order'
    });
  }
};
