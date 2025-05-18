import  { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isLoggedIn: boolean;
  userRole: string | null;
  login: (role: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored login state on app start
    checkLoginState();
  }, []);

  const checkLoginState = async () => {
    try {
      const storedRole = await AsyncStorage.getItem('userRole');
      if (storedRole) {
        setIsLoggedIn(true);
        setUserRole(storedRole);
      }
    } catch (error) {
      console.error('Error checking login state:', error);
    }
  };

  const login = async (role: string) => {
    try {
      await AsyncStorage.setItem('userRole', role);
      setIsLoggedIn(true);
      setUserRole(role);
    } catch (error) {
      console.error('Error storing login state:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userRole');
      setIsLoggedIn(false);
      setUserRole(null);
    } catch (error) {
      console.error('Error clearing login state:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 