// app/(tabs)/home/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="messaging" options={{ headerShown: false }} />
      <Stack.Screen name="[productDetails]" options={{ title: "Product" }} />
    </Stack>
  );
}
