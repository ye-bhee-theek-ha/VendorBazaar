// app/(tabs)/home/messaging/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function MessagingStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The header and tab bar visibility for these screens are controlled 
          by (tabs)/_layout.tsx based on the route segments. */}
      <Stack.Screen name="index" />
      <Stack.Screen name="[chatId]" />
    </Stack>
  );
}
