import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: 'admin@codershive.com',
    password: 'Admin@12345'
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
      console.log('Admin login attempt with data:', formData);
      
      // Use admin-specific login endpoint
      const response = await fetch('https://cardtrack.onrender.com/api/auth/login/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Store tokens manually
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
        setError(data.message || 'Admin login failed');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            🔐 Admin Portal - CardTracker Pro
          </h2>
          <p className="mt-2 text-center text-lg text-gray-600">
            Secure Admin Access
          </p>
          <p className="mt-1 text-center text-sm text-red-600 font-medium">
            Authorized Personnel Only
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@codershive.com"
              required
              disabled={isLoading}
            />
            
            <Input
              label="Admin Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? '🔐 Authenticating...' : '🚀 Access Admin Dashboard'}
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-yellow-800 mb-2">
                🔑 Default Admin Credentials
              </div>
              <div className="text-xs text-yellow-700 space-y-1">
                <div><strong>Email:</strong> admin@codershive.com</div>
                <div><strong>Password:</strong> Admin@12345</div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <Link 
              to="/login" 
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to Regular Login
            </Link>
            <div className="text-xs text-gray-500">
              Need help? Contact system administrator
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
