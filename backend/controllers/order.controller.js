const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Ensure environment variables from backend/.env are loaded regardless of execution context or cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

// Helper to get configured Razorpay client instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
  }

  const keyId = process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : '';

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// Helper to get verification secret (Razorpay Key Secret or fallback)
const getVerificationSecret = () => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
  }
  return (
    (process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET.trim()) ||
    (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) ||
    'shopkart_gateway_secret_2026'
  );
};

// 1. Create a new Order from customer's persistent Cart
// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const customerId = req.user._id;
    const {
      shippingAddress,
      paymentMethod = 'Online Payment (Razorpay)',
    } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const { fullName, phone, address, city, state, postalCode } = shippingAddress;
    if (!fullName || !phone || !address || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'All shipping address fields (full name, phone, address, city, state, postal code) are required',
      });
    }

    // Validate payment method
    const allowedPaymentMethods = [
      'Online Payment (Razorpay)',
      'Online Payment (Test Gateway)',
      'Online Payment',
      'Cash on Delivery',
    ];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method selected',
      });
    }

    // Fetch customer's persistent shopping cart from database
    const cart = await Cart.findOne({ customer: customerId }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your shopping cart is empty. Add products before placing an order.',
      });
    }

    // Server-side validation: verify each product's existence, price, and current stock
    const orderItems = [];
    let itemsPrice = 0;

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'An item in your cart no longer exists in our catalog.',
        });
      }

      // Check real-time stock
      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot place order. "${product.name}" only has ${product.stock} units in stock, but ${item.quantity} requested.`,
        });
      }

      // Calculate strictly using current database catalog prices (never trust client)
      const unitPrice = Number(product.price) || 0;
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      itemsPrice += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image || '',
        price: unitPrice,
        quantity: item.quantity,
        itemTotal: lineTotal,
      });
    }

    const taxPrice = 0.0;
    const shippingPrice = 0.0; // Free delivery
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

    // Case A: Cash on Delivery (COD) -> Order confirmed immediately, stock deducted, cart cleared
    if (paymentMethod === 'Cash on Delivery') {
      // Deduct stock for all ordered products
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // Clear customer's persistent cart
      cart.items = [];
      await cart.save();

      const order = new Order({
        customer: customerId,
        orderItems,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: (shippingAddress.country || 'India').trim(),
        },
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        orderStatus: 'Processing',
        isPaid: false,
        paymentResult: {
          paymentId: `cod_${Date.now()}`,
          gatewayOrderId: `cod_order_${Date.now()}`,
          status: 'Pending (Cash on Delivery)',
        },
      });

      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully with Cash on Delivery',
        order,
      });
    }

    // Case B: Online Payment via Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      dotenv.config({ path: path.resolve(__dirname, '../.env') });
    }

    const keyId = process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : '';

    if (keyId && keySecret) {
      const razorpay = getRazorpayInstance();
      const amountInPaise = Math.round(totalPrice * 100);

      let rzpOrder;
      try {
        rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${customerId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
          notes: {
            customerId: customerId.toString(),
            shopkartOrder: 'ShopKart Retail Store',
          },
        });
      } catch (rzpErr) {
        console.error('Razorpay order creation error:', rzpErr);
        return res.status(502).json({
          success: false,
          message: `Failed to create Razorpay payment order: ${rzpErr.error?.description || rzpErr.message || 'Payment gateway error'}`,
        });
      }

      const order = new Order({
        customer: customerId,
        orderItems,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: (shippingAddress.country || 'India').trim(),
        },
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        orderStatus: 'Pending',
        isPaid: false,
        paymentResult: {
          gatewayOrderId: rzpOrder.id,
          status: 'Pending',
        },
      });

      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Razorpay order created successfully. Proceed to payment.',
        order,
        razorpayOrder: {
          orderId: order._id,
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount, // in paise
          currency: rzpOrder.currency || 'INR',
          keyId: keyId,
        },
        gatewayOrder: {
          orderId: order._id,
          gatewayOrderId: rzpOrder.id,
          amount: totalPrice,
          currency: 'INR',
        },
      });
    }

    // If Razorpay keys are not configured in environment
    if (paymentMethod === 'Online Payment (Razorpay)' || paymentMethod === 'Online Payment') {
      return res.status(400).json({
        success: false,
        message:
          'Razorpay payment gateway keys are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env to enable online checkout.',
      });
    }

    // Case C: Legacy Test Gateway (for automated test suite or offline demonstration)
    const gatewayOrderId = `order_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expectedSignature = crypto
      .createHmac('sha256', getVerificationSecret())
      .update(`${gatewayOrderId}|${totalPrice}`)
      .digest('hex');

    const order = new Order({
      customer: customerId,
      orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: (shippingAddress.country || 'India').trim(),
      },
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderStatus: 'Pending',
      isPaid: false,
      paymentResult: {
        gatewayOrderId,
        status: 'Pending',
      },
    });

    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Test order created. Proceed to payment verification.',
      order,
      gatewayOrder: {
        orderId: order._id,
        gatewayOrderId,
        amount: totalPrice,
        currency: 'INR',
        testSignature: expectedSignature,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating order',
    });
  }
};

