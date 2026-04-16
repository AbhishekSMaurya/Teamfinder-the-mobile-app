// AppNavigator.js
// Place this file at: src/navigation/AppNavigator.js
//
// This is the ROOT navigator.
// • If user is not logged in  → shows Auth stack (Login / Register)
// • If user is logged in      → shows TabNavigator (main app)
//
// Your App.tsx should render <AppNavigator /> inside <AuthProvider> and <NavigationContainer>.

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import colors from '../styles/colors';



const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Show a simple centered spinner while checking stored token on launch
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ── Logged in ─────────────────────────────────────────────────────
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        // ── Not logged in ─────────────────────────────────────────────────
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
