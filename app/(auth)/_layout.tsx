// app/(auth)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";

export default function AuthLayout() {
  const { user, initialAuthLoading } = useAuth();

  if (initialAuthLoading) {
    return null; // Or a loading spinner, Splash screen should cover this
  }

  if (user) {
    // TODO: Redirect to the appropriate home page based on user role
    return <Redirect href="/(customer)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
