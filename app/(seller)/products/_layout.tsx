// app/(seller)/products/_layout.tsx
import React from "react";
import { router, Stack } from "expo-router";
import { SellerProductProvider } from "@/src/context/seller/SellerProductContext";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SellerProductsLayout() {
  return (
    <Stack>
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

      <Stack.Screen
        name="add"
        options={{ title: "List New Product", presentation: "modal" }}
      />

      <Stack.Screen
        name="[productId]"
        options={{ title: "Product Details", headerShown: false }}
      />
    </Stack>
  );
}
