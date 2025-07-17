import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import LoadingScreen from "@/src/screens/LoadingScreen";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function MessagesLayout() {
  const router = useRouter();
  const { user, initialAuthLoading } = useAuth();
  const { effectiveTheme } = useTheme();

  return (
    <Stack
      initialRouteName="messages"
      screenOptions={{
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.headerBackground
              : lightColors.headerBackground,
        },
        headerTitleStyle: {
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          fontFamily: "MuseoModerno_SemiBold",
          fontSize: 22,
        },
        contentStyle: {
          backgroundColor: "transparent",
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mx-4">
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                effectiveTheme === "dark" ? darkColors.text : lightColors.text
              }
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            className="mr-4"
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={
                effectiveTheme === "dark" ? darkColors.text : lightColors.text
              }
            />
          </TouchableOpacity>
        ),
      }}
    >
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
              <Ionicons
                name="close"
                size={28}
                color={
                  effectiveTheme === "dark" ? darkColors.text : lightColors.text
                }
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chat",
        }}
      />
    </Stack>
  );
}
