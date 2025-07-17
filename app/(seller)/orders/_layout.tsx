// app/(seller)/orders/_layout.tsx
import React from "react";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderRightIcons from "@/src/components/Layout_Components";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function SellerOrdersLayout() {
  const { effectiveTheme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
        headerRight: () => <HeaderRightIcons />,
      }}
      initialRouteName="index"
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Manage Orders",
        }}
      />
      <Stack.Screen
        name="[orderId]"
        options={{
          title: "Order Details",
          headerTitleAlign: "center",
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
        }}
      />

      {/* Orders */}
      <Stack.Screen
        name="orders/index"
        options={{
          title: "Orders",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
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
