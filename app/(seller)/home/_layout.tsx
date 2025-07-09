// app/(seller)/home/_layout.tsx
import MessagesIcon from "@/src/components/MessagesIcon";
import { View } from "@/src/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

export default function HomeStackLayout() {
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
            <View className="flex-row items-center">
              <TouchableOpacity
                className="mr-4"
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={28} />
              </TouchableOpacity>
              <MessagesIcon />
            </View>
          ),
        }}
      />

      <Stack.Screen name="messaging" options={{ headerShown: false }} />
      <Stack.Screen name="[productDetails]" options={{ title: "Product" }} />
    </Stack>
  );
}
