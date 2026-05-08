import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CustomerUser } from '@/types';
import { customerAuthApi } from '@/services/api';

interface CustomerAuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface CustomerAuthContextType extends CustomerAuthState {
  login: (payload: { email: string; password: string }) => Promise<void>;
  signup: (payload: { full_name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CustomerAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initialize = async () => {
      const token = customerAuthApi.getStoredToken();
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await customerAuthApi.me(token);
        setState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        await customerAuthApi.logout();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initialize();
  }, []);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await customerAuthApi.login(payload);
      setState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (payload: { full_name: string; email: string; phone: string; password: string }) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await customerAuthApi.signup(payload);
      setState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await customerAuthApi.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
