import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import './Admin.css';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsShaking(false);

    if (username.trim() === 'swastikmart' && password === 'swastikmart69') {
      setIsLoading(true);
      setTimeout(() => {
        localStorage.setItem('admin_token', 'swastikmart_authenticated');
        onLoginSuccess();
      }, 800); // Small delay for premium micro-interaction feel
    } else {
      setIsShaking(true);
      setError('Invalid username or password. Please try again.');
      setTimeout(() => setIsShaking(false), 500); // Reset shake class after animation
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="login-bg-overlay"></div>
      <div className={`admin-login-card ${isShaking ? 'shake' : ''}`}>
        <div className="login-header">
          <div className="login-logo-circle">
            <Lock className="gold-icon" size={28} />
          </div>
          <h2>Swastik Mart Admin</h2>
          <p>Please log in to access the control panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error-alert">{error}</div>}

          <div className="login-input-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                type="text"
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <div className="login-spinner"></div>
            ) : (
              <>
                <span>Login</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
