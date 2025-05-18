import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  const theme = useColorScheme();

  return (
    <StripeProvider
      publishableKey="pk_test_51RAzPYPu5kyawoOkiSzvpvyMz1IX7xsKBJACdWIgbosSCm9Q8YI9tGUd2PsnJG5qZdPN5DraqEOd6MBivMl9omRm008WkZJwpV"
      
    >
      <AuthProvider>
        <StatusBar
          backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'}
          style={theme === 'dark' ? 'light' : 'dark'}
          translucent={false}
        />

        <Stack screenOptions={{
          headerShown: false,
          animationDuration: 3000,
          animation: 'slide_from_right'
        }} />
      </AuthProvider>
    </StripeProvider>
  );
}
