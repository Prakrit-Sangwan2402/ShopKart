const mongoose = require('mongoose');

// Schema for individual items within an order (immutable snapshot of product at purchase)
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price snapshot is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    itemTotal: {
      type: Number,
      required: [true, 'Item total is required'],
    },
  },
  {
    _id: true,
  }
);

// Schema for shipping address details
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal / PIN code is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// Schema for payment gateway transaction records & signatures
const paymentResultSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      default: '',
    },
    gatewayOrderId: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Pending',
    },
    paidAt: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

// Schema for customer orders (Engineering Lab 06)
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    orderItems: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: [
        'Online Payment (Razorpay)',
        'Online Payment (Test Gateway)',
        'Online Payment',
        'Cash on Delivery',
      ],
      default: 'Online Payment (Razorpay)',
    },
    paymentResult: {
      type: paymentResultSchema,
      default: () => ({ status: 'Pending' }),
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Paid', 'Delivered', 'Cancelled', 'Payment Failed'],
      default: 'Pending',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
