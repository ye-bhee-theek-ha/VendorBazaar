// app/(onboarding)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { View, ActivityIndicator, Text } from "react-native";

export default function OnboardingLayout() {
  const { user, initialAuthLoading } = useAuth();

  if (user && user.OnboardingCompleted !== "false") {
    if (user.role === "seller") {
      return <Redirect href="/(seller)/home" />;
    }
    return <Redirect href="/(customer)/home" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
