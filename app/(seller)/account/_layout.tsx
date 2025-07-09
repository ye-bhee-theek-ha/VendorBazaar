// app/(customer)/account/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AccountStackLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Account",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity className="mr-4">
              <Ionicons name="notifications-outline" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="details" options={{ title: "Account Details" }} />
      <Stack.Screen name="address-book" options={{ title: "Address Book" }} />
      <Stack.Screen
        name="payment-methods"
        options={{ title: "Payment Methods" }}
      />

      {/* Sub Screens */}

      {/* Orders */}
      <Stack.Screen
        name="orders/index"
        options={{
          title: "Orders",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="orders/track" options={{ headerShown: false }} />
      <Stack.Screen
        name="orders/leave-review"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
