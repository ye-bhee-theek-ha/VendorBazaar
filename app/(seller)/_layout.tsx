// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs, usePathname, useSegments, Redirect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // Or your preferred icon library
import { View, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext"; // Adjust path
import { SellerDashboardProvider } from "@/src/context/seller/SellerDashboardContext";
import { SellerOrderProvider } from "@/src/context/seller/SellerOrderContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { SellerProductProvider } from "@/src/context/seller/SellerProductContext";

// Example Custom Header (can be moved to components/common/CustomHeader.tsx)
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
    return null; // Or a loading spinner, Splash screen should cover this
  }

  if (!user) {
    // Safe guard: if user is not authenticated, redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  // Determine if the bottom tab bar should be visible
  // Hide on specific sub-pages like a chat screen
  const hideTabBarForRoutes = ["/(seller)/home/messaging/"];

  let isTabBarVisible = true;
  // Check if the current path starts with any of the paths in hideTabBarForRoutes
  // For example, if current path is '/(tabs)/home/messaging/chat123'
  // and hideTabBarForRoutes contains '/(tabs)/home/messaging/', it will hide.
  if (
    segments.length > 2 &&
    segments[0] === "(seller)" &&
    segments[1] === "home" &&
    segments[2] === "messaging" &&
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
    if (currentSubPage === "messaging" && detailPage) {
      screenTitle = "Chat";
      showHeader = true;
    } else if (currentSubPage === "messaging") {
      screenTitle = "Messages";
      showHeader = true;
    } else if (currentSubPage && currentSubPage.startsWith("product")) {
      screenTitle = "Product Details";
      showHeader = true;
      // isTabBarVisible = false; // Optionally hide tab bar on product details too
    } else {
      screenTitle = "Home";
      showHeader = true;
    }
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#B3B3B3",

        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 70,
          paddingBottom: 15,
          display: isTabBarVisible ? "flex" : "none",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          color: "black",
        },
        header: (props) => (
          <CustomHeader title={screenTitle} showHeader={true} {...props} />
        ),
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
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
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
        name="account" // `app/(tabs)/account/index.tsx` or `app/(tabs)/account/_layout.tsx`
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
