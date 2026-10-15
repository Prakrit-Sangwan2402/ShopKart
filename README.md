# ShopKart — Modern E-Commerce Web Application

ShopKart is a full-stack, production-ready e-commerce platform built with **React**, **Vite**, **Node.js**, **Express.js**, **Mongoose**, **MongoDB Atlas**, and **Razorpay Standard Checkout**.

Designed specifically for Indian retail customers, ShopKart features end-to-end Indian Rupee (`₹`) pricing, a responsive architectural design system, secure JWT session management via HTTP-only cookies, atomic cart stock enforcement, and server-side cryptographically verified Razorpay payments.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Environment Variables](#environment-variables)
6. [Local Installation & Setup](#local-installation--setup)
7. [Running the Application](#running-the-application)
8. [Automated Testing](#automated-testing)
9. [API Documentation](#api-documentation)
10. [Payment Flow (Razorpay Standard Checkout)](#payment-flow-razorpay-standard-checkout)
11. [Production Deployment Guide](#production-deployment-guide)
    - [Backend Deployment (Render)](#backend-deployment-render)
    - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [License](#license)

---

## Features

- **Product Catalog & Discovery**:
  - Live search across titles and descriptions with debounce.
  - Multi-category filtering and sorting (Price: Low to High, High to Low, Newest Arrivals).
  - Real-time stock status badges (`In Stock`, `Low Stock`, `Out of Stock`).
  - Formatted currency displays in Indian Rupees (`₹`) via `Intl.NumberFormat('en-IN')`.

- **Customer Authentication**:
  - Secure customer registration and login with bcrypt password hashing (salt rounds: 10).
  - Stateless JSON Web Tokens (JWT) stored in secure, `httpOnly`, `sameSite` cookies to protect against XSS and CSRF.
  - Graceful session inspection (`GET /api/customers/me`) and clean logout (`POST /api/customers/logout`).

- **Wishlist Management**:
  - Customer-specific wishlist synchronization stored in MongoDB Atlas.
  - Instant one-click toggle from product cards and product detail views with visual indicators.

- **Shopping Cart**:
  - Server-side inventory and stock validation preventing overselling.
  - Quantity controls with immediate stock boundary checks.
  - Live calculations for items count, subtotal, and free delivery eligibility.

- **Razorpay Standard Checkout (Test Mode)**:
  - Official Razorpay Standard Checkout SDK modal integration.
  - Server-calculated orders in paise (`amount * 100`) strictly enforced in `INR`.
  - Server-side cryptographic HMAC-SHA256 signature verification using the backend `RAZORPAY_KEY_SECRET`.
  - Strict protection against duplicate verification, tampered payloads, and double stock deductions.
  - Cart preservation upon modal cancellation or payment failures.

- **Order Tracking & History**:
  - Customer order history with status pills (`Paid`, `Pending`, `Payment Failed`).
  - Interactive **Inline Expandable Order Details** featuring itemized product breakdowns, formatted line totals, recipient shipping details, payment gateway references, and price summaries.
  - Dedicated full order receipt page (`/orders/:id`) with verified confirmation badges.

- **Architectural UI / UX**:
  - Warm neutral aesthetic with muted olive accents (`#526b4e`).
  - Subtle micro-radii (`2px`-`4px`) designed for modern minimalism (no exaggerated bubble corners).
  - Fully responsive across desktop, tablet, and mobile screen sizes.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v7, Native CSS Variables, Razorpay Standard Checkout JS |
| **Backend** | Node.js (v18+ / v20+ / v24+), Express.js, Mongoose 9.x, MongoDB Node Driver 7.x |
| **Database** | MongoDB Atlas (Cloud Managed Replica Set) |
| **Authentication** | JWT (`jsonwebtoken`), `cookie-parser`, `bcrypt` |
| **Payment Gateway** | Razorpay Node.js SDK (`razorpay`), Razorpay Checkout (`window.Razorpay`) |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) |

---

## Project Structure

```text
shapkart/
├── .gitignore                     # Git ignore rules (protects all .env, node_modules, dist)
├── package.json                   # Root workspace scripts and testing scripts
├── README.md                      # Complete project documentation
├── backend/
│   ├── .env                       # Local private environment variables (git-ignored)
│   ├── .env.example               # Template environment configuration
│   ├── index.js                   # Express application entry, CORS, DNS & DB connection
│   ├── controllers/
│   │   ├── cart.controller.js     # Cart retrieval, addition, quantity update, item removal
│   │   ├── customer.controller.js # Customer auth (register, login, me, logout)
│   │   ├── order.controller.js    # Razorpay order creation & HMAC verification
│   │   ├── product.controller.js  # Catalog retrieval, search, filter, and creation
│   │   └── wishlist.controller.js # Wishlist toggle and retrieval
│   ├── middlewares/
│   │   └── auth.middleware.js     # JWT cookie verification middleware
│   ├── models/
│   │   ├── cart.model.js          # Mongoose schema for customer cart
│   │   ├── customer.model.js      # Mongoose schema for customer account & hashed password
│   │   ├── order.model.js         # Mongoose schema for orders & payment receipts
│   │   ├── product.model.js       # Mongoose schema for catalog inventory
│   │   └── wishlist.model.js      # Mongoose schema for wishlist items
│   ├── routes/
│   │   ├── cart.routes.js         # /api/cart endpoints
│   │   ├── customer.routes.js     # /api/customers endpoints
│   │   ├── order.routes.js        # /api/orders endpoints
│   │   ├── product.routes.js      # /api/products endpoints
│   │   └── wishlist.routes.js     # /api/wishlist endpoints
│   ├── tests/
│   │   ├── auth_cart.test.js      # Unit tests for bcrypt, JWT cookies, cart logic
│   │   └── razorpay_checkout.test.js # Unit tests for Razorpay paise, HMAC & stock
│   └── utils/
│       └── generateToken.js       # JWT signing and cookie generator
└── frontend/
    ├── .env.example               # Template frontend environment configuration
    ├── index.html                 # HTML shell and Razorpay checkout script inclusion
    ├── package.json               # Frontend dependencies and Vite build scripts
    ├── vercel.json                # Vercel deployment SPA rewrite configuration
    ├── vite.config.js             # Vite development server configuration & /api proxy
    └── src/
        ├── App.jsx                # Route definitions and session initialization
        ├── index.css              # Global architectural CSS design system
        ├── main.jsx               # React DOM entry point
        ├── components/
        │   ├── Footer.jsx         # Site footer
        │   ├── Icons.jsx          # SVG icon helpers
        │   ├── Login.jsx          # Customer login modal / view
        │   ├── Navbar.jsx         # Global navigation bar with search and cart badge
        │   ├── ProductCard.jsx    # Catalog card with wishlist toggle & INR pricing
        │   ├── ProductFilter.jsx  # Category & sort filter controls
        │   ├── Profile.jsx        # Customer profile summary
        │   └── Register.jsx       # Customer registration modal / view
        ├── context/
        │   └── CartContext.jsx    # Global cart state provider and stock sync
        ├── pages/
        │   ├── Cart.jsx           # Shopping cart page
        │   ├── Checkout.jsx       # Checkout page with Razorpay Standard modal trigger
        │   ├── Home.jsx           # Landing page with hero banner & featured categories
        │   ├── MyOrders.jsx       # Orders history with expandable View Details
        │   ├── OrderDetails.jsx   # Dedicated order receipt page
        │   ├── ProductDetails.jsx # Detailed single-product view
        │   ├── Products.jsx       # Full product catalog grid with filters
        │   └── Wishlist.jsx       # Customer wishlist page
        ├── services/
        │   └── api.js             # Centralized API fetch layer with credentials support
        └── utils/
            └── formatCurrency.js  # Currency formatter utility (INR - ₹)
```

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node.js `v20` and `v24`).
- **MongoDB Atlas**: An active MongoDB Atlas cluster with Database Access user credentials and Network Access IP whitelist (`0.0.0.0/0` or server IP).
- **Razorpay Account**: Razorpay Dashboard account in **Test Mode** with generated Key ID and Key Secret.

---

## Environment Variables

### Backend Configuration (`backend/.env`)

Create a `backend/.env` file based on `backend/.env.example`:

| Variable | Description | Example Value |
|---|---|---|
| `PORT` | Port number for Express backend server | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGO_URI` | MongoDB Atlas SRV connection string | `mongodb+srv://user:pass@cluster0.abcde.mongodb.net/shopkart?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key used to sign and verify customer JWTs | `a_very_secure_random_string_here` |
| `FRONTEND_URL` | Frontend origin for CORS and cookie acceptance | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Public Key ID from Razorpay Dashboard | `rzp_test_YourKeyIdHere` |
| `RAZORPAY_KEY_SECRET` | Private Key Secret from Razorpay Dashboard | `YourSecretKeyHere` |

> [!IMPORTANT]
> Never commit `backend/.env` or any production secrets to version control. The repository `.gitignore` automatically excludes all `.env` files.

### Frontend Configuration (`frontend/.env`)

Create a `frontend/.env` file based on `frontend/.env.example` (optional in local development, needed for decoupled production):

| Variable | Description | Default / Example Value |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API (if decoupled) | Empty in dev (uses Vite proxy); `https://your-backend.onrender.com` in production |

---

## Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/ShopKart.git
   cd ShopKart
   ```

2. **Install Root and Backend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure Environment Variables**:
   Copy the example templates and add your credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your MongoDB Atlas URI, JWT Secret, and Razorpay Test Mode keys.

---

## Running the Application

### Option A: Running Backend and Frontend Simultaneously

1. **Start the Backend Server** (Port `5000`):
   ```bash
   node backend/index.js
   ```
   *Expected console output:*
   ```text
   💳 Razorpay Payment Gateway: CONFIGURED (Public Key: rzp_test_...)
   📡 Connecting to MongoDB Atlas cluster at: ... (Database: shopkart)...
   ✅ Successfully connected to MongoDB Atlas!
   🚀 ShopKart backend server running on http://localhost:5000
   ```

2. **Start the Frontend Development Server** (Port `5173`):
   ```bash
   cd frontend
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

### Health Check Endpoint

You can verify the backend and database connection at any time by requesting:

```bash
curl http://localhost:5000/api/health
```

*Response:*
```json
{
  "status": "ok",
  "service": "ShopKart Backend API",
  "database": "connected",
  "timestamp": "2026-10-15T14:00:00.000Z"
}
```

---

## Automated Testing

ShopKart includes a comprehensive suite of unit and integration tests using Node.js's native test runner (`node:test` and `node:assert`).

Run the automated test suite from the project root:

```bash
npm test
```

### Test Coverage Summary:

- **Authentication & Security**:
  - `bcrypt`: Hashes password securely and verifies match against plain text.
  - `generateToken`: Signs valid JWT and sets secure `httpOnly` cookie.
  - `protect` middleware: Rejects unauthorized requests with missing or tampered tokens.
- **Cart & Inventory Calculation**:
  - `cart calculation`: Accurately computes item line totals, item counts, and subtotal.
  - `cart stock enforcement`: Prevents adding more items than available in inventory.
- **Razorpay Payment Integration**:
  - Server-side amount computation in paise (`* 100`) strictly enforced in `INR`.
  - Cryptographic validation of authentic HMAC-SHA256 signatures generated with `RAZORPAY_KEY_SECRET`.
  - Rejection of tampered order ID, payment ID, or signature strings.
  - Prevention of duplicate verification calls and double inventory deductions.
  - Stock depletion guards during concurrent checkout finalization.
  - Preservation of customer cart items upon cancelled or declined payments.
  - Automatic transition of order status to `Paid` and catalog stock reduction upon valid payment.
  - Graceful error detection and informative feedback when API keys are not configured.

---

## API Documentation

### 1. Health & Diagnostics
- `GET /api/health` — Returns backend service and MongoDB Atlas connectivity status (`200 OK` or `503 Service Unavailable`).

### 2. Customer Authentication
- `POST /api/customers/register` — Registers new customer (`{ name, email, password }`). Sets `token` cookie.
- `POST /api/customers/login` — Authenticates customer (`{ email, password }`). Sets `token` cookie.
- `GET /api/customers/me` — Returns current logged-in customer profile.
- `POST /api/customers/logout` — Clears customer session cookie.

### 3. Products & Catalog
- `GET /api/products` — Returns filtered catalog with optional queries: `search`, `category`, `sort`.
- `GET /api/products/:id` — Returns single product details and available stock count.
- `POST /api/products` — Creates a new product catalog item (Protected).

### 4. Wishlist
- `GET /api/wishlist` — Returns customer's active wishlist items (Protected).
- `POST /api/wishlist` — Adds/toggles a product on the wishlist (`{ productId }`) (Protected).
- `DELETE /api/wishlist/:id` — Removes an item from the wishlist (Protected).

### 5. Shopping Cart
- `GET /api/cart` — Returns customer's active cart with populated product data (Protected).
- `POST /api/cart` — Adds an item to cart (`{ productId, quantity }`) with stock boundary checks (Protected).
- `PUT /api/cart/:itemId` — Updates line item quantity with inventory validation (Protected).
- `DELETE /api/cart/:itemId` — Removes an item from the cart (Protected).
- `DELETE /api/cart` — Clears all items from the cart (Protected).

### 6. Orders & Checkout
- `POST /api/orders` — Validates cart stock, converts total to paise, generates official Razorpay Order, and creates pending order in MongoDB (Protected).
- `POST /api/orders/:id/verify-payment` — Cryptographically validates HMAC-SHA256 signature, updates order status to `Paid`, and decrements inventory (Protected).
- `GET /api/orders/my-orders` — Returns all orders placed by the authenticated customer (Protected).
- `GET /api/orders/:id` — Returns full order receipt details (Protected).

---

## Payment Flow (Razorpay Standard Checkout)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant Frontend as React / Vite (ShopKart)
    participant Backend as Express API Server
    participant DB as MongoDB Atlas
    participant RZP as Razorpay Gateway

    Customer->>Frontend: Clicks "Pay ₹... with Razorpay"
    Frontend->>Backend: POST /api/orders { shippingAddress, paymentMethod: "Razorpay" }
    Backend->>DB: Validate cart stock from catalog
    Backend->>RZP: razorpay.orders.create({ amount: subtotalInPaise, currency: "INR" })
    RZP-->>Backend: Returns { id: "order_xyz", amount, currency }
    Backend->>DB: Save Order with status "Pending"
    Backend-->>Frontend: Returns { order, razorpayOrderId, keyId, amount, currency }
    Frontend->>Customer: Opens window.Razorpay checkout modal
    Customer->>RZP: Completes payment in modal (Test Card / UPI / NetBanking)
    RZP-->>Frontend: Returns handler payload { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    Frontend->>Backend: POST /api/orders/:id/verify-payment { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    Backend->>Backend: crypto.createHmac('sha256', KEY_SECRET).update(...).digest('hex')
    alt Signature Matches
        Backend->>DB: Decrement product inventory stock
        Backend->>DB: Update order status to "Paid", save paymentId & paidAt
        Backend->>DB: Clear customer cart
        Backend-->>Frontend: 200 OK { success: true, order }
        Frontend->>Customer: Redirects to /orders/:id?success=true
    else Signature Tampered or Invalid
        Backend-->>Frontend: 400 Bad Request { success: false, message: "Invalid payment signature" }
        Frontend->>Customer: Preserves cart & shows actionable error feedback
    end
```

---

## Production Deployment Guide

### Backend Deployment (Render)

1. **Create a New Web Service**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository: `ShopKart`.

2. **Configure Service Settings**:
   - **Name**: `shopkart-backend` (or your preferred name)
   - **Root Directory**: `backend` (or leave root and set Build Command)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js` (or `node backend/index.js` if running from root)

3. **Set Environment Variables on Render**:
   In the **Environment** tab, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default; Render sets `PORT` automatically)
   - `MONGO_URI`: Your production MongoDB Atlas SRV URI
   - `JWT_SECRET`: A high-entropy random string (e.g. 64 characters)
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://shopkart.vercel.app`)
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret

4. **Verify Health Check**:
   Set Render Health Check Path to: `/api/health`.

---

### Frontend Deployment (Vercel)

1. **Import Project to Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New...** > **Project**.
   - Select your `ShopKart` repository.

2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Configure Environment Variables on Vercel**:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://shopkart-backend.onrender.com`)

4. **Client-Side Routing Support**:
   The repository already includes `frontend/vercel.json` with the necessary rewrite rules so single-page routes like `/products/:id`, `/cart`, and `/orders` resolve properly without 404 errors:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

---

## Troubleshooting Guide

### 1. MongoDB Atlas Connection Failure (`MongooseServerSelectionError`)
- **DNS / SRV Resolution**: Windows systems sometimes fail to resolve Atlas SRV records with ISP default DNS. ShopKart's backend automatically registers Google and Cloudflare DNS resolvers (`8.8.8.8`, `1.1.1.1`) at startup.
- **Atlas Network Access**: Ensure your MongoDB Atlas cluster has `0.0.0.0/0` (allow access from anywhere) configured under **Network Access** > **IP Access List**.
- **Bad Authentication**: Ensure your database user credentials match `MONGO_URI`. If the password contains special characters (`@`, `:`, `/`), URL-encode them.

### 2. Razorpay Modal Does Not Open
- Check the browser DevTools Console. If you see `"Razorpay payment gateway keys are not configured"`, verify that both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are present in `backend/.env`.
- Ensure `https://checkout.razorpay.com/v1/checkout.js` is allowed by your network and not blocked by ad-blockers or browser privacy shields.

### 3. Cross-Origin Cookies in Production
- When the frontend and backend are hosted on separate domains (e.g. Vercel and Render), cookies require:
  - `sameSite: 'none'`
  - `secure: true` (HTTPS)
  - Backend must specify `Access-Control-Allow-Credentials: true` with the explicit origin (already configured in `backend/index.js`).

---

## License

This project is licensed under the MIT License — feel free to use and adapt it for your e-commerce applications.
