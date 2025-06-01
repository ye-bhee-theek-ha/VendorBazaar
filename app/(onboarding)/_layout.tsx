// app/(onboarding)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { View, ActivityIndicator, Text } from "react-native";

function OnboardingLoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
      }}
    >
      <Text>Onboarding Screen</Text>
      <ActivityIndicator size="large" color="#0B6623" />
    </View>
  );
}

export default function OnboardingLayout() {
  const { user, initialAuthLoading } = useAuth();

  if (initialAuthLoading) {
    return <OnboardingLoadingScreen />;
  }

  if (user && user.OnboardingCompleted) {
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
