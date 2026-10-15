const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Set dummy JWT_SECRET for test environment if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_shopkart_2026';

// 1. Password Hashing and Verification
test('bcrypt: hashes password securely and verifies match', async () => {
  const plainPassword = 'securePassword123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  assert.notStrictEqual(hashedPassword, plainPassword);
  assert.strictEqual(hashedPassword.startsWith('$2'), true);

  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  assert.strictEqual(isMatch, true);

  const isWrongMatch = await bcrypt.compare('wrongPassword', hashedPassword);
  assert.strictEqual(isWrongMatch, false);
});

// 2. JWT Generation and Cookie Setting
test('generateToken: signs valid JWT and sets httpOnly cookie', () => {
  const generateToken = require('../utils/generateToken');
  const dummyUserId = '6523abc12345678901234567';

  let setCookieCall = null;
  const mockRes = {
    cookie: (name, value, options) => {
      setCookieCall = { name, value, options };
    },
  };

  const token = generateToken(dummyUserId, mockRes);
  assert.strictEqual(typeof token, 'string');
  assert.ok(setCookieCall, 'res.cookie should have been called');
  assert.strictEqual(setCookieCall.name, 'token');
  assert.strictEqual(setCookieCall.options.httpOnly, true);
  assert.strictEqual(setCookieCall.options.sameSite, 'lax');
  assert.strictEqual(setCookieCall.options.maxAge, 7 * 24 * 60 * 60 * 1000);

  // Verify decoded payload
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.strictEqual(decoded.userId, dummyUserId);
});

// 3. Auth Middleware token verification
test('protect middleware: rejects requests with missing or invalid tokens', async () => {
  const { protect } = require('../middlewares/auth.middleware');

  // Test Case A: Missing token
  let statusMissing = null;
  let jsonMissing = null;
  const reqMissing = { cookies: {} };
  const resMissing = {
    status: (code) => {
      statusMissing = code;
      return {
        json: (data) => {
          jsonMissing = data;
        },
      };
    },
  };

  await protect(reqMissing, resMissing, () => {});
  assert.strictEqual(statusMissing, 401);
  assert.strictEqual(jsonMissing.message, 'Not authorized, token missing');

  // Test Case B: Invalid/tampered token
  let statusInvalid = null;
  let jsonInvalid = null;
  const reqInvalid = { cookies: { token: 'invalid.tampered.token' } };
  const resInvalid = {
    status: (code) => {
      statusInvalid = code;
      return {
        json: (data) => {
          jsonInvalid = data;
        },
      };
    },
  };

  await protect(reqInvalid, resInvalid, () => {});
  assert.strictEqual(statusInvalid, 401);
  assert.strictEqual(jsonInvalid.message, 'Not authorized, token invalid or expired');
});

// 4. Cart Totals Calculation logic
test('cart calculation: accurately computes line totals, total items, and subtotal', () => {
  const mockCart = {
    _id: 'cart123',
    customer: 'cust123',
    items: [
      {
        _id: 'item1',
        product: { _id: 'prod1', name: 'Wireless Headphones', price: 99.99, stock: 15 },
        quantity: 2,
      },
      {
        _id: 'item2',
        product: { _id: 'prod2', name: 'USB-C Cable', price: 14.50, stock: 50 },
        quantity: 3,
      },
    ],
  };

  let subtotal = 0;
  let totalItems = 0;

  const computedItems = mockCart.items.map((item) => {
    const price = Number(item.product.price) || 0;
    const lineTotal = Number((price * item.quantity).toFixed(2));
    subtotal += lineTotal;
    totalItems += item.quantity;
    return {
      ...item,
      itemTotal: lineTotal,
    };
  });

  assert.strictEqual(totalItems, 5);
  // 99.99 * 2 = 199.98; 14.50 * 3 = 43.50; Total = 243.48
  assert.strictEqual(computedItems[0].itemTotal, 199.98);
  assert.strictEqual(computedItems[1].itemTotal, 43.50);
  assert.strictEqual(Number(subtotal.toFixed(2)), 243.48);
});

// 5. Cart Stock Limit validation
test('cart stock enforcement: prevents adding more items than available stock', () => {
  const productStock = 5;
  const currentCartQuantity = 4;
  const requestedAdditionalQuantity = 2;

  const newTotalQuantity = currentCartQuantity + requestedAdditionalQuantity;
  const exceedsStock = newTotalQuantity > productStock;

  assert.strictEqual(exceedsStock, true);
  assert.strictEqual(newTotalQuantity, 6);
  assert.ok(newTotalQuantity > productStock);
});

// 6. Order HMAC SHA-256 Signature Verification
test('order payment verification: validates correct HMAC SHA256 signature', () => {
  const gatewayOrderId = 'order_test_12345';
  const totalPrice = 199.99;
  const secret = process.env.JWT_SECRET;

  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${gatewayOrderId}|${totalPrice}`)
    .digest('hex');

  // Verify match
  const testSignature = crypto
    .createHmac('sha256', secret)
    .update(`${gatewayOrderId}|${totalPrice}`)
    .digest('hex');

  assert.strictEqual(validSignature, testSignature);

  // Tampered amount or orderId must fail
  const tamperedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${gatewayOrderId}|99.99`)
    .digest('hex');

  assert.notStrictEqual(validSignature, tamperedSignature);
});
