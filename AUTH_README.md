# Authentication System Documentation

## Overview

This CardTracker Pro application now includes a complete JWT-based authentication system with login and signup functionality.

## Features

### 🔐 Authentication Features
- **User Registration**: Create new accounts with email validation
- **User Login**: Secure login with email/password
- **JWT Tokens**: Mock JWT tokens for client-side authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Session Management**: Persistent login sessions
- **Logout Functionality**: Secure logout with token cleanup

### 🛡️ Security Features
- **Password Strength Validation**: Real-time password strength indicator
- **Token Expiration**: Automatic token refresh and expiration handling
- **Secure Cookie Storage**: HTTP-only cookies for token storage
- **Route Protection**: Protected routes that require authentication
- **Public Route Handling**: Redirect authenticated users away from auth pages

## Demo Credentials

For testing purposes, the following demo accounts are available:

### Demo User
- **Email**: demo@example.com
- **Password**: password123

### Admin User
- **Email**: admin@example.com
- **Password**: admin123

## File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # Authentication context and provider
├── components/
│   ├── ProtectedRoute.jsx       # Route protection components
│   └── ui/
│       └── Header.jsx           # Updated header with user menu
├── pages/
│   ├── login/
│   │   └── index.jsx           # Login page component
│   └── signup/
│       └── index.jsx           # Signup page component
└── utils/
    ├── auth.js                 # Authentication utilities
    └── authApi.js              # Authentication API functions
```

## Authentication Flow

### 1. User Registration
1. User visits `/signup`
2. Fills out registration form with validation
3. System creates new user account
4. JWT tokens are generated and stored
5. User is redirected to dashboard

### 2. User Login
1. User visits `/login`
2. Enters credentials (or uses demo credentials)
3. System validates credentials
4. JWT tokens are generated and stored
5. User is redirected to intended destination

### 3. Protected Routes
1. User tries to access protected route
2. System checks for valid authentication
3. If authenticated: Allow access
4. If not authenticated: Redirect to login

### 4. Logout
1. User clicks logout in header menu
2. Tokens are cleared from storage
3. User is redirected to login page

## API Integration

The authentication system is designed to work with a backend API. Currently, it uses mock data for demonstration purposes.

### Backend Integration Points

To integrate with a real backend, update the following files:

1. **`src/utils/authApi.js`**: Replace mock functions with real API calls
2. **`src/utils/auth.js`**: Update token handling for real JWT tokens
3. **Environment Variables**: Set up proper API endpoints

### Required Backend Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh access token

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME=CardTracker Pro
REACT_APP_DEBUG=true
```

### JWT Configuration

The current implementation uses mock JWT tokens for demonstration. For production:

1. **Backend**: Implement proper JWT token generation
2. **Frontend**: Update token verification to work with real JWT tokens
3. **Security**: Use proper JWT secrets and secure token storage

## Usage Examples

### Using Authentication Context

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```jsx
import ProtectedRoute from '../components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

## Security Considerations

### Current Implementation (Demo)
- Mock JWT tokens for demonstration
- Client-side token generation (not secure for production)
- Basic password validation

### Production Recommendations
- **Backend JWT Generation**: Move JWT creation to secure backend
- **HTTPS Only**: Use HTTPS in production
- **Secure Cookies**: Implement HTTP-only, secure cookies
- **Token Refresh**: Implement proper token refresh mechanism
- **Password Hashing**: Use proper password hashing (bcrypt, etc.)
- **Rate Limiting**: Implement login attempt rate limiting
- **Input Validation**: Server-side input validation and sanitization

## Troubleshooting

### Common Issues

1. **Token Expiration**: Tokens expire after 15 minutes (access) or 7 days (refresh)
2. **Route Protection**: Ensure all protected routes are wrapped with `ProtectedRoute`
3. **Cookie Issues**: Check browser cookie settings and HTTPS configuration
4. **API Errors**: Verify API endpoints and network connectivity

### Debug Mode

Enable debug mode by setting `REACT_APP_DEBUG=true` in your environment variables.

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Social login integration
- [ ] User profile management
- [ ] Role-based access control
- [ ] Session management dashboard
- [ ] Audit logging

## Support

For issues or questions about the authentication system, please check the console for error messages and ensure all dependencies are properly installed.
