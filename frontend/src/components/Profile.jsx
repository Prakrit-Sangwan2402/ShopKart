import React from 'react';

const Profile = ({ customer, onLogout, isLoggingOut }) => {
  if (!customer) {
    return null;
  }

  // Get initial for avatar
  const initial = customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="card-wrapper profile-card">
      <div className="auth-card">
        <div className="profile-avatar-container">
          <div className="profile-avatar">{initial}</div>
        </div>

        <div className="card-header">
          <h2 className="card-title">{customer.fullName}</h2>
          <p className="card-subtitle">
            Customer Profile <span className="badge-verified">Active Session</span>
          </p>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Full Name</span>
            <span className="detail-value">{customer.fullName}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Email Address</span>
            <span className="detail-value">{customer.email}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Phone Number</span>
            <span className="detail-value">{customer.phone}</span>
          </div>

          {customer._id && (
            <div className="detail-row">
              <span className="detail-label">Customer ID</span>
              <span className="detail-value">{customer._id}</span>
            </div>
          )}
        </div>

        <button
          className="btn-logout"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Log Out of Account'}
        </button>
      </div>
    </div>
  );
};

export default Profile;
