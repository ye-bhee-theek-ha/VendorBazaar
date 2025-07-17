// app/(seller)/products/_layout.tsx
import React from "react";
import { router, Stack } from "expo-router";
import { SellerProductProvider } from "@/src/context/seller/SellerProductContext";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function SellerProductsLayout() {
  const { effectiveTheme } = useTheme();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "My Products",
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
          headerTintColor:
            effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          contentStyle: {
            backgroundColor: "transparent",
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(seller)/products/add")}
              className="mr-4"
            >
              <Ionicons
                name="add-circle"
                size={28}
                color={effectiveTheme === "dark" ? darkColors.text : "#0b6623"}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="add"
        options={{
          title: "List New Product",
          presentation: "modal",

          headerTitleAlign: "left",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.headerBackground
                : lightColors.headerBackground,
          },
          headerTintColor:
            effectiveTheme === "dark" ? darkColors.text : lightColors.text,

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

      <Stack.Screen
        name="[productId]"
        options={{
          title: "Product Details",
          headerShown: false,
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
        }}
      />
    </Stack>
  );
}
