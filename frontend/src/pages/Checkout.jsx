import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, verifyOrderPayment } from '../services/api';
import { IconShieldCheck, IconLock } from '../components/Icons';
import { formatINR } from '../utils/formatCurrency';

// Reliable dynamic script loader for official Razorpay Checkout SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = ({ customer }) => {
  const navigate = useNavigate();
  const { cart, refreshCart, loading: cartLoading } = useCart();

  // Form state for shipping address
  const [shippingAddress, setShippingAddress] = useState(() => ({
    fullName: customer?.fullName || '',
    phone: customer?.phone || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  }));

  // Selected payment method
  const [paymentMethod, setPaymentMethod] = useState('Online Payment (Razorpay)');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle form field change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit Order Form & Initialize Razorpay Standard Checkout
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Form validation
    const { fullName, phone, address, city, state, postalCode } = shippingAddress;
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !postalCode.trim()
    ) {
      setErrorMessage('Please fill in all required shipping address fields.');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setErrorMessage('Your cart is empty. Add products before placing an order.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step A: Create Order on Backend (server calculates total from trusted catalog prices)
      const data = await createOrder({
        shippingAddress,
        paymentMethod,
      });

      // Handle Cash on Delivery flow
      if (paymentMethod === 'Cash on Delivery') {
        await refreshCart();
        navigate(`/orders/${data.order._id}?success=true`);
        return;
      }

      // Step B: Online Payment via Razorpay Standard Checkout
      if (!data.razorpayOrder) {
        throw new Error(
          data.message || 'Razorpay order creation failed. Please check payment configuration.'
        );
      }

      // Load official Razorpay checkout script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error(
          'Failed to load Razorpay payment SDK. Please check your internet connection.'
        );
      }

      const { razorpayOrderId, amount, currency, keyId } = data.razorpayOrder;
      const orderId = data.order._id;

      // Configure Razorpay Checkout options
      const options = {
        key: keyId,
        amount: amount, // in paise
        currency: currency || 'INR',
        name: 'ShopKart',
        description: `Order #${orderId.slice(-8).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress.fullName.trim(),
          contact: shippingAddress.phone.trim(),
          email: customer?.email || '',
        },
        notes: {
          shopkart_order_id: orderId,
        },
        theme: {
          color: '#526b4e', // ShopKart muted olive green accent
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setErrorMessage(
              'Payment was cancelled or closed. Your cart has been preserved so you can retry when ready.'
            );
          },
        },
        handler: async function (response) {
          // Step C: Verify payment securely on the server
          try {
            setIsSubmitting(true);
            await verifyOrderPayment(orderId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Clear cart in frontend context and redirect to order confirmation
            await refreshCart();
            navigate(`/orders/${orderId}?success=true`);
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr.message);
            setErrorMessage(
              verifyErr.message ||
                'Payment verification failed on the server. Your cart is preserved.'
            );
            setIsSubmitting(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (failResponse) {
        setIsSubmitting(false);
        const reason =
          failResponse.error?.description ||
          failResponse.error?.reason ||
          'Payment was declined by bank or gateway';
        setErrorMessage(`Payment failed: ${reason}. Your cart has been preserved.`);
      });

      // Open the Razorpay payment portal
      rzp.open();
    } catch (err) {
      console.error('Order creation error:', err.message);
      setErrorMessage(err.message || 'Failed to initiate order. Please try again.');
      setIsSubmitting(false);
    }
  };

  // If customer is not logged in, prompt authentication
  if (!customer) {
    return (
      <div className="checkout-page-container">
        <div className="checkout-auth-prompt-card">
          <div className="prompt-icon-circle">
            <IconLock size={26} />
          </div>
          <h2>Authentication Required for Checkout</h2>
          <p>Please log in or register an account to place and track your orders securely.</p>
          <div className="prompt-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Log In to Account
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/register')}
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If cart is loading
  if (cartLoading) {
    return (
      <div className="full-loader">
        <span className="spinner spinner-olive"></span>
        <p>Loading checkout details...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0).toFixed(2);
  const totalItems = cart?.totalItems || 0;

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="checkout-page-container">
        <div className="checkout-empty-card">
          <div className="empty-icon-circle">
            <IconShieldCheck size={28} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p>You need to have at least one product in your cart to proceed with checkout.</p>
          <Link to="/products" className="btn-hero-primary">
            Explore Product Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      {/* Page Header */}
      <div className="checkout-header">
        <div>
          <h1 className="checkout-title">Secure Checkout</h1>
          <p className="checkout-subtitle">Review your order and select your payment method</p>
        </div>
        <div className="checkout-badge">
          Step 2 of 2 &bull; Review & Pay
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error checkout-alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="checkout-layout-grid">
        {/* Left Column: Shipping & Payment Form */}
        <div className="checkout-form-column">
          {/* Shipping Address Section */}
          <div className="checkout-card">
            <h2 className="card-section-title">1. Shipping Details</h2>
            <p className="card-section-subtitle">Enter the delivery address for your items</p>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="fullName">Recipient Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Prakrit Sangwan"
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="address">Street Address / House No. *</label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="e.g. 124/B Sector 14, Main Avenue"
                value={shippingAddress.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-grid-3">
              <div className="form-field">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Chandigarh"
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">State / Province *</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. Punjab"
                  value={shippingAddress.state}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="postalCode">Postal / PIN Code *</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  placeholder="e.g. 160014"
                  value={shippingAddress.postalCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                type="text"
                value={shippingAddress.country}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="checkout-card">
            <h2 className="card-section-title">2. Payment Method</h2>
            <p className="card-section-subtitle">Select how you would like to pay</p>

            <div className="payment-options-list">
              <label
                className={`payment-option-card ${
                  paymentMethod === 'Online Payment (Razorpay)' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Online Payment (Razorpay)"
                  checked={paymentMethod === 'Online Payment (Razorpay)'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-option-content">
                  <div className="payment-option-header">
                    <span className="payment-name">⚡ Online Payment (Razorpay)</span>
                    <span className="payment-tag">Cards, UPI & NetBanking</span>
                  </div>
                  <p className="payment-desc">
                    Secure online checkout powered by Razorpay Standard Checkout. Supports UPI, Google Pay, PhonePe, Debit/Credit Cards, and NetBanking.
                  </p>
                </div>
              </label>

              <label
                className={`payment-option-card ${
                  paymentMethod === 'Cash on Delivery' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-option-content">
                  <div className="payment-option-header">
                    <span className="payment-name">💵 Cash on Delivery (COD)</span>
                  </div>
                  <p className="payment-desc">
                    Pay with cash directly upon delivery of your parcel.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-column">
          <div className="checkout-summary-card">
            <h2 className="summary-title">Order Items ({totalItems})</h2>

            <div className="checkout-items-list">
              {items.map((item) => {
                const product = item.product;
                if (!product) return null;

                const price = Number(product.price) || 0;
                const lineTotal = Number((price * item.quantity).toFixed(2));

                return (
                  <div key={item._id || product._id} className="checkout-item-row">
                    <div className="checkout-item-img-wrap">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                        alt={product.name}
                        className="checkout-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80';
                        }}
                      />
                    </div>
                    <div className="checkout-item-info">
                      <h4 className="checkout-item-name">{product.name}</h4>
                      <p className="checkout-item-meta">
                        Qty: {item.quantity} &bull; {formatINR(price)} each
                      </p>
                    </div>
                    <div className="checkout-item-total">
                      {formatINR(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-cost-breakdown">
              <div className="cost-row">
                <span>Items Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="cost-row">
                <span>Estimated Tax (GST)</span>
                <span>{formatINR(0)}</span>
              </div>
              <div className="cost-row">
                <span>Shipping & Delivery</span>
                <span className="cost-free">FREE</span>
              </div>
              <div className="summary-divider"></div>
              <div className="cost-row total-row">
                <span>Total Amount</span>
                <span>{formatINR(subtotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-place-order-primary"
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting
                ? 'Connecting to Payment Portal...'
                : paymentMethod === 'Cash on Delivery'
                ? 'Confirm Cash on Delivery Order'
                : `Pay ${formatINR(subtotal)} with Razorpay`}
            </button>

            <Link to="/cart" className="btn-back-to-cart">
              &larr; Return to Shopping Cart
            </Link>

            <div className="checkout-security-badge">
              <IconShieldCheck size={16} />
              <span>Official Razorpay 256-bit Secure Gateway</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
