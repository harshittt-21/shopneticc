const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get user cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('products.productId', 'name price image');
    
    if (!cart) {
      cart = new Cart({ 
        userId: req.user._id, 
        products: [], 
        total: 0 
      });
      await cart.save();
    }
    
    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching cart',
      error: error.message 
    });
  }
});

// Add product to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({ 
        userId: req.user._id, 
        products: [], 
        total: 0 
      });
    }

    // Check if product already in cart
    const existingProductIndex = cart.products.findIndex(
      p => p.productId.toString() === productId
    );
    
    if (existingProductIndex > -1) {
      // Update quantity
      cart.products[existingProductIndex].quantity += parseInt(quantity);
    } else {
      // Add new product
      cart.products.push({
        productId,
        quantity: parseInt(quantity),
        price: product.price
      });
    }

    // Calculate total
    cart.total = cart.products.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
    
    await cart.save();
    await cart.populate('products.productId', 'name price image');
    
    res.json({ 
      success: true,
      message: 'Product added to cart successfully', 
      cart 
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding product to cart',
      error: error.message 
    });
  }
});

// Update cart item quantity
router.put('/update/:productId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const productIndex = cart.products.findIndex(
      p => p.productId.toString() === req.params.productId
    );
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    cart.products[productIndex].quantity = parseInt(quantity);
    
    // Recalculate total
    cart.total = cart.products.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
    
    await cart.save();
    await cart.populate('products.productId', 'name price image');
    
    res.json({ 
      success: true,
      message: 'Cart updated successfully', 
      cart 
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating cart',
      error: error.message 
    });
  }
});

// Remove product from cart
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    cart.products = cart.products.filter(
      p => p.productId.toString() !== req.params.productId
    );
    
    // Recalculate total
    cart.total = cart.products.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
    
    await cart.save();
    await cart.populate('products.productId', 'name price image');
    
    res.json({ 
      success: true,
      message: 'Product removed from cart successfully', 
      cart 
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error removing product from cart',
      error: error.message 
    });
  }
});

// Clear entire cart
router.delete('/clear', auth, async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { products: [], total: 0 },
      { new: true }
    );
    
    res.json({ 
      success: true,
      message: 'Cart cleared successfully' 
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing cart',
      error: error.message 
    });
  }
});

module.exports = router;
