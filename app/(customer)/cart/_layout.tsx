// app/(customer)/notifications/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import HeaderRightIcons from "@/src/components/Layout_Components";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function CartStackLayout() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Cart",
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
          headerRight: () => <HeaderRightIcons />,
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: "Complete Payment",
          headerBackTitle: "Cart",
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
        }}
      />

      <Stack.Screen
        name="checkout"
        options={{
          title: "Checkout",
          headerBackTitle: "Cart",
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
        }}
      />
    </Stack>
  );
}
