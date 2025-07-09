import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import LoadingScreen from "@/src/screens/LoadingScreen";

export default function MessagesLayout() {
  const router = useRouter();
  const { user, initialAuthLoading } = useAuth();

  return (
    <Stack initialRouteName="messages">
      <Stack.Screen
        name="messages"
        options={{
          title: "Messages",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("..")
              }
              className="ml-4"
            >
              {/* <Text>{router.canGoBack() ? "Back" : "Close"}</Text> */}
              <Ionicons name="close" size={28} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chat",
          headerTitleAlign: "center",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
