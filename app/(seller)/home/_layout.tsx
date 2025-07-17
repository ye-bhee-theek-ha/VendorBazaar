// app/(seller)/home/_layout.tsx
import HeaderRightIcons from "@/src/components/Layout_Components";
import MessagesIcon from "@/src/components/MessagesIcon";
import { lightColors } from "@/src/constants/Colors";
import { darkColors } from "@/src/constants/Colors";
import { useTheme } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function HomeStackLayout() {
  const { effectiveTheme } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "Dashboard",
          headerTitleAlign: "left",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.headerBackground
                : lightColors.headerBackground,
          },
          headerTitleStyle: {
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            fontFamily: "MuseoModerno_SemiBold",
            fontSize: 22,
          },
          contentStyle: {
            backgroundColor: "transparent",
          },
          headerRight: () => <HeaderRightIcons />,
        }}
      />
    </Stack>
  );
}
