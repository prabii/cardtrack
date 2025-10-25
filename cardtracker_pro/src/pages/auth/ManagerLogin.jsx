import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ManagerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3003/api/auth/login/manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken, refreshToken } = data.tokens;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Update auth context with the user data from response
        const userData = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        };
        
        // Manually update the auth context
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Force page reload to update auth context
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Manager login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Manager login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Manager Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your manager account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="manager@codershive.com"
              required
              disabled={isLoading}
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in as Manager'}
            </Button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Default Manager Credentials:</span>
              <br />
              <span className="text-xs">Email: manager@codershive.com</span>
              <br />
              <span className="text-xs">Password: Manager@12345</span>
            </div>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to regular login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerLogin;