// 2. Verify Payment for an Order
// POST /api/orders/:id/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const customerId = req.user._id;
    const orderId = req.params.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
      gatewayOrderId,
      signature,
      simulateFailure = false,
    } = req.body;

    const actualOrderId = razorpay_order_id || gatewayOrderId;
    const actualPaymentId = razorpay_payment_id || paymentId;
    const actualSignature = razorpay_signature || signature;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ensure customer owns this order
    if (order.customer.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order',
      });
    }

    // Check if order was already paid (prevent duplicate callbacks / double fulfillment)
    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid and processed.',
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify payment for a cancelled order.',
      });
    }

    // Cash on Delivery orders do not require online verification
    if (order.paymentMethod === 'Cash on Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Cash on Delivery orders do not require online payment verification.',
      });
    }

    // Handle simulation failure or cancellation
    if (simulateFailure) {
      order.orderStatus = 'Payment Failed';
      order.paymentResult = {
        paymentId: actualPaymentId || `failed_${Date.now()}`,
        gatewayOrderId: actualOrderId || order.paymentResult?.gatewayOrderId,
        status: 'Failed',
      };
      await order.save();

      // Cart is intentionally preserved so user can retry
      return res.status(400).json({
        success: false,
        message: 'Payment was declined or cancelled. Your cart has been preserved.',
        order,
      });
    }

    // Guard: gateway order id must match order's registered gateway order id
    if (order.paymentResult?.gatewayOrderId && actualOrderId) {
      if (order.paymentResult.gatewayOrderId !== actualOrderId) {
        return res.status(400).json({
          success: false,
          message: 'Gateway order ID mismatch. Verification failed.',
        });
      }
    }

    // Secure Signature Verification (HMAC-SHA256)
    const secret = getVerificationSecret();

    // 1) Razorpay standard format: ${order_id}|${payment_id}
    const rzpExpected = actualOrderId && actualPaymentId
      ? crypto
          .createHmac('sha256', secret)
          .update(`${actualOrderId}|${actualPaymentId}`)
          .digest('hex')
      : null;

    // 2) Legacy test format: ${order_id}|${totalPrice}
    const legacyExpected = actualOrderId
      ? crypto
          .createHmac('sha256', secret)
          .update(`${actualOrderId}|${order.totalPrice}`)
          .digest('hex')
      : null;

    const isSignatureValid = Boolean(
      actualSignature && (
        (rzpExpected && actualSignature === rzpExpected) ||
        (legacyExpected && actualSignature === legacyExpected)
      )
    );

    if (!isSignatureValid) {
      order.orderStatus = 'Payment Failed';
      order.paymentResult = {
        paymentId: actualPaymentId || '',
        gatewayOrderId: actualOrderId || '',
        status: 'Signature Mismatch (Failed)',
      };
      await order.save();

      // Cart preserved on failure
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // Re-verify catalog stock right before payment finalization
    for (const item of order.orderItems) {
      const p = await Product.findById(item.product);
      if (!p || p.stock < item.quantity) {
        order.orderStatus = 'Payment Failed';
        await order.save();
        return res.status(400).json({
          success: false,
          message: `Stock changed unexpectedly for "${item.name}". Order could not be completed.`,
        });
      }
    }

    // Deduct stock in catalog
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Mark order as Paid and Processing
    order.isPaid = true;
    order.paidAt = new Date();
    order.orderStatus = 'Processing';
    order.paymentResult = {
      paymentId: actualPaymentId || `pay_${Date.now()}`,
      gatewayOrderId: actualOrderId,
      signature: actualSignature,
      status: 'Paid',
      paidAt: new Date(),
    };
    await order.save();

    // Now that payment is verified and order processed, clear customer's shopping cart
    await Cart.findOneAndUpdate(
      { customer: customerId },
      { $set: { items: [] } }
    );

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order placed!',
      order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying payment',
    });
  }
};

// 3. Fetch all orders for authenticated customer
// GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user._id;
    const orders = await Order.find({ customer: customerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching orders',
    });
  }
};

// 4. Fetch specific order details by ID
// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const customerId = req.user._id;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(orderId).populate('orderItems.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ownership check: Customer can only view their own order
    if (order.customer.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this order',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order details',
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
};
