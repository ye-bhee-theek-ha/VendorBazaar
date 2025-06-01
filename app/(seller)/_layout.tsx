// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs, usePathname, useSegments, Redirect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // Or your preferred icon library
import { View, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext"; // Adjust path

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

export default function TabLayout() {
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
  const hideTabBarForRoutes = ["/(tabs)/home/messaging/"];

  let isTabBarVisible = true;
  // Check if the current path starts with any of the paths in hideTabBarForRoutes
  // For example, if current path is '/(tabs)/home/messaging/chat123'
  // and hideTabBarForRoutes contains '/(tabs)/home/messaging/', it will hide.
  if (
    segments.length > 2 &&
    segments[0] === "(tabs)" &&
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
  //   } else if (currentMainTab === "search") {
  //     screenTitle = "Search";
  //     showHeader = true;
  //   } else if (currentMainTab === "saved") {
  //     screenTitle = "Saved Items";
  //     showHeader = true;
  //   } else if (currentMainTab === "cart") {
  //     screenTitle = "My Cart";
  //     showHeader = true;
  //   } else if (currentMainTab === "account") {
  //     screenTitle = "My Account";
  //     showHeader = true;
  //   }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6", // Tailwind blue-500
        tabBarInactiveTintColor: "#6b7280", // Tailwind gray-500
        tabBarStyle: {
          backgroundColor: "#ffffff", // White background
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb", // Tailwind gray-200
          height: 60,
          paddingBottom: 5,
          display: isTabBarVisible ? "flex" : "none", // Conditionally hide tab bar
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        header: (props) => (
          <CustomHeader
            title={screenTitle}
            showHeader={showHeader}
            {...props}
          />
        ),
        headerShown: false,
      }}
    >
      {/* <Tabs.Screen
        name="home" // This refers to the `app/(tabs)/home/index.tsx` or `app/(tabs)/home/_layout.tsx`
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search" // `app/(tabs)/search/index.tsx` or `app/(tabs)/search/_layout.tsx`
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
        name="account" // `app/(tabs)/account/index.tsx` or `app/(tabs)/account/_layout.tsx`
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle" color={color} size={size} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
