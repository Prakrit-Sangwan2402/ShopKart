import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors as user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
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
        const backendMessage = data.message || data.error || data.msg;
        let fallbackMessage = 'Registration failed. Please try again.';

        if (response.status === 409) {
          fallbackMessage = 'A customer with this email already exists.';
        } else if (response.status === 400) {
          fallbackMessage = 'Validation failed. Please verify all required fields.';
        } else if (response.status >= 500) {
          fallbackMessage = 'Server error occurred. Please ensure the backend is running.';
        }

        throw new Error(backendMessage || fallbackMessage);
      }

      setSuccess('Account created successfully! Redirecting to login...');
      // Reset form
      setFormData({ fullName: '', email: '', phone: '', password: '' });

      // Automatically transition or notify parent after a short pause
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess('Registration successful! Please login with your credentials.');
        }
        if (onNavigateToLogin) {
          onNavigateToLogin();
        } else {
          navigate('/login');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-wrapper">
      <div className="auth-card">
        <div className="card-header">
          <h2 className="card-title">Create Account</h2>
          <p className="card-subtitle">Sign up to get started with ShopKart</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              className="form-input"
              type="text"
              name="fullName"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
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
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              className="form-input"
              type="tel"
              name="phone"
              placeholder="e.g. +1 234 567 8900"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <p className="form-hint">Must be at least 6 characters</p>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Creating Account...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="card-footer">
          Already have an account?{' '}
          <button
            type="button"
            className="switch-btn"
            onClick={() => {
              if (onNavigateToLogin) onNavigateToLogin();
              else navigate('/login');
            }}
            disabled={loading}
          >
            Log in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
