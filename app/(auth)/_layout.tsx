// app/(auth)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";
import LoadingScreen from "@/src/screens/LoadingScreen";

export default function AuthLayout() {
  const { user, initialAuthLoading } = useAuth();

  if (initialAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
