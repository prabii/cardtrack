import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
  isAuthenticated, 
  getCurrentUser, 
  clearTokens 
} from '../utils/auth';
import { 
  loginUser, 
  registerUser, 
  logoutUser,
  refreshPermissions
} from '../utils/authApi';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const authenticated = isAuthenticated();
        if (authenticated) {
          const user = getCurrentUser();
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: {
              user,
              isAuthenticated: true,
            },
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.SET_LOADING,
            payload: false,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        dispatch({
          type: AUTH_ACTIONS.SET_LOADING,
          payload: false,
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      console.log('[AuthContext] Login start for', credentials?.email);
      const response = await loginUser(credentials);
      console.log('[AuthContext] Login success:', response?.user?.email);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
        },
      });
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Login failed';
      console.error('[AuthContext] Login failed:', errorMessage);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await registerUser(userData);
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.user,
        },
      });
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage },
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Refresh permissions function
  const refreshUserPermissions = useCallback(async () => {
    try {
      const response = await refreshPermissions();
      if (response.success) {
        // Update user with new permissions
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: {
            user: { ...state.user, permissions: response.user.permissions },
            isAuthenticated: true,
          },
        });
        return { success: true, user: response.user };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Refresh permissions error:', error);
      return { success: false, error: error.message };
    }
  }, [state.user]);

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    refreshUserPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export action types for external use
export { AUTH_ACTIONS };
