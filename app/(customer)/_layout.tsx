// app/(customer)/_layout.tsx
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

  let isTabBarVisible = true;

  if (
    segments.length > 2 &&
    segments[0] === "(customer)" &&
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
    } else if (currentSubPage && currentSubPage.startsWith("[pid]")) {
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
