// app/(seller)/orders/_layout.tsx
import React from "react";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SellerOrdersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "Dashboard",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              className="mr-4"
            >
              <Ionicons name="notifications-outline" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="[orderId]" options={{ title: "Order Details" }} />
    </Stack>
  );
}
