// app/(tabs)/home/_layout.tsx
import MessagesIcon from "@/src/components/MessagesIcon";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function HomeStackLayout() {
  return (
    <Stack initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{
          title: "Discover",
          headerTitleAlign: "left",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 30,
            fontWeight: "black",
          },
          headerStyle: {
            backgroundColor: "transparent",
          },
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
      <Stack.Screen
        name="[pid]"
        options={{
          title: "Details",
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
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
        name="seller/[sellerId]"
        options={{
          title: "Details",
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
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
    </Stack>
  );
}
