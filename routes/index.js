const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

// Replace with your actual Razorpay key and secret
const instance = new Razorpay({
  key_id: 'rzp_test_cVKgsetuz7l4GK',
  key_secret: 'Y4sk6qZH7pZKrBHBusNmlY8xmT',
});

// Replace with your actual MongoDB connection string
mongoose.connect('mongodb://localhost:27017/digital-wallet');

// Define the schema for the Order model
const orderSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String, default: '' },
}, { timestamps: true });

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', async (req, res) => {
  try {
    const { rollNumber, amount } = req.body;

    // Create a new order document in the database
    const newOrder = new Order({
      rollNumber,
      amount,
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();
    console.log('Saved Order:', savedOrder);

    // Create a Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: savedOrder.amount * 100,  // Razorpay amount is in paisa
      currency: 'INR',
      receipt: `receipt#${savedOrder._id}`,  // Use a unique identifier as the receipt
    });

    // Update the database record with the Razorpay order ID
    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

    // Send the Razorpay order details to the client
    res.json(razorpayOrder);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;