import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onNavigateToRegister, onLoginSuccess, initialSuccessMessage }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(initialSuccessMessage || '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      let data = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Invalid email or password.');
        }
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Success: backend sets the HTTP-only cookie automatically
      if (onLoginSuccess && data.customer) {
        onLoginSuccess(data.customer);
      }
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="card-wrapper">
      <div className="auth-card">
        <div className="card-header">
          <h2 className="card-title">Welcome Back</h2>
          <p className="card-subtitle">Log in to your ShopKart account</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Logging In...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="card-footer">
          Don't have an account yet?{' '}
          <button
            type="button"
            className="switch-btn"
            onClick={handleGoToRegister}
            disabled={loading}
          >
            Register now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
