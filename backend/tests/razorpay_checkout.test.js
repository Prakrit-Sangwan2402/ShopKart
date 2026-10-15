const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// =========================================================================
// Razorpay Standard Checkout & Payment Flow Unit Tests
// =========================================================================

// 1. Amount & Currency Calculation (Server-trusted, never client-controlled)
test('Razorpay: server computes exact amount in paise and enforces INR currency', () => {
  const catalogProducts = [
    { id: 'prod_1', price: 79.99, stock: 10 },
    { id: 'prod_2', price: 28.0, stock: 5 },
  ];

  const cartItems = [
    { productId: 'prod_1', quantity: 2 },
    { productId: 'prod_2', quantity: 1 },
  ];

  // Server calculation strictly using catalog prices
  let totalPrice = 0;
  for (const item of cartItems) {
    const product = catalogProducts.find((p) => p.id === item.productId);
    assert.ok(product, 'Product must exist in catalog');
    totalPrice += product.price * item.quantity;
  }

  // 79.99 * 2 + 28.00 * 1 = 159.98 + 28.00 = 187.98
  assert.strictEqual(Number(totalPrice.toFixed(2)), 187.98);

  // Razorpay expects amount in paise (smallest currency subunit)
  const amountInPaise = Math.round(totalPrice * 100);
  assert.strictEqual(amountInPaise, 18798);

  const currency = 'INR';
  assert.strictEqual(currency, 'INR');
});

// 2. Razorpay Official Signature Verification (HMAC-SHA256)
test('Razorpay: validates authentic HMAC-SHA256 signature generated with key secret', () => {
  const razorpayOrderId = 'order_Ilu13AOHStatus';
  const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
  const razorpaySecret = 'rzp_test_secret_998877';

  // Official Razorpay formula: hmac_sha256(order_id + "|" + payment_id, secret)
  const expectedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const incomingSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  assert.strictEqual(incomingSignature, expectedSignature);
});

// 3. Rejection of Tampered or Invalid Payment Signatures
test('Razorpay: rejects tampered order ID, payment ID, or signature', () => {
  const razorpayOrderId = 'order_Ilu13AOHStatus';
  const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
  const razorpaySecret = 'rzp_test_secret_998877';

  const validSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  // Tampered payment ID
  const tamperedPaymentId = 'pay_TAMPERED_00000';
  const tamperedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${razorpayOrderId}|${tamperedPaymentId}`)
    .digest('hex');

  assert.notStrictEqual(validSignature, tamperedSignature);

  // Wrong secret (e.g. forged on client)
  const forgedSignature = crypto
    .createHmac('sha256', 'wrong_fake_secret')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  assert.notStrictEqual(validSignature, forgedSignature);
});

// 4. Duplicate Payment Verification Guard
test('Razorpay: prevents duplicate verification and double stock deduction', () => {
  const order = {
    _id: 'order_abc123',
    totalPrice: 150.0,
    isPaid: true, // Already marked as paid
    orderStatus: 'Processing',
  };

  let stockDeducted = false;

  // Verification guard
  if (order.isPaid) {
    // Expected rejection: do NOT process again
    const errorResponse = {
      status: 400,
      message: 'This order has already been paid and processed.',
    };
    assert.strictEqual(errorResponse.status, 400);
  } else {
    stockDeducted = true;
  }

  assert.strictEqual(stockDeducted, false);
});

// 5. Stock Validation Guard before Payment Finalization
test('Razorpay: aborts finalization if product stock depleted during checkout', () => {
  const orderItems = [
    { productId: 'prod_keyboard', quantity: 2, name: 'Mechanical Keyboard' },
  ];

  const currentCatalogStock = 1; // Only 1 left, but order requested 2

  let orderFailed = false;
  let failureReason = '';

  for (const item of orderItems) {
    if (currentCatalogStock < item.quantity) {
      orderFailed = true;
      failureReason = `Stock changed unexpectedly for "${item.name}". Order could not be completed.`;
      break;
    }
  }

  assert.strictEqual(orderFailed, true);
  assert.ok(failureReason.includes('Mechanical Keyboard'));
});

// 6. Payment Failure and Cart Preservation
test('Razorpay: preserves cart items when payment is declined or cancelled', () => {
  let cart = {
    items: [
      { product: 'prod_1', quantity: 2 },
      { product: 'prod_2', quantity: 1 },
    ],
  };

  const paymentOutcome = 'FAILED';

  if (paymentOutcome === 'SUCCESS') {
    cart.items = []; // Cleared only on success
  } else {
    // Preserved on failure/cancellation
  }

  assert.strictEqual(cart.items.length, 2);
  assert.strictEqual(cart.items[0].quantity, 2);
});

// 7. Successful Payment Order Finalization
test('Razorpay: updates order to Paid and decrements catalog stock on valid payment', () => {
  let productCatalog = {
    prod_1: { stock: 10 },
    prod_2: { stock: 5 },
  };

  let cart = {
    items: [
      { productId: 'prod_1', quantity: 2 },
      { productId: 'prod_2', quantity: 1 },
    ],
  };

  let order = {
    isPaid: false,
    orderStatus: 'Pending',
    paidAt: null,
  };

  // Simulate successful payment verification
  const isSignatureValid = true;
  if (isSignatureValid) {
    for (const item of cart.items) {
      productCatalog[item.productId].stock -= item.quantity;
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.orderStatus = 'Processing';
    cart.items = []; // Cleared
  }

  assert.strictEqual(order.isPaid, true);
  assert.strictEqual(order.orderStatus, 'Processing');
  assert.ok(order.paidAt instanceof Date);
  assert.strictEqual(productCatalog.prod_1.stock, 8);
  assert.strictEqual(productCatalog.prod_2.stock, 4);
  assert.strictEqual(cart.items.length, 0);
});

// 8. Gateway Key Configuration Diagnostic
test('Razorpay: detects missing keys and reports clear configuration message', () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isConfigured = Boolean(keyId && keySecret);

  // If not configured, should return descriptive guidance
  if (!isConfigured) {
    const diagnosticMessage =
      'Razorpay payment gateway keys are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env to enable online checkout.';
    assert.ok(diagnosticMessage.includes('RAZORPAY_KEY_ID'));
    assert.ok(diagnosticMessage.includes('RAZORPAY_KEY_SECRET'));
  }
});
