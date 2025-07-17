// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs, usePathname, useSegments, Redirect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // Or your preferred icon library
import { View, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext"; // Adjust path
import { SellerDashboardProvider } from "@/src/context/seller/SellerDashboardContext";
import { SellerOrderProvider } from "@/src/context/seller/SellerOrderContext";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SellerProductProvider } from "@/src/context/seller/SellerProductContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

const CustomHeader = ({
  title,
  showHeader,
}: {
  title: string;
  showHeader?: boolean;
}) => {
  if (!showHeader) return null;
  return (
    <View className="bg-blue-600 pt-10 pb-4 px-4 items-center justify-center shadow-md">
      <Text className="text-white text-xl font-bold">{title}</Text>
    </View>
  );
};

function SellerTabLayout() {
  const { user, initialAuthLoading } = useAuth();
  const pathname = usePathname();
  const segments = useSegments(); // e.g. ['(tabs)', 'home', 'messaging', 'chatId123']

  if (initialAuthLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const { effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const hideTabBarForRoutes = ["/(seller)/home/messaging/"];

  // Determine if the header should be visible and its title
  let screenTitle = "App";
  let showHeader = true;

  const currentMainTab = segments[1]; // 'home', 'search', etc.
  const currentSubPage = segments[2]; // 'messaging' under 'home'
  const detailPage = segments[3]; //  '[chatId]' under 'messaging'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        tabBarInactiveTintColor: lightColors.secondaryText,

        tabBarStyle: {
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.headerBackground
              : lightColors.headerBackground,
          borderTopWidth: 1,
          borderColor:
            effectiveTheme === "dark" ? darkColors.accent : lightColors.accent,
          height: 55 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          sceneStyle: {
            flex: 1,
            backgroundColor: "transparent",
          },
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={color} size={size} />
          ),
          sceneStyle: {
            flex: 1,
            backgroundColor: "transparent",
          },
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
          sceneStyle: {
            flex: 1,
            backgroundColor: "transparent",
          },
        }}
      />
      <Tabs.Screen
        name="cart" // `app/(tabs)/cart/index.tsx` or `app/(tabs)/cart/_layout.tsx`
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
          sceneStyle: {
            flex: 1,
            backgroundColor: "transparent",
          },
          // tabBarBadge: 3,
        }}
      />
      <Tabs.Screen
        name="account" // `app/(tabs)/account/index.tsx` or `app/(tabs)/account/_layout.tsx`
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle" color={color} size={size} />
          ),
          sceneStyle: {
            flex: 1,
            backgroundColor: "transparent",
          },
        }}
      />
    </Tabs>
  );
}

export default function SellerPortalLayout() {
  return (
    <SellerDashboardProvider>
      <SellerOrderProvider>
        <SellerProductProvider>
          <SellerTabLayout />
        </SellerProductProvider>
      </SellerOrderProvider>
    </SellerDashboardProvider>
  );
}
