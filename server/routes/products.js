const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all products (Public route)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products',
      error: error.message 
    });
  }
});

// Get single product (Public route)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Fetch product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching product',
      error: error.message 
    });
  }
});

// Add product (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, price, image, stock, category } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      image: image || '',
      stock: parseInt(stock) || 0,
      category
    });
    
    await product.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Product created successfully', 
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating product',
      error: error.message 
    });
  }
});

// Update product (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Convert price and stock to numbers if provided
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.stock) updates.stock = parseInt(updates.stock);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Product updated successfully', 
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating product',
      error: error.message 
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting product',
      error: error.message 
    });
  }
});

module.exports = router;
