// app/(customer)/_layout.tsx
import React from "react";
import { Tabs, usePathname, useSegments, Redirect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // Or your preferred icon library
import { View, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext"; // Adjust path
import { ProductProvider } from "@/src/context/ProductContext";
import { OrderProvider } from "@/src/context/OrderContext";
import { CartProvider } from "@/src/context/CartContext";
import { SearchProvider } from "@/src/context/SearchContext";

import { PaystackProvider, usePaystack } from "react-native-paystack-webview";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function CustomerTabLayout() {
  const { user, initialAuthLoading } = useAuth();
  const pathname = usePathname();
  const segments = useSegments(); // e.g. ['(tabs)', 'home', 'messaging', 'chatId123']

  if (initialAuthLoading) {
    return null; // Or a loading spinner, Splash screen should cover this
  }

  if (!user) {
    // Safe guard: if user is not authenticated, redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  const { effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  let isTabBarVisible = true;

  if (
    segments.length > 2 &&
    segments[0] === "(customer)" &&
    segments[1] === "home" &&
    segments[3]
  ) {
    isTabBarVisible = false;
  }

  // Determine if the header should be visible and its title
  let screenTitle = "App";
  let showHeader = true;

  const currentMainTab = segments[1]; // 'home', 'search', etc.
  const currentSubPage = segments[2]; // 'messaging' under 'home'
  const detailPage = segments[3]; //  '[chatId]' under 'messaging'

  // Customize header based on route
  if (currentMainTab === "home") {
    if (currentSubPage && currentSubPage.startsWith("[pid]")) {
      screenTitle = "Product Details";
      showHeader = true;
      isTabBarVisible = false;
    } else {
      screenTitle = "Home";
      showHeader = true;
    }
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        tabBarInactiveTintColor: lightColors.secondaryText,
        sceneStyle: {
          flex: 1,
          backgroundColor: "transparent",
        },
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
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="saved" // `app/(tabs)/saved/index.tsx` or `app/(tabs)/saved/_layout.tsx`
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart" // `app/(tabs)/cart/index.tsx` or `app/(tabs)/cart/_layout.tsx`
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
          // tabBarBadge: 3, // Example badge
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function CustomerPortalLayout() {
  // console.log("key ================> ", process.env.EXPO_PUBLIC_PAYSTACK_KEY);
  return (
    <PaystackProvider
      publicKey={process.env.EXPO_PUBLIC_PAYSTACK_KEY || ""}
      // debug
      currency="ZAR"
      defaultChannels={["card", "mobile_money"]}
    >
      <ProductProvider>
        <SearchProvider>
          <CartProvider>
            <OrderProvider>
              <CustomerTabLayout />
            </OrderProvider>
          </CartProvider>
        </SearchProvider>
      </ProductProvider>
    </PaystackProvider>
  );
}
