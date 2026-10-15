import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import { CartProvider } from './context/CartContext';
import { fetchMe, logoutCustomer } from './services/api';

function App() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authNotification, setAuthNotification] = useState('');

  // Check authentication session on page load/refresh
  useEffect(() => {
    let isMounted = true;
    const checkAuthStatus = async () => {
      try {
        const data = await fetchMe();
        if (isMounted && data.customer) {
          setCustomer(data.customer);
        }
      } catch {
        // Not logged in or expired cookie
        if (isMounted) {
          setCustomer(null);
        }
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle successful login
  const handleLoginSuccess = (customerData) => {
    setCustomer(customerData);
    setAuthNotification('');
  };

  // Handle successful registration transition
  const handleRegisterSuccess = (msg) => {
    setAuthNotification(msg);
  };

  // Handle customer logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutCustomer();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setCustomer(null);
      setIsLoggingOut(false);
      setAuthNotification('You have been logged out.');
      navigate('/login');
    }
  };

  return (
    // CartProvider wraps the entire app so all components share cart state
    <CartProvider customer={customer}>
      <Navbar
        customer={customer}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="main-content">
        {checkingAuth ? (
          <div className="full-loader">
            <span className="spinner spinner-blue"></span>
            <p>Checking session...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home customer={customer} />} />
            <Route path="/products" element={<Products customer={customer} />} />
            <Route path="/products/:id" element={<ProductDetails customer={customer} />} />
            <Route path="/wishlist" element={<Wishlist customer={customer} />} />
            <Route path="/cart" element={<Cart customer={customer} />} />
            <Route path="/checkout" element={<Checkout customer={customer} />} />
            <Route path="/orders" element={<MyOrders customer={customer} />} />
            <Route path="/orders/:id" element={<OrderDetails customer={customer} />} />

            <Route
              path="/login"
              element={
                customer ? (
                  <Navigate to="/profile" replace />
                ) : (
                  <Login
                    onLoginSuccess={handleLoginSuccess}
                    initialSuccessMessage={authNotification}
                  />
                )
              }
            />

            <Route
              path="/register"
              element={
                customer ? (
                  <Navigate to="/profile" replace />
                ) : (
                  <Register onRegisterSuccess={handleRegisterSuccess} />
                )
              }
            />

            <Route
              path="/profile"
              element={
                customer ? (
                  <Profile
                    customer={customer}
                    onLogout={handleLogout}
                    isLoggingOut={isLoggingOut}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        )}
      </main>

      <Footer />
    </CartProvider>
  );
}

export default App;
