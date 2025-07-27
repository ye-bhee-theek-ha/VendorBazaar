// app/(customer)/account/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function AccountStackLayout() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="track" options={{ title: "Track Order" }} />
      <Stack.Screen
        name="leave-review"
        options={{
          title: "Leave a Review",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
